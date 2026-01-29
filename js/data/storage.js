/**
 * LocalStorage Wrapper
 * Simple and safe interface for browser LocalStorage
 */

const Storage = {
    /**
     * Get item from LocalStorage
     * @param {string} key - Storage key
     * @param {*} defaultValue - Default value if key doesn't exist
     * @returns {*} Parsed value or default
     */
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            if (item === null) {
                return defaultValue;
            }
            return JSON.parse(item);
        } catch (error) {
            console.error(`Error getting ${key} from LocalStorage:`, error);
            return defaultValue;
        }
    },

    /**
     * Set item in LocalStorage
     * @param {string} key - Storage key
     * @param {*} value - Value to store (will be JSON stringified)
     * @returns {boolean} Success status
     */
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Error setting ${key} in LocalStorage:`, error);
            // Check if quota exceeded
            if (error.name === 'QuotaExceededError') {
                console.warn('LocalStorage quota exceeded. Consider clearing old data.');
            }
            return false;
        }
    },

    /**
     * Remove item from LocalStorage
     * @param {string} key - Storage key
     * @returns {boolean} Success status
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Error removing ${key} from LocalStorage:`, error);
            return false;
        }
    },

    /**
     * Clear all items from LocalStorage
     * @returns {boolean} Success status
     */
    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Error clearing LocalStorage:', error);
            return false;
        }
    },

    /**
     * Check if key exists in LocalStorage
     * @param {string} key - Storage key
     * @returns {boolean}
     */
    has(key) {
        return localStorage.getItem(key) !== null;
    },

    /**
     * Get all keys from LocalStorage
     * @param {string} prefix - Optional prefix filter
     * @returns {string[]} Array of keys
     */
    keys(prefix = '') {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!prefix || key.startsWith(prefix)) {
                keys.push(key);
            }
        }
        return keys;
    },

    /**
     * Get total size of LocalStorage in bytes (approximate)
     * @returns {number} Size in bytes
     */
    getSize() {
        let size = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            size += key.length + value.length;
        }
        return size;
    },

    /**
     * Get formatted size of LocalStorage
     * @returns {string} Formatted size (e.g., "1.5 MB")
     */
    getFormattedSize() {
        const bytes = this.getSize();
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }
};

// Freeze to prevent modifications
Object.freeze(Storage);
