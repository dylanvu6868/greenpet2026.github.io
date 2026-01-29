/**
 * GreenPet Configuration
 * Application-wide constants and settings
 */

// Detect if current page is under /admin/ to fix relative paths on GitHub Pages
const __IS_ADMIN_PAGE__ = typeof window !== 'undefined'
    && typeof window.location !== 'undefined'
    && /\/admin\//.test(window.location.pathname);

// Base prefix for static asset/data paths (works on GitHub Pages subpaths)
const __BASE_PREFIX__ = __IS_ADMIN_PAGE__ ? '..' : '.';

const CONFIG = {
    // Application Info
    APP_NAME: 'GreenPet',
    APP_VERSION: '1.0.1',
    APP_DESCRIPTION: 'Quần áo thú cưng từ vật liệu tái chế',

    // LocalStorage Keys
    STORAGE_KEYS: {
        CART: 'greenpet_cart',
        WISHLIST: 'greenpet_wishlist',
        USER: 'greenpet_user',
        USERS: 'greenpet_users',
        ORDERS: 'greenpet_orders',
        ADMIN_TOKEN: 'greenpet_admin_token',
        SETTINGS: 'greenpet_settings',
        PRODUCTS: 'greenpet_products',
        CATEGORIES: 'greenpet_categories'
    },

    // API/Data Paths (for JSON files)
    // NOTE: Must be correct for both root pages and /admin/* pages when deployed to GitHub Pages.
    DATA_PATHS: {
        PRODUCTS: `${__BASE_PREFIX__}/data/products.json`,
        CATEGORIES: `${__BASE_PREFIX__}/data/categories.json`,
        SETTINGS: `${__BASE_PREFIX__}/data/settings.json`
    },

    // Pagination
    PAGINATION: {
        PRODUCTS_PER_PAGE: 12,
        ORDERS_PER_PAGE: 20,
        ADMIN_ITEMS_PER_PAGE: 25
    },

    // Filters
    FILTERS: {
        CATEGORIES: ['cho', 'meo'],
        SIZES: ['XS', 'S', 'M', 'L', 'XL'],
        PRICE_RANGES: [
            { label: 'Dưới 200,000₫', min: 0, max: 200000 },
            { label: '200,000₫ - 400,000₫', min: 200000, max: 400000 },
            { label: '400,000₫ - 600,000₫', min: 400000, max: 600000 },
            { label: 'Trên 600,000₫', min: 600000, max: Infinity }
        ]
    },

    // Order Status
    ORDER_STATUS: {
        PENDING: 'pending',
        PROCESSING: 'processing',
        COMPLETED: 'completed',
        CANCELLED: 'cancelled'
    },

    ORDER_STATUS_LABELS: {
        pending: 'Chờ xử lý',
        processing: 'Đang xử lý',
        completed: 'Hoàn thành',
        cancelled: 'Đã hủy'
    },

    // Payment Methods
    PAYMENT_METHODS: {
        COD: 'cod',
        BANK_TRANSFER: 'bank_transfer'
    },

    PAYMENT_METHOD_LABELS: {
        cod: 'Thanh toán khi nhận hàng (COD)',
        bank_transfer: 'Chuyển khoản ngân hàng'
    },

    // Shipping
    SHIPPING: {
        DEFAULT_FEE: 30000,
        FREE_SHIPPING_THRESHOLD: 500000
    },

    // Inventory
    INVENTORY: {
        LOW_STOCK_THRESHOLD: 5,
        OUT_OF_STOCK: 0
    },

    // Validation Rules
    VALIDATION: {
        PRODUCT_NAME_MIN_LENGTH: 5,
        PRODUCT_NAME_MAX_LENGTH: 100,
        DESCRIPTION_MIN_LENGTH: 10,
        DESCRIPTION_MAX_LENGTH: 500,
        PRICE_MIN: 0,
        PRICE_MAX: 10000000,
        USERNAME_MIN_LENGTH: 4,
        USERNAME_MAX_LENGTH: 20,
        PASSWORD_MIN_LENGTH: 6,
        PHONE_PATTERN: /^0\d{9}$/,
        EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },

    // Admin
    ADMIN: {
        DEFAULT_USERNAME: 'admin',
        DEFAULT_PASSWORD: 'admin123' // In production, use proper authentication
    },

    // UI Messages
    MESSAGES: {
        ADD_TO_CART_SUCCESS: 'Đã thêm sản phẩm vào giỏ hàng!',
        REMOVE_FROM_CART: 'Đã xóa sản phẩm khỏi giỏ hàng',
        UPDATE_CART_SUCCESS: 'Đã cập nhật giỏ hàng',
        ORDER_SUCCESS: 'Đặt hàng thành công! Cảm ơn bạn đã tin tưởng GreenPet.',
        ORDER_ERROR: 'Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.',
        LOGIN_SUCCESS: 'Đăng nhập thành công!',
        LOGIN_ERROR: 'Tên đăng nhập hoặc mật khẩu không đúng',
        PRODUCT_SAVED: 'Đã lưu sản phẩm thành công',
        PRODUCT_DELETED: 'Đã xóa sản phẩm',
        CONFIRM_DELETE: 'Bạn có chắc chắn muốn xóa?',
        VALIDATION_ERROR: 'Vui lòng kiểm tra lại thông tin',
        OUT_OF_STOCK: 'Sản phẩm đã hết hàng',
        CART_EMPTY: 'Giỏ hàng trống',
        WISHLIST_EMPTY: 'Danh sách yêu thích trống'
    },

    // Date Format
    DATE_FORMAT: {
        LOCALE: 'vi-VN',
        OPTIONS: {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }
    },

    // Currency
    CURRENCY: {
        SYMBOL: '₫',
        LOCALE: 'vi-VN',
        FORMAT: 'VND'
    }
};

// Freeze config to prevent modifications
Object.freeze(CONFIG);

// Export for modules (if using modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
