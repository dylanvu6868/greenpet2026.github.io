document.addEventListener('DOMContentLoaded', async () => {
    // Auth handled by AdminHeader
    // Logout handled by AdminHeader

    const tableContainer = document.getElementById('productTableContainer');
    const tableBody = document.getElementById('productTableBody');
    const loading = document.getElementById('loading');

    // Load Products
    await loadProducts();

    async function loadProducts() {
        try {
            const products = await AdminService.getAllProducts();
            renderTable(products);

            loading.style.display = 'none';
            tableContainer.style.display = 'block';
        } catch (error) {
            console.error('Error loading products:', error);
            alert('Có lỗi xảy ra khi tải danh sách sản phẩm');
        }
    }

    function renderTable(products) {
        if (!products || products.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Chưa có sản phẩm nào</td></tr>';
            return;
        }

        tableBody.innerHTML = products.map(product => {
            const statusBadge = product.isActive
                ? '<span class="badge" style="background: #e6fcf5; color: var(--color-success)">Đang bán</span>'
                : '<span class="badge" style="background: #fff5f5; color: var(--color-error)">Ẩn</span>';

            const categoryName = getCategoryName(product.categoryId);

            return `
                <tr>
                    <td>
                        <img src=".${product.images[0]}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">
                    </td>
                    <td>
                        <strong>${product.name}</strong>
                    </td>
                    <td>${categoryName}</td>
                    <td>${ProductService.formatPrice(product.price)}</td>
                    <td>${product.stock}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <div class="flex gap-sm">
                            <a href="product-form.html?id=${product.id}" class="btn btn-sm btn-secondary">Sửa</a>
                            <button class="btn btn-sm btn-text text-error" onclick="deleteProduct('${product.id}')">Xóa</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Helper to get category name (mock for now, ideally fetch categories too)
    function getCategoryName(categoryId) {
        const categories = {
            'cat-clothes': 'Quần áo mèo',
            'dog-clothes': 'Quần áo chó',
            'accessories': 'Phụ kiện'
        };
        return categories[categoryId] || categoryId;
    }

    // Global delete function
    window.deleteProduct = async (id) => {
        const result = await AdminService.deleteProduct(id);
        if (result.success) {
            await loadProducts(); // Reload table
        } else if (result.error) {
            alert(result.error);
        }
    };
});
