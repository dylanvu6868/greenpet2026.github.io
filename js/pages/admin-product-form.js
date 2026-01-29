document.addEventListener('DOMContentLoaded', async () => {
    // Auth handled by AdminHeader

    const form = document.getElementById('productForm');
    const pageTitle = document.getElementById('pageTitle');

    // Get Product ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    const isEditMode = !!productId;

    await loadCategories();

    if (isEditMode) {
        pageTitle.textContent = 'Chỉnh sửa sản phẩm';
        await loadProductData(productId);
    }

    async function loadCategories() {
        try {
            const categories = await Database.loadCategories();
            const select = document.getElementById('categoryId');
            if (!select) return;

            select.innerHTML = '<option value="">-- Chọn danh mục --</option>';
            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.name;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const productData = {
            name: document.getElementById('name').value,
            categoryId: document.getElementById('categoryId').value,
            price: document.getElementById('price').value,
            compareAtPrice: document.getElementById('compareAtPrice').value,
            stock: document.getElementById('stock').value,
            sizes: document.getElementById('sizes').value.split(',').map(s => s.trim()).filter(s => s),
            recycledContent: document.getElementById('recycledContent').value || 0,
            material: document.getElementById('material').value,
            images: [document.getElementById('imageUrl').value], // Simple single image handler
            description: document.getElementById('description').value,
            longDescription: document.getElementById('longDescription').value,
            seoTitle: document.getElementById('seoTitle').value,
            seoDescription: document.getElementById('seoDescription').value,
            isActive: document.getElementById('isActive').checked,
            isFeatured: document.getElementById('isFeatured').checked
        };

        if (isEditMode) {
            const result = await AdminService.updateProduct(productId, productData);
            if (result.success) {
                alert('Cập nhật thành công!');
                window.location.href = 'products.html';
            } else {
                showErrors(result);
            }
        } else {
            const result = await AdminService.createProduct(productData);
            if (result.success) {
                alert('Thêm sản phẩm thành công!');
                window.location.href = 'products.html';
            } else {
                showErrors(result);
            }
        }
    });

    function showErrors(result) {
        if (result.errors) {
            const errorMsg = Object.values(result.errors).join('\n');
            alert('Vui lòng kiểm tra lại:\n' + errorMsg);
        } else {
            alert(result.error || 'Có lỗi xảy ra');
        }
    }

    async function loadProductData(id) {
        const products = await AdminService.getAllProducts();
        const product = products.find(p => p.id === id);

        if (!product) {
            alert('Không tìm thấy sản phẩm');
            window.location.href = 'products.html';
            return;
        }

        // Fill form
        document.getElementById('name').value = product.name;
        document.getElementById('categoryId').value = product.categoryId;
        document.getElementById('price').value = product.price;
        document.getElementById('compareAtPrice').value = product.compareAtPrice || '';
        document.getElementById('stock').value = product.stock;
        document.getElementById('sizes').value = product.sizes ? product.sizes.join(', ') : '';
        document.getElementById('recycledContent').value = product.recycledContent || 0;
        document.getElementById('material').value = product.material || '';
        document.getElementById('imageUrl').value = product.images[0] || '';
        document.getElementById('description').value = product.description;
        document.getElementById('longDescription').value = product.longDescription || product.description;
        document.getElementById('seoTitle').value = product.seoTitle || '';
        document.getElementById('seoDescription').value = product.seoDescription || '';
        document.getElementById('isActive').checked = product.isActive;
        document.getElementById('isFeatured').checked = product.isFeatured;
    }
});
