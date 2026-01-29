/**
 * Blog Service
 * Handles blog post management
 */

const BlogService = {
    /**
     * Get all posts
     * @returns {Array} List of posts
     */
    getPosts() {
        return Storage.get('greenpet_posts', [])
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    /**
     * Get post by ID
     * @param {string} id
     * @returns {Object|null}
     */
    getPostById(id) {
        const posts = this.getPosts();
        return posts.find(p => p.id === id) || null;
    },

    /**
     * Create new post
     * @param {Object} data 
     * @returns {Object} Created post
     */
    createPost(data) {
        const posts = this.getPosts();

        const newPost = {
            id: 'post_' + Date.now(),
            title: data.title,
            content: data.content,
            shortDescription: data.shortDescription,
            image: data.image,
            author: data.author || 'Admin',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isActive: data.isActive !== false
        };

        posts.unshift(newPost);
        Storage.set('greenpet_posts', posts);

        return { success: true, post: newPost };
    },

    /**
     * Update post
     * @param {string} id 
     * @param {Object} data 
     */
    updatePost(id, data) {
        const posts = this.getPosts();
        const index = posts.findIndex(p => p.id === id);

        if (index === -1) return { success: false, error: 'Bài viết không tồn tại' };

        posts[index] = {
            ...posts[index],
            ...data,
            updatedAt: new Date().toISOString()
        };

        Storage.set('greenpet_posts', posts);
        return { success: true, post: posts[index] };
    },

    /**
     * Delete post
     * @param {string} id 
     */
    deletePost(id) {
        let posts = this.getPosts();
        const initialLength = posts.length;
        posts = posts.filter(p => p.id !== id);

        if (posts.length === initialLength) {
            return { success: false, error: 'Bài viết không tồn tại' };
        }

        Storage.set('greenpet_posts', posts);
        return { success: true };
    }
};

// Seed initial data if empty
if (BlogService.getPosts().length === 0) {
    BlogService.createPost({
        title: 'Chào mừng đến với GreenPet',
        shortDescription: 'GreenPet là thương hiệu thời trang thú cưng bền vững đầu tiên tại Việt Nam.',
        content: '<p>Chúng tôi tự hào mang đến những sản phẩm chất lượng cao, thân thiện với môi trường dành cho thú cưng của bạn.</p>',
        image: './assets/images/hero-bg.jpg',
        author: 'Admin'
    });
}
