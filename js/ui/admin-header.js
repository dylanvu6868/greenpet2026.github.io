/**
 * AdminHeader Component
 * Renders the consistent admin header across all pages.
 */
const AdminHeader = {
    init() {
        // 1. Check Authentication immediately
        if (typeof AdminService !== 'undefined') {
            if (!AdminService.requireAuth()) return; // Will redirect

            // 2. Apply Role Permissions
            AdminService.applyRoleUI();
        }

        // 3. Render Header
        this.render();
        this.highlightActiveLink();
        this.bindEvents();
    },

    render() {
        // Determine if we need to prepend or replace
        // Ideally, we look for a specific container, or inject at top of body
        // For smoother transition, we'll try to replace existing header or prepend to body

        const existingHeader = document.querySelector('header.admin-header');
        if (existingHeader) {
            existingHeader.remove();
        }

        const headerHTML = `
      <header class="admin-header site-header sticky-header">
        <div class="header-container container">
            <div class="header-left">
                <a href="index.html" class="site-logo">
                    <img src="../assets/images/logo.svg" alt="GreenPet" class="logo-img">
                    <span class="logo-text">Admin Portal</span>
                </a>
            </div>
            
            <div class="header-center">
                <nav class="site-nav">
                    <a href="index.html" class="nav-link" data-page="index">Dashboard</a>
                    <a href="products.html" class="nav-link" data-page="products">Sản phẩm</a>
                    <a href="orders.html" class="nav-link" data-page="orders">Đơn hàng</a>
                    <a href="messages.html" class="nav-link" data-page="messages">Tin nhắn</a>
                    <a href="vouchers.html" class="nav-link" data-page="vouchers">Mã giảm giá</a>
                    <a href="subscribers.html" class="nav-link" data-page="subscribers">Subscribers</a>
                    <a href="settings.html" class="nav-link" data-page="settings">Cài đặt</a>
                </nav>
            </div>

            <div class="header-right">
                <a href="../index.html" class="nav-link home-link" title="Về trang chủ">
                    <span class="icon">🏠</span>
                    <span class="text">Trang chủ</span>
                </a>
                <div class="user-menu">
                    <div class="user-avatar">AD</div>
                    <button class="btn btn-sm btn-logout" id="js-logout-btn">
                        <span class="icon">🚪</span>
                        <span>Đăng xuất</span>
                    </button>
                </div>
            </div>
        </div>
      </header>
    `;

        document.body.insertAdjacentHTML('afterbegin', headerHTML);
    },

    highlightActiveLink() {
        const path = window.location.pathname;
        const page = path.split('/').pop() || 'index.html';

        // Normalize page name (remove .html if needed or handle root)
        let cleanPage = page.replace('.html', '');
        if (cleanPage === 'admin' || cleanPage === '') cleanPage = 'index';

        // Handle specific cases (like product-form should highlight products)
        if (cleanPage === 'product-form') cleanPage = 'products';
        if (cleanPage === 'order-detail') cleanPage = 'orders';

        const links = document.querySelectorAll('.site-nav .nav-link');
        links.forEach(link => {
            if (link.dataset.page === cleanPage) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    },

    bindEvents() {
        const logoutBtn = document.getElementById('js-logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (typeof AdminService !== 'undefined') {
                    AdminService.logout();
                    window.location.href = 'login.html';
                } else {
                    // Fallback if AdminService is not loaded yet (should generally be loaded)
                    console.warn('AdminService not found');
                    window.location.href = 'login.html';
                }
            });
        }
    }
};

// Auto-init if DOM is ready, or wait
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AdminHeader.init());
} else {
    AdminHeader.init();
}
