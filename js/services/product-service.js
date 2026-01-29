/**
 * Product Service
 * Handles product-related business logic
 */

const ProductService = {
    /**
     * Get all active products
     * @returns {Promise<Array>} Array of active products
     */
    async getAllProducts() {
        const products = await Database.loadProducts();
        return products.filter(p => p.isActive);
    },

    /**
     * Get product by ID
     * @param {string} id - Product ID
     * @returns {Promise<Object|null>} Product object or null
     */
    async getProduct(id) {
        return await Database.getProductById(id);
    },

    /**
     * Get product by slug
     * @param {string} slug - Product slug
     * @returns {Promise<Object|null>} Product object or null
     */
    async getProductBySlug(slug) {
        const products = await Database.loadProducts();
        return products.find(p => p.slug === slug && p.isActive) || null;
    },

    /**
     * Get featured products for homepage
     * @param {number} limit - Maximum number of products
     * @returns {Promise<Array>} Array of featured products
     */
    async getFeatured(limit = 8) {
        return await Database.getFeaturedProducts(limit);
    },

    /**
     * Get products by category
     * @param {string} categorySlug - Category slug
     * @returns {Promise<Array>} Array of products
     */
    async getByCategory(categorySlug) {
        const categories = await Database.loadCategories();
        const category = categories.find(c => c.slug === categorySlug);

        if (!category) return [];

        return await Database.getProductsByCategory(category.id);
    },

    /**
     * Search products
     * @param {string} query - Search query
     * @returns {Promise<Array>} Array of matching products
     */
    async search(query) {
        if (!query || query.trim().length < 2) {
            return [];
        }
        return await Database.searchProducts(query);
    },

    /**
     * Filter products by multiple criteria
     * @param {Object} filters - Filter criteria
     * @returns {Promise<Array>} Filtered products
     */
    async filterProducts(filters) {
        let products = await this.getAllProducts();

        // Filter by category
        if (filters.categoryId) {
            products = products.filter(p => p.categoryId === filters.categoryId);
        }

        // Filter by size
        if (filters.size) {
            products = products.filter(p => p.sizes.includes(filters.size));
        }

        // Filter by price range
        if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
            const min = filters.minPrice || 0;
            const max = filters.maxPrice || Infinity;
            products = products.filter(p => p.price >= min && p.price <= max);
        }

        // Filter by recycled content minimum
        if (filters.minRecycled) {
            products = products.filter(p => p.recycledContent >= filters.minRecycled);
        }

        // Filter by tags
        if (filters.tags && filters.tags.length > 0) {
            products = products.filter(p =>
                filters.tags.some(tag => p.tags.includes(tag))
            );
        }

        // Filter by search query
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            products = products.filter(p =>
                p.name.toLowerCase().includes(searchTerm) ||
                p.description.toLowerCase().includes(searchTerm)
            );
        }

        return products;
    },

    /**
     * Sort products
     * @param {Array} products - Products array
     * @param {string} sortBy - Sort criteria
     * @returns {Array} Sorted products
     */
    sortProducts(products, sortBy) {
        const sorted = [...products];

        switch (sortBy) {
            case 'price-asc':
                return sorted.sort((a, b) => a.price - b.price);

            case 'price-desc':
                return sorted.sort((a, b) => b.price - a.price);

            case 'name-asc':
                return sorted.sort((a, b) => a.name.localeCompare(b.name, 'vi'));

            case 'name-desc':
                return sorted.sort((a, b) => b.name.localeCompare(a.name, 'vi'));

            case 'newest':
                return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            case 'recycled-desc':
                return sorted.sort((a, b) => b.recycledContent - a.recycledContent);

            default:
                return sorted;
        }
    },

    /**
     * Paginate products
     * @param {Array} products - Products array
     * @param {number} page - Page number (1-indexed)
     * @param {number} perPage - Items per page
     * @returns {Object} Paginated result
     */
    paginate(products, page = 1, perPage = CONFIG.PAGINATION.PRODUCTS_PER_PAGE) {
        const totalItems = products.length;
        const totalPages = Math.ceil(totalItems / perPage);
        const currentPage = Math.max(1, Math.min(page, totalPages || 1));

        const startIndex = (currentPage - 1) * perPage;
        const endIndex = startIndex + perPage;

        const items = products.slice(startIndex, endIndex);

        return {
            items,
            pagination: {
                currentPage,
                totalPages,
                totalItems,
                perPage,
                hasNext: currentPage < totalPages,
                hasPrev: currentPage > 1
            }
        };
    },

    /**
     * Get related products (same category, excluding current)
     * @param {string} productId - Current product ID
     * @param {number} limit - Maximum number of related products
     * @returns {Promise<Array>} Related products
     */
    async getRelatedProducts(productId, limit = 4) {
        const product = await this.getProduct(productId);
        if (!product) return [];

        const categoryProducts = await Database.getProductsByCategory(product.categoryId);

        return categoryProducts
            .filter(p => p.id !== productId)
            .slice(0, limit);
    },

    /**
     * Check if product is in stock
     * @param {string} productId - Product ID
     * @param {number} quantity - Desired quantity
     * @returns {Promise<Object>} { inStock: boolean, available: number }
     */
    async checkStock(productId, quantity = 1) {
        const product = await this.getProduct(productId);

        if (!product) {
            return { inStock: false, available: 0 };
        }

        return {
            inStock: product.stock >= quantity,
            available: product.stock
        };
    },

    /**
     * Get discount percentage
     * @param {Object} product - Product object
     * @returns {number} Discount percentage
     */
    getDiscountPercentage(product) {
        if (!product.compareAtPrice || product.compareAtPrice <= product.price) {
            return 0;
        }

        const discount = ((product.compareAtPrice - product.price) / product.compareAtPrice) * 100;
        return Math.round(discount);
    },

    /**
     * Format product price
     * @param {number} price - Price value
     * @returns {string} Formatted price
     */
    formatPrice(price) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    },

    /**
     * Get all available sizes across all products
     * @returns {Promise<Array>} Array of unique sizes
     */
    async getAllSizes() {
        const products = await this.getAllProducts();
        const sizesSet = new Set();

        products.forEach(product => {
            product.sizes.forEach(size => sizesSet.add(size));
        });

        // Return in standard order
        const standardOrder = ['XS', 'S', 'M', 'L', 'XL'];
        return standardOrder.filter(size => sizesSet.has(size));
    },

    /**
     * Get all unique tags
     * @returns {Promise<Array>} Array of unique tags
     */
    async getAllTags() {
        const products = await this.getAllProducts();
        const tagsSet = new Set();

        products.forEach(product => {
            product.tags.forEach(tag => tagsSet.add(tag));
        });

        return Array.from(tagsSet).sort();
    },

    /**
     * Get price range of all products
     * @returns {Promise<Object>} { min: number, max: number }
     */
    async getPriceRange() {
        const products = await this.getAllProducts();

        if (products.length === 0) {
            return { min: 0, max: 0 };
        }

        const prices = products.map(p => p.price);

        return {
            min: Math.min(...prices),
            max: Math.max(...prices)
        };
    }
};

// Freeze to prevent modifications
Object.freeze(ProductService);
