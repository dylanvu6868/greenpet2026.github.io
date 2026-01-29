/**
 * Admin Blog Page JavaScript
 */

(function () {
    'use strict';

    if (!AdminService.isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    let allPosts = [];

    DOM.ready(() => {
        loadPosts();
        setupEventListeners();
    });

    function loadPosts() {
        allPosts = BlogService.getPosts();
        renderPosts(allPosts);
    }

    function renderPosts(posts) {
        const tbody = DOM.byId('postsTableBody');
        DOM.empty(tbody);

        if (posts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-lg text-gray">Chưa có bài viết nào</td></tr>';
            return;
        }

        posts.forEach(post => {
            const tr = DOM.create('tr');

            const dateStr = new Date(post.createdAt).toLocaleDateString('vi-VN');
            const statusClass = post.isActive ? 'text-success' : 'text-gray';
            const statusText = post.isActive ? 'Hiển thị' : 'Ẩn';

            tr.innerHTML = `
                <td>
                    <div class="font-bold">${post.title}</div>
                    <div class="text-xs text-gray truncate" style="max-width: 300px;">${post.shortDescription}</div>
                </td>
                <td>${post.author}</td>
                <td>${dateStr}</td>
                <td><span class="${statusClass} font-medium">${statusText}</span></td>
                <td>
                    <div class="flex gap-sm">
                        <button class="btn btn-sm btn-secondary edit-btn" data-id="${post.id}">Sửa</button>
                        <button class="btn btn-sm btn-danger delete-btn" data-id="${post.id}">Xóa</button>
                    </div>
                </td>
            `;
            DOM.append(tbody, tr);
        });

        // Attach dynamic listeners
        DOM.qsa('.edit-btn', tbody).forEach(btn => {
            DOM.on(btn, 'click', () => editPost(btn.dataset.id));
        });

        DOM.qsa('.delete-btn', tbody).forEach(btn => {
            DOM.on(btn, 'click', () => deletePost(btn.dataset.id));
        });
    }

    function openModal(isEdit = false) {
        const modal = DOM.byId('postModal');
        const title = DOM.byId('modalTitle');
        const form = DOM.byId('postForm');

        DOM.text(title, isEdit ? 'Chỉnh sửa bài viết' : 'Viết bài mới');
        if (!isEdit) {
            form.reset();
            DOM.byId('postId').value = '';
            DOM.byId('postActive').checked = true;
        }
        DOM.addClass(modal, 'active');
    }

    function closeModal() {
        DOM.removeClass(DOM.byId('postModal'), 'active');
    }

    function editPost(id) {
        const post = BlogService.getPostById(id);
        if (!post) return;

        openModal(true);
        DOM.byId('postId').value = post.id;
        DOM.byId('postTitle').value = post.title;
        DOM.byId('postShortDesc').value = post.shortDescription;
        DOM.byId('postImage').value = post.image || '';
        DOM.byId('postContent').value = post.content;
        DOM.byId('postActive').checked = post.isActive;
    }

    function deletePost(id) {
        if (confirm('Bạn có chắc chắn muốn xóa bài viết này không?')) {
            BlogService.deletePost(id);
            loadPosts();
        }
    }

    function setupEventListeners() {
        // Search
        DOM.on(DOM.byId('searchPost'), 'input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = allPosts.filter(p => p.title.toLowerCase().includes(term));
            renderPosts(filtered);
        });

        // Modal triggers
        DOM.on(DOM.byId('addPostBtn'), 'click', () => openModal(false));
        DOM.on(DOM.byId('closeModalBtn'), 'click', closeModal);

        // Form submit
        DOM.on(DOM.byId('postForm'), 'submit', (e) => {
            e.preventDefault();

            const id = DOM.byId('postId').value;
            const data = {
                title: DOM.byId('postTitle').value,
                shortDescription: DOM.byId('postShortDesc').value,
                image: DOM.byId('postImage').value,
                content: DOM.byId('postContent').value,
                isActive: DOM.byId('postActive').checked
            };

            if (id) {
                BlogService.updatePost(id, data);
            } else {
                BlogService.createPost(data);
            }

            closeModal();
            loadPosts();
        });

        // Logout
        const logoutBtn = DOM.byId('logoutBtn');
        if (logoutBtn) {
            DOM.on(logoutBtn, 'click', () => {
                AdminService.logout();
                window.location.href = 'login.html';
            });
        }
    }

})();
