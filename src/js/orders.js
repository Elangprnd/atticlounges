// ===== ORDERS PAGE FUNCTIONALITY ===== //

// ===== CART FUNCTIONS ===== //
function getCart() {
  const userId = getCurrentUserId();
  const cartKey = userId ? `cart_${userId}` : 'cart_guest';
  return JSON.parse(localStorage.getItem(cartKey)) || [];
}

// Get current user ID from token
function getCurrentUserId() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.id || null;
}

function updateCartCount() {
  const cart = getCart();
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  
  const cartCounts = document.querySelectorAll('#cart-count, #cart-count-user');
  cartCounts.forEach(countEl => {
    if (totalItems > 0) {
      countEl.textContent = totalItems;
      countEl.classList.remove('hidden');
    } else {
      countEl.classList.add('hidden');
    }
  });
}

// ===== STATUS COLOR HELPER ===== //
function getStatusColor(status) {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'text-yellow-600 bg-yellow-100';
    case 'processing':
      return 'text-blue-600 bg-blue-100';
    case 'shipped':
      return 'text-purple-600 bg-purple-100';
    case 'delivered':
    case 'completed':
      return 'text-green-600 bg-green-100';
    case 'cancelled':
    case 'canceled':
      return 'text-red-600 bg-red-100';
    case 'refunded':
      return 'text-orange-600 bg-orange-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

// ===== RENDER ORDERS ===== //
async function renderOrders() {
  const container = document.getElementById("orders-container");
  const noOrdersMessage = document.getElementById("no-orders");
  if (!container || !noOrdersMessage) return;

  container.innerHTML = "";
  let orders = [];

  try {
    // Always try to fetch orders from Order Service first
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    console.log('Debug - Token exists:', !!token);
    console.log('Debug - User data:', user);
    console.log('Debug - User ID:', user.id);
    
    if (!token) {
      throw new Error('No authentication token found - please login first');
    }
    
    const response = await fetch('http://localhost:4003/api/orders', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      orders = await response.json();
      console.log('✅ Fetched orders from backend:', orders.length, 'orders');
    } else {
      const errorData = await response.json();
      console.error('❌ API Error:', errorData);
      throw new Error(errorData.message || 'Failed to fetch orders from backend');
    }
  } catch (error) {
    console.warn('⚠️ Order service not available, using local storage:', error);
    // Fallback to localStorage (per user)
    const userId = getCurrentUserId();
    const ordersKey = userId ? `orders_${userId}` : 'orders_guest';
    orders = JSON.parse(localStorage.getItem(ordersKey)) || [];
    console.log('📦 Using local storage orders:', orders.length, 'orders');
  }

  if (orders.length === 0) {
    noOrdersMessage.classList.remove('hidden');
    return;
  }

  noOrdersMessage.classList.add('hidden');

  orders.forEach(order => {
    const orderDiv = document.createElement("div");
    orderDiv.className = "bg-white rounded-xl shadow-sm p-6 mb-6";
    orderDiv.innerHTML = `
      <div class="flex justify-between items-center mb-4 border-b pb-3">
        <h3 class="text-xl font-semibold text-gray-800">Order ID: ${order.orderId}</h3>
        <span class="text-sm font-medium ${getStatusColor(order.status)} px-3 py-1 rounded-full">
          ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </span>
      </div>
      <p class="text-gray-600 mb-2">Order Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
      <p class="text-gray-600 mb-4">Total Amount: Rp ${order.total.toLocaleString("id-ID")}</p>
      
      <h4 class="font-semibold text-gray-800 mb-3">Items:</h4>
      <div class="space-y-3 mb-4">
        ${order.items.map(item => `
          <div class="flex items-center gap-3">
            <img src="${item.image || item.imageUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAzNkMzMC42MjcgMzYgMzYgMzAuNjI3IDM2IDI0QzM2IDE3LjM3MyAzMC42MjcgMTIgMjQgMTJDMTcuMzczIDEyIDEyIDE3LjM3MyAxMiAyNEMxMiAzMC42MjcgMTcuMzczIDM2IDI0IDM2WiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNMjQgMjhDMjUuMTA0NiAyOCAyNiAyNy4xMDQ2IDI2IDI2QzI2IDI0Ljg5NTQgMjUuMTA0NiAyNCAyNCAyNEMyMi44OTU0IDI0IDIyIDI0Ljg5NTQgMjIgMjZDMjIgMjcuMTA0NiAyMi44OTU0IDI4IDI0IDI4WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+'}" alt="${item.name}" class="w-12 h-12 object-cover rounded-lg">
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-800">${item.name}</p>
              <p class="text-xs text-gray-500">Qty: ${item.qty || item.quantity || 1} × Rp ${item.price.toLocaleString("id-ID")}</p>
            </div>
          </div>
        `).join('')}
      </div>

      <h4 class="font-semibold text-gray-800 mt-4 mb-3">Payment Method:</h4>
      <p class="text-gray-700">${order.payment ? order.payment.replace(/-/g, ' ').toUpperCase() : 'Not specified'}</p>
    `;
    container.appendChild(orderDiv);
  });
}

// ===== INITIALIZE ORDERS PAGE ===== //
document.addEventListener("DOMContentLoaded", () => {
  renderOrders();
  updateCartCount();
});
