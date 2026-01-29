/**
 * Database Manager
 * Handles loading, caching, and managing JSON data
 */

const Database = {
    // Cache for loaded data
    _cache: {
        products: null,
        categories: null,
        settings: null
    },

    // Loading states
    _loading: {
        products: false,
        categories: false,
        settings: false
    },

    /**
     * Load JSON file
     * @param {string} url - URL to JSON file
     * @returns {Promise<Object>} Parsed JSON data
     */
    async _loadJSON(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error loading JSON from ${url}:`, error);
            throw error;
        }
    },

    /**
     * Load products from Server (Priority), LocalStorage (Fallback), or JSON (Static)
     * @param {boolean} forceReload - Force reload from source
     * @returns {Promise<Array>} Array of products
     */
    async loadProducts(forceReload = false) {
        if (!forceReload && this._cache.products) return this._cache.products;
        if (this._loading.products) {
            await new Promise(resolve => setTimeout(resolve, 100));
            return this.loadProducts(forceReload);
        }

        this._loading.products = true;
        try {
            // 1. Try Server (SQLite)
            try {
                const response = await fetch('/api/products');
                if (response.ok) {
                    const data = await response.json();
                    if (data.products) {
                        this._cache.products = data.products;
                        Storage.set(CONFIG.STORAGE_KEYS.PRODUCTS, data.products); // Sync local
                        return data.products;
                    }
                }
            } catch (e) {
                console.warn('Backend unavailable, switching to Hybrid Mode (LocalStorage/Static).');
            }

            // 2. Hybrid Mode: Check LocalStorage (User edits in Demo Mode)
            const localData = Storage.get(CONFIG.STORAGE_KEYS.PRODUCTS);
            if (localData && Array.isArray(localData)) {
                this._cache.products = localData;
                return localData;
            }

            // 3. Static Fallback: Load initial JSON
            const data = await this._loadJSON(CONFIG.DATA_PATHS.PRODUCTS);
            const products = data.products || [];
            this._cache.products = products;
            Storage.set(CONFIG.STORAGE_KEYS.PRODUCTS, products);
            return products;

        } catch (error) {
            console.error('Error loading products:', error);
            return [];
        } finally {
            this._loading.products = false;
        }
    },

    /**
     * Load categories from Server, Storage, or JSON
     */
    async loadCategories(forceReload = false) {
        if (!forceReload && this._cache.categories) return this._cache.categories;
        if (this._loading.categories) {
            await new Promise(resolve => setTimeout(resolve, 100));
            return this.loadCategories(forceReload);
        }

        this._loading.categories = true;
        try {
            // 1. Try Server
            try {
                const response = await fetch('/api/categories');
                if (response.ok) {
                    const data = await response.json();
                    if (data.categories) {
                        this._cache.categories = data.categories;
                        Storage.set(CONFIG.STORAGE_KEYS.CATEGORIES, data.categories);
                        return data.categories;
                    }
                }
            } catch (e) { /* Ignore */ }

            // 2. LocalStorage
            const localData = Storage.get(CONFIG.STORAGE_KEYS.CATEGORIES);
            if (localData) {
                this._cache.categories = localData;
                return localData;
            }

            // 3. Static
            const data = await this._loadJSON(CONFIG.DATA_PATHS.CATEGORIES);
            const categories = data.categories || [];
            this._cache.categories = categories;
            Storage.set(CONFIG.STORAGE_KEYS.CATEGORIES, categories);
            return categories;

        } catch (error) {
            console.error('Error loading categories:', error);
            return [];
        } finally {
            this._loading.categories = false;
        }
    },

    /**
     * Load settings from Server, Storage, or JSON
     */
    async loadSettings(forceReload = false) {
        if (!forceReload && this._cache.settings) return this._cache.settings;
        if (this._loading.settings) {
            await new Promise(resolve => setTimeout(resolve, 100));
            return this.loadSettings(forceReload);
        }

        this._loading.settings = true;
        try {
            // 1. Try Server
            try {
                const response = await fetch('/api/settings');
                if (response.ok) {
                    const data = await response.json();
                    if (data.settings) {
                        this._cache.settings = data.settings;
                        Storage.set(CONFIG.STORAGE_KEYS.SETTINGS, data.settings);
                        return data.settings;
                    }
                }
            } catch (e) { /* Ignore */ }

            // 2. LocalStorage
            const localData = Storage.get(CONFIG.STORAGE_KEYS.SETTINGS);
            if (localData) {
                this._cache.settings = localData;
                return localData;
            }

            // 3. Static
            const data = await this._loadJSON(CONFIG.DATA_PATHS.SETTINGS);
            const settings = data.settings || {};
            this._cache.settings = settings;
            Storage.set(CONFIG.STORAGE_KEYS.SETTINGS, settings);
            return settings;

        } catch (error) {
            console.error('Error loading settings:', error);
            return {};
        } finally {
            this._loading.settings = false;
        }
    },

    /**
     * Get product by ID
     * @param {string} id - Product ID
     * @returns {Promise<Object|null>} Product object or null
     */
    async getProductById(id) {
        const products = await this.loadProducts();
        return products.find(p => p.id === id) || null;
    },

    /**
     * Get products by category
     * @param {string} categoryId - Category ID
     * @returns {Promise<Array>} Array of products
     */
    async getProductsByCategory(categoryId) {
        const products = await this.loadProducts();
        return products.filter(p => p.categoryId === categoryId && p.isActive);
    },

    /**
     * Get featured products
     * @param {number} limit - Maximum number of products to return
     * @returns {Promise<Array>} Array of featured products
     */
    async getFeaturedProducts(limit = 8) {
        const products = await this.loadProducts();
        return products
            .filter(p => p.isFeatured && p.isActive)
            .slice(0, limit);
    },

    /**
     * Search products
     * @param {string} query - Search query
     * @returns {Promise<Array>} Array of matching products
     */
    async searchProducts(query) {
        const products = await this.loadProducts();
        const searchTerm = query.toLowerCase();

        return products.filter(p => {
            if (!p.isActive) return false;

            return (
                p.name.toLowerCase().includes(searchTerm) ||
                p.description.toLowerCase().includes(searchTerm) ||
                p.tags.some(tag => tag.toLowerCase().includes(searchTerm))
            );
        });
    },

    /**
     * Save products to LocalStorage AND Server
     * @param {Array} products - Products array
     * @returns {Promise<boolean>} Success status
     */
    async saveProducts(products) {
        this._cache.products = products;
        Storage.set(CONFIG.STORAGE_KEYS.PRODUCTS, products);

        // Sync to Server
        try {
            const response = await fetch('/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ products }) // Wrap in object matching JSON structure
            });
            return response.ok;
        } catch (error) {
            console.error('Error syncing products to server:', error);
            // We return true because local save succeeded, but log error
            return true;
        }
    },

    /**
     * Save settings to LocalStorage AND Server
     * @param {Object} settings - Settings object
     * @returns {Promise<boolean>} Success status
     */
    async saveSettings(settings) {
        this._cache.settings = settings;
        Storage.set(CONFIG.STORAGE_KEYS.SETTINGS, settings);

        // Sync to Server
        try {
            const response = await fetch('/api/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ settings })
            });
            return response.ok;
        } catch (error) {
            console.error('Error syncing settings to server:', error);
            return true;
        }
    },

    /**
     * Clear all caches
     */
    clearCache() {
        this._cache = {
            products: null,
            categories: null,
            settings: null
        };
    },

    /**
     * Initialize database - preload common data
     * @returns {Promise<void>}
     */
    async initialize() {
        try {
            await Promise.all([
                this.loadProducts(),
                this.loadCategories(),
                this.loadSettings()
            ]);
            console.log('Database initialized successfully');
        } catch (error) {
            console.error('Error initializing database:', error);
        }
    }
};
