/**
 * UI Components
 * Reusable component renderers
 */

const UIComponents = {
    /**
     * Render product card
     * @param {Object} product - Product object
     * @returns {HTMLElement}
     */
    renderProductCard(product) {
        const discount = ProductService.getDiscountPercentage(product);
        const hasDiscount = discount > 0;
        const isNew = product.isNew || false;
        const stock = product.stock || 0;
        const maxStock = 100; // Mock max stock for progress bar calculation
        const stockPercent = Math.min((stock / maxStock) * 100, 100);

        const card = DOM.create('div', {
            className: 'product-card-premium',
            dataset: { productId: product.id }
        });

        // Image container
        const imageLink = DOM.create('a', {
            href: `product-detail.html?id=${product.id}`,
            className: 'product-card-image-premium'
        });

        const img = DOM.create('img', {
            src: product.images[0],
            alt: product.name,
            loading: 'lazy'
        });

        DOM.append(imageLink, img);

        // Badges container (top-left)
        const badgesContainer = DOM.create('div', {
            className: 'product-badges-container'
        });

        // NEW badge
        if (isNew || Math.random() > 0.8) {
            const newBadge = DOM.create('span', {
                className: 'product-badge-new'
            }, 'NEW');
            DOM.append(badgesContainer, newBadge);
        }

        // Discount badge
        if (hasDiscount) {
            const discountBadge = DOM.create('span', {
                className: 'product-badge-discount'
            }, `-${discount}%`);
            DOM.append(badgesContainer, discountBadge);
        }

        DOM.append(imageLink, badgesContainer);

        // Wishlist button (top-right)
        const isInWishlist = WishlistService.isInWishlist(product.id);
        const wishlistBtn = DOM.create('button', {
            className: `product-wishlist-btn ${isInWishlist ? 'added' : ''}`,
            onclick: (e) => {
                e.preventDefault();
                e.stopPropagation();

                // Auth check
                const currentUser = JSON.parse(localStorage.getItem('currentUser'));
                if (!currentUser) {
                    window.location.href = 'login.html';
                    return;
                }

                const result = WishlistService.toggleWishlist(product.id);
                const btn = e.currentTarget;

                if (result.added) {
                    DOM.addClass(btn, 'added');
                    DOM.text(btn, '♥');
                    UIComponents.showToast('Đã thêm vào yêu thích', 'success');
                } else {
                    DOM.removeClass(btn, 'added');
                    DOM.text(btn, '♡');
                    UIComponents.showToast('Đã xóa khỏi yêu thích', 'info');
                }

                // Update header count if available
                const count = WishlistService.getWishlistCount();
                UIComponents.updateHeaderWishlistCount(count);
            }
        }, isInWishlist ? '♥' : '♡');

        DOM.append(imageLink, wishlistBtn);

        // Body
        const body = DOM.create('div', { className: 'product-card-body-premium' });

        // Name
        const titleLink = DOM.create('a', {
            href: `product-detail.html?id=${product.id}`,
            className: 'product-card-title-premium'
        }, product.name);

        // Description (recycling info)
        const description = DOM.create('p', {
            className: 'product-card-description',
            style: 'font-size: 0.8rem; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 4px;'
        });
        description.innerHTML = `<span style="color: var(--color-success);">♻</span> ${product.recycledContent}% vật liệu tái chế`;

        // Price row
        const priceRow = DOM.create('div', { className: 'product-card-price-row' });

        const priceContainer = DOM.create('div', { className: 'product-card-price-premium' });

        const price = DOM.create('span', {
            className: 'product-price-current',
            style: 'font-size: 1.2rem; display: block;'
        }, ProductService.formatPrice(product.price));

        if (hasDiscount) {
            const originalPrice = DOM.create('span', {
                className: 'product-price-old',
                style: 'font-size: 0.85rem; color: #999; margin-left: 6px; font-weight: normal;'
            }, ProductService.formatPrice(product.compareAtPrice));
            price.appendChild(originalPrice);
        }

        DOM.append(priceContainer, price);
        DOM.append(priceRow, priceContainer);

        // Stock indicator (New UI)
        const stockContainer = DOM.create('div', {
            className: 'product-card-stock',
            style: 'margin-top: 0;'
        });

        // Progress bar container
        const progressBg = DOM.create('div', {
            className: 'stock-progress-bg',
            title: `Còn ${stock} sản phẩm`
        });

        // Progress fill
        const progressFill = DOM.create('div', {
            className: 'stock-progress-fill',
            style: `width: ${stockPercent}%; background-color: ${stock < 10 ? '#ff6b6b' : 'var(--color-primary)'};`
        });

        DOM.append(progressBg, progressFill);

        // Text labels
        const stockLabels = DOM.create('div', {
            className: 'stock-labels',
        });

        const stockText = DOM.create('span', {
            className: 'stock-text'
        }, stock < 10 ? `Sắp hết hàng (${stock})` : `Còn ${stock} sản phẩm`);

        DOM.append(stockLabels, stockText);
        DOM.append(stockContainer, [progressBg, stockLabels]);

        // Special label (if needed)
        // const specialLabel = DOM.create('div', { ... });

        DOM.append(body, [titleLink, description, priceRow, stockContainer]);
        DOM.append(card, [imageLink, body]);

        return card;
    },

    /**
     * Render cart item
     * @param {Object} item - Cart item
     * @returns {HTMLElement}
     */
    renderCartItem(item) {
        const cartItem = DOM.create('div', {
            className: 'cart-item',
            dataset: {
                productId: item.productId,
                size: item.size
            }
        });

        // Image
        const img = DOM.create('img', {
            src: item.image,
            alt: item.productName,
            className: 'cart-item-image'
        });

        // Details
        const details = DOM.create('div', { className: 'cart-item-details' });

        const info = DOM.create('div');
        const name = DOM.create('div', {
            className: 'cart-item-name'
        }, item.productName);

        const meta = DOM.create('div', {
            className: 'cart-item-meta'
        }, `Size: ${item.size} | ${ProductService.formatPrice(item.price)}`);

        DOM.append(info, [name, meta]);

        // Actions
        const actions = DOM.create('div', { className: 'cart-item-actions' });

        // Quantity selector
        const quantitySelector = DOM.create('div', { className: 'quantity-selector' });

        const decreaseBtn = DOM.create('button', {
            className: 'quantity-btn',
            onclick: () => this.handleQuantityChange(item.productId, item.size, item.quantity - 1)
        }, '-');

        const quantityValue = DOM.create('span', {
            className: 'quantity-value'
        }, item.quantity.toString());

        const increaseBtn = DOM.create('button', {
            className: 'quantity-btn',
            onclick: () => this.handleQuantityChange(item.productId, item.size, item.quantity + 1)
        }, '+');

        DOM.append(quantitySelector, [decreaseBtn, quantityValue, increaseBtn]);

        // Price total
        const totalPrice = DOM.create('div', {
            className: 'text-lg font-semibold'
        }, ProductService.formatPrice(item.price * item.quantity));

        // Remove button
        const removeBtn = DOM.create('button', {
            className: 'btn-text',
            style: 'color: var(--color-error);',
            onclick: () => this.handleRemoveItem(item.productId, item.size)
        }, 'Xóa');

        DOM.append(actions, [quantitySelector, totalPrice, removeBtn]);
        DOM.append(details, [info, actions]);
        DOM.append(cartItem, [img, details]);

        return cartItem;
    },

    /**
     * Handle quantity change in cart
     * @param {string} productId - Product ID
     * @param {string} size - Size
     * @param {number} newQuantity - New quantity
     */
    async handleQuantityChange(productId, size, newQuantity) {
        if (newQuantity < 1) return;

        const result = await CartService.updateQuantity(productId, size, newQuantity);

        if (result.success) {
            this.updateCartUI();
        } else {
            alert(result.error);
        }
    },

    /**
     * Handle remove item from cart
     * @param {string} productId - Product ID
     * @param {string} size - Size
     */
    handleRemoveItem(productId, size) {
        const confirmed = confirm('Bạn có chắc muốn xóa sản phẩm này?');
        if (!confirmed) return;

        const result = CartService.removeItem(productId, size);

        if (result.success) {
            this.updateCartUI();
        }
    },

    /**
     * Update cart UI (to be implemented in page-specific code)
     */
    updateCartUI() {
        // This will be implemented in cart.js
        if (window.updateCart) {
            window.updateCart();
        }
    },

    /**
     * Render pagination
     * @param {Object} pagination - Pagination object
     * @param {Function} onPageChange - Page change handler
     * @returns {HTMLElement}
     */
    renderPagination(pagination, onPageChange) {
        if (pagination.totalPages <= 1) {
            return DOM.create('div'); // Empty div
        }

        const paginationEl = DOM.create('ul', { className: 'pagination' });

        // Previous button
        const prevBtn = DOM.create('li', {
            className: 'pagination-item',
            onclick: () => {
                if (pagination.hasPrev) {
                    onPageChange(pagination.currentPage - 1);
                }
            }
        }, '‹ Trước');

        if (!pagination.hasPrev) {
            prevBtn.disabled = true;
            DOM.addClass(prevBtn, 'opacity-50');
        }

        DOM.append(paginationEl, prevBtn);

        // Page numbers
        const maxPages = 5;
        let startPage = Math.max(1, pagination.currentPage - Math.floor(maxPages / 2));
        let endPage = Math.min(pagination.totalPages, startPage + maxPages - 1);

        if (endPage - startPage + 1 < maxPages) {
            startPage = Math.max(1, endPage - maxPages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = DOM.create('li', {
                className: `pagination-item ${i === pagination.currentPage ? 'active' : ''}`,
                onclick: () => onPageChange(i)
            }, i.toString());

            DOM.append(paginationEl, pageBtn);
        }

        // Next button
        const nextBtn = DOM.create('li', {
            className: 'pagination-item',
            onclick: () => {
                if (pagination.hasNext) {
                    onPageChange(pagination.currentPage + 1);
                }
            }
        }, 'Sau ›');

        if (!pagination.hasNext) {
            nextBtn.disabled = true;
            DOM.addClass(nextBtn, 'opacity-50');
        }

        DOM.append(paginationEl, nextBtn);

        return paginationEl;
    },

    /**
     * Render loading spinner
     * @returns {HTMLElement}
     */
    renderLoader() {
        const loader = DOM.create('div', {
            className: 'flex justify-center items-center py-3xl'
        });

        const spinner = DOM.create('div', { className: 'spinner' });
        DOM.append(loader, spinner);

        return loader;
    },

    /**
     * Render empty state
     * @param {string} icon - Icon (emoji)
     * @param {string} title - Title
     * @param {string} text - Description
     * @param {HTMLElement} action - Action button (optional)
     * @returns {HTMLElement}
     */
    renderEmptyState(icon, title, text, action = null) {
        const emptyState = DOM.create('div', { className: 'empty-state' });

        if (icon) {
            const iconEl = DOM.create('div', {
                className: 'empty-state-icon'
            }, icon);
            DOM.append(emptyState, iconEl);
        }

        const titleEl = DOM.create('div', {
            className: 'empty-state-title'
        }, title);

        const textEl = DOM.create('div', {
            className: 'empty-state-text'
        }, text);

        DOM.append(emptyState, [titleEl, textEl]);

        if (action) {
            DOM.append(emptyState, action);
        }

        return emptyState;
    },

    /**
     * Render alert/notification
     * @param {string} type - Alert type (success, error, warning, info)
     * @param {string} message - Message
     * @returns {HTMLElement}
     */
    renderAlert(type, message) {
        return DOM.create('div', {
            className: `alert alert-${type}`
        }, message);
    },

    /**
     * Show toast notification
     * @param {string} message - Message
     * @param {string} type - Type (success, error, warning, info)
     * @param {number} duration - Duration in ms
     */
    showToast(message, type = 'success', duration = 3000) {
        // Check if toast container exists
        let container = DOM.byId('toast-container');

        if (!container) {
            container = DOM.create('div', {
                id: 'toast-container',
                style: 'position: fixed; top: 20px; right: 20px; z-index: 9999;'
            });
            document.body.appendChild(container);
        }

        const toast = DOM.create('div', {
            className: `alert alert-${type}`,
            style: 'margin-bottom: 10px; min-width: 300px; animation: slideInRight 0.3s ease;'
        }, message);

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    /**
     * Render header cart count badge
     * @param {number} count - Item count
     */
    updateHeaderCartCount(count) {
        const cartCountEl = DOM.qs('.cart-count');
        if (cartCountEl) {
            DOM.text(cartCountEl, count.toString());

            if (count > 0) {
                DOM.show(cartCountEl);
            } else {
                DOM.hide(cartCountEl);
            }
        }
    },

    /**
     * Update auth link in header based on login state
     */
    /**
     * Update auth link in header based on login state
     */
    updateAuthLink() {
        // Find existing Auth Link or Wrapper
        const headerActions = DOM.qs('.header-actions');
        let authLink = DOM.qs('.auth-link');
        let authWrapper = DOM.qs('.auth-wrapper');

        const currentUser = JSON.parse(localStorage.getItem('currentUser'));

        // If no auth wrapper yet, wrap the link provided it exists (initial load usually has just .auth-link)
        if (authLink && !authWrapper && headerActions) {
            authWrapper = DOM.create('div', { className: 'auth-wrapper' });
            headerActions.insertBefore(authWrapper, authLink);
            authWrapper.appendChild(authLink);
        }

        // If neither exists, we can't do anything (shouldn't happen on standard pages)
        if (!authWrapper && !authLink) return;

        if (currentUser) {
            // LOGGED IN STATE
            if (authLink) {
                authLink.href = 'profile.html';
                authLink.title = `Tài khoản: ${currentUser.name || 'Của tôi'}`;
                // Optional: Replace icon with Avatar if available? Keeping simple for now as per design
            }

            // Create/Update Dropdown
            let dropdown = DOM.qs('.header-dropdown', authWrapper);
            if (!dropdown) {
                dropdown = DOM.create('div', { className: 'header-dropdown' });
                authWrapper.appendChild(dropdown);
            }

            dropdown.innerHTML = `
                <div class="dropdown-header">
                    <span class="dropdown-user-name">${currentUser.name || 'Người dùng'}</span>
                    <span class="dropdown-user-role">Thành viên GreenPet</span>
                </div>
                <a href="profile.html" class="dropdown-item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    Tài khoản của tôi
                </a>
                <a href="profile-orders.html" class="dropdown-item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                    Đơn hàng
                </a>
                <div class="dropdown-divider"></div>
                <a href="#" class="dropdown-item text-danger" id="globalLogoutBtn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                    Đăng xuất
                </a>
            `;

            // Bind Global Logout
            const logoutBtn = dropdown.querySelector('#globalLogoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (confirm('Bạn có chắc muốn đăng xuất?')) {
                        localStorage.removeItem('currentUser');
                        window.location.href = 'index.html';
                    }
                });
            }

        } else {
            // NOT LOGGED IN STATE
            if (authLink) {
                authLink.href = 'login.html';
                authLink.title = 'Đăng nhập';
            }
            // Remove dropdown if exists
            const dropdown = DOM.qs('.header-dropdown', authWrapper);
            if (dropdown) dropdown.remove();
        }
    },

    /**
     * Setup protected links (intercept clicks if not logged in)
     */
    setupProtectedLinks() {
        const protectedSelectors = [
            '.header-cart',              // Cart
            'a[href="wishlist.html"]',   // Wishlist
            'a[href="cart.html"]'        // Cart link alternative
        ];

        protectedSelectors.forEach(selector => {
            const elements = DOM.qsa(selector);
            elements.forEach(el => {
                // Remove old listeners to be safe (though this runs once on load)
                const newEl = el.cloneNode(true);
                el.parentNode.replaceChild(newEl, el);

                newEl.addEventListener('click', (e) => {
                    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
                    if (!currentUser) {
                        e.preventDefault();
                        e.stopPropagation();
                        // alert('Vui lòng đăng nhập để tiếp tục');
                        window.location.href = 'login.html';
                    }
                });
            });
        });
    }
};

// Add CSS animation for toast
if (!document.querySelector('#toast-animations')) {
    const style = document.createElement('style');
    style.id = 'toast-animations';
    style.textContent = `
    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
    document.head.appendChild(style);
}

// Auto-run auth update on load
document.addEventListener('DOMContentLoaded', () => {
    UIComponents.updateAuthLink();
    UIComponents.setupProtectedLinks();
});
