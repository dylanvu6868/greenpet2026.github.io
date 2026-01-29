/**
 * Order Service
 * Handles order creation and management
 */

const OrderService = {
    /**
     * Get all orders from LocalStorage
     * @returns {Array} Array of orders
     */
    getAllOrders() {
        return Storage.get(CONFIG.STORAGE_KEYS.ORDERS, []);
    },

    /**
     * Get order by ID
     * @param {string} orderId - Order ID
     * @returns {Object|null} Order object or null
     */
    getOrder(orderId) {
        const orders = this.getAllOrders();
        return orders.find(o => o.id === orderId) || null;
    },

    /**
     * Create new order from cart
     * @param {Object} customerInfo - Customer information
     * @param {string} paymentMethod - Payment method
     * @returns {Promise<Object>} Result object
     */
    async createOrder(customerInfo, paymentMethod) {
        try {
            // Validate customer info
            const validation = Validators.validateCustomerInfo(customerInfo);
            if (!validation.valid) {
                return {
                    success: false,
                    errors: validation.errors
                };
            }

            // Validate cart
            const cartValidation = await CartService.validateCart();
            if (!cartValidation.valid) {
                return {
                    success: false,
                    error: cartValidation.error || cartValidation.errors.join(', ')
                };
            }

            const cart = CartService.getCart();
            if (cart.items.length === 0) {
                return {
                    success: false,
                    error: CONFIG.MESSAGES.CART_EMPTY
                };
            }

            // Calculate totals
            const totals = CartService.calculateTotals();

            // Generate order ID
            const timestamp = Date.now();
            const orderId = `ORD${timestamp}`;

            // Create order object
            const order = {
                id: orderId,
                orderNumber: orderId,
                customerName: customerInfo.name.trim(),
                customerEmail: customerInfo.email.trim(),
                customerPhone: customerInfo.phone.trim(),
                shippingAddress: {
                    street: customerInfo.address.street.trim(),
                    ward: customerInfo.address.ward.trim(),
                    district: customerInfo.address.district.trim(),
                    city: customerInfo.address.city.trim()
                },
                items: cart.items.map(item => ({
                    productId: item.productId,
                    productName: item.productName,
                    productSlug: item.productSlug,
                    size: item.size,
                    quantity: item.quantity,
                    price: item.price,
                    image: item.image
                })),
                subtotal: totals.subtotal,
                shippingFee: totals.shippingFee,
                total: totals.total,
                status: CONFIG.ORDER_STATUS.PENDING,
                paymentMethod: paymentMethod || CONFIG.PAYMENT_METHODS.COD,
                notes: customerInfo.notes || '',
                createdAt: new Date().toISOString()
            };

            // DEDUCT STOCK
            // Note: Since we are using localStorage/client-side DB, we need to be careful with concurrency (though here it's single user)
            const products = await Database.loadProducts();
            for (const item of order.items) {
                const productIndex = products.findIndex(p => p.id === item.productId);
                if (productIndex !== -1) {
                    if (products[productIndex].stock >= item.quantity) {
                        products[productIndex].stock -= item.quantity;
                    } else {
                        // Fallback check (should have been caught by validateCart, but safety first)
                        return {
                            success: false,
                            error: `Sản phẩm ${item.productName} không đủ tồn kho`
                        };
                    }
                }
            }
            // Save updated products
            await Database.saveProducts(products);


            // Save order
            const orders = this.getAllOrders();
            orders.unshift(order); // Add to beginning
            Storage.set(CONFIG.STORAGE_KEYS.ORDERS, orders);

            // Clear cart
            CartService.clearCart();

            return {
                success: true,
                order,
                message: CONFIG.MESSAGES.ORDER_SUCCESS
            };
        } catch (error) {
            console.error('Error creating order:', error);
            return {
                success: false,
                error: CONFIG.MESSAGES.ORDER_ERROR
            };
        }
    },

    /**
     * Update order status (Admin only)
     * @param {string} orderId - Order ID
     * @param {string} newStatus - New status
     * @returns {Object} Result object
     */
    async updateOrderStatus(orderId, newStatus) {
        const orders = this.getAllOrders();
        const order = orders.find(o => o.id === orderId);

        if (!order) {
            return {
                success: false,
                error: 'Đơn hàng không tồn tại'
            };
        }

        // Validate status
        const validStatuses = Object.values(CONFIG.ORDER_STATUS);
        if (!validStatuses.includes(newStatus)) {
            return {
                success: false,
                error: 'Trạng thái không hợp lệ'
            };
        }

        const oldStatus = order.status;

        // RESTORE STOCK IF CANCELLED
        if (newStatus === CONFIG.ORDER_STATUS.CANCELLED && oldStatus !== CONFIG.ORDER_STATUS.CANCELLED) {
            const products = await Database.loadProducts();
            for (const item of order.items) {
                const productIndex = products.findIndex(p => p.id === item.productId);
                if (productIndex !== -1) {
                    products[productIndex].stock += item.quantity;
                }
            }
            await Database.saveProducts(products);
        }

        // DEDUCT STOCK IF UN-CANCELLED (Rare case, but logical)
        if (oldStatus === CONFIG.ORDER_STATUS.CANCELLED && newStatus !== CONFIG.ORDER_STATUS.CANCELLED) {
            const products = await Database.loadProducts();
            for (const item of order.items) {
                const productIndex = products.findIndex(p => p.id === item.productId);
                if (productIndex !== -1) {
                    if (products[productIndex].stock >= item.quantity) {
                        products[productIndex].stock -= item.quantity;
                    } else {
                        return { success: false, error: `Không đủ tồn kho để khôi phục đơn hàng (${item.productName})` };
                    }
                }
            }
            await Database.saveProducts(products);
        }

        order.status = newStatus;
        order.updatedAt = new Date().toISOString();

        Storage.set(CONFIG.STORAGE_KEYS.ORDERS, orders);

        return {
            success: true,
            order,
            message: 'Đã cập nhật trạng thái đơn hàng'
        };
    },

    /**
     * Get orders by user email
     * @param {string} email - User email
     * @returns {Array} User orders sorted by date desc
     */
    getOrdersByUser(email) {
        const orders = this.getAllOrders();
        const userOrders = orders.filter(o => o.customerEmail === email);
        return this.sortOrders(userOrders, 'date-desc');
    },

    /**
     * Get orders by status
     * @param {string} status - Order status
     * @returns {Array} Filtered orders
     */
    getOrdersByStatus(status) {
        const orders = this.getAllOrders();
        return orders.filter(o => o.status === status);
    },

    /**
     * Get order statistics
     * @returns {Object} Statistics object
     */
    getStatistics() {
        const orders = this.getAllOrders();

        const stats = {
            total: orders.length,
            pending: 0,
            processing: 0,
            completed: 0,
            cancelled: 0,
            totalRevenue: 0,
            completedRevenue: 0
        };

        orders.forEach(order => {
            stats[order.status]++;

            if (order.status === CONFIG.ORDER_STATUS.COMPLETED) {
                stats.completedRevenue += order.total;
            }

            stats.totalRevenue += order.total;
        });

        return stats;
    },

    /**
     * Format order for display
     * @param {Object} order - Order object
     * @returns {Object} Formatted order
     */
    formatOrder(order) {
        return {
            ...order,
            statusLabel: CONFIG.ORDER_STATUS_LABELS[order.status] || order.status,
            paymentMethodLabel: CONFIG.PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod,
            formattedTotal: ProductService.formatPrice(order.total),
            formattedSubtotal: ProductService.formatPrice(order.subtotal),
            formattedShipping: ProductService.formatPrice(order.shippingFee),
            formattedDate: new Date(order.createdAt).toLocaleDateString('vi-VN', CONFIG.DATE_FORMAT.OPTIONS)
        };
    },

    /**
     * Search orders
     * @param {string} query - Search query (order number, customer name, email, phone)
     * @returns {Array} Matching orders
     */
    searchOrders(query) {
        if (!query || query.trim().length === 0) {
            return this.getAllOrders();
        }

        const searchTerm = query.toLowerCase();
        const orders = this.getAllOrders();

        return orders.filter(order =>
            order.orderNumber.toLowerCase().includes(searchTerm) ||
            order.customerName.toLowerCase().includes(searchTerm) ||
            order.customerEmail.toLowerCase().includes(searchTerm) ||
            order.customerPhone.includes(searchTerm)
        );
    },

    /**
     * Sort orders
     * @param {Array} orders - Orders array
     * @param {string} sortBy - Sort criteria
     * @returns {Array} Sorted orders
     */
    sortOrders(orders, sortBy) {
        const sorted = [...orders];

        switch (sortBy) {
            case 'date-desc':
                return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            case 'date-asc':
                return sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

            case 'total-desc':
                return sorted.sort((a, b) => b.total - a.total);

            case 'total-asc':
                return sorted.sort((a, b) => a.total - b.total);

            case 'status':
                const statusOrder = ['pending', 'processing', 'completed', 'cancelled'];
                return sorted.sort((a, b) =>
                    statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
                );

            default:
                return sorted;
        }
    },

    /**
     * Delete order (Admin only)
     * @param {string} orderId - Order ID
     * @returns {Object} Result object
     */
    deleteOrder(orderId) {
        const orders = this.getAllOrders();
        const initialLength = orders.length;

        const filteredOrders = orders.filter(o => o.id !== orderId);

        if (filteredOrders.length === initialLength) {
            return {
                success: false,
                error: 'Đơn hàng không tồn tại'
            };
        }

        Storage.set(CONFIG.STORAGE_KEYS.ORDERS, filteredOrders);

        return {
            success: true,
            message: 'Đã xóa đơn hàng'
        };
    }
};

// Freeze to prevent modifications
Object.freeze(OrderService);
