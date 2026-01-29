document.addEventListener('DOMContentLoaded', async () => {
    // Auth handled by AdminHeader
    // Logout handled by AdminHeader

    const tableContainer = document.getElementById('orderTableContainer');
    const tableBody = document.getElementById('orderTableBody');
    const loading = document.getElementById('loading');
    const tabBtns = document.querySelectorAll('.tab-btn');

    let allOrders = [];
    let currentFilter = 'all';

    // Initial Load
    await loadOrders();

    // Tab Filtering
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // UI Update
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Logic Update
            currentFilter = btn.dataset.status;
            renderTable();
        });
    });

    async function loadOrders() {
        try {
            // Fetch all orders (mock logic: ideally AdminService should support this directly or via pagination)
            // For now accessing OrderService directly as per admin-service impl.
            allOrders = OrderService.getAllOrders();

            // Sort by date desc
            allOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            renderTable();

            loading.style.display = 'none';
            tableContainer.style.display = 'block';
        } catch (error) {
            console.error('Error loading orders:', error);
            alert('Có lỗi xảy ra khi tải danh sách đơn hàng');
        }
    }

    function renderTable() {
        let filteredOrders = allOrders;
        if (currentFilter !== 'all') {
            filteredOrders = allOrders.filter(o => o.status === currentFilter);
        }

        if (filteredOrders.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Không tìm thấy đơn hàng nào</td></tr>';
            return;
        }

        tableBody.innerHTML = filteredOrders.map(order => {
            // Mock formatting or use OrderService helper if available
            const formattedDate = new Date(order.createdAt).toLocaleDateString('vi-VN', {
                year: 'numeric', month: 'numeric', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });

            // Map statuses to labels/colors
            const statusConfig = {
                pending: { label: 'Chờ xử lý', color: 'badge-warning' },
                processing: { label: 'Đang xử lý', color: 'badge-info' },
                shipping: { label: 'Đang giao', color: 'badge-primary' },
                completed: { label: 'Hoàn thành', color: 'badge-success' },
                cancelled: { label: 'Đã hủy', color: 'badge-danger' }
            };
            const statusInfo = statusConfig[order.status] || { label: order.status, color: 'badge-secondary' };

            return `
                <tr>
                    <td><strong>${order.id}</strong></td>
                    <td>${formattedDate}</td>
                    <td>
                        <div>${order.customerName}</div>
                        <div class="text-sm text-gray">${order.customerEmail}</div>
                    </td>
                    <td>${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total)}</td>
                    <td><span class="badge ${statusInfo.color}">${statusInfo.label}</span></td>
                    <td>
                         <a href="order-detail.html?id=${order.id}" class="btn btn-sm btn-secondary">Xem</a>
                    </td>
                </tr>
            `;
        }).join('');
    }
});
