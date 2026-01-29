/**
 * Cart Service
 * Handles shopping cart operations
 */

const CartService = {
    /**
     * Get current cart from LocalStorage
     * @returns {Object} Cart object
     */
    getCart() {
        const cart = Storage.get(CONFIG.STORAGE_KEYS.CART, {
            items: [],
            updatedAt: new Date().toISOString()
        });
        return cart;
    },

    /**
     * Save cart to LocalStorage
     * @param {Object} cart - Cart object
     * @returns {boolean} Success status
     */
    saveCart(cart) {
        cart.updatedAt = new Date().toISOString();
        return Storage.set(CONFIG.STORAGE_KEYS.CART, cart);
    },

    /**
     * Add item to cart
     * @param {string} productId - Product ID
     * @param {string} size - Selected size
     * @param {number} quantity - Quantity to add
     * @returns {Promise<Object>} Result object
     */
    async addItem(productId, size, quantity = 1) {
        try {
            // Validate product exists
            const product = await ProductService.getProduct(productId);
            if (!product) {
                return { success: false, error: 'Sản phẩm không tồn tại' };
            }

            // Check if product is active
            if (!product.isActive) {
                return { success: false, error: 'Sản phẩm không còn bán' };
            }

            // Validate size
            if (!product.sizes.includes(size)) {
                return { success: false, error: 'Size không hợp lệ' };
            }

            // Check stock
            const cart = this.getCart();
            const existingItem = cart.items.find(
                item => item.productId === productId && item.size === size
            );

            const currentQuantity = existingItem ? existingItem.quantity : 0;
            const newQuantity = currentQuantity + quantity;

            if (newQuantity > product.stock) {
                return {
                    success: false,
                    error: `Chỉ còn ${product.stock} sản phẩm trong kho`
                };
            }

            // Add or update item
            if (existingItem) {
                existingItem.quantity = newQuantity;
            } else {
                cart.items.push({
                    productId: product.id,
                    productName: product.name,
                    productSlug: product.slug,
                    size,
                    quantity,
                    price: product.price,
                    image: product.images[0],
                    recycledContent: product.recycledContent
                });
            }

            this.saveCart(cart);

            return {
                success: true,
                cart: this.getCart(),
                message: CONFIG.MESSAGES.ADD_TO_CART_SUCCESS
            };
        } catch (error) {
            console.error('Error adding item to cart:', error);
            return { success: false, error: 'Có lỗi xảy ra' };
        }
    },

    /**
     * Update item quantity
     * @param {string} productId - Product ID
     * @param {string} size - Size
     * @param {number} quantity - New quantity
     * @returns {Promise<Object>} Result object
     */
    async updateQuantity(productId, size, quantity) {
        try {
            const cart = this.getCart();
            const item = cart.items.find(
                i => i.productId === productId && i.size === size
            );

            if (!item) {
                return { success: false, error: 'Sản phẩm không có trong giỏ hàng' };
            }

            // Validate quantity
            if (quantity < 1) {
                return { success: false, error: 'Số lượng phải lớn hơn 0' };
            }

            // Check stock
            const product = await ProductService.getProduct(productId);
            if (!product) {
                return { success: false, error: 'Sản phẩm không tồn tại' };
            }

            if (quantity > product.stock) {
                return {
                    success: false,
                    error: `Chỉ còn ${product.stock} sản phẩm trong kho`
                };
            }

            item.quantity = quantity;
            this.saveCart(cart);

            return {
                success: true,
                cart: this.getCart(),
                message: CONFIG.MESSAGES.UPDATE_CART_SUCCESS
            };
        } catch (error) {
            console.error('Error updating cart quantity:', error);
            return { success: false, error: 'Có lỗi xảy ra' };
        }
    },

    /**
     * Remove item from cart
     * @param {string} productId - Product ID
     * @param {string} size - Size
     * @returns {Object} Result object
     */
    removeItem(productId, size) {
        const cart = this.getCart();
        const initialLength = cart.items.length;

        cart.items = cart.items.filter(
            item => !(item.productId === productId && item.size === size)
        );

        if (cart.items.length === initialLength) {
            return { success: false, error: 'Sản phẩm không có trong giỏ hàng' };
        }

        this.saveCart(cart);

        return {
            success: true,
            cart: this.getCart(),
            message: CONFIG.MESSAGES.REMOVE_FROM_CART
        };
    },

    /**
     * Clear entire cart
     * @returns {Object} Result object
     */
    clearCart() {
        const emptyCart = {
            items: [],
            updatedAt: new Date().toISOString()
        };

        this.saveCart(emptyCart);

        return {
            success: true,
            cart: emptyCart,
            message: 'Đã xóa giỏ hàng'
        };
    },

    /**
     * Get cart item count
     * @returns {number} Total number of items (counting quantities)
     */
    getItemCount() {
        const cart = this.getCart();
        return cart.items.reduce((total, item) => total + item.quantity, 0);
    },

    /**
     * Get cart unique product count
     * @returns {number} Number of unique products
     */
    getUniqueItemCount() {
        const cart = this.getCart();
        return cart.items.length;
    },

    /**
     * Calculate cart totals
     * @returns {Object} Totals object
     */
    calculateTotals() {
        const cart = this.getCart();

        const subtotal = cart.items.reduce((sum, item) => {
            return sum + (item.price * item.quantity);
        }, 0);

        const shippingFee = subtotal >= CONFIG.SHIPPING.FREE_SHIPPING_THRESHOLD
            ? 0
            : CONFIG.SHIPPING.DEFAULT_FEE;

        let total = subtotal + shippingFee;
        let discountAmount = 0;

        // Apply voucher if exists
        if (cart.voucher) {
            // Re-validate voucher in case conditions changed
            const validation = VoucherService.validateVoucher(cart.voucher.code, subtotal);
            if (validation.isValid) {
                discountAmount = validation.discountAmount;
                total -= discountAmount;
            } else {
                // Remove invalid voucher automatically
                this.removeVoucher();
            }
        }

        return {
            subtotal,
            shippingFee,
            discountAmount,
            total: Math.max(0, total),
            isFreeShipping: shippingFee === 0,
            amountForFreeShipping: Math.max(0, CONFIG.SHIPPING.FREE_SHIPPING_THRESHOLD - subtotal),
            appliedVoucher: cart.voucher
        };
    },

    /**
     * Apply voucher to cart
     * @param {string} code 
     * @returns {Object} Result
     */
    applyVoucher(code) {
        const cart = this.getCart();
        const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        const validation = VoucherService.validateVoucher(code, subtotal);

        if (!validation.isValid) {
            return { success: false, error: validation.error };
        }

        cart.voucher = {
            code: validation.voucher.code,
            discountType: validation.voucher.discountType,
            discountValue: validation.voucher.discountValue
        };

        this.saveCart(cart);

        return {
            success: true,
            message: 'Áp dụng mã giảm giá thành công',
            discountAmount: validation.discountAmount
        };
    },

    /**
     * Remove voucher from cart
     */
    removeVoucher() {
        const cart = this.getCart();
        delete cart.voucher;
        this.saveCart(cart);
        return { success: true };
    },

    /**
     * Validate cart before checkout
     * @returns {Promise<Object>} Validation result
     */
    async validateCart() {
        const cart = this.getCart();

        if (cart.items.length === 0) {
            return {
                valid: false,
                error: CONFIG.MESSAGES.CART_EMPTY
            };
        }

        const errors = [];

        // Check each item
        for (const item of cart.items) {
            const product = await ProductService.getProduct(item.productId);

            if (!product) {
                errors.push(`${item.productName}: Sản phẩm không còn tồn tại`);
                continue;
            }

            if (!product.isActive) {
                errors.push(`${item.productName}: Sản phẩm không còn bán`);
                continue;
            }

            if (item.quantity > product.stock) {
                errors.push(`${item.productName}: Chỉ còn ${product.stock} sản phẩm`);
            }

            // Update price if changed
            if (item.price !== product.price) {
                item.price = product.price;
            }
        }

        if (errors.length > 0) {
            // Save updated cart
            this.saveCart(cart);

            return {
                valid: false,
                errors
            };
        }

        return {
            valid: true
        };
    },

    /**
     * Get cart summary for display
     * @returns {Object} Cart summary
     */
    getSummary() {
        const cart = this.getCart();
        const totals = this.calculateTotals();

        return {
            itemCount: this.getItemCount(),
            uniqueItemCount: this.getUniqueItemCount(),
            items: cart.items,
            ...totals,
            isEmpty: cart.items.length === 0
        };
    },

    /**
     * Check if product is in cart
     * @param {string} productId - Product ID
     * @param {string} size - Size (optional)
     * @returns {boolean}
     */
    isInCart(productId, size = null) {
        const cart = this.getCart();

        if (size) {
            return cart.items.some(
                item => item.productId === productId && item.size === size
            );
        }

        return cart.items.some(item => item.productId === productId);
    },

    /**
     * Get item from cart
     * @param {string} productId - Product ID
     * @param {string} size - Size
     * @returns {Object|null} Cart item or null
     */
    getItem(productId, size) {
        const cart = this.getCart();
        return cart.items.find(
            item => item.productId === productId && item.size === size
        ) || null;
    }
};

// Freeze to prevent modifications
Object.freeze(CartService);
