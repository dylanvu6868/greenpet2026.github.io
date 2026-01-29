import http.server
import socketserver
import os
import sys
import json
import sqlite3
import shutil
import urllib.request
import urllib.error

PORT = 8000
DB_FILE = 'greenpet.db'

# Try to get API Key from secrets.json first, then environment variable
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    try:
        if os.path.exists('secrets.json'):
            with open('secrets.json', 'r') as f:
                secrets = json.load(f)
                GEMINI_API_KEY = secrets.get('GEMINI_API_KEY')
    except Exception as e:
        print(f"Warning: Could not read secrets.json: {e}")

GEMINI_MODEL = "gemini-flash-latest"
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key="

# --- DATABASE LOGIC ---

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize database tables."""
    conn = get_db_connection()
    c = conn.cursor()
    
    # Create tables
    # storing mostly JSON blobs for flexibility and compatibility with frontend structure
    c.execute('''CREATE TABLE IF NOT EXISTS products 
                 (id TEXT PRIMARY KEY, data TEXT)''')
    
    c.execute('''CREATE TABLE IF NOT EXISTS orders 
                 (id TEXT PRIMARY KEY, data TEXT)''')
    
    c.execute('''CREATE TABLE IF NOT EXISTS categories 
                 (id TEXT PRIMARY KEY, data TEXT)''')
    
    c.execute('''CREATE TABLE IF NOT EXISTS kv_store 
                 (key TEXT PRIMARY KEY, data TEXT)''') # For settings, etc.
    
    conn.commit()
    return conn

def migrate_from_json(conn):
    """Migrate data from JSON files if DB is empty."""
    c = conn.cursor()
    
    # Check if products exist
    c.execute('SELECT count(*) FROM products')
    if c.fetchone()[0] > 0:
        print("Database already populated. Skipping migration.")
        return

    print("Migrating data from JSON to SQLite...")

    # 1. Products
    try:
        if os.path.exists('data/products.json'):
            with open('data/products.json', 'r', encoding='utf-8') as f:
                data = json.load(f)
                products = data.get('products', [])
                for p in products:
                    c.execute('INSERT OR REPLACE INTO products (id, data) VALUES (?, ?)', 
                              (p['id'], json.dumps(p, ensure_ascii=False)))
            print(f"Migrated {len(products)} products.")
    except Exception as e:
        print(f"Error migrating products: {e}")

    # 2. Categories
    try:
        if os.path.exists('data/categories.json'):
            with open('data/categories.json', 'r', encoding='utf-8') as f:
                data = json.load(f)
                categories = data.get('categories', [])
                for cat in categories:
                    c.execute('INSERT OR REPLACE INTO categories (id, data) VALUES (?, ?)', 
                              (cat['id'], json.dumps(cat, ensure_ascii=False)))
            print(f"Migrated {len(categories)} categories.")
    except Exception as e:
        print(f"Error migrating categories: {e}")

    # 3. Orders
    try:
        if os.path.exists('data/orders.json'):
            with open('data/orders.json', 'r', encoding='utf-8') as f:
                data = json.load(f)
                orders = data.get('orders', [])
                for o in orders:
                    c.execute('INSERT OR REPLACE INTO orders (id, data) VALUES (?, ?)', 
                              (o['id'], json.dumps(o, ensure_ascii=False)))
            print(f"Migrated {len(orders)} orders.")
    except Exception as e:
        print(f"Error migrating orders: {e}")

    # 4. Settings
    try:
        if os.path.exists('data/settings.json'):
            with open('data/settings.json', 'r', encoding='utf-8') as f:
                data = json.load(f)
                settings = data.get('settings', {})
                c.execute('INSERT OR REPLACE INTO kv_store (key, data) VALUES (?, ?)', 
                          ('settings', json.dumps(settings, ensure_ascii=False)))
            print("Migrated settings.")
    except Exception as e:
        print(f"Error migrating settings: {e}")

    conn.commit()

# --- SERVER HANDLER ---

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        if self.path.startswith('/api/'):
            self.handle_api_get()
        else:
            super().do_GET()

    def do_POST(self):
        if self.path.startswith('/api/'):
            self.handle_api_post()
        else:
            self.send_error(404, "Not Found")

    def handle_api_get(self):
        conn = get_db_connection()
        c = conn.cursor()
        response_data = {}

        try:
            if self.path == '/api/products':
                c.execute('SELECT data FROM products')
                items = [json.loads(row[0]) for row in c.fetchall()]
                response_data = {'products': items}

            elif self.path == '/api/categories':
                c.execute('SELECT data FROM categories')
                items = [json.loads(row[0]) for row in c.fetchall()]
                response_data = {'categories': items}
            
            elif self.path == '/api/orders':
                c.execute('SELECT data FROM orders')
                items = [json.loads(row[0]) for row in c.fetchall()]
                response_data = {'orders': items}

            elif self.path == '/api/settings':
                c.execute("SELECT data FROM kv_store WHERE key = 'settings'")
                row = c.fetchone()
                settings = json.loads(row[0]) if row else {}
                response_data = {'settings': settings}

            else:
                self.send_error(404, "API Endpoint not found")
                conn.close()
                return

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response_data).encode('utf-8'))

        except Exception as e:
            print(f"API Error: {e}")
            self.send_error(500, str(e))
        finally:
            conn.close()

    def handle_api_post(self):
        try:
            length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(length)
            payload = json.loads(post_data.decode('utf-8'))
            
            # --- CHATBOT ENDPOINT ---
            if self.path == '/api/chat':
                user_message = payload.get('message', '')
                if not user_message:
                    self.send_error(400, "Message is required")
                    return

                if not GEMINI_API_KEY:
                    # Mock response if no API key
                    response_text = "Xin lỗi, tôi chưa được cấu hình API Key. Vui lòng kiểm tra server."
                else:
                    response_text = self.call_gemini_api(user_message)

                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'response': response_text}).encode('utf-8'))
                return
            
            # --- DATABASE ENDPOINTS ---
            conn = get_db_connection()
            c = conn.cursor()
            
            # Transactional Save
            # Note: Current frontend logic sends the ENTIRE array for products/orders/categories.
            # So we strictly replace the database content to match the frontend state.
            
            if self.path == '/api/products':
                products = payload.get('products', [])
                c.execute('DELETE FROM products') # Clear table
                for p in products:
                    c.execute('INSERT INTO products (id, data) VALUES (?, ?)', 
                             (p['id'], json.dumps(p, ensure_ascii=False)))
                print(f"Saved {len(products)} products to DB.")

            elif self.path == '/api/categories':
                categories = payload.get('categories', [])
                c.execute('DELETE FROM categories')
                for cat in categories:
                    c.execute('INSERT INTO categories (id, data) VALUES (?, ?)', 
                             (cat['id'], json.dumps(cat, ensure_ascii=False)))
                print(f"Saved {len(categories)} categories to DB.")

            elif self.path == '/api/orders':
                orders = payload.get('orders', [])
                c.execute('DELETE FROM orders')
                for o in orders:
                    c.execute('INSERT INTO orders (id, data) VALUES (?, ?)', 
                             (o['id'], json.dumps(o, ensure_ascii=False)))
                print(f"Saved {len(orders)} orders to DB.")

            elif self.path == '/api/settings':
                settings = payload.get('settings', {})
                c.execute('INSERT OR REPLACE INTO kv_store (key, data) VALUES (?, ?)', 
                         ('settings', json.dumps(settings, ensure_ascii=False)))
                print("Saved settings to DB.")

            else:
                self.send_error(404, "API Endpoint not found")
                conn.close()
                return

            conn.commit()
            conn.close()

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'success': True}).encode('utf-8'))

        except Exception as e:
            print(f"Save Error: {e}")
            self.send_error(500, str(e))

    def call_gemini_api(self, user_message):
        """Call Google Gemini API"""
        try:
            # Load Context
            context = ""
            if os.path.exists('chatbot_context.txt'):
                with open('chatbot_context.txt', 'r', encoding='utf-8') as f:
                    context = f.read()
            
            system_instruction = f"Bạn là trợ lý ảo của GreenPet. Dưới đây là thông tin cửa hàng:\n{context}\n\nHãy trả lời câu hỏi sau của khách hàng một cách thân thiện, ngắn gọn:"
            
            data = {
                "contents": [{
                    "parts": [{"text": f"{system_instruction}\n\nKhách hàng: {user_message}"}]
                }]
            }
            
            req = urllib.request.Request(
                f"{GEMINI_URL}{GEMINI_API_KEY}",
                data=json.dumps(data).encode('utf-8'),
                headers={'Content-Type': 'application/json'}
            )
            
            with urllib.request.urlopen(req) as response:
                result = json.loads(response.read().decode('utf-8'))
                # Extract text from Gemini response structure
                try:
                    return result['candidates'][0]['content']['parts'][0]['text']
                except (KeyError, IndexError):
                    return "Xin lỗi, tôi không hiểu câu hỏi này."
        
        except urllib.error.HTTPError as e:
            error_body = e.read().decode()
            print(f"Gemini API HTTP Error: {e.code} - {error_body}")
            # Try to parse the JSON error body for a cleaner message
            try:
                err_json = json.loads(error_body)
                err_msg = err_json.get('error', {}).get('message', str(e))
                return f"Lỗi API Google: {err_msg}"
            except:
                return f"Lỗi kết nối ({e.code}): {error_body}"
                    
        except Exception as e:
            print(f"Gemini API Error: {e}")
            return f"Lỗi hệ thống: {str(e)}"

if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Initialize Database
    try:
        conn = init_db()
        migrate_from_json(conn)
        conn.close()
        print(f"Database {DB_FILE} ready.")
    except Exception as e:
        print(f"Database Initialization Error: {e}")
        sys.exit(1)

    try:
        socketserver.TCPServer.allow_reuse_address = True
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            print(f"Server started at http://localhost:{PORT}")
            print("Press Ctrl+C to stop")
            httpd.serve_forever()
    except OSError as e:
        if e.errno == 98 or e.errno == 10048:
            print(f"Port {PORT} is already in use. Please close the existing server window.")
        else:
            raise
    except KeyboardInterrupt:
        print("\nServer stopped.")
        sys.exit(0)
