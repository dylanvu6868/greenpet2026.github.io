/**
 * Cart Page JavaScript
 */

(function () {
    'use strict';

    DOM.ready(async () => {
        await InitialData.initialize();
        renderCart();
        setupEventListeners();
    });

    function renderCart() {
        const cart = CartService.getCart();
        const loader = DOM.byId('cartLoader');
        const emptyCart = DOM.byId('emptyCart');
        const cartWithItems = DOM.byId('cartWithItems');

        // Hide loader
        if (loader) DOM.hide(loader);

        if (cart.items.length === 0) {
            // Show empty state
            const emptyState = UIComponents.renderEmptyState(
                null,
                'Giỏ hàng trống',
                'Bạn chưa có sản phẩm nào trong giỏ hàng',
                DOM.create('a', {
                    href: 'products.html',
                    className: 'btn btn-primary btn-lg'
                }, 'Khám phá sản phẩm')
            );

            DOM.empty(emptyCart);
            DOM.append(emptyCart, emptyState);
            DOM.show(emptyCart);
            DOM.hide(cartWithItems);
            updateHeaderCartCount();
            return;
        }

        // Show cart with items
        DOM.hide(emptyCart);
        DOM.show(cartWithItems);

        renderCartItems(cart.items);
        renderCartSummary();
        updateHeaderCartCount();
    }

    function renderCartItems(items) {
        const container = DOM.byId('cartItems');
        if (!container) return;

        DOM.empty(container);

        items.forEach(item => {
            const cartItem = UIComponents.renderCartItem(item);
            DOM.append(container, cartItem);
        });
    }

    function renderCartSummary() {
        const totals = CartService.calculateTotals();

        const subtotalEl = DOM.byId('subtotalAmount');
        const shippingEl = DOM.byId('shippingAmount');
        const discountRow = DOM.byId('discountRow');
        const discountEl = DOM.byId('discountAmount');
        const totalEl = DOM.byId('totalAmount');
        const voucherInput = DOM.byId('voucherCode');
        const voucherMsg = DOM.byId('voucherMessage');

        if (subtotalEl) DOM.text(subtotalEl, ProductService.formatPrice(totals.subtotal));
        if (shippingEl) DOM.text(shippingEl, ProductService.formatPrice(totals.shippingFee));
        if (totalEl) DOM.text(totalEl, ProductService.formatPrice(totals.total));

        // Discount display
        if (totals.discountAmount > 0) {
            DOM.show(discountRow);
            DOM.text(discountEl, `-${ProductService.formatPrice(totals.discountAmount)}`);
            if (totals.appliedVoucher && voucherInput) {
                voucherInput.value = totals.appliedVoucher.code;
                voucherInput.disabled = true;
                if (voucherMsg) {
                    voucherMsg.textContent = `Đã dùng mã ${totals.appliedVoucher.code}`;
                    voucherMsg.className = 'text-sm mt-xs text-success';
                }

                // Switch button to Remove
                const applyBtn = DOM.byId('applyVoucherBtn');
                if (applyBtn) {
                    applyBtn.textContent = 'Xóa';
                    applyBtn.onclick = removeVoucher;
                }
            }
        } else {
            DOM.hide(discountRow);
            if (voucherInput) {
                voucherInput.disabled = false;
                // Reset button
                const applyBtn = DOM.byId('applyVoucherBtn');
                if (applyBtn) {
                    applyBtn.textContent = 'Áp dụng';
                    applyBtn.onclick = applyVoucher;
                }
            }
        }

        // ... existing free shipping logic ...
        const freeShippingMsg = DOM.byId('freeShippingMessage');
        const almostFreeMsg = DOM.byId('almostFreeShipping');
        const amountNeeded = DOM.byId('amountNeeded');

        if (totals.isFreeShipping) {
            if (freeShippingMsg) DOM.show(freeShippingMsg);
            if (almostFreeMsg) DOM.hide(almostFreeMsg);
        } else {
            if (freeShippingMsg) DOM.hide(freeShippingMsg);
            if (almostFreeMsg && amountNeeded) {
                DOM.text(amountNeeded, ProductService.formatPrice(totals.amountForFreeShipping));
                DOM.show(almostFreeMsg);
            }
        }
    }

    async function applyVoucher() {
        const code = DOM.byId('voucherCode').value;
        if (!code) return;

        const result = CartService.applyVoucher(code);
        const voucherMsg = DOM.byId('voucherMessage');

        if (result.success) {
            renderCartSummary();
            if (voucherMsg) {
                voucherMsg.textContent = result.message;
                voucherMsg.className = 'text-sm mt-xs text-success';
            }
        } else {
            if (voucherMsg) {
                voucherMsg.textContent = result.error;
                voucherMsg.className = 'text-sm mt-xs text-error';
            }
        }
    }

    function removeVoucher() {
        CartService.removeVoucher();
        DOM.byId('voucherCode').value = '';
        const voucherMsg = DOM.byId('voucherMessage');
        if (voucherMsg) voucherMsg.textContent = '';
        renderCartSummary();
    }

    function setupEventListeners() {
        // ... existing listeners ...

        // Checkout button
        const checkoutBtn = DOM.byId('checkoutBtn');
        if (checkoutBtn) {
            DOM.on(checkoutBtn, 'click', () => {
                const currentUser = JSON.parse(localStorage.getItem('currentUser'));
                if (!currentUser) {
                    alert('Vui lòng đăng nhập để thanh toán');
                    window.location.href = 'login.html';
                    return;
                }
                window.location.href = 'checkout.html';
            });
        }

        // Initial attach for apply button is handled in renderCartSummary but safe to attach default here
        const applyBtn = DOM.byId('applyVoucherBtn');
        if (applyBtn) {
            DOM.on(applyBtn, 'click', applyVoucher);
        }
    }

    // Global function for UI components to call
    window.updateCart = renderCart;
})();
