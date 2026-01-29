/**
 * User Service
 * Handles user authentication, registration, and management
 */

const UserService = {
    /**
     * Get all registered users
     * @returns {Array} List of users
     */
    getAllUsers() {
        return Storage.get(CONFIG.STORAGE_KEYS.USERS, []);
    },

    /**
     * Find user by email
     * @param {string} email 
     * @returns {Object|null}
     */
    findByEmail(email) {
        const users = this.getAllUsers();
        return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
    },

    /**
     * Find user by ID
     * @param {string} id 
     * @returns {Object|null}
     */
    findById(id) {
        const users = this.getAllUsers();
        return users.find(u => u.id === id) || null;
    },

    /**
     * Register new user
     * @param {Object} userData { name, email, password, phone }
     * @returns {Object} Result { success, user, error, errors }
     */
    register(userData) {
        try {
            // Basic validation
            const errors = [];
            if (!userData.name || userData.name.length < 2) errors.push('Tên phải có ít nhất 2 ký tự');
            if (!userData.email || !CONFIG.VALIDATION.EMAIL_PATTERN.test(userData.email)) errors.push('Email không hợp lệ');
            if (!userData.password || userData.password.length < 6) errors.push('Mật khẩu phải có ít nhất 6 ký tự');

            if (errors.length > 0) {
                return { success: false, errors };
            }

            // Check if email exists
            if (this.findByEmail(userData.email)) {
                return { success: false, error: 'Email đã được sử dụng' };
            }

            const newUser = {
                id: `usr-${Date.now()}`,
                name: userData.name.trim(),
                email: userData.email.trim().toLowerCase(),
                password: userData.password, // In real app, MUST HASH THIS
                phone: userData.phone || '',
                role: 'user',
                status: 'active',
                createdAt: new Date().toISOString(),
                lastLoginAt: null
            };

            const users = this.getAllUsers();
            users.push(newUser);
            Storage.set(CONFIG.STORAGE_KEYS.USERS, users);

            return { success: true, user: newUser };
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: 'Lỗi đăng ký' };
        }
    },

    /**
     * Login user
     * @param {string} email 
     * @param {string} password 
     * @returns {Object} Result
     */
    login(email, password) {
        const user = this.findByEmail(email);
        if (!user) {
            return { success: false, error: CONFIG.MESSAGES.LOGIN_ERROR };
        }

        if (user.password !== password) {
            return { success: false, error: CONFIG.MESSAGES.LOGIN_ERROR };
        }

        if (user.status === 'blocked') {
            return { success: false, error: 'Tài khoản đã bị khóa' };
        }

        // Update last login
        user.lastLoginAt = new Date().toISOString();
        this.updateUser(user.id, { lastLoginAt: user.lastLoginAt });

        // Save current user session
        const sessionUser = { ...user };
        delete sessionUser.password; // Don't store password in session
        Storage.set('currentUser', sessionUser);

        return { success: true, user: sessionUser };
    },

    /**
     * Logout
     */
    logout() {
        Storage.remove('currentUser');
        window.location.reload();
    },

    /**
     * Get current logged in user
     * @returns {Object|null}
     */
    getCurrentUser() {
        return Storage.get('currentUser');
    },

    /**
     * Update user data
     * @param {string} userId 
     * @param {Object} updates 
     * @returns {Object} Result
     */
    updateUser(userId, updates) {
        const users = this.getAllUsers();
        const index = users.findIndex(u => u.id === userId);

        if (index === -1) return { success: false, error: 'User not found' };

        // Prevent email duplication if changing email
        if (updates.email && updates.email !== users[index].email) {
            if (this.findByEmail(updates.email)) {
                return { success: false, error: 'Email đã tồn tại' };
            }
        }

        users[index] = { ...users[index], ...updates };
        Storage.set(CONFIG.STORAGE_KEYS.USERS, users);

        // If updating current user, update session too
        const currentUser = this.getCurrentUser();
        if (currentUser && currentUser.id === userId) {
            const newSession = { ...users[index] };
            delete newSession.password;
            Storage.set('currentUser', newSession);
        }

        return { success: true, user: users[index] };
    },

    /**
     * Delete user
     * @param {string} userId 
     * @returns {Object}
     */
    deleteUser(userId) {
        let users = this.getAllUsers();
        const initialLen = users.length;
        users = users.filter(u => u.id !== userId);

        if (users.length === initialLen) return { success: false, error: 'User not found' };

        Storage.set(CONFIG.STORAGE_KEYS.USERS, users);
        return { success: true };
    },

    /**
     * Toggle user block status
     * @param {string} userId 
     * @returns {Object}
     */
    toggleBlock(userId) {
        const user = this.findById(userId);
        if (!user) return { success: false, error: 'User not found' };

        const newStatus = user.status === 'blocked' ? 'active' : 'blocked';
        return this.updateUser(userId, { status: newStatus });
    }
};

// Freeze
Object.freeze(UserService);
