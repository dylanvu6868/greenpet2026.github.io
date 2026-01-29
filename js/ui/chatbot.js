/**
 * GreenPet Chatbot
 * Handles UI rendering and simple interactions
 */

const Chatbot = {
    isOpen: false,

    // Simple predefined responses (Fallback for Static Mode)
    responses: {
        'default': 'Cảm ơn bạn đã liên hệ GreenPet! Chúng tôi sẽ phản hồi sớm nhất có thể. Bạn có thể gọi hotline: 0976774094 để được hỗ trợ nhanh nhất.',
        'hello': 'Chào bạn! GreenPet có thể giúp gì cho bạn hôm nay?',
        'hi': 'Chào bạn! GreenPet có thể giúp gì cho bạn hôm nay?',
        'chào': 'Chào bạn! GreenPet có thể giúp gì cho bạn hôm nay?',
        'giá': 'Sản phẩm của GreenPet có giá dao động từ 100k - 500k tùy loại. Bạn quan tâm sản phẩm nào?',
        'ship': 'GreenPet freeship cho đơn hàng từ 500k. Phí ship nội thành Hà Nội là 20k, ngoại thành 30k.',
        'bảo hành': 'Sản phẩm được đổi trả trong vòng 7 ngày nếu có lỗi từ nhà sản xuất.',
        'địa chỉ': 'GreenPet có cửa hàng tại Đại học FPT Hòa Lạc, Hà Nội.',
    },

    init() {
        if (document.getElementById('greenpet-chatbot')) return;
        this.render();
        this.bindEvents();
    },

    render() {
        const container = document.createElement('div');
        container.id = 'greenpet-chatbot';
        container.className = 'chatbot-container';

        container.innerHTML = `
            <!-- Chat Window -->
            <div class="chatbot-window" id="chatbot-window">
                <div class="chatbot-header">
                    <div class="chatbot-title">
                        <span></span> Trợ lý GreenPet
                    </div>
                    <button class="chatbot-close" id="chatbot-close">&times;</button>
                </div>
                <div class="chatbot-messages" id="chatbot-messages">
                    <div class="message bot">
                        Xin chào! 👋<br>Tôi là trợ lý ảo của GreenPet. Tôi có thể giúp gì cho bạn?
                    </div>
                </div>
                <div class="chatbot-input-area">
                    <input type="text" class="chatbot-input" id="chatbot-input" placeholder="Nhập tin nhắn...">
                    <button class="chatbot-send" id="chatbot-send">➤</button>
                </div>
            </div>

            <!-- Launcher -->
            <button class="chatbot-launcher" id="chatbot-launcher">
                <img src="https://api.iconify.design/mdi:message-processing-outline.svg?color=white" alt="Chat">
            </button>
        `;

        document.body.appendChild(container);
    },

    bindEvents() {
        const launcher = document.getElementById('chatbot-launcher');
        const closeBtn = document.getElementById('chatbot-close');
        const windowEl = document.getElementById('chatbot-window');
        const inputEl = document.getElementById('chatbot-input');
        const sendBtn = document.getElementById('chatbot-send');

        const toggleChat = () => {
            this.isOpen = !this.isOpen;
            if (this.isOpen) {
                windowEl.classList.add('active');
                inputEl.focus();
            } else {
                windowEl.classList.remove('active');
            }
        };

        launcher.addEventListener('click', toggleChat);
        closeBtn.addEventListener('click', toggleChat);

        const sendMessage = async () => {
            const text = inputEl.value.trim();
            if (!text) return;

            // Add User Message
            this.addMessage(text, 'user');
            inputEl.value = '';

            // Add Typing Indicator
            const typingId = this.addMessage('Đang suy nghĩ...', 'bot typing');

            try {
                // 1. Try Server (AI)
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: text })
                });

                if (!response.ok) throw new Error('API Error');

                const data = await response.json();

                // Remove Typing Indicator
                const typingEl = document.getElementById(typingId);
                if (typingEl) typingEl.remove();

                // Add Bot Response
                this.addMessage(data.response, 'bot');
            } catch (error) {
                console.warn('AI unavailable, switching to Fallback Mode');
                // Remove Typing Indicator
                const typingEl = document.getElementById(typingId);
                if (typingEl) typingEl.remove();

                // 2. Static Fallback
                const fallbackResponse = this.getResponse(text);
                this.addMessage(fallbackResponse, 'bot');
            }
        };

        sendBtn.addEventListener('click', sendMessage);
        inputEl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    },

    // Helper for static responses
    getResponse(text) {
        const lowerText = text.toLowerCase();

        for (const key in this.responses) {
            if (lowerText.includes(key) && key !== 'default') {
                return this.responses[key];
            }
        }
        return this.responses['default'];
    },

    addMessage(text, sender) {
        const messagesEl = document.getElementById('chatbot-messages');
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;

        // Generate unique ID for typing indicator removal
        const msgId = 'msg-' + Date.now();
        msgDiv.id = msgId;

        // Simple Markdown-like bold formatting
        msgDiv.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');

        messagesEl.appendChild(msgDiv);
        messagesEl.scrollTop = messagesEl.scrollHeight;
        return msgId;
    }
};

// Auto Init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Chatbot.init());
} else {
    Chatbot.init();
}
