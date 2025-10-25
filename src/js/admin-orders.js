// Fungsi untuk admin mengelola pesanan
const ORDER_SERVICE = 'http://localhost:4003';

let allOrders = [];
let currentFilter = 'all';

// Jalankan kode pas halaman udah loaded
document.addEventListener('DOMContentLoaded', () => {
    loadOrders();
    setupEventListeners();
});

// Setup event listener untuk semua tombol
function setupEventListeners() {
    // Tombol refresh
    document.getElementById('refresh-orders-btn').addEventListener('click', loadOrders);
    
    // Tombol filter
    document.getElementById('filter-pending-btn').addEventListener('click', () => {
        currentFilter = 'pending';
        filterOrders();
    });
    
    document.getElementById('filter-all-btn').addEventListener('click', () => {
        currentFilter = 'all';
        filterOrders();
    });
    
    // Modal status
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
        showMessage('Gagal memuat pesanan. Pastikan Order Service berjalan.', 'error');
    }
}

function updateStats() {
    const stats = {
        pending: 0,
        processing: 0,
        shipped: 0,
        delivered: 0
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
                <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                    ${currentFilter === 'all' ? 'Tidak ada pesanan' : `Tidak ada pesanan dengan status ${currentFilter}`}
                </td>
            </tr>
        `;
        return;
    }
    
    orders.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                #${order._id.slice(-8)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                User ID: ${order.userId.slice(-8)}
            </td>
            <td class="px-6 py-4 text-sm text-gray-900">
                ${order.items.length} item(s)
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                Rp ${order.total.toLocaleString()}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(order.status)}">
                    ${getStatusText(order.status)}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${new Date(order.createdAt).toLocaleDateString()}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="openStatusModal('${order._id}', '${order.status}')" 
                        class="text-[#DC9C84] hover:text-[#93392C] transition">
                    Update Status
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function getStatusBadgeClass(status) {
    const classes = {
        pending: 'bg-yellow-100 text-yellow-800',
        processing: 'bg-blue-100 text-blue-800',
        shipped: 'bg-purple-100 text-purple-800',
        delivered: 'bg-green-100 text-green-800',
        cancelled: 'bg-red-100 text-red-800'
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
        
        updateStats();
        filterOrders();
        closeStatusModal();
        
        showMessage(`Status pesanan berhasil diubah menjadi ${getStatusText(newStatus)}`, 'success');
        
    } catch (error) {
        console.error('Error updating order status:', error);
        showMessage('Gagal mengupdate status pesanan', 'error');
    }
}

// Make functions globally available
window.openStatusModal = openStatusModal;
