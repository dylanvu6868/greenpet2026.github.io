/**
 * Checkout Page JavaScript
 */

(function () {
    'use strict';

    DOM.ready(async () => {
        await InitialData.initialize();

        // Check if user is logged in
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) {
            window.location.href = 'login.html';
            return;
        }

        // Check if cart is empty
        const cart = CartService.getCart();
        if (cart.items.length === 0) {
            window.location.href = 'cart.html';
            return;
        }

        renderOrderSummary();
        setupEventListeners();
    });

    function renderOrderSummary() {
        const cart = CartService.getCart();
        const totals = CartService.calculateTotals();

        // Render order items
        const itemsContainer = DOM.byId('orderItems');
        if (itemsContainer) {
            DOM.empty(itemsContainer);

            cart.items.forEach(item => {
                const itemEl = DOM.create('div', {
                    className: 'flex justify-between mb-sm',
                    style: 'font-size: 0.875rem;'
                });

                const info = DOM.create('div', {}, `${item.productName} (${item.size}) x${item.quantity}`);
                const price = DOM.create('div', {}, ProductService.formatPrice(item.price * item.quantity));

                DOM.append(itemEl, [info, price]);
                DOM.append(itemsContainer, itemEl);
            });
        }

        // Update totals
        const subtotal = DOM.byId('subtotalAmount');
        const shipping = DOM.byId('shippingAmount');
        const total = DOM.byId('totalAmount');

        if (subtotal) DOM.text(subtotal, ProductService.formatPrice(totals.subtotal));
        if (shipping) {
            DOM.text(shipping, totals.isFreeShipping ? 'Miễn phí' : ProductService.formatPrice(totals.shippingFee));
        }
        if (total) DOM.text(total, ProductService.formatPrice(totals.total));
    }

    function setupEventListeners() {
        const form = DOM.byId('checkoutForm');
        if (!form) return;

        // Payment method change logic
        const paymentRadios = DOM.qsa('input[name="paymentMethod"]');
        const bankQR = DOM.byId('bankTransferQR');

        paymentRadios.forEach(radio => {
            DOM.on(radio, 'change', (e) => {
                if (e.target.value === 'bank_transfer') {
                    if (bankQR) DOM.show(bankQR);
                } else {
                    if (bankQR) DOM.hide(bankQR);
                }
            });
        });

        DOM.on(form, 'submit', async (e) => {
            e.preventDefault();
            await handlePlaceOrder();
        });
    }

    async function handlePlaceOrder() {
        const form = DOM.byId('checkoutForm');
        const btn = DOM.byId('placeOrderBtn');

        if (!form || !btn) return;

        // Disable button
        btn.disabled = true;
        const originalText = btn.textContent;
        DOM.text(btn, 'Đang xử lý...');

        try {
            // Get form data
            const formData = DOM.serializeForm(form);

            // Build customer info
            const customerInfo = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                address: {
                    street: formData.street,
                    ward: formData.ward,
                    district: formData.district,
                    city: formData.city
                },
                notes: formData.notes || ''
            };

            const paymentMethod = formData.paymentMethod || 'cod';

            // Validate cart before order
            const validation = await CartService.validateCart();
            if (!validation.valid) {
                alert(validation.error || validation.errors.join('\n'));
                btn.disabled = false;
                DOM.text(btn, originalText);
                return;
            }

            // Create order
            const result = await OrderService.createOrder(customerInfo, paymentMethod);

            if (result.success) {
                // Redirect to success page
                window.location.href = `checkout-success.html?orderId=${result.order.orderNumber}`;
            } else {
                // Show errors
                let errorMessage = 'Có lỗi xảy ra khi đặt hàng';

                if (result.errors) {
                    errorMessage = Object.values(result.errors).join(', ');
                } else if (result.error) {
                    errorMessage = result.error;
                }

                // Redirect to fail page or just alert if it's a validation error?
                // For better UX during "checkout process" errors, maybe stay on page?
                // But user requested fail page. Let's redirect for critical errors, 
                // but keep alerts for simple validation if we could distinguish.
                // Assuming result.success = false implies a backend failure or logic failure.

                // However, common validation (like empty fields) is caught before this block.
                // So this is likely a processing error.
                window.location.href = `checkout-fail.html?error=${encodeURIComponent(errorMessage)}`;
            }

            btn.disabled = false;
            DOM.text(btn, originalText);
        } catch (error) {
            console.error('Error placing order:', error);
            alert('Có lỗi xảy ra. Vui lòng thử lại.');
            btn.disabled = false;
            DOM.text(btn, originalText);
        }
    }
})();
