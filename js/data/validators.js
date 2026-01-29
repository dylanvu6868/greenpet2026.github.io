/**
 * Data Validators
 * Validation functions for user input and data integrity
 */

const Validators = {
    /**
     * Validate email format
     * @param {string} email - Email address
     * @returns {boolean}
     */
    isValidEmail(email) {
        if (!email || typeof email !== 'string') return false;
        return CONFIG.VALIDATION.EMAIL_PATTERN.test(email);
    },

    /**
     * Validate phone number (Vietnamese format)
     * @param {string} phone - Phone number
     * @returns {boolean}
     */
    isValidPhone(phone) {
        if (!phone || typeof phone !== 'string') return false;
        return CONFIG.VALIDATION.PHONE_PATTERN.test(phone);
    },

    /**
     * Validate product name
     * @param {string} name - Product name
     * @returns {Object} { valid: boolean, error: string }
     */
    validateProductName(name) {
        if (!name || typeof name !== 'string') {
            return { valid: false, error: 'Tên sản phẩm không được để trống' };
        }

        const trimmed = name.trim();

        if (trimmed.length < CONFIG.VALIDATION.PRODUCT_NAME_MIN_LENGTH) {
            return {
                valid: false,
                error: `Tên sản phẩm phải có ít nhất ${CONFIG.VALIDATION.PRODUCT_NAME_MIN_LENGTH} ký tự`
            };
        }

        if (trimmed.length > CONFIG.VALIDATION.PRODUCT_NAME_MAX_LENGTH) {
            return {
                valid: false,
                error: `Tên sản phẩm không được vượt quá ${CONFIG.VALIDATION.PRODUCT_NAME_MAX_LENGTH} ký tự`
            };
        }

        return { valid: true, error: null };
    },

    /**
     * Validate description
     * @param {string} description - Description text
     * @returns {Object} { valid: boolean, error: string }
     */
    validateDescription(description) {
        if (!description || typeof description !== 'string') {
            return { valid: false, error: 'Mô tả không được để trống' };
        }

        const trimmed = description.trim();

        if (trimmed.length < CONFIG.VALIDATION.DESCRIPTION_MIN_LENGTH) {
            return {
                valid: false,
                error: `Mô tả phải có ít nhất ${CONFIG.VALIDATION.DESCRIPTION_MIN_LENGTH} ký tự`
            };
        }

        if (trimmed.length > CONFIG.VALIDATION.DESCRIPTION_MAX_LENGTH) {
            return {
                valid: false,
                error: `Mô tả không được vượt quá ${CONFIG.VALIDATION.DESCRIPTION_MAX_LENGTH} ký tự`
            };
        }

        return { valid: true, error: null };
    },

    /**
     * Validate price
     * @param {number|string} price - Price value
     * @returns {Object} { valid: boolean, error: string }
     */
    validatePrice(price) {
        const numPrice = typeof price === 'string' ? parseFloat(price) : price;

        if (isNaN(numPrice)) {
            return { valid: false, error: 'Giá không hợp lệ' };
        }

        if (numPrice <= CONFIG.VALIDATION.PRICE_MIN) {
            return { valid: false, error: 'Giá phải lớn hơn 0' };
        }

        if (numPrice > CONFIG.VALIDATION.PRICE_MAX) {
            return {
                valid: false,
                error: `Giá không được vượt quá ${CONFIG.VALIDATION.PRICE_MAX.toLocaleString('vi-VN')}₫`
            };
        }

        return { valid: true, error: null };
    },

    /**
     * Validate stock quantity
     * @param {number|string} stock - Stock quantity
     * @returns {Object} { valid: boolean, error: string }
     */
    validateStock(stock) {
        const numStock = typeof stock === 'string' ? parseInt(stock, 10) : stock;

        if (isNaN(numStock)) {
            return { valid: false, error: 'Số lượng không hợp lệ' };
        }

        if (numStock < 0) {
            return { valid: false, error: 'Số lượng không được âm' };
        }

        if (!Number.isInteger(numStock)) {
            return { valid: false, error: 'Số lượng phải là số nguyên' };
        }

        return { valid: true, error: null };
    },

    /**
     * Validate recycled content percentage
     * @param {number|string} percentage - Percentage value
     * @returns {Object} { valid: boolean, error: string }
     */
    validateRecycledContent(percentage) {
        const numPercentage = typeof percentage === 'string' ? parseFloat(percentage) : percentage;

        if (isNaN(numPercentage)) {
            return { valid: false, error: 'Tỷ lệ tái chế không hợp lệ' };
        }

        if (numPercentage < 0 || numPercentage > 100) {
            return { valid: false, error: 'Tỷ lệ tái chế phải từ 0-100%' };
        }

        return { valid: true, error: null };
    },

    /**
     * Validate username
     * @param {string} username - Username
     * @returns {Object} { valid: boolean, error: string }
     */
    validateUsername(username) {
        if (!username || typeof username !== 'string') {
            return { valid: false, error: 'Tên đăng nhập không được để trống' };
        }

        const trimmed = username.trim();

        if (trimmed.length < CONFIG.VALIDATION.USERNAME_MIN_LENGTH) {
            return {
                valid: false,
                error: `Tên đăng nhập phải có ít nhất ${CONFIG.VALIDATION.USERNAME_MIN_LENGTH} ký tự`
            };
        }

        if (trimmed.length > CONFIG.VALIDATION.USERNAME_MAX_LENGTH) {
            return {
                valid: false,
                error: `Tên đăng nhập không được vượt quá ${CONFIG.VALIDATION.USERNAME_MAX_LENGTH} ký tự`
            };
        }

        // Only alphanumeric
        if (!/^[a-zA-Z0-9]+$/.test(trimmed)) {
            return {
                valid: false,
                error: 'Tên đăng nhập chỉ được chứa chữ cái và số'
            };
        }

        return { valid: true, error: null };
    },

    /**
     * Validate password
     * @param {string} password - Password
     * @returns {Object} { valid: boolean, error: string }
     */
    validatePassword(password) {
        if (!password || typeof password !== 'string') {
            return { valid: false, error: 'Mật khẩu không được để trống' };
        }

        if (password.length < CONFIG.VALIDATION.PASSWORD_MIN_LENGTH) {
            return {
                valid: false,
                error: `Mật khẩu phải có ít nhất ${CONFIG.VALIDATION.PASSWORD_MIN_LENGTH} ký tự`
            };
        }

        return { valid: true, error: null };
    },

    /**
     * Validate customer info for checkout
     * @param {Object} customerInfo - Customer information
     * @returns {Object} { valid: boolean, errors: Object }
     */
    validateCustomerInfo(customerInfo) {
        const errors = {};

        // Name
        if (!customerInfo.name || customerInfo.name.trim().length < 2) {
            errors.name = 'Vui lòng nhập họ tên (ít nhất 2 ký tự)';
        }

        // Email
        if (!this.isValidEmail(customerInfo.email)) {
            errors.email = 'Email không hợp lệ';
        }

        // Phone
        if (!this.isValidPhone(customerInfo.phone)) {
            errors.phone = 'Số điện thoại không hợp lệ (VD: 0912345678)';
        }

        // Address
        if (!customerInfo.address || !customerInfo.address.street) {
            errors.street = 'Vui lòng nhập địa chỉ';
        }
        if (!customerInfo.address || !customerInfo.address.ward) {
            errors.ward = 'Vui lòng nhập phường/xã';
        }
        if (!customerInfo.address || !customerInfo.address.district) {
            errors.district = 'Vui lòng nhập quận/huyện';
        }
        if (!customerInfo.address || !customerInfo.address.city) {
            errors.city = 'Vui lòng nhập tỉnh/thành phố';
        }

        return {
            valid: Object.keys(errors).length === 0,
            errors
        };
    },

    /**
     * Validate complete product object
     * @param {Object} product - Product object
     * @returns {Object} { valid: boolean, errors: Object }
     */
    validateProduct(product) {
        const errors = {};

        // Name
        const nameValidation = this.validateProductName(product.name);
        if (!nameValidation.valid) {
            errors.name = nameValidation.error;
        }

        // Description
        const descValidation = this.validateDescription(product.description);
        if (!descValidation.valid) {
            errors.description = descValidation.error;
        }

        // Price
        const priceValidation = this.validatePrice(product.price);
        if (!priceValidation.valid) {
            errors.price = priceValidation.error;
        }

        // Stock
        const stockValidation = this.validateStock(product.stock);
        if (!stockValidation.valid) {
            errors.stock = stockValidation.error;
        }

        // Recycled content
        const recycledValidation = this.validateRecycledContent(product.recycledContent);
        if (!recycledValidation.valid) {
            errors.recycledContent = recycledValidation.error;
        }

        // Category
        if (!product.categoryId) {
            errors.categoryId = 'Vui lòng chọn danh mục';
        }

        // Sizes
        if (!product.sizes || product.sizes.length === 0) {
            errors.sizes = 'Vui lòng chọn ít nhất một size';
        }

        return {
            valid: Object.keys(errors).length === 0,
            errors
        };
    },

    /**
     * Sanitize string input (remove HTML tags)
     * @param {string} str - Input string
     * @returns {string} Sanitized string
     */
    sanitizeString(str) {
        if (!str || typeof str !== 'string') return '';
        return str.replace(/<[^>]*>/g, '').trim();
    },

    /**
     * Sanitize number input
     * @param {*} num - Input number
     * @param {number} defaultValue - Default value if invalid
     * @returns {number} Sanitized number
     */
    sanitizeNumber(num, defaultValue = 0) {
        const parsed = typeof num === 'string' ? parseFloat(num) : num;
        return isNaN(parsed) ? defaultValue : parsed;
    }
};

// Freeze to prevent modifications
Object.freeze(Validators);
