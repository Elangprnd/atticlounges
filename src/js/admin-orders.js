// ===== ADMIN ORDER MANAGEMENT ===== //
const ORDER_SERVICE = 'http://localhost:4003';

let allOrders = [];
let currentFilter = 'all';

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    loadOrders();
    setupEventListeners();
    
    // Initialize search overlay for admin orders page
    if (typeof initializeSearchOverlay === 'function') {
        initializeSearchOverlay();
    }
});

function setupEventListeners() {
    // Filter buttons
    document.getElementById('filter-all-btn').addEventListener('click', () => {
        currentFilter = 'all';
        filterOrders();
    });
    
    document.getElementById('filter-pending-btn').addEventListener('click', () => {
        currentFilter = 'pending';
        filterOrders();
    });
    
    document.getElementById('filter-processing-btn').addEventListener('click', () => {
        currentFilter = 'processing';
        filterOrders();
    });
    
    document.getElementById('filter-shipped-btn').addEventListener('click', () => {
        currentFilter = 'shipped';
        filterOrders();
    });
    
    document.getElementById('filter-delivered-btn').addEventListener('click', () => {
        currentFilter = 'delivered';
        filterOrders();
    });
    
    document.getElementById('filter-cancelled-btn').addEventListener('click', () => {
        currentFilter = 'cancelled';
        filterOrders();
    });
    
    // Status modal
    document.getElementById('close-status-modal').addEventListener('click', closeStatusModal);
    document.getElementById('cancel-status').addEventListener('click', closeStatusModal);
    document.getElementById('update-status').addEventListener('click', updateOrderStatus);
    
    // Close modal on outside click
    document.getElementById('status-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('status-modal')) {
            closeStatusModal();
        }
    });
}

async function loadOrders() {
    try {
        const response = await fetch(`${ORDER_SERVICE}/api/admin/orders`);
        if (!response.ok) throw new Error('Failed to fetch orders');
        
        allOrders = await response.json();
        updateStats();
        filterOrders();
        
    } catch (error) {
        console.error('Error loading orders:', error);
        console.log('Order Service tidak berjalan, mencoba load dari localStorage...');
        
        // Try to load from localStorage as fallback
        loadOrdersFromLocalStorage();
    }
}

function loadOrdersFromLocalStorage() {
    // Get all orders from localStorage (from all users)
    allOrders = [];
    
    // Get all localStorage keys that start with 'orders_'
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('orders_')) {
            const userOrders = JSON.parse(localStorage.getItem(key) || '[]');
            allOrders = allOrders.concat(userOrders);
        }
    }
    
    if (allOrders.length > 0) {
        updateStats();
        filterOrders();
        showMessage(`Memuat ${allOrders.length} pesanan dari localStorage. Pastikan Order Service berjalan untuk data real.`, 'info');
    } else {
        showMessage('Tidak ada data pesanan. Pastikan Order Service berjalan atau ada pesanan di localStorage.', 'error');
    }
}

function updateStats() {
    const stats = {
        pending: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0
    };
    
    allOrders.forEach(order => {
        if (stats.hasOwnProperty(order.status)) {
            stats[order.status]++;
        }
    });
    
    document.getElementById('pending-count').textContent = stats.pending;
    document.getElementById('processing-count').textContent = stats.processing;
    document.getElementById('shipped-count').textContent = stats.shipped;
    document.getElementById('delivered-count').textContent = stats.delivered;
    document.getElementById('cancelled-count').textContent = stats.cancelled;
}

function filterOrders() {
    let filteredOrders = allOrders;
    
    if (currentFilter !== 'all') {
        filteredOrders = allOrders.filter(order => order.status === currentFilter);
    }
    
    renderOrdersTable(filteredOrders);
}

