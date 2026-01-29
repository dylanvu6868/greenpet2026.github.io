/**
 * Products Page JavaScript
 * Handles product listing, filtering, sorting, and pagination
 */

(function () {
    'use strict';

    let currentFilters = {};
    let allProducts = [];
    let filteredProducts = [];
    let allCategories = [];

    // Initialize page
    DOM.ready(async () => {
        try {
            await InitialData.initialize();

            // Parse URL filters
            currentFilters = FilterService.fromQueryString(window.location.search);

            await Promise.all([
                loadProducts(),
                loadFilterOptions(),
                updateCartCount()
            ]);

            setupEventListeners();
            applyFiltersAndRender();
        } catch (error) {
            console.error('Error initializing products page:', error);
            showError();
        }
    });

    /**
     * Load all products
     */
    async function loadProducts() {
        allProducts = await ProductService.getAllProducts();
    }

    /**
     * Load filter options (categories, sizes)
     */
    async function loadFilterOptions() {
        // Load categories
        const categories = await Database.loadCategories();
        allCategories = categories;
        renderCategoryFilters(categories);

        // Load available sizes
        const sizes = await ProductService.getAllSizes();
        renderSizeFilters(sizes);

        // Render price ranges
        renderPriceFilters();
    }

    /**
     * Render category filters
     */
    function renderCategoryFilters(categories) {
        const container = DOM.byId('categoryFilters');
        if (!container) return;

        DOM.empty(container);

        categories.forEach(category => {
            const label = DOM.create('label', { className: 'form-check' });

            const checkbox = DOM.create('input', {
                type: 'checkbox',
                className: 'form-check-input',
                name: 'category',
                value: category.slug,
                'data-filter': 'category'
            });

            if (currentFilters.categorySlug === category.slug) {
                checkbox.checked = true;
            }

            const span = DOM.create('span', {
                className: 'form-check-label'
            }, `${category.icon} ${category.name}`);

            DOM.append(label, [checkbox, span]);
            DOM.append(container, label);
        });
    }

    /**
     * Render size filters
     */
    function renderSizeFilters(sizes) {
        const container = DOM.byId('sizeFilters');
        if (!container) return;

        DOM.empty(container);

        sizes.forEach(size => {
            const label = DOM.create('label', { className: 'form-check' });

            const checkbox = DOM.create('input', {
                type: 'checkbox',
                className: 'form-check-input',
                name: 'size',
                value: size,
                'data-filter': 'size'
            });

            if (currentFilters.size === size) {
                checkbox.checked = true;
            }

            const span = DOM.create('span', {
                className: 'form-check-label'
            }, size);

            DOM.append(label, [checkbox, span]);
            DOM.append(container, label);
        });
    }

    /**
     * Render price range filters
     */
    function renderPriceFilters() {
        const container = DOM.byId('priceFilters');
        if (!container) return;

        DOM.empty(container);

        CONFIG.FILTERS.PRICE_RANGES.forEach((range, index) => {
            const label = DOM.create('label', { className: 'form-check' });

            const radio = DOM.create('input', {
                type: 'radio',
                className: 'form-check-input',
                name: 'priceRange',
                value: index.toString(),
                'data-filter': 'price'
            });

            const isActive = currentFilters.minPrice === range.min &&
                currentFilters.maxPrice === range.max;
            if (isActive) {
                radio.checked = true;
            }

            const span = DOM.create('span', {
                className: 'form-check-label'
            }, range.label);

            DOM.append(label, [radio, span]);
            DOM.append(container, label);
        });
    }

    /**
     * Apply filters and render results
     */
    function applyFiltersAndRender() {
        showLoader();

        // Apply filters
        filteredProducts = ProductService.sortProducts(
            FilterService.applyFilters(allProducts, currentFilters, allCategories),
            currentFilters.sort || ''
        );

        // Paginate
        const page = parseInt(currentFilters.page) || 1;
        const paginatedResult = ProductService.paginate(filteredProducts, page);

        // Render
        renderProducts(paginatedResult.items);
        renderPagination(paginatedResult.pagination);
        renderActiveFilters();
        renderResultsSummary(filteredProducts.length);

        hideLoader();

        // Update URL
        FilterService.updateURL(currentFilters);

        // Scroll to top of results
        const productsGrid = DOM.byId('productsGrid');
        if (productsGrid && page > 1) {
            DOM.scrollTo(productsGrid, { behavior: 'smooth', block: 'start' });
        }
    }

    /**
     * Render products grid
     */
    function renderProducts(products) {
        const grid = DOM.byId('productsGrid');
        if (!grid) return;

        DOM.empty(grid);

        if (products.length === 0) {
            const emptyState = UIComponents.renderEmptyState(
                '🔍',
                'Không tìm thấy sản phẩm',
                'Thử thay đổi bộ lọc hoặc tìm kiếm với từ khóa khác',
                DOM.create('button', {
                    className: 'btn btn-primary',
                    onclick: clearAllFilters
                }, 'Xóa bộ lọc')
            );
            DOM.append(grid, emptyState);
            DOM.show(grid);
            return;
        }

        products.forEach(product => {
            const card = UIComponents.renderProductCard(product);
            DOM.append(grid, card);
        });

        DOM.show(grid);
    }

    /**
     * Render pagination
     */
    function renderPagination(pagination) {
        const container = DOM.byId('paginationContainer');
        if (!container) return;

        DOM.empty(container);

        if (pagination.totalPages <= 1) return;

        const paginationEl = UIComponents.renderPagination(pagination, (page) => {
            currentFilters.page = page;
            applyFiltersAndRender();
        });

        DOM.append(container, paginationEl);
    }

    /**
     * Render active filters
     */
    function renderActiveFilters() {
        const container = DOM.byId('activeFilters');
        const list = DOM.byId('activeFiltersList');

        if (!container || !list) return;

        const activeFilters = FilterService.getActiveFilters(currentFilters);

        if (activeFilters.length === 0) {
            DOM.hide(container);
            return;
        }

        DOM.empty(list);

        activeFilters.forEach(filter => {
            const filterBadge = DOM.create('span', {
                className: 'badge badge-secondary',
                style: 'display: flex; align-items: center; gap: 0.5rem;'
            });

            const label = DOM.create('span', {}, filter.label);

            const removeBtn = DOM.create('button', {
                style: 'background: none; border: none; cursor: pointer; font-weight: bold; font-size: 1.1em;',
                onclick: () => {
                    currentFilters = FilterService.removeFilter(currentFilters, filter.type, filter.value);
                    currentFilters.page = 1;
                    updateFilterCheckboxes();
                    applyFiltersAndRender();
                }
            }, '×');

            DOM.append(filterBadge, [label, removeBtn]);
            DOM.append(list, filterBadge);
        });

        DOM.show(container);
    }

    /**
     * Render results summary
     */
    function renderResultsSummary(totalResults) {
        const summary = DOM.byId('resultsSummary');
        if (!summary) return;

        const text = FilterService.getSummaryText(totalResults, currentFilters);
        DOM.text(summary, text);
    }

    /**
     * Update cart count
     */
    function updateCartCount() {
        const count = CartService.getItemCount();
        UIComponents.updateHeaderCartCount(count);
    }

    /**
     * Show loader
     */
    function showLoader() {
        const loader = DOM.byId('productsLoader');
        const grid = DOM.byId('productsGrid');

        if (loader) DOM.show(loader);
        if (grid) DOM.hide(grid);
    }

    /**
     * Hide loader
     */
    function hideLoader() {
        const loader = DOM.byId('productsLoader');
        const grid = DOM.byId('productsGrid');

        if (loader) DOM.hide(loader);
        if (grid) DOM.show(grid);
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        // Mobile menu
        const mobileMenuToggle = DOM.byId('mobileMenuToggle');
        const siteNav = DOM.byId('siteNav');

        if (mobileMenuToggle && siteNav) {
            DOM.on(mobileMenuToggle, 'click', () => {
                DOM.toggleClass(siteNav, 'active');
            });
        }

        // Filter checkboxes
        DOM.delegate(document, 'change', 'input[data-filter]', function (e) {
            handleFilterChange(e);
        });

        // Search input (debounced)
        const searchInput = DOM.byId('searchInput');
        if (searchInput) {
            const debouncedSearch = DOM.debounce((e) => {
                currentFilters.search = e.target.value.trim();
                currentFilters.page = 1;
                applyFiltersAndRender();
            }, 500);

            DOM.on(searchInput, 'input', debouncedSearch);

            // Set initial value from filters
            if (currentFilters.search) {
                searchInput.value = currentFilters.search;
            }
        }

        // Sort select
        const sortSelect = DOM.byId('sortSelect');
        if (sortSelect) {
            DOM.on(sortSelect, 'change', (e) => {
                currentFilters.sort = e.target.value;
                currentFilters.page = 1;
                applyFiltersAndRender();
            });

            // Set initial value
            if (currentFilters.sort) {
                sortSelect.value = currentFilters.sort;
            }
        }

        // Clear filters button
        const clearFiltersBtn = DOM.byId('clearFilters');
        if (clearFiltersBtn) {
            DOM.on(clearFiltersBtn, 'click', clearAllFilters);
        }
    }

    /**
     * Handle filter checkbox/radio change
     */
    function handleFilterChange(e) {
        const input = e.target;
        const filterType = input.dataset.filter;

        if (filterType === 'category') {
            // Category is exclusive
            currentFilters.categorySlug = input.checked ? input.value : null;
            // Uncheck other categories
            DOM.qsa('input[data-filter="category"]').forEach(cb => {
                if (cb !== input) cb.checked = false;
            });
        } else if (filterType === 'size') {
            // Size is exclusive
            currentFilters.size = input.checked ? input.value : null;
            // Uncheck other sizes
            DOM.qsa('input[data-filter="size"]').forEach(cb => {
                if (cb !== input) cb.checked = false;
            });
        } else if (filterType === 'price') {
            // Price range
            const rangeIndex = parseInt(input.value);
            const range = CONFIG.FILTERS.PRICE_RANGES[rangeIndex];
            if (range) {
                currentFilters.minPrice = range.min;
                currentFilters.maxPrice = range.max;
            }
        } else if (filterType === 'recycled') {
            // Recycled content is exclusive
            currentFilters.minRecycled = input.checked ? parseInt(input.value) : null;
            // Uncheck others
            DOM.qsa('input[data-filter="recycled"]').forEach(cb => {
                if (cb !== input) cb.checked = false;
            });
        }

        currentFilters.page = 1;
        applyFiltersAndRender();
    }

    /**
     * Update filter checkboxes based on current filters
     */
    function updateFilterCheckboxes() {
        // Category
        DOM.qsa('input[data-filter="category"]').forEach(cb => {
            cb.checked = cb.value === currentFilters.categorySlug;
        });

        // Size
        DOM.qsa('input[data-filter="size"]').forEach(cb => {
            cb.checked = cb.value === currentFilters.size;
        });

        // Recycled
        DOM.qsa('input[data-filter="recycled"]').forEach(cb => {
            cb.checked = currentFilters.minRecycled && parseInt(cb.value) === currentFilters.minRecycled;
        });

        // Price
        DOM.qsa('input[data-filter="price"]').forEach(radio => {
            const rangeIndex = parseInt(radio.value);
            const range = CONFIG.FILTERS.PRICE_RANGES[rangeIndex];
            radio.checked = range && currentFilters.minPrice === range.min && currentFilters.maxPrice === range.max;
        });
    }

    /**
     * Clear all filters
     */
    function clearAllFilters() {
        currentFilters = FilterService.clearFilters(currentFilters);

        // Reset all checkboxes/radios
        DOM.qsa('input[data-filter]').forEach(input => {
            input.checked = false;
        });

        // Reset search
        const searchInput = DOM.byId('searchInput');
        if (searchInput) searchInput.value = '';

        // Reset sort
        const sortSelect = DOM.byId('sortSelect');
        if (sortSelect) sortSelect.value = '';

        applyFiltersAndRender();
    }

    /**
     * Show error state
     */
    function showError() {
        hideLoader();
        const grid = DOM.byId('productsGrid');
        if (grid) {
            DOM.empty(grid);
            const errorState = UIComponents.renderEmptyState(
                '⚠️',
                'Có lỗi xảy ra',
                'Không thể tải sản phẩm. Vui lòng thử lại.',
                DOM.create('button', {
                    className: 'btn btn-primary',
                    onclick: () => window.location.reload()
                }, 'Tải lại')
            );
            DOM.append(grid, errorState);
            DOM.show(grid);
        }
    }
})();
