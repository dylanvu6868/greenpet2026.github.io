/**
 * Admin Sidebar Component
 * Renders the sidebar navigation and handles the hamburger menu toggle.
 */

const AdminSidebar = {
    render(activePage) {
        // Create Sidebar Container
        const sidebar = document.createElement('aside');
        sidebar.className = 'admin-sidebar';
        sidebar.id = 'adminSidebar';

        // Sidebar Header (Logo)
        const header = document.createElement('div');
        header.className = 'admin-sidebar-header';
        header.innerHTML = `
            <a href="index.html" class="sidebar-logo">
                <img src="../assets/images/logo.svg" alt="GreenPet">
                <span>Admin</span>
            </a>
            <button class="btn-text close-sidebar-btn" id="closeSidebarBtn">&times;</button>
        `;
        sidebar.appendChild(header);

        // Navigation Links
        const nav = document.createElement('nav');
        nav.className = 'admin-sidebar-nav';

        const menuItems = [
            { id: 'dashboard', label: 'Dashboard', icon: '📊', href: 'index.html' },
            { id: 'products', label: 'Sản phẩm', icon: '📦', href: 'products.html' },
            { id: 'orders', label: 'Đơn hàng', icon: '🛒', href: 'orders.html' },
            { id: 'vouchers', label: 'Mã giảm giá', icon: '🎫', href: 'vouchers.html' },
            // { id: 'blog', label: 'Tin tức', icon: '📰', href: 'blog.html' }, // Removed as per user deletion
            { id: 'settings', label: 'Cài đặt', icon: '⚙️', href: 'settings.html' },
            { id: 'home', label: 'Trang chủ', icon: '🏠', href: '../index.html' }
        ];

        // Filter based on role (AdminService)
        const role = AdminService.getRole();
        const restricted = ['settings', 'vouchers'];

        menuItems.forEach(item => {
            if (role !== 'owner' && restricted.includes(item.id)) return;

            const link = document.createElement('a');
            link.href = item.href;
            link.className = `sidebar-link ${activePage === item.id ? 'active' : ''}`;
            link.innerHTML = `
                <span class="sidebar-icon">${item.icon}</span>
                <span class="sidebar-label">${item.label}</span>
            `;
            nav.appendChild(link);
        });

        sidebar.appendChild(nav);

        // User Info / Logout (Bottom)
        const footer = document.createElement('div');
        footer.className = 'admin-sidebar-footer';
        footer.innerHTML = `
            <div class="user-info">
                <div class="user-avatar">${role === 'owner' ? '👑' : '👤'}</div>
                <div class="user-details">
                    <div class="user-name">Admin</div>
                    <div class="user-role">${role === 'owner' ? 'Chủ cửa hàng' : 'Nhân viên'}</div>
                </div>
            </div>
            <button class="btn-logout" id="sidebarLogoutBtn">
                ↪
            </button>
        `;
        sidebar.appendChild(footer);

        document.body.prepend(sidebar);

        // Backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'sidebar-backdrop';
        backdrop.id = 'sidebarBackdrop';
        document.body.appendChild(backdrop);

        // Sidebar Events
        this.setupEvents();
    },

    setupEvents() {
        const toggleBtn = document.getElementById('sidebarToggleBtn');
        const closeBtn = document.getElementById('closeSidebarBtn');
        const backdrop = document.getElementById('sidebarBackdrop');
        const logoutBtn = document.getElementById('sidebarLogoutBtn');
        const sidebar = document.getElementById('adminSidebar');

        function toggleSidebar() {
            sidebar.classList.toggle('active');
            backdrop.classList.toggle('active');
        }

        if (toggleBtn) toggleBtn.addEventListener('click', toggleSidebar);
        if (closeBtn) closeBtn.addEventListener('click', toggleSidebar);
        if (backdrop) backdrop.addEventListener('click', toggleSidebar);

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                AdminService.logout();
                window.location.href = 'login.html';
            });
        }
    }
};
