/**
 * Admin Service
 * Handles admin operations (CRUD for products, orders, settings)
 */

const AdminService = {
    /**
     * Simple authentication check (for demo purposes)
     * In production, use proper authentication
     * @param {string} username - Username
     * @param {string} password - Password
     * @returns {Object} Result object
     */
    login(username, password) {
        let role = null;
        let token = null;

        // Hardcoded credentials for demo
        if ((username === 'admin' && password === 'admin123') ||
            (username === 'owner' && password === 'owner123')) {
            role = 'owner';
            token = 'admin_token_' + Date.now();
        } else if (username === 'staff' && password === 'staff123') {
            role = 'staff';
            token = 'staff_token_' + Date.now();
        }

        if (role) {
            Storage.set(CONFIG.STORAGE_KEYS.ADMIN_TOKEN, token);
            Storage.set('admin_role', role);

            return {
                success: true,
                token,
                role,
                message: CONFIG.MESSAGES.LOGIN_SUCCESS
            };
        }

        return {
            success: false,
            error: CONFIG.MESSAGES.LOGIN_ERROR
        };
    },

    /**
     * Logout admin
     * @returns {Object} Result object
     */
    logout() {
        Storage.remove(CONFIG.STORAGE_KEYS.ADMIN_TOKEN);
        Storage.remove('admin_role');
        return {
            success: true,
            message: 'Đã đăng xuất'
        };
    },

    isLoggedIn() {
        return Storage.has(CONFIG.STORAGE_KEYS.ADMIN_TOKEN);
    },

    getRole() {
        return Storage.get('admin_role', 'staff');
    },

    isOwner() {
        return this.getRole() === 'owner';
    },

    /**
     * Apply UI restrictions based on role
     */
    applyRoleUI() {
        if (!this.isOwner()) {
            const restrictedLinks = ['settings.html', 'vouchers.html', 'users.html'];

            // Hide Nav Links
            const navLinks = document.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                const href = link.getAttribute('href');
                if (restrictedLinks.includes(href)) {
                    link.style.display = 'none';
                }
            });

            // Redirect if in restricted page
            if (typeof window !== 'undefined') {
                const currentPage = window.location.pathname.split('/').pop();
                if (restrictedLinks.includes(currentPage)) {
                    alert('Bạn không có quyền truy cập trang này');
                    window.location.href = 'index.html';
                }
            }
        }
    },

    /**
     * Require admin authentication (call before admin operations)
     * @returns {boolean} Is authenticated
     */
    requireAuth() {
        if (!this.isLoggedIn()) {
            alert('Vui lòng đăng nhập để tiếp tục');
            window.location.href = 'login.html';
            return false;
        }
        return true;
    },

    // ==================
    // PRODUCT OPERATIONS
    // ==================

    /**
     * Get all products (including inactive)
     * @returns {Promise<Array>} All products
     */
    async getAllProducts() {
        return await Database.loadProducts();
    },

    /**
     * Create new product
     * @param {Object} productData - Product data
     * @returns {Promise<Object>} Result object
     */
    async createProduct(productData) {
        try {
            // Validate product
            const validation = Validators.validateProduct(productData);
            if (!validation.valid) {
                return {
                    success: false,
                    errors: validation.errors
                };
            }

            // Load current products
            const products = await this.getAllProducts();

            // Generate ID and slug
            const id = `prod-${Date.now()}`;
            const slug = this.generateSlug(productData.name);

            // Create product object
            const newProduct = {
                id,
                slug,
                name: productData.name.trim(),
                description: productData.description.trim(),
                longDescription: productData.longDescription?.trim() || productData.description.trim(),
                categoryId: productData.categoryId,
                price: parseFloat(productData.price),
                compareAtPrice: parseFloat(productData.compareAtPrice) || 0,
                images: productData.images || ['./assets/images/products/placeholder.jpg'],
                sizes: productData.sizes || [],
                material: productData.material?.trim() || '',
                recycledContent: parseFloat(productData.recycledContent) || 0,
                stock: parseInt(productData.stock) || 0,
                isActive: productData.isActive !== false,
                isFeatured: productData.isFeatured === true,
                tags: productData.tags || [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // Add to products array
            products.push(newProduct);

            // Save
            await Database.saveProducts(products);

            return {
                success: true,
                product: newProduct,
                message: CONFIG.MESSAGES.PRODUCT_SAVED
            };
        } catch (error) {
            console.error('Error creating product:', error);
            return {
                success: false,
                error: 'Có lỗi xảy ra khi tạo sản phẩm'
            };
        }
    },

    /**
     * Update existing product
     * @param {string} productId - Product ID
     * @param {Object} productData - Updated product data
     * @returns {Promise<Object>} Result object
     */
    async updateProduct(productId, productData) {
        try {
            // Validate product
            const validation = Validators.validateProduct(productData);
            if (!validation.valid) {
                return {
                    success: false,
                    errors: validation.errors
                };
            }

            // Load current products
            const products = await this.getAllProducts();
            const index = products.findIndex(p => p.id === productId);

            if (index === -1) {
                return {
                    success: false,
                    error: 'Sản phẩm không tồn tại'
                };
            }

            // Update product
            const existingProduct = products[index];
            const updatedProduct = {
                ...existingProduct,
                name: productData.name.trim(),
                description: productData.description.trim(),
                longDescription: productData.longDescription?.trim() || productData.description.trim(),
                categoryId: productData.categoryId,
                price: parseFloat(productData.price),
                compareAtPrice: parseFloat(productData.compareAtPrice) || 0,
                images: productData.images || existingProduct.images,
                sizes: productData.sizes || [],
                material: productData.material?.trim() || '',
                recycledContent: parseFloat(productData.recycledContent) || 0,
                stock: parseInt(productData.stock) || 0,
                isActive: productData.isActive !== false,
                isFeatured: productData.isFeatured === true,
                tags: productData.tags || [],
                updatedAt: new Date().toISOString()
            };

            products[index] = updatedProduct;

            // Save
            await Database.saveProducts(products);

            return {
                success: true,
                product: updatedProduct,
                message: CONFIG.MESSAGES.PRODUCT_SAVED
            };
        } catch (error) {
            console.error('Error updating product:', error);
            return {
                success: false,
                error: 'Có lỗi xảy ra khi cập nhật sản phẩm'
            };
        }
    },

    /**
     * Delete product
     * @param {string} productId - Product ID
     * @returns {Promise<Object>} Result object
     */
    async deleteProduct(productId) {
        try {
            const confirmed = confirm(CONFIG.MESSAGES.CONFIRM_DELETE);
            if (!confirmed) {
                return { success: false, cancelled: true };
            }

            const products = await this.getAllProducts();
            const filtered = products.filter(p => p.id !== productId);

            if (filtered.length === products.length) {
                return {
                    success: false,
                    error: 'Sản phẩm không tồn tại'
                };
            }

            await Database.saveProducts(filtered);

            return {
                success: true,
                message: CONFIG.MESSAGES.PRODUCT_DELETED
            };
        } catch (error) {
            console.error('Error deleting product:', error);
            return {
                success: false,
                error: 'Có lỗi xảy ra khi xóa sản phẩm'
            };
        }
    },

    /**
     * Toggle product active status
     * @param {string} productId - Product ID
     * @returns {Promise<Object>} Result object
     */
    async toggleProductActive(productId) {
        try {
            const products = await this.getAllProducts();
            const product = products.find(p => p.id === productId);

            if (!product) {
                return {
                    success: false,
                    error: 'Sản phẩm không tồn tại'
                };
            }

            product.isActive = !product.isActive;
            product.updatedAt = new Date().toISOString();

            await Database.saveProducts(products);

            return {
                success: true,
                product,
                message: product.isActive ? 'Đã kích hoạt sản phẩm' : 'Đã ẩn sản phẩm'
            };
        } catch (error) {
            console.error('Error toggling product:', error);
            return {
                success: false,
                error: 'Có lỗi xảy ra'
            };
        }
    },

    /**
     * Update product stock
     * @param {string} productId - Product ID
     * @param {number} newStock - New stock quantity
     * @returns {Promise<Object>} Result object
     */
    async updateStock(productId, newStock) {
        try {
            const stockValidation = Validators.validateStock(newStock);
            if (!stockValidation.valid) {
                return {
                    success: false,
                    error: stockValidation.error
                };
            }

            const products = await this.getAllProducts();
            const product = products.find(p => p.id === productId);

            if (!product) {
                return {
                    success: false,
                    error: 'Sản phẩm không tồn tại'
                };
            }

            product.stock = parseInt(newStock);
            product.updatedAt = new Date().toISOString();

            await Database.saveProducts(products);

            return {
                success: true,
                product,
                message: 'Đã cập nhật tồn kho'
            };
        } catch (error) {
            console.error('Error updating stock:', error);
            return {
                success: false,
                error: 'Có lỗi xảy ra'
            };
        }
    },

    // ==================
    // SETTINGS OPERATIONS
    // ==================

    /**
     * Get settings
     * @returns {Promise<Object>} Settings object
     */
    async getSettings() {
        return await Database.loadSettings();
    },

    /**
     * Update settings
     * @param {Object} settingsData - Settings data
     * @returns {Promise<Object>} Result object
     */
    async updateSettings(settingsData) {
        try {
            const currentSettings = await this.getSettings();

            const updatedSettings = {
                ...currentSettings,
                ...settingsData,
                updatedAt: new Date().toISOString()
            };

            await Database.saveSettings(updatedSettings);

            return {
                success: true,
                settings: updatedSettings,
                message: 'Đã cập nhật cài đặt'
            };
        } catch (error) {
            console.error('Error updating settings:', error);
            return {
                success: false,
                error: 'Có lỗi xảy ra khi cập nhật cài đặt'
            };
        }
    },

    // ==================
    // UTILITIES
    // ==================

    /**
     * Generate slug from text
     * @param {string} text - Input text
     * @returns {string} URL-friendly slug
     */
    generateSlug(text) {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
            .replace(/đ/g, 'd')
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    },

    /**
     * Get dashboard statistics
     * @returns {Promise<Object>} Dashboard stats
     */
    async getDashboardStats() {
        const products = await this.getAllProducts();
        const orders = OrderService.getAllOrders();
        const users = UserService.getAllUsers(); // Get real users

        const activeProducts = products.filter(p => p.isActive);
        const lowStock = products.filter(p =>
            p.stock > 0 && p.stock <= CONFIG.INVENTORY.LOW_STOCK_THRESHOLD
        );
        const outOfStock = products.filter(p => p.stock === 0);

        const orderStats = OrderService.getStatistics();
        const recentOrders = orders.slice(0, 5);

        return {
            products: {
                total: products.length,
                active: activeProducts.length,
                lowStock: lowStock.length,
                outOfStock: outOfStock.length
            },
            orders: orderStats,
            users: {
                total: users.length,
                new: users.filter(u => {
                    const diff = Date.now() - new Date(u.createdAt).getTime();
                    return diff < 7 * 24 * 60 * 60 * 1000; // New in last 7 days
                }).length
            },
            recentOrders: recentOrders.map(OrderService.formatOrder),
            lowStockProducts: lowStock.map(p => ({
                id: p.id,
                name: p.name,
                stock: p.stock
            }))
        };
    }
};

// Freeze to prevent modifications
Object.freeze(AdminService);

// Auto-run removed (Handled by AdminHeader)
