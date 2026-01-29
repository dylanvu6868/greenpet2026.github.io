/**
 * Order Detail Page Logic
 */

(function () {
    'use strict';

    DOM.ready(() => {
        const orderId = new URLSearchParams(window.location.search).get('id');
        if (!orderId) {
            window.location.href = 'profile-orders.html';
            return;
        }

        loadOrderDetails(orderId);
        setupEventListeners();
        updateHeader();
    });

    function loadOrderDetails(orderId) {
        // Mock data fetch
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const orders = OrderService.getOrdersByUser(currentUser?.email);
        const order = orders.find(o => o.orderNumber === orderId);

        if (!order) {
            alert('Không tìm thấy đơn hàng!');
            window.location.href = 'profile-orders.html';
            return;
        }

        renderOrderInfo(order);
        renderStepper(order.status);
        renderItems(order);
    }

    function renderOrderInfo(order) {
        const formatted = OrderService.formatOrder(order);

        DOM.text('#displayOrderId', `#${order.orderNumber}`);
        DOM.text('#orderDate', `Ngày đặt: ${formatted.formattedDate}`);

        // Badge
        const badgeSpan = DOM.byId('headerStatusBadge');
        if (badgeSpan) {
            badgeSpan.textContent = formatted.statusLabel;
            badgeSpan.className = `product-badge-new text-lg px-4 py-2 ${getStatusBadgeClass(order.status)}`;
        }

        // Customer & Shipping
        DOM.text('#customerName', order.shippingAddress.fullName);
        DOM.text('#customerPhone', order.shippingAddress.phone);
        DOM.text('#shippingAddress', `${order.shippingAddress.address}, ${order.shippingAddress.ward}, ${order.shippingAddress.district}, ${order.shippingAddress.city}`);
        DOM.text('#paymentMethod', order.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : 'Chuyển khoản ngân hàng');

        // Financials
        DOM.text('#summarySubtotal', OrderService.formatCurrency(order.subTotal));
        DOM.text('#summaryShipping', OrderService.formatCurrency(order.shippingFee));
        DOM.text('#summaryTotal', formatted.formattedTotal);

        // Cancel Button logic
        const cancelBtn = DOM.byId('cancelOrderBtn');
        if (cancelBtn && order.status === 'pending') {
            cancelBtn.classList.remove('hidden');
            cancelBtn.onclick = () => handleCancelOrder(order.orderNumber);
        }
    }

    function renderStepper(status) {
        const steps = ['pending', 'processing', 'shipping', 'completed'];
        const currentIdx = steps.indexOf(status);
        const progressWidth = Math.max(0, Math.min(100, (currentIdx / (steps.length - 1)) * 100));

        // Update Bar
        const bar = DOM.byId('stepperProgress');
        if (bar) bar.style.width = `${progressWidth}%`;

        // Update Dots
        document.querySelectorAll('.step-item').forEach((item, idx) => {
            if (idx <= currentIdx) {
                item.classList.add('completed');
            }
            if (idx === currentIdx) {
                item.classList.add('active');
            }
        });

        if (status === 'cancelled') {
            if (bar) {
                bar.style.backgroundColor = '#ef4444';
                bar.style.width = '100%';
            }
            // Optional: Visual cue for cancelled
        }
    }

    function renderItems(order) {
        const container = DOM.byId('orderItemsContainer');
        if (!container) return;

        let html = '';
        order.items.forEach(item => {
            const price = OrderService.formatCurrency(item.price);
            const total = OrderService.formatCurrency(item.price * item.quantity);
            const image = item.image || './assets/images/placeholder-product.png';

            html += `
                <div class="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-gray-100 items-start sm:items-center">
                    <div class="w-full sm:w-20 h-20 bg-gray-50 rounded-lg overflow-hidden shrink-0 border border-gray-100">
                        <img src="${image}" alt="${item.productName}" class="w-full h-full object-cover">
                    </div>
                    
                    <div class="flex-1 min-w-0">
                        <h4 class="font-bold text-gray-900 truncate" title="${item.productName}">${item.productName}</h4>
                        <p class="text-sm text-gray-500 mt-1">Phân loại: ${item.size || 'Tiêu chuẩn'} / ${item.color || 'Mặc định'}</p>
                        <p class="text-sm text-gray-500">x${item.quantity}</p>
                    </div>

                    <div class="text-right shrink-0">
                        <p class="font-bold text-primary">${total}</p>
                        <p class="text-xs text-gray-400 line-through">${price}</p>
                    </div>
                </div>
            `;
        });

        DOM.html(container, html);
    }

    function getStatusBadgeClass(status) {
        // Reusing logic from profile.js structure but mapping to specific colors
        switch (status) {
            case 'pending': return 'bg-orange-400';
            case 'processing': return 'bg-blue-500';
            case 'shipping': return 'bg-blue-600';
            case 'completed': return 'bg-green-600';
            case 'cancelled': return 'bg-red-500';
            default: return 'bg-gray-400';
        }
    }

    function handleCancelOrder(orderId) {
        if (confirm('Bạn có chắc muốn hủy đơn hàng này? Hành động này không thể hoàn tác.')) {
            // In a real app, API call here
            let orders = JSON.parse(localStorage.getItem('greenpet_orders')) || [];
            const idx = orders.findIndex(o => o.orderNumber === orderId);
            if (idx !== -1) {
                orders[idx].status = 'cancelled';
                localStorage.setItem('greenpet_orders', JSON.stringify(orders));
                alert('Đã hủy đơn hàng thành công.');
                location.reload();
            }
        }
    }

    function setupEventListeners() {
        const toggle = DOM.byId('mobileMenuToggle');
        const nav = DOM.byId('siteNav');
        if (toggle && nav) {
            DOM.on(toggle, 'click', () => DOM.toggleClass(nav, 'active'));
        }
    }

    function updateHeader() {
        if (window.CartService && window.UIComponents) {
            const count = CartService.getItemCount();
            UIComponents.updateHeaderCartCount(count);
        }
    }

})();
