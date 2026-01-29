/**
 * Voucher Service
 * Handles discount codes and promotions
 */

const VoucherService = {
    /**
     * Get all vouchers
     * @returns {Array} List of vouchers
     */
    getAllVouchers() {
        return Storage.get('greenpet_vouchers', []);
    },

    /**
     * Create new voucher
     * @param {Object} voucherData { code, discountType, discountValue, minOrderValue, maxUsage, expiryDate }
     * @returns {Object} Result
     */
    createVoucher(voucherData) {
        try {
            const vouchers = this.getAllVouchers();
            const code = voucherData.code.toUpperCase().trim();

            if (vouchers.some(v => v.code === code)) {
                return { success: false, error: 'Mã giảm giá đã tồn tại' };
            }

            const newVoucher = {
                id: `vou-${Date.now()}`,
                code,
                discountType: voucherData.discountType || 'percent', // 'percent' or 'fixed'
                discountValue: parseFloat(voucherData.discountValue),
                minOrderValue: parseFloat(voucherData.minOrderValue) || 0,
                maxUsage: parseInt(voucherData.maxUsage) || 100,
                usedCount: 0,
                expiryDate: voucherData.expiryDate,
                isActive: true,
                createdAt: new Date().toISOString()
            };

            vouchers.push(newVoucher);
            Storage.set('greenpet_vouchers', vouchers);

            return { success: true, voucher: newVoucher };
        } catch (error) {
            console.error('Error creating voucher:', error);
            return { success: false, error: 'Lỗi tạo mã giảm giá' };
        }
    },

    /**
     * Validate and apply voucher
     * @param {string} code 
     * @param {number} orderTotal 
     * @returns {Object} { isValid, discountAmount, error }
     */
    validateVoucher(code, orderTotal) {
        if (!code) return { isValid: false, error: 'Vui lòng nhập mã' };

        const vouchers = this.getAllVouchers();
        const voucher = vouchers.find(v => v.code === code.toUpperCase() && v.isActive);

        if (!voucher) {
            return { isValid: false, error: 'Mã giảm giá không tồn tại' };
        }

        // Check expiry
        if (new Date(voucher.expiryDate) < new Date()) {
            return { isValid: false, error: 'Mã giảm giá đã hết hạn' };
        }

        // Check usage limit
        if (voucher.usedCount >= voucher.maxUsage) {
            return { isValid: false, error: 'Mã giảm giá đã hết lượt sử dụng' };
        }

        // Check min order value
        if (orderTotal < voucher.minOrderValue) {
            return { isValid: false, error: `Đơn hàng tối thiểu ${new Intl.NumberFormat('vi-VN').format(voucher.minOrderValue)}đ` };
        }

        // Calculate discount
        let discountAmount = 0;
        if (voucher.discountType === 'percent') {
            discountAmount = orderTotal * (voucher.discountValue / 100);
            // Optional: Cap max discount for percent type? For now simpler logic.
        } else {
            discountAmount = voucher.discountValue;
        }

        // Ensure discount doesn't exceed total
        discountAmount = Math.min(discountAmount, orderTotal);

        return {
            isValid: true,
            discountAmount,
            voucher
        };
    },

    /**
     * Increment usage count
     * @param {string} code 
     */
    useVoucher(code) {
        const vouchers = this.getAllVouchers();
        const index = vouchers.findIndex(v => v.code === code);

        if (index !== -1) {
            vouchers[index].usedCount += 1;
            Storage.set('greenpet_vouchers', vouchers);
        }
    },

    /**
     * Delete voucher
     * @param {string} id 
     */
    deleteVoucher(id) {
        let vouchers = this.getAllVouchers();
        vouchers = vouchers.filter(v => v.id !== id);
        Storage.set('greenpet_vouchers', vouchers);
        return { success: true };
    }
};

Object.freeze(VoucherService);
