/**
 * Filter Service
 * Handles product filtering and search logic
 */

const FilterService = {
    /**
     * Build filter object from form/URL parameters
     * @param {Object} params - Filter parameters
     * @returns {Object} Filter object
     */
    buildFilters(params) {
        const filters = {};

        // Category filter
        if (params.category) {
            filters.categorySlug = params.category;
        }

        // Size filter
        if (params.size) {
            filters.size = params.size;
        }

        // Price range filter
        if (params.minPrice !== undefined) {
            filters.minPrice = parseFloat(params.minPrice) || 0;
        }
        if (params.maxPrice !== undefined) {
            filters.maxPrice = parseFloat(params.maxPrice) || Infinity;
        }

        // Price range preset
        if (params.priceRange) {
            const range = CONFIG.FILTERS.PRICE_RANGES.find(r => r.label === params.priceRange);
            if (range) {
                filters.minPrice = range.min;
                filters.maxPrice = range.max;
            }
        }

        // Recycled content filter
        if (params.minRecycled) {
            filters.minRecycled = parseFloat(params.minRecycled) || 0;
        }

        // Tags filter
        if (params.tags) {
            filters.tags = Array.isArray(params.tags) ? params.tags : [params.tags];
        }

        // Search query
        if (params.search) {
            filters.search = params.search.trim();
        }

        // Sort
        if (params.sort) {
            filters.sort = params.sort;
        }

        // Page
        if (params.page) {
            filters.page = parseInt(params.page) || 1;
        }

        return filters;
    },

    /**
     * Apply filters to products
     * @param {Array} products - Products array
     * @param {Object} filters - Filter object
     * @returns {Array} Filtered products
     */
    applyFilters(products, filters, categories = []) {
        let filtered = [...products];

        // Category filter
        if (filters.categorySlug) {
            const category = categories.find(c => c.slug === filters.categorySlug);
            if (category) {
                filtered = filtered.filter(p => p.categoryId === category.id);
            } else {
                // If category slug provided but not found, return empty
                filtered = [];
            }
        }

        // Size filter
        if (filters.size) {
            filtered = filtered.filter(p => p.sizes.includes(filters.size));
        }

        // Price range filter
        if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
            const min = filters.minPrice || 0;
            const max = filters.maxPrice || Infinity;
            filtered = filtered.filter(p => p.price >= min && p.price <= max);
        }

        // Recycled content filter
        if (filters.minRecycled) {
            filtered = filtered.filter(p => p.recycledContent >= filters.minRecycled);
        }

        // Tags filter
        if (filters.tags && filters.tags.length > 0) {
            filtered = filtered.filter(p =>
                filters.tags.some(tag => p.tags.includes(tag))
            );
        }

        // Search filter
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(searchTerm) ||
                p.description.toLowerCase().includes(searchTerm) ||
                p.longDescription?.toLowerCase().includes(searchTerm) ||
                p.tags.some(tag => tag.toLowerCase().includes(searchTerm))
            );
        }

        return filtered;
    },

    /**
     * Get active filters from filter object
     * @param {Object} filters - Filter object
     * @returns {Array} Array of active filter labels
     */
    getActiveFilters(filters) {
        const active = [];

        if (filters.categorySlug) {
            active.push({
                type: 'category',
                label: `Danh mục: ${filters.categorySlug}`,
                value: filters.categorySlug
            });
        }

        if (filters.size) {
            active.push({
                type: 'size',
                label: `Size: ${filters.size}`,
                value: filters.size
            });
        }

        if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
            const min = filters.minPrice || 0;
            const max = filters.maxPrice || Infinity;
            const label = max === Infinity
                ? `Từ ${ProductService.formatPrice(min)}`
                : `${ProductService.formatPrice(min)} - ${ProductService.formatPrice(max)}`;
            active.push({
                type: 'price',
                label: `Giá: ${label}`,
                value: { min, max }
            });
        }

        if (filters.minRecycled) {
            active.push({
                type: 'recycled',
                label: `Tái chế: ${filters.minRecycled}% trở lên`,
                value: filters.minRecycled
            });
        }

        if (filters.tags && filters.tags.length > 0) {
            filters.tags.forEach(tag => {
                active.push({
                    type: 'tag',
                    label: `Tag: ${tag}`,
                    value: tag
                });
            });
        }

        if (filters.search) {
            active.push({
                type: 'search',
                label: `Tìm kiếm: "${filters.search}"`,
                value: filters.search
            });
        }

        return active;
    },

    /**
     * Remove specific filter
     * @param {Object} filters - Current filters
     * @param {string} type - Filter type to remove
     * @param {*} value - Filter value to remove (optional)
     * @returns {Object} Updated filters
     */
    removeFilter(filters, type, value) {
        const updated = { ...filters };

        switch (type) {
            case 'category':
                delete updated.categorySlug;
                break;

            case 'size':
                delete updated.size;
                break;

            case 'price':
                delete updated.minPrice;
                delete updated.maxPrice;
                delete updated.priceRange;
                break;

            case 'recycled':
                delete updated.minRecycled;
                break;

            case 'tag':
                if (updated.tags) {
                    updated.tags = updated.tags.filter(t => t !== value);
                    if (updated.tags.length === 0) {
                        delete updated.tags;
                    }
                }
                break;

            case 'search':
                delete updated.search;
                break;
        }

        return updated;
    },

    /**
     * Clear all filters
     * @param {Object} filters - Current filters
     *@returns {Object} Empty filter object (preserving sort and page)
     */
    clearFilters(filters) {
        return {
            sort: filters.sort,
            page: 1
        };
    },

    /**
     * Convert filters to URL query string
     * @param {Object} filters - Filter object
     * @returns {string} Query string
     */
    toQueryString(filters) {
        const params = new URLSearchParams();

        Object.entries(filters).forEach(([key, value]) => {
            if (value === undefined || value === null) return;

            if (Array.isArray(value)) {
                value.forEach(v => params.append(key, v));
            } else {
                params.set(key, value);
            }
        });

        const queryString = params.toString();
        return queryString ? `?${queryString}` : '';
    },

    /**
     * Parse URL query string to filters
     * @param {string} queryString - URL query string
     * @returns {Object} Filter object
     */
    fromQueryString(queryString) {
        const params = new URLSearchParams(queryString);
        const filters = {};

        for (const [key, value] of params.entries()) {
            // Handle array parameters (tags)
            if (key === 'tags') {
                if (!filters.tags) {
                    filters.tags = [];
                }
                filters.tags.push(value);
            } else {
                filters[key] = value;
            }
        }

        return this.buildFilters(filters);
    },

    /**
     * Update URL with current filters (without page reload)
     * @param {Object} filters - Filter object
     */
    updateURL(filters) {
        const queryString = this.toQueryString(filters);
        const newURL = window.location.pathname + queryString;
        window.history.pushState({ filters }, '', newURL);
    },

    /**
     * Get filter summary text
     * @param {number} totalResults - Total filtered results
     * @param {Object} filters - Current filters
     * @returns {string} Summary text
     */
    getSummaryText(totalResults, filters) {
        const activeFilters = this.getActiveFilters(filters);

        if (activeFilters.length === 0) {
            return `Hiển thị tất cả ${totalResults} sản phẩm`;
        }

        return `Tìm thấy ${totalResults} sản phẩm`;
    }
};

// Freeze to prevent modifications
Object.freeze(FilterService);
