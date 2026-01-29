/**
 * Product Detail Page JavaScript
 */

(function () {
    'use strict';

    let currentProduct = null;
    let selectedSize = null;
    let quantity = 1;
    let allCategories = [];

    DOM.ready(async () => {
        await InitialData.initialize();
        await loadProduct();
        setupEventListeners();
        updateCartCount();
    });

    async function loadProduct() {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');

        if (!productId) {
            showError('Không tìm thấy sản phẩm');
            return;
        }

        const loader = DOM.byId('productLoader');
        const detail = DOM.byId('productDetail');

        try {
            DOM.show(loader);

            // Load categories and product in parallel
            const [product, categories] = await Promise.all([
                ProductService.getProduct(productId),
                Database.loadCategories()
            ]);

            currentProduct = product;
            allCategories = categories;

            if (!currentProduct || !currentProduct.isActive) {
                showError('Sản phẩm không tồn tại hoặc đã ngừng bán');
                return;
            }

            DOM.hide(loader);
            renderProduct();
            await loadRelatedProducts();
            DOM.show(detail);
        } catch (error) {
            console.error('Error loading product:', error);
            showError('Có lỗi xảy ra khi tải sản phẩm');
        }
    }

    function renderProduct() {
        // Breadcrumb
        const breadcrumb = DOM.byId('breadcrumbProduct');
        if (breadcrumb) DOM.text(breadcrumb, currentProduct.name);

        // Image
        const img = DOM.byId('productImage');
        if (img) {
            img.src = currentProduct.images[0];
            img.alt = currentProduct.name;
        }

        // Category
        const categoryEl = DOM.byId('productCategory');
        if (categoryEl) {
            const category = allCategories.find(c => c.id === currentProduct.categoryId);
            if (category) {
                DOM.text(categoryEl, `${category.icon} ${category.name}`);
            } else {
                // Fallback if category not found
                DOM.text(categoryEl, currentProduct.categoryId === 'cat-dog' ? '🐕 Chó' : '🐈 Mèo');
            }
        }

        // Name
        const name = DOM.byId('productName');
        if (name) DOM.text(name, currentProduct.name);

        // Badge
        const badge = DOM.byId('productBadge');
        if (badge && currentProduct.recycledContent >= 90) {
            DOM.html(badge, `<span class="eco-badge" style="font-size: 1rem;">✨ Sản phẩm đặc biệt bền vững</span>`);
        }

        // Price
        const price = DOM.byId('productPrice');
        if (price) DOM.text(price, ProductService.formatPrice(currentProduct.price));

        const comparePrice = DOM.byId('productComparePrice');
        if (comparePrice) {
            if (currentProduct.compareAtPrice && currentProduct.compareAtPrice > currentProduct.price) {
                DOM.text(comparePrice, ProductService.formatPrice(currentProduct.compareAtPrice));
                DOM.show(comparePrice);
            } else {
                DOM.hide(comparePrice);
            }
        }

        // Description
        const desc = DOM.byId('productDescription');
        if (desc) DOM.text(desc, currentProduct.description);

        // Recycled %
        const recycled = DOM.byId('recycledPercent');
        if (recycled) DOM.text(recycled, currentProduct.recycledContent.toString());

        // Material
        const material = DOM.byId('productMaterial');
        if (material) DOM.text(material, currentProduct.material);

        // Sizes
        renderSizes();

        // Stock
        const stock = DOM.byId('stockAmount');
        if (stock) DOM.text(stock, currentProduct.stock.toString());

        // Long description
        const longDesc = DOM.byId('productLongDescription');
        if (longDesc) DOM.text(longDesc, currentProduct.longDescription || currentProduct.description);

        // Update page title & meta
        document.title = (currentProduct.seoTitle || currentProduct.name) + ' - GreenPet';

        // Update meta description
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.name = 'description';
            document.head.appendChild(metaDesc);
        }
        metaDesc.content = currentProduct.seoDescription || currentProduct.description;
    }

    function renderSizes() {
        const container = DOM.byId('sizeOptions');
        if (!container) return;

        DOM.empty(container);

        currentProduct.sizes.forEach((size, index) => {
            const btn = DOM.create('button', {
                className: 'btn btn-secondary',
                style: 'min-width: 50px;',
                onclick: () => selectSize(size)
            }, size);

            // Auto-select first size
            if (index === 0 && !selectedSize) {
                selectedSize = size;
                DOM.addClass(btn, 'btn-primary');
                DOM.removeClass(btn, 'btn-secondary');
            }

            DOM.append(container, btn);
        });
    }

    function selectSize(size) {
        selectedSize = size;

        // Update button styles
        const buttons = DOM.qsa('#sizeOptions button');
        buttons.forEach(btn => {
            if (DOM.text(btn, '') === size) {
                DOM.addClass(btn, 'btn-primary');
                DOM.removeClass(btn, 'btn-secondary');
            } else {
                DOM.removeClass(btn, 'btn-primary');
                DOM.addClass(btn, 'btn-secondary');
            }
        });
    }

    async function loadRelatedProducts() {
        const related = await ProductService.getRelatedProducts(currentProduct.id, 4);

        if (related.length === 0) return;

        const section = DOM.byId('relatedSection');
        const container = DOM.byId('relatedProducts');

        if (!section || !container) return;

        DOM.empty(container);

        related.forEach(product => {
            const card = UIComponents.renderProductCard(product);
            DOM.append(container, card);
        });

        DOM.show(section);
    }

    function setupEventListeners() {
        // Mobile menu
        const toggle = DOM.byId('mobileMenuToggle');
        const nav = DOM.byId('siteNav');
        if (toggle && nav) {
            DOM.on(toggle, 'click', () => DOM.toggleClass(nav, 'active'));
        }

        // Quantity controls
        const decreaseBtn = DOM.byId('decreaseQty');
        const increaseBtn = DOM.byId('increaseQty');

        if (decreaseBtn) {
            DOM.on(decreaseBtn, 'click', () => {
                if (quantity > 1) {
                    quantity--;
                    updateQuantityDisplay();
                }
            });
        }

        if (increaseBtn) {
            DOM.on(increaseBtn, 'click', () => {
                if (quantity < currentProduct.stock) {
                    quantity++;
                    updateQuantityDisplay();
                }
            });
        }

        // Add to cart
        const addBtn = DOM.byId('addToCartBtn');
        if (addBtn) {
            DOM.on(addBtn, 'click', () => handleAddToCart(false));
        }

        // Buy now
        const buyNowBtn = DOM.byId('buyNowBtn');
        if (buyNowBtn) {
            DOM.on(buyNowBtn, 'click', () => handleAddToCart(true));
        }
    }

    function updateQuantityDisplay() {
        const qtyEl = DOM.byId('quantityValue');
        if (qtyEl) DOM.text(qtyEl, quantity.toString());
    }

    async function handleAddToCart(redirect = false) {
        // Auth check
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser) {
            window.location.href = 'login.html';
            return;
        }

        if (!selectedSize) {
            alert('Vui lòng chọn size');
            return;
        }

        if (quantity < 1 || quantity > currentProduct.stock) {
            alert('Số lượng không hợp lệ');
            return;
        }

        const result = await CartService.addItem(currentProduct.id, selectedSize, quantity);

        if (result.success) {
            if (redirect) {
                window.location.href = 'checkout.html';
            } else {
                UIComponents.showToast(result.message, 'success');
                updateCartCount();

                // Reset quantity
                quantity = 1;
                updateQuantityDisplay();
            }
        } else {
            alert(result.error);
        }
    }

    function updateCartCount() {
        const count = CartService.getItemCount();
        UIComponents.updateHeaderCartCount(count);
    }

    function showError(message) {
        const loader = DOM.byId('productLoader');
        const detail = DOM.byId('productDetail');
        const error = DOM.byId('productError');

        DOM.hide(loader);
        DOM.hide(detail);

        if (error) {
            const errorState = UIComponents.renderEmptyState(
                '⚠️',
                'Không tìm thấy sản phẩm',
                message,
                DOM.create('a', {
                    href: 'products.html',
                    className: 'btn btn-primary'
                }, 'Quay lại danh sách')
            );

            DOM.empty(error);
            DOM.append(error, errorState);
            DOM.show(error);
        }
    }
})();
