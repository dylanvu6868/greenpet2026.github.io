/**
 * Initial Data Setup
 * Functions to initialize the application with sample data
 */

const InitialData = {
    /**
     * Initialize application data on first load
     * Checks if data exists in LocalStorage, if not, loads from JSON files
     */
    async initialize() {
        console.log('Initializing application data...');

        try {
            // Check version and clear cache if needed
            // Check version and clear cache if needed
            const currentVersion = Storage.get('greenpet_app_version');
            if (currentVersion !== CONFIG.APP_VERSION) {
                console.log(`Upgrading from ${currentVersion} to ${CONFIG.APP_VERSION}`);
                // Database.clearCache();
                // // Clear specific data caches that need refreshing
                // Storage.remove(CONFIG.STORAGE_KEYS.PRODUCTS);
                // Storage.remove(CONFIG.STORAGE_KEYS.CATEGORIES);
                // Storage.remove(CONFIG.STORAGE_KEYS.SETTINGS);

                // Update version
                Storage.set('greenpet_app_version', CONFIG.APP_VERSION);
            }

            // Load all data from JSON files
            await Database.initialize();

            // Initialize cart if doesn't exist
            if (!Storage.has(CONFIG.STORAGE_KEYS.CART)) {
                this.initializeCart();
            }

            // Initialize orders if doesn't exist
            if (!Storage.has(CONFIG.STORAGE_KEYS.ORDERS)) {
                this.initializeOrders();
            }

            console.log('Application data initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing application data:', error);
            return false;
        }
    },

    /**
     * Initialize empty cart
     */
    initializeCart() {
        const emptyCart = {
            items: [],
            updatedAt: new Date().toISOString()
        };
        Storage.set(CONFIG.STORAGE_KEYS.CART, emptyCart);
        console.log('Cart initialized');
    },

    /**
     * Initialize empty orders array
     */
    initializeOrders() {
        Storage.set(CONFIG.STORAGE_KEYS.ORDERS, []);
        console.log('Orders initialized');
    },

    /**
     * Reset all data to initial state
     * WARNING: This will clear all LocalStorage data
     */
    resetAllData() {
        const confirmed = confirm(
            'Bạn có chắc chắn muốn reset tất cả dữ liệu? ' +
            'Thao tác này sẽ xóa giỏ hàng, đơn hàng và tất cả thay đổi.'
        );

        if (!confirmed) return false;

        // Clear all GreenPet data from LocalStorage
        const keys = Storage.keys('greenpet_');
        keys.forEach(key => Storage.remove(key));

        // Clear database cache
        Database.clearCache();

        // Reinitialize
        this.initialize();

        console.log('All data has been reset');
        return true;
    },

    /**
     * Get sample customer data for testing
     * @returns {Object} Sample customer info
     */
    getSampleCustomer() {
        return {
            name: 'Nguyễn Văn A',
            email: 'customer@example.com',
            phone: '0912345678',
            address: {
                street: '123 Đường ABC',
                ward: 'Phường 1',
                district: 'Quận 1',
                city: 'TP. Hồ Chí Minh'
            },
            notes: ''
        };
    },

    /**
     * Create sample order for testing
     * @returns {Object} Sample order
     */
    createSampleOrder() {
        const now = new Date();
        const orderId = 'ORD' + now.getTime();

        return {
            id: orderId,
            orderNumber: orderId,
            customerName: 'Nguyễn Văn A',
            customerEmail: 'customer@example.com',
            customerPhone: '0912345678',
            shippingAddress: {
                street: '123 Đường ABC',
                ward: 'Phường 1',
                district: 'Quận 1',
                city: 'TP. Hồ Chí Minh'
            },
            items: [],
            subtotal: 0,
            shippingFee: CONFIG.SHIPPING.DEFAULT_FEE,
            total: CONFIG.SHIPPING.DEFAULT_FEE,
            status: CONFIG.ORDER_STATUS.PENDING,
            paymentMethod: CONFIG.PAYMENT_METHODS.COD,
            notes: '',
            createdAt: now.toISOString()
        };
    },

    /**
     * Get database statistics
     * @returns {Promise<Object>} Statistics object
     */
    async getStatistics() {
        const products = await Database.loadProducts();
        const orders = Storage.get(CONFIG.STORAGE_KEYS.ORDERS, []);
        const cart = Storage.get(CONFIG.STORAGE_KEYS.CART, { items: [] });

        const activeProducts = products.filter(p => p.isActive);
        const featuredProducts = products.filter(p => p.isFeatured && p.isActive);
        const outOfStock = products.filter(p => p.stock === 0);
        const lowStock = products.filter(p =>
            p.stock > 0 && p.stock <= CONFIG.INVENTORY.LOW_STOCK_THRESHOLD
        );

        const pendingOrders = orders.filter(o => o.status === CONFIG.ORDER_STATUS.PENDING);
        const completedOrders = orders.filter(o => o.status === CONFIG.ORDER_STATUS.COMPLETED);

        const totalRevenue = completedOrders.reduce((sum, order) => sum + order.total, 0);

        return {
            products: {
                total: products.length,
                active: activeProducts.length,
                featured: featuredProducts.length,
                outOfStock: outOfStock.length,
                lowStock: lowStock.length
            },
            orders: {
                total: orders.length,
                pending: pendingOrders.length,
                completed: completedOrders.length,
                revenue: totalRevenue
            },
            cart: {
                itemCount: cart.items.length,
                totalItems: cart.items.reduce((sum, item) => sum + item.quantity, 0)
            },
            storage: {
                size: Storage.getFormattedSize()
            }
        };
    },

    /**
     * Export all data as JSON (for backup)
     * @returns {Promise<string>} JSON string of all data
     */
    async exportData() {
        const products = await Database.loadProducts();
        const categories = await Database.loadCategories();
        const settings = await Database.loadSettings();
        const orders = Storage.get(CONFIG.STORAGE_KEYS.ORDERS, []);
        const cart = Storage.get(CONFIG.STORAGE_KEYS.CART, { items: [] });

        const exportData = {
            version: CONFIG.APP_VERSION,
            exportedAt: new Date().toISOString(),
            products,
            categories,
            settings,
            orders,
            cart
        };

        return JSON.stringify(exportData, null, 2);
    },

    /**
     * Import data from JSON string
     * @param {string} jsonString - JSON string to import
     * @returns {boolean} Success status
     */
    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);

            if (!data.version || !data.products) {
                throw new Error('Invalid data format');
            }

            // Confirm import
            const confirmed = confirm(
                'Import dữ liệu sẽ ghi đè tất cả dữ liệu hiện tại. Bạn có chắc chắn?'
            );

            if (!confirmed) return false;

            // Import products
            if (data.products && Array.isArray(data.products)) {
                Database.saveProducts(data.products);
            }

            // Import settings
            if (data.settings) {
                Database.saveSettings(data.settings);
            }

            // Import orders
            if (data.orders && Array.isArray(data.orders)) {
                Storage.set(CONFIG.STORAGE_KEYS.ORDERS, data.orders);
            }

            // Import cart
            if (data.cart) {
                Storage.set(CONFIG.STORAGE_KEYS.CART, data.cart);
            }

            console.log('Data imported successfully');
            alert('Import thành công! Trang sẽ được tải lại.');

            // Reload page to reflect changes
            window.location.reload();

            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            alert('Lỗi khi import dữ liệu. Vui lòng kiểm tra lại file.');
            return false;
        }
    }
};
