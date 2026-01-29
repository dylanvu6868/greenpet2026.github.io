document.addEventListener('DOMContentLoaded', async () => {
    // Auth handled by AdminHeader implicitly

    const orderId = new URLSearchParams(window.location.search).get('id');
    if (!orderId) {
        alert('Không tìm thấy mã đơn hàng');
        window.location.href = 'orders.html';
        return;
    }

    try {
        await loadOrderDetails(orderId);
    } catch (e) {
        console.error(e);
        alert('Có lỗi khi tải đơn hàng');
    }

    // Bind Status Update
    const updateBtn = document.getElementById('updateStatusBtn');
    if (updateBtn) {
        updateBtn.addEventListener('click', async () => {
            const status = document.getElementById('statusSelect').value;
            if (confirm('Cập nhật trạng thái đơn hàng?')) {
                const result = await AdminService.updateOrderStatus(orderId, status);
                if (result.success) {
                    alert('Cập nhật thành công');
                    loadOrderDetails(orderId); // Reload
                } else {
                    alert(result.error || 'Có lỗi xảy ra');
                }
            }
        });
    }

    async function loadOrderDetails(id) {
        // AdminService should helper to get order, or direct OrderService? 
        // Existing pattern uses AdminService wrappers usually, but let's check OrderService usage
        // Given earlier files used OrderService directly for listing, we'll try OrderService.
        // ideally AdminService has `getOrder(id)`

        let order = null;
        if (typeof AdminService.getOrder === 'function') {
            order = await AdminService.getOrder(id);
        } else {
            // Fallback to OrderService if AdminService wrapper missing
            order = OrderService.getOrderById(id);
        }

        if (!order) {
            document.querySelector('.container').innerHTML = '<div class="alert alert-danger">Không tìm thấy đơn hàng</div>';
            return;
        }

        renderOrder(order);
    }

    function renderOrder(order) {
        // Header Info
        document.getElementById('orderIdText').textContent = `#${order.id}`;
        document.getElementById('itemCount').textContent = `${order.items.length} sản phẩm`;

        // Status
        const statusBadge = document.getElementById('orderStatusBadge');
        const statusMap = {
            pending: { text: 'Chờ xử lý', class: 'badge-warning' },
            processing: { text: 'Đang xử lý', class: 'badge-info' },
            shipping: { text: 'Đang giao', class: 'badge-primary' },
            completed: { text: 'Hoàn thành', class: 'badge-success' },
            cancelled: { text: 'Đã hủy', class: 'badge-danger' }
        };
        const s = statusMap[order.status] || { text: order.status, class: 'badge-secondary' };
        statusBadge.textContent = s.text;
        statusBadge.className = `badge ${s.class} badge-lg`;

        // Update Select
        document.getElementById('statusSelect').value = order.status;

        // Render Items
        const itemsContainer = document.getElementById('orderItems');
        itemsContainer.innerHTML = order.items.map(item => `
            <div class="flex items-center gap-md py-md px-lg">
                <img src="${item.image || '../assets/images/placeholder.png'}" 
                     alt="${item.name}" 
                     class="w-16 h-16 object-cover rounded border border-gray-100">
                <div class="flex-1">
                    <h4 class="font-bold text-gray-800 text-sm mb-xs">${item.name}</h4>
                    <div class="text-xs text-gray-500">Phân loại: ${item.size || 'Default'}</div>
                    <div class="text-xs text-gray-500">x${item.quantity}</div>
                </div>
                <div class="text-right">
                    <div class="font-bold text-gray-900">${ProductService.formatPrice(item.price * item.quantity)}</div>
                    <div class="text-xs text-gray-400">${ProductService.formatPrice(item.price)} / sp</div>
                </div>
            </div>
        `).join('');

        // Financials
        document.getElementById('subTotal').textContent = ProductService.formatPrice(order.subTotal || order.total); // Fallback
        document.getElementById('shippingFee').textContent = ProductService.formatPrice(order.shippingFee || 0);
        document.getElementById('totalAmount').textContent = ProductService.formatPrice(order.total);

        // Customer Info (Mock if missing)
        document.getElementById('customerName').textContent = order.customerName || order.shippingAddress?.name || 'Khách lẻ';
        document.getElementById('customerEmail').textContent = order.customerEmail || 'N/A';
        document.getElementById('customerPhone').textContent = order.customerPhone || order.shippingAddress?.phone || 'N/A';

        // Address
        if (order.shippingAddress) {
            const addr = order.shippingAddress;
            document.getElementById('shippingAddress').textContent =
                `${addr.address}, ${addr.ward}, ${addr.district}, ${addr.city}`;
        } else {
            document.getElementById('shippingAddress').textContent = 'Tại cửa hàng';
        }

        // Payment
        document.getElementById('paymentMethod').textContent =
            order.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : 'Chuyển khoản';
    }
});
