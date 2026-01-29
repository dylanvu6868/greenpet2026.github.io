/**
 * Profile Logic
 * - Load & hiển thị dữ liệu hồ sơ
 * - Cập nhật avatar, thông tin và lưu vào LocalStorage
 * - Hiển thị đơn hàng gần đây
 */

(function () {
    'use strict';

    DOM.ready(() => {
        try {
            initAnimations();
            loadProfileData();
            loadRecentOrders();
        } catch (error) {
            console.error('Profile initialization error:', error);
        }

        bindEvents();
    });

    /**
     * Helpers cho currentUser trong LocalStorage
     */
    function getCurrentUser() {
        // Ưu tiên wrapper Storage nếu có, fallback về localStorage thuần
        if (typeof Storage !== 'undefined' && Storage.get) {
            return Storage.get('currentUser', null);
        }
        try {
            return JSON.parse(localStorage.getItem('currentUser'));
        } catch {
            return null;
        }
    }

    function saveCurrentUser(user) {
        if (typeof Storage !== 'undefined' && Storage.set) {
            Storage.set('currentUser', user);
        } else {
            localStorage.setItem('currentUser', JSON.stringify(user));
        }
    }

    /**
     * Gắn các event: upload avatar, submit form
     */
    function bindEvents() {
        // Avatar Upload
        const avatarInput = DOM.byId('avatarInput');
        const avatarImg = DOM.byId('avatarImg');

        if (avatarInput && avatarImg) {
            avatarInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (ev) => {
                    const dataUrl = ev.target.result;

                    // Cập nhật UI
                    avatarImg.src = dataUrl;

                    // Lưu vào currentUser
                    const user = getCurrentUser() || {};
                    user.avatar = dataUrl;
                    saveCurrentUser(user);

                    showToast('Đã cập nhật ảnh đại diện!');
                };
                reader.readAsDataURL(file);
            });
        }

        // Profile Form Submit
        const form = DOM.byId('profileForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();

                const nameInput = DOM.byId('profileName');
                const phoneInput = DOM.byId('profilePhone');
                const addressInput = DOM.byId('profileAddress');

                const newName = nameInput ? nameInput.value.trim() : '';
                const newPhone = phoneInput ? phoneInput.value.trim() : '';
                const newAddress = addressInput ? addressInput.value.trim() : '';

                if (!newName) {
                    alert('Vui lòng nhập họ tên!');
                    return;
                }

                // Lấy user hiện tại và cập nhật
                const user = getCurrentUser() || {};
                // Đồng bộ cả displayName và name để header dropdown dùng chung
                user.displayName = newName;
                user.name = newName;
                user.phone = newPhone;
                user.address = newAddress;

                saveCurrentUser(user);

                // Cập nhật hiển thị trên trang
                const headerName = DOM.byId('userNameDisplay');
                if (headerName) {
                    headerName.textContent = newName;
                }

                // Loading state cho nút
                const btn = form.querySelector('button[type="submit"]');
                if (btn) {
                    const originalHtml = btn.innerHTML;
                    btn.disabled = true;
                    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Đang lưu...';

                    setTimeout(() => {
                        btn.disabled = false;
                        btn.innerHTML = originalHtml;
                        showToast('Đã lưu thông tin hồ sơ!');
                    }, 800);
                } else {
                    showToast('Đã lưu thông tin hồ sơ!');
                }
            });
        }
    }

    /**
     * Toast Notification helper
     */
    function showToast(message) {
        // Dùng toast chung nếu đã có trong layout
        const toast = DOM.byId('toast');
        const msgEl = DOM.byId('toast-message');

        if (toast && msgEl) {
            msgEl.textContent = message;
            toast.classList.remove('translate-x-full');
            setTimeout(() => {
                toast.classList.add('translate-x-full');
            }, 3000);
        } else {
            // Fallback đơn giản
            console.log('[Toast]', message);
        }
    }

    // Cho phép chỗ khác dùng showToast nếu cần
    window.showToast = showToast;

    /**
     * 1. Intersection Observer cho hiệu ứng fade-in-up
     */
    function initAnimations() {
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries, observerInstance) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observerInstance.unobserve(entry.target);
                }
            });
        }, observerOptions);

        document.querySelectorAll('.fade-in-up').forEach(el => observer.observe(el));
    }

    /**
     * 2. Load thông tin user vào UI
     */
    function loadProfileData() {
        const user = getCurrentUser();

        // Nếu chưa có currentUser (chưa đăng nhập / chưa lưu), giữ nguyên giá trị HTML mặc định
        if (!user) {
            return;
        }

        const displayName = user.displayName || user.name || '';
        DOM.text('#userNameDisplay', displayName || 'Khách');

        const avatarImg = DOM.byId('avatarImg');
        if (avatarImg && user.avatar) {
            avatarImg.src = user.avatar;
        }

        const nameInput = DOM.byId('profileName');
        const phoneInput = DOM.byId('profilePhone');
        const emailInput = DOM.byId('profileEmail');
        const addressInput = DOM.byId('profileAddress');

        if (nameInput) nameInput.value = displayName;
        if (phoneInput) phoneInput.value = user.phone || '';
        if (emailInput) emailInput.value = user.email || '';
        if (addressInput) addressInput.value = user.address || '';
    }

    /**
     * 3. Hiển thị đơn hàng gần đây
     */
    function loadRecentOrders() {
        const user = getCurrentUser();
        const email = user && user.email ? user.email : 'user@example.com';
        const orders = (typeof OrderService !== 'undefined'
            ? OrderService.getOrdersByUser(email)
            : []).slice(0, 4);

        DOM.text('#orderCount', orders.length);

        const container = DOM.byId('recentOrdersList');
        if (!container) return;

        if (orders.length === 0) {
            container.innerHTML = '<div class="text-center text-gray-500 py-10">Chưa có đơn hàng nào.</div>';
            return;
        }

        let html = '';
        orders.forEach(order => {
            const item = order.items[0];
            const formatted = OrderService.formatOrder(order);

            html += `
                <div class="group relative rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 bg-white">
                    <div class="h-40 bg-gray-100 overflow-hidden relative">
                        <img src="${item.image || './assets/images/placeholder-product.png'}" 
                             alt="Item" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                        <div class="absolute top-3 left-3">
                             <span class="text-xs font-bold text-brand-green bg-white/90 backdrop-blur px-2 py-1 rounded-md shadow-sm">
                                ${formatted.statusLabel}
                             </span>
                        </div>
                    </div>
                    <div class="p-5">
                        <div class="flex justify-between items-start mb-2">
                             <h3 class="font-bold text-gray-800 text-lg hover:text-brand-green transition-colors">
                                #${order.orderNumber}
                             </h3>
                             <span class="font-bold text-brand-green">${formatted.formattedTotal}</span>
                        </div>
                        <p class="text-sm text-gray-500 line-clamp-1 mb-3">${item.productName} ${order.items.length > 1 ? `+${order.items.length - 1} khác` : ''}</p>
                        
                        <a href="order-detail.html?id=${order.orderNumber}" class="inline-flex items-center text-sm font-bold text-brand-green hover:underline group-hover:translate-x-1 transition-transform">
                            Xem chi tiết <i class="fas fa-arrow-right ml-1"></i>
                        </a>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    /**
     * Helpers dùng chung trên trang
     */
    window.scrollToSection = function (id) {
        const el = document.getElementById(`section-${id}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    window.logout = function () {
        if (confirm('Đăng xuất ngay?')) {
            if (typeof Storage !== 'undefined' && Storage.remove) {
                Storage.remove('currentUser');
            } else {
                localStorage.removeItem('currentUser');
            }
            window.location.href = 'index.html';
        }
    };

})(); 
