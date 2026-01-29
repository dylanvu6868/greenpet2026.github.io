/**
 * Homepage JavaScript
 * Handles homepage interactions and data loading
 */

(function () {
    'use strict';

    // Initialize page
    DOM.ready(async () => {
        try {
            // Initialize data
            await InitialData.initialize();

            // Load page content
            await Promise.all([
                loadSettings(),
                loadFeaturedProducts(),
                updateCartCount()
            ]);

            // Setup event listeners
            setupEventListeners();
        } catch (error) {
            console.error('Error initializing homepage:', error);
            showError();
        }
    });

    /**
     * Load settings and update homepage content
     */
    async function loadSettings() {
        try {
            const settings = await Database.loadSettings();

            // Update hero section
            if (settings.homepageBanner) {
                const { title, subtitle, ctaText } = settings.homepageBanner;

                const heroTitle = DOM.byId('heroTitle');
                const heroSubtitle = DOM.byId('heroSubtitle');
                const heroCTA = DOM.byId('heroCTA');

                if (heroTitle && title) DOM.text(heroTitle, title);
                if (heroSubtitle && subtitle) DOM.text(heroSubtitle, subtitle);
                if (heroCTA && ctaText) DOM.text(heroCTA, ctaText);
            }

            // Update features (Removed: Replaced with Monthly Promotions)
            /*
            if (settings.features && Array.isArray(settings.features)) {
                renderFeatures(settings.features);
            }
            */

            // Update story (Removed: Replaced with Monthly Promotions)
            /*
            if (settings.aboutStory) {
                const storyEl = DOM.byId('aboutStory');
                if (storyEl) {
                    DOM.html(storyEl, settings.aboutStory);
                }
            }
            */

            // Update social links
            if (settings.socialLinks) {
                renderSocialLinks(settings.socialLinks);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    /**
     * Load and display featured products
     */
    async function loadFeaturedProducts() {
        const loader = DOM.byId('featuredLoader');
        const productsGrid = DOM.byId('featuredProducts');
        const viewAllContainer = DOM.byId('viewAllContainer');

        try {
            // Show loader
            if (loader) DOM.show(loader);
            if (productsGrid) DOM.hide(productsGrid);

            // Load featured products
            const products = await ProductService.getFeatured(8);

            // Hide loader
            if (loader) DOM.hide(loader);

            if (products.length === 0) {
                // Show empty state
                const emptyState = UIComponents.renderEmptyState(
                    '📦',
                    'Chưa có sản phẩm',
                    'Chúng tôi đang cập nhật sản phẩm mới',
                    DOM.create('a', {
                        href: 'products.html',
                        className: 'btn btn-primary'
                    }, 'Xem tất cả')
                );
                DOM.empty(productsGrid);
                DOM.append(productsGrid, emptyState);
                DOM.show(productsGrid);
                return;
            }

            // Render products
            DOM.empty(productsGrid);
            products.forEach(product => {
                const card = UIComponents.renderProductCard(product);
                DOM.append(productsGrid, card);
            });

            DOM.show(productsGrid);

            // Show view all button
            if (viewAllContainer) {
                DOM.show(viewAllContainer);
            }
        } catch (error) {
            console.error('Error loading featured products:', error);

            if (loader) DOM.hide(loader);
            if (productsGrid) {
                DOM.empty(productsGrid);
                const errorMsg = UIComponents.renderAlert(
                    'error',
                    'Không thể tải sản phẩm. Vui lòng thử lại sau.'
                );
                DOM.append(productsGrid, errorMsg);
                DOM.show(productsGrid);
            }
        }
    }

    /**
     * Render features section
     */
    function renderFeatures(features) {
        const featuresGrid = DOM.byId('featuresGrid');
        if (!featuresGrid) return;

        DOM.empty(featuresGrid);

        features.forEach(feature => {
            const featureCard = DOM.create('div', {
                className: 'card text-center'
            });

            const cardBody = DOM.create('div', {
                className: 'card-body'
            });

            const icon = DOM.create('div', {
                style: 'font-size: 3rem; margin-bottom: 1rem;'
            }, feature.icon);

            const title = DOM.create('h3', {
                className: 'text-xl font-semibold mb-sm'
            }, feature.title);

            const description = DOM.create('p', {
                className: 'text-base',
                style: 'color: var(--text-secondary);'
            }, feature.description);

            DOM.append(cardBody, [icon, title, description]);
            DOM.append(featureCard, cardBody);
            DOM.append(featuresGrid, featureCard);
        });
    }

    /**
     * Render social links
     */
    function renderSocialLinks(socialLinks) {
        const socialContainer = DOM.byId('socialLinks');
        if (!socialContainer) return;

        DOM.empty(socialContainer);

        const links = [
            { name: 'Facebook', icon: 'FB', url: socialLinks.facebook },
            { name: 'Instagram', icon: 'IG', url: socialLinks.instagram },
            { name: 'Email', icon: '✉', url: `mailto:${socialLinks.email}` }
        ];

        links.forEach(link => {
            if (link.url) {
                const a = DOM.create('a', {
                    href: link.url,
                    className: 'social-link',
                    target: '_blank',
                    rel: 'noopener noreferrer',
                    title: link.name
                }, link.icon);

                DOM.append(socialContainer, a);
            }
        });
    }

    /**
     * Update cart count in header
     */
    function updateCartCount() {
        const count = CartService.getItemCount();
        UIComponents.updateHeaderCartCount(count);
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        // Mobile menu toggle
        const mobileMenuToggle = DOM.byId('mobileMenuToggle');
        const siteNav = DOM.byId('siteNav');

        if (mobileMenuToggle && siteNav) {
            DOM.on(mobileMenuToggle, 'click', () => {
                DOM.toggleClass(siteNav, 'active');
            });
        }

        // Close mobile menu when clicking outside
        DOM.on(document, 'click', (e) => {
            if (siteNav &&
                !mobileMenuToggle.contains(e.target) &&
                !siteNav.contains(e.target)) {
                DOM.removeClass(siteNav, 'active');
            }
        });
    }

    /**
     * Show error state
     */
    function showError() {
        const main = document.querySelector('main');
        if (main) {
            const errorState = UIComponents.renderEmptyState(
                '⚠️',
                'Có lỗi xảy ra',
                'Không thể tải nội dung trang. Vui lòng tải lại trang.',
                DOM.create('button', {
                    className: 'btn btn-primary',
                    onclick: () => window.location.reload()
                }, 'Tải lại')
            );

            DOM.empty(main);
            DOM.append(main, errorState);
        }
    }
})();
