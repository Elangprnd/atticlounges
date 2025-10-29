// ===== ADMIN PANEL FUNCTIONALITY ===== //

let products = [];
let currentUser = null;

// ===== INITIALIZATION ===== //
document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is logged in and is owner
    await checkOwnerAuth();
    
    // Load products
    await loadProducts();
    
    // Setup event listeners
    setupEventListeners();
    
    // Update stats
    updateStats();
    
    // Initialize search overlay for admin page
    if (typeof initializeSearchOverlay === 'function') {
        initializeSearchOverlay();
    }
});

// ===== AUTHENTICATION ===== //
async function checkOwnerAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token || !user || user.role !== 'owner') {
        alert('Akses ditolak. Hanya owner yang bisa mengakses halaman ini.');
        window.location.href = '../index.html';
        return;
    }
    
    currentUser = user;
}

// ===== PRODUCT MANAGEMENT ===== //
async function loadProducts() {
    try {
        const response = await fetch('http://localhost:4002/api/products');
        if (!response.ok) throw new Error('Failed to fetch products');
        
        products = await response.json();
        renderProductsTable();
        updateStats();
    } catch (error) {
        console.error('Error loading products:', error);
        showError('Gagal memuat produk. Pastikan Product Service berjalan di port 4002.');
    }
}

function renderProductsTable() {
    const tbody = document.getElementById('products-table-body');
    if (!tbody) return;
    
    if (products.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-4 text-center text-gray-500">
                    Belum ada produk. Klik "Tambah Produk" untuk menambah produk pertama.
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = products.map(product => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="flex-shrink-0 h-12 w-12">
                        <img class="h-12 w-12 rounded-lg object-cover" src="${product.image}" alt="${product.name}">
                    </div>
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">${product.name}</div>
                        <div class="text-sm text-gray-500">${product.brand}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-center">
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-[#DC9C84]/20 text-[#DC9C84]">
                    ${product.category}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                Rp ${product.price.toLocaleString('id-ID')}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-center">
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-[#93392C]/20 text-[#93392C]">
                    ${product.condition}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="editProduct('${product._id}')" class="text-[#DC9C84] hover:text-[#93392C] mr-3">
                    Edit
                </button>
                <button onclick="deleteProduct('${product._id}')" class="text-red-600 hover:text-red-900">
                    Hapus
                </button>
            </td>
        </tr>
    `).join('');
}

function updateStats() {
    document.getElementById('total-products').textContent = products.length;
    
    const categories = [...new Set(products.map(p => p.category))];
    document.getElementById('total-categories').textContent = categories.length;
}

// ===== MODAL MANAGEMENT ===== //
function setupEventListeners() {
    // Add Product Modal
    const addBtn = document.getElementById('add-product-btn');
    const addModal = document.getElementById('add-product-modal');
    const closeModal = document.getElementById('close-modal');
    const cancelAdd = document.getElementById('cancel-add');
    const addForm = document.getElementById('add-product-form');
    
    addBtn?.addEventListener('click', () => {
        addModal.classList.remove('hidden');
        clearAddForm();
    });
    
    closeModal?.addEventListener('click', () => {
        addModal.classList.add('hidden');
    });
    
    cancelAdd?.addEventListener('click', () => {
        addModal.classList.add('hidden');
    });
    
    addForm?.addEventListener('submit', handleAddProduct);
    
    // Edit Product Modal
    const editModal = document.getElementById('edit-product-modal');
    const closeEditModal = document.getElementById('close-edit-modal');
    const cancelEdit = document.getElementById('cancel-edit');
    const editForm = document.getElementById('edit-product-form');
    
    closeEditModal?.addEventListener('click', () => {
        editModal.classList.add('hidden');
    });
    
    cancelEdit?.addEventListener('click', () => {
        editModal.classList.add('hidden');
    });
    
    editForm?.addEventListener('submit', handleEditProduct);
    
    
    // Logout Button
    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn?.addEventListener('click', logout);
}

function clearAddForm() {
    document.getElementById('add-product-form').reset();
}

function clearEditForm() {
    document.getElementById('edit-product-form').reset();
}

// ===== PRODUCT CRUD OPERATIONS ===== //
async function handleAddProduct(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('product-name').value,
        category: document.getElementById('product-category').value,
        price: parseInt(document.getElementById('product-price').value),
        condition: document.getElementById('product-condition').value,
        size: document.getElementById('product-size').value,
        brand: document.getElementById('product-brand').value,
        image: document.getElementById('product-image').value,
        description: document.getElementById('product-description').value
    };
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:4002/api/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to add product');
        }
        
        const newProduct = await response.json();
        products.unshift(newProduct);
        renderProductsTable();
        updateStats();
        
        document.getElementById('add-product-modal').classList.add('hidden');
        showSuccess('Produk berhasil ditambahkan!');
        
    } catch (error) {
        console.error('Error adding product:', error);
        showError('Gagal menambahkan produk: ' + error.message);
    }
}

async function editProduct(productId) {
    const product = products.find(p => p._id === productId);
    if (!product) return;
    
    // Fill edit form
    document.getElementById('edit-product-id').value = product._id;
    document.getElementById('edit-product-name').value = product.name;
    document.getElementById('edit-product-category').value = product.category;
    document.getElementById('edit-product-price').value = product.price;
    document.getElementById('edit-product-condition').value = product.condition;
    document.getElementById('edit-product-size').value = product.size;
    document.getElementById('edit-product-brand').value = product.brand;
    document.getElementById('edit-product-image').value = product.image;
    document.getElementById('edit-product-description').value = product.description;
    
    // Show modal
    document.getElementById('edit-product-modal').classList.remove('hidden');
}

async function handleEditProduct(e) {
    e.preventDefault();
    
    const productId = document.getElementById('edit-product-id').value;
    const formData = {
        name: document.getElementById('edit-product-name').value,
        category: document.getElementById('edit-product-category').value,
        price: parseInt(document.getElementById('edit-product-price').value),
        condition: document.getElementById('edit-product-condition').value,
        size: document.getElementById('edit-product-size').value,
        brand: document.getElementById('edit-product-brand').value,
        image: document.getElementById('edit-product-image').value,
        description: document.getElementById('edit-product-description').value
    };
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:4002/api/products/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update product');
        }
        
        const updatedProduct = await response.json();
        const index = products.findIndex(p => p._id === productId);
        if (index !== -1) {
            products[index] = updatedProduct;
        }
        
        renderProductsTable();
        updateStats();
        
        document.getElementById('edit-product-modal').classList.add('hidden');
        showSuccess('Produk berhasil diupdate!');
        
    } catch (error) {
        console.error('Error updating product:', error);
        showError('Gagal mengupdate produk: ' + error.message);
    }
}

async function deleteProduct(productId) {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:4002/api/products/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete product');
        }
        
        products = products.filter(p => p._id !== productId);
        renderProductsTable();
        updateStats();
        
        showSuccess('Produk berhasil dihapus!');
        
    } catch (error) {
        console.error('Error deleting product:', error);
        showError('Gagal menghapus produk: ' + error.message);
    }
}

// ===== UTILITY FUNCTIONS ===== //
function showSuccess(message) {
    // Create success notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function showError(message) {
    // Create error notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    window.location.href = '../index.html';
}