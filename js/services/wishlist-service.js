/**
 * Wishlist Service
 * Handles wishlist operations
 */

const WishlistService = {
    /**
     * Get wishlist items from LocalStorage
     * @returns {Array} Array of product IDs
     */
    getWishlist() {
        return Storage.get(CONFIG.STORAGE_KEYS.WISHLIST, []);
    },

    /**
     * Save wishlist to LocalStorage
     * @param {Array} wishlist - Array of product IDs
     * @returns {boolean} Success status
     */
    saveWishlist(wishlist) {
        return Storage.set(CONFIG.STORAGE_KEYS.WISHLIST, wishlist);
    },

    /**
     * Add product to wishlist
     * @param {string} productId - Product ID
     * @returns {boolean} Success status
     */
    addToWishlist(productId) {
        const wishlist = this.getWishlist();
        if (!wishlist.includes(productId)) {
            wishlist.push(productId);
            this.saveWishlist(wishlist);
            return true;
        }
        return false;
    },

    /**
     * Remove product from wishlist
     * @param {string} productId - Product ID
     * @returns {boolean} Success status
     */
    removeFromWishlist(productId) {
        let wishlist = this.getWishlist();
        if (wishlist.includes(productId)) {
            wishlist = wishlist.filter(id => id !== productId);
            this.saveWishlist(wishlist);
            return true;
        }
        return false;
    },

    /**
     * Toggle product in wishlist
     * @param {string} productId - Product ID
     * @returns {Object} Result object { added: boolean, count: number }
     */
    toggleWishlist(productId) {
        const wishlist = this.getWishlist();
        let added = false;

        if (wishlist.includes(productId)) {
            // Remove
            const index = wishlist.indexOf(productId);
            wishlist.splice(index, 1);
        } else {
            // Add
            wishlist.push(productId);
            added = true;
        }

        this.saveWishlist(wishlist);
        return {
            added,
            count: wishlist.length
        };
    },

    /**
     * Check if product is in wishlist
     * @param {string} productId - Product ID
     * @returns {boolean}
     */
    isInWishlist(productId) {
        const wishlist = this.getWishlist();
        return wishlist.includes(productId);
    },

    /**
     * Get wishlist item count
     * @returns {number}
     */
    getWishlistCount() {
        const wishlist = this.getWishlist();
        return wishlist.length;
    }
};

// Freeze to prevent modifications
Object.freeze(WishlistService);
