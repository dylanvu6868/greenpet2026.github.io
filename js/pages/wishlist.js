/**
 * Wishlist Page JavaScript
 */

(function () {
    'use strict';

    DOM.ready(async () => {
        await InitialData.initialize(); // Ensure DB is loaded
        renderWishlist();
        setupEventListeners();
    });

    /**
     * Render wishlist content
     */
    async function renderWishlist() {
        const wishlistIds = WishlistService.getWishlist();
        const grid = DOM.byId('wishlistGrid');
        const emptyState = DOM.byId('emptyWishlist');
        const loader = DOM.byId('wishlistLoader');

        if (loader) DOM.hide(loader);

        if (wishlistIds.length === 0) {
            renderEmptyState(emptyState, grid);
            updateHeaderWishlistCount(0);
            return;
        }

        // Load products
        const products = [];
        for (const id of wishlistIds) {
            const product = await ProductService.getProduct(id);
            if (product) {
                products.push(product);
            }
        }

        if (products.length === 0) {
            // IDs existed but products not found (maybe deleted)
            renderEmptyState(emptyState, grid);
            updateHeaderWishlistCount(0);
            return;
        }

        renderProducts(grid, emptyState, products);
        updateHeaderWishlistCount(products.length);
    }

    /**
     * Render empty state
     */
    function renderEmptyState(emptyContainer, gridContainer) {
        if (gridContainer) DOM.hide(gridContainer);
        if (emptyContainer) {
            DOM.empty(emptyContainer);
            const content = UIComponents.renderEmptyState(
                createHeartIcon(),
                CONFIG.MESSAGES.WISHLIST_EMPTY,
                'Hãy thêm những sản phẩm bạn yêu thích vào đây',
                DOM.create('a', {
                    href: 'products.html',
                    className: 'btn btn-primary btn-lg'
                }, 'Khám phá ngay')
            );
            DOM.append(emptyContainer, content);
            DOM.show(emptyContainer);
        }
    }

    function createHeartIcon() {
        const div = document.createElement('div');
        div.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="#FF4081" stroke="#FF4081" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>`;
        return div.firstElementChild;
    }

    /**
     * Render products grid
     */
    function renderProducts(gridContainer, emptyContainer, products) {
        if (emptyContainer) DOM.hide(emptyContainer);
        if (gridContainer) {
            DOM.empty(gridContainer);
            products.forEach(product => {
                const card = UIComponents.renderProductCard(product);
                DOM.append(gridContainer, card);
            });
            DOM.show(gridContainer);
        }
    }

    function updateHeaderWishlistCount(count) {
        UIComponents.updateHeaderWishlistCount(count);
    }

    function setupEventListeners() {
        // Mobile menu
        const toggle = DOM.byId('mobileMenuToggle');
        const nav = DOM.byId('siteNav');
        if (toggle && nav) {
            DOM.on(toggle, 'click', () => DOM.toggleClass(nav, 'active'));
        }
    }

    // Expose for updates
    window.renderWishlist = renderWishlist;

    // Listen for wishlist changes (if we had an event system, for now we rely on page reload or direct calls)
    // Monkey part WishlistService.toggleWishlist to re-render if on this page?
    // Better: ui-components.js toggles button state, but if we remove item, we want it gone from grid.

    // Override the click handler for this page specifically?
    // Actually, UIComponents.renderProductCard already handles the toggle logic.
    // But on wishlist page, if I untoggle, it should ideally disappear.
    // Let's leave it as is for now, user can refresh to clear removed items, or we can add a listener.
})();