function renderOrdersTable(orders) {
    const tbody = document.getElementById('orders-table-body');
    tbody.innerHTML = '';
    
    if (orders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="px-6 py-4 text-center text-gray-500">
                    ${currentFilter === 'all' ? 'Tidak ada pesanan' : `Tidak ada pesanan dengan status ${currentFilter}`}
                </td>
            </tr>
        `;
        return;
    }
    
    orders.forEach(order => {
        const row = document.createElement('tr');
        // Generate images for all items - Simple approach
        const generateItemImages = (items) => {
            console.log('Generating images for items:', items);
            
            if (!items || items.length === 0) {
                return '<img src="https://via.placeholder.com/60x60/cccccc/666666?text=IMG" alt="No Image" class="w-12 h-12 object-cover rounded-lg mx-auto" onerror="this.src=\'https://via.placeholder.com/60x60/cccccc/666666?text=IMG\'">';
            }
            
            if (items.length === 1) {
                const item = items[0];
                const imageUrl = item.image || item.imageUrl || 'https://via.placeholder.com/60x60/cccccc/666666?text=IMG';
                console.log('Single item image:', imageUrl);
                return `<img src="${imageUrl}" alt="Product Image" class="w-12 h-12 object-cover rounded-lg mx-auto" onerror="this.src='https://via.placeholder.com/60x60/cccccc/666666?text=IMG'">`;
            }
            
            // Multiple items - show horizontally
            console.log('Multiple items detected:', items.length);
            let imagesHtml = '<div class="flex gap-1 justify-center">';
            const maxImages = Math.min(items.length, 4);
            
            for (let i = 0; i < maxImages; i++) {
                const item = items[i];
                const imageUrl = item.image || item.imageUrl || 'https://via.placeholder.com/60x60/cccccc/666666?text=IMG';
                console.log(`Item ${i + 1} image:`, imageUrl);
                
                imagesHtml += `
                    <img src="${imageUrl}" 
                         alt="Product ${i + 1}" 
                         class="w-8 h-8 object-cover rounded" 
                         onerror="this.src='https://via.placeholder.com/60x60/cccccc/666666?text=IMG'">
                `;
            }
            
            // If more than 4 items, show a "+" indicator
            if (items.length > 4) {
                imagesHtml += `
                    <div class="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-xs font-bold text-gray-600">
                        +${items.length - 4}
                    </div>
                `;
            }
            
            imagesHtml += '</div>';
            console.log('Generated HTML:', imagesHtml);
            return imagesHtml;
        };
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                #${order._id.slice(-8)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                User ID: ${order.userId.slice(-8)}
            </td>
            <td class="px-6 py-4 text-sm text-gray-900 text-center">
                ${order.items.length} item(s)
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-center">
                ${generateItemImages(order.items)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                Rp ${order.total.toLocaleString()}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-center">
                <span class="inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(order.status)}">
                    ${getStatusText(order.status)}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                ${new Date(order.createdAt).toLocaleDateString()}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                ${order.status === 'cancelled' || order.status === 'delivered'
                    ? '<span class="text-gray-400 text-sm">Final Status</span>' 
                    : `<button onclick="openStatusModal('${order._id}', '${order.status}')" 
                        class="text-[#DC9C84] hover:text-[#93392C] transition">
                        Update Status
                    </button>`
                }
            </td>
        `;
        tbody.appendChild(row);
    });
}

function getStatusBadgeClass(status) {
    const classes = {
        pending: 'bg-white border border-pending text-pending',
        processing: 'bg-white border border-processing text-processing',
        shipped: 'bg-white border border-shipped text-shipped',
        delivered: 'bg-white border border-delivered text-delivered',
        cancelled: 'bg-white border border-cancelled text-cancelled'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
}

function getStatusText(status) {
    const texts = {
        pending: 'Pending',
        processing: 'Processing',
        shipped: 'Shipped',
        delivered: 'Delivered',
        cancelled: 'Cancelled'
    };
    return texts[status] || status;
}

function openStatusModal(orderId, currentStatus) {
    document.getElementById('modal-order-id').value = orderId;
    document.getElementById('new-status').value = currentStatus;
    document.getElementById('status-modal').classList.remove('hidden');
}

function closeStatusModal() {
    document.getElementById('status-modal').classList.add('hidden');
}

async function updateOrderStatus() {
    const orderId = document.getElementById('modal-order-id').value;
    const newStatus = document.getElementById('new-status').value;
    
    if (!orderId || !newStatus) {
        showMessage('Data tidak lengkap', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${ORDER_SERVICE}/api/admin/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update status');
        }
        
        const updatedOrder = await response.json();
        
        // Update local data
        const orderIndex = allOrders.findIndex(order => order._id === orderId);
        if (orderIndex !== -1) {
            allOrders[orderIndex] = updatedOrder;
        }
        
        // If status is delivered, mark products as sold
        if (newStatus === 'delivered') {
            markProductsAsSold(updatedOrder);
        }
        
        updateStats();
        filterOrders();
        closeStatusModal();
        
        showMessage(`Status pesanan berhasil diubah menjadi ${getStatusText(newStatus)}`, 'success');
        
    } catch (error) {
        console.error('Error updating order status:', error);
        showMessage('Gagal mengupdate status pesanan', 'error');
    }
}

// Mark products as sold when order status is delivered
function markProductsAsSold(order) {
    try {
        if (!order.items || order.items.length === 0) return;
        
        console.log('Marking products as sold for delivered order:', order._id);
        
        // Update each product in the order
        order.items.forEach(item => {
            if (item.productId) {
                // Update product in localStorage if it exists
                const productKey = `product_${item.productId}`;
                const existingProduct = localStorage.getItem(productKey);
                
                if (existingProduct) {
                    const product = JSON.parse(existingProduct);
                    product.isSold = true;
                    product.soldTo = order.userId;
                    product.soldAt = new Date().toISOString();
                    product.orderId = order._id;
                    localStorage.setItem(productKey, JSON.stringify(product));
                    console.log(`Product ${item.productId} marked as sold`);
                }
            }
        });
        
        // Also update the order itself to mark as delivered
        const orderKey = `order_${order._id}`;
        localStorage.setItem(orderKey, JSON.stringify({
            ...order,
            status: 'delivered',
            deliveredAt: new Date().toISOString()
        }));
        
        // Refresh product list if we're on a product page
        if (typeof renderProducts === 'function' && typeof fetchProducts === 'function') {
            setTimeout(() => {
                fetchProducts().then(products => {
                    renderProducts(products);
                });
            }, 100);
        }
        
        showMessage('Produk telah ditandai sebagai terjual (stock = 0)', 'info');
        
    } catch (error) {
        console.error('Error marking products as sold:', error);
    }
}

// Simple message function
function showMessage(message, type = 'info') {
    // Create a simple alert for now
    alert(message);
}

// Make functions globally available
window.openStatusModal = openStatusModal;
