// ===== CHECKOUT FUNCTIONALITY ===== //

let checkoutItems = [];

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

// ===== LOAD CHECKOUT ITEMS ===== //
function loadCheckoutItems() {
  const root = document.getElementById('checkout-root');

  // Get items from localStorage (selected from cart)
  checkoutItems = JSON.parse(localStorage.getItem("checkoutItems")) || [];
  
  if (!root) return;
  root.innerHTML = '';

  if (checkoutItems.length === 0) {
    root.innerHTML = `
      <div class="text-center py-8">
        <p class="text-gray-500 text-lg mb-4">No items in your order</p>
        <a href="product.html" class="inline-block px-6 py-2 bg-[#DC9C84] text-white rounded-lg hover:bg-[#93392C] transition">Continue Shopping</a>
      </div>`;
    return;
  }

  // Build layout
  root.innerHTML = `
    <div class="max-w-5xl mx-auto px-6">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div class="space-y-6">
        <div class="bg-white rounded-xl shadow-sm p-6">
          <h2 class="text-xl font-semibold text-gray-800 mb-4">Alamat Pengiriman</h2>
          <div id="address-selection" class="space-y-3">
            <!-- Address options will be loaded here -->
          </div>
          <div class="mt-4">
            <button id="add-new-address" class="text-[#DC9C84] hover:text-[#93392C] text-sm font-medium">+ Tambah Alamat Baru</button>
          </div>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-6">
          <h2 class="text-xl font-semibold text-gray-800 mb-4">Shipping Method</h2>
          <div class="space-y-3">
            <label class="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"><input type="radio" name="shipping" value="standard" data-cost="10000" class="mr-3" checked><span>Standard (Rp 10.000)</span></label>
            <label class="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"><input type="radio" name="shipping" value="express" data-cost="20000" class="mr-3"><span>Express (Rp 20.000)</span></label>
          </div>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-6">
          <h2 class="text-xl font-semibold text-gray-800 mb-4">Payment Method</h2>
          <div class="space-y-3">
            <label class="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"><input type="radio" name="payment" value="bank-transfer" class="mr-3" checked><span>Bank Transfer</span></label>
            <label class="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"><input type="radio" name="payment" value="cod" class="mr-3"><span>Cash on Delivery (COD)</span></label>
            <label class="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"><input type="radio" name="payment" value="ovo" class="mr-3"><span>OVO</span></label>
            <label class="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"><input type="radio" name="payment" value="dana" class="mr-3"><span>DANA</span></label>
          </div>
        </div>
        </div>
        <div class="space-y-6">
        <div class="bg-white rounded-xl shadow-sm p-6">
          <h2 class="text-xl font-semibold text-gray-800 mb-4">Order Summary</h2>
          <div id="checkout-items" class="space-y-4"></div>
        </div>
        <div class="bg-white rounded-xl shadow-sm p-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">Order Total</h3>
          <div class="space-y-2">
            <div class="flex justify-between text-gray-600"><span>Subtotal</span><span id="subtotal">Rp 0</span></div>
            <div class="flex justify-between text-gray-600"><span>Shipping</span><span id="shipping">Rp 10,000</span></div>
            <div class="flex justify-between text-gray-600"><span>Tax</span><span id="tax">Rp 0</span></div>
            <hr class="my-2">
            <div class="flex justify-between text-lg font-bold text-gray-900"><span>Total</span><span id="total">Rp 0</span></div>
          </div>
        </div>
        <button id="place-order-btn" class="w-full px-6 py-3 bg-[#DC9C84] text-white rounded-lg hover:bg-[#93392C] font-semibold shadow-md transition">Place Order</button>
        </div>
      </div>
    </div>
  `;

  // Load addresses
  loadAddressesForCheckout();

  // fill items and totals
  const itemsEl = document.getElementById('checkout-items');
  let subtotal = 0;
  checkoutItems.forEach(item => {
    const itemTotal = item.price * item.qty;
    subtotal += itemTotal;
    const row = document.createElement('div');
    row.className = 'flex items-center gap-4 py-4 border-b border-gray-200 last:border-b-0';
    row.innerHTML = `
      <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded-lg" />
      <div class="flex-1">
        <h3 class="font-semibold text-gray-800 mb-1">${item.name}</h3>
        <p class="text-sm text-gray-500 mb-1">${item.category}</p>
        <div class="flex items-center justify-between mt-2">
          <span class="text-sm text-gray-500">Qty: ${item.qty}</span>
          <span class="font-semibold text-gray-800">Rp ${itemTotal.toLocaleString('id-ID')}</span>
        </div>
      </div>`;
    itemsEl.appendChild(row);
  });
  const getShippingCost = () => {
    const checked = document.querySelector('input[name="shipping"]:checked');
    return checked ? parseInt(checked.dataset.cost) : 10000;
  };
  const recalcTotals = () => {
    const shippingCost = getShippingCost();
    const tax = Math.round(subtotal * 0.1);
    const total = subtotal + shippingCost + tax;
    document.getElementById('subtotal').textContent = `Rp ${subtotal.toLocaleString('id-ID')}`;
    document.getElementById('shipping').textContent = `Rp ${shippingCost.toLocaleString('id-ID')}`;
    document.getElementById('tax').textContent = `Rp ${tax.toLocaleString('id-ID')}`;
    document.getElementById('total').textContent = `Rp ${total.toLocaleString('id-ID')}`;
  };
  recalcTotals();

  // listen shipping change
  document.querySelectorAll('input[name="shipping"]').forEach(r => {
    r.addEventListener('change', recalcTotals);
  });

  // Add event listener for "add new address" button
  document.getElementById('add-new-address')?.addEventListener('click', () => {
    window.location.href = 'profile.html';
  });
}

// ===== ADDRESS LOADING AND VALIDATION ===== //
function loadAddressesForCheckout() {
  const userId = getCurrentUserId();
  const addressesKey = userId ? `addresses_${userId}` : 'addresses_guest';
  const addresses = JSON.parse(localStorage.getItem(addressesKey) || '[]');
  const addressSelection = document.getElementById('address-selection');
  
  if (!addressSelection) return;
  
  if (addresses.length === 0) {
    addressSelection.innerHTML = `
      <div class="p-4 border-2 border-red-300 border-dashed rounded-lg bg-red-50">
        <div class="text-center">
          <svg class="w-8 h-8 text-red-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
          </svg>
          <p class="text-sm text-red-600 font-medium">Tidak ada alamat tersedia</p>
          <p class="text-xs text-red-500 mt-1">Silakan tambahkan alamat terlebih dahulu</p>
        </div>
      </div>
    `;
    return;
  }
  
  addressSelection.innerHTML = addresses.map((address, index) => `
    <label class="flex items-start p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 address-option">
      <input type="radio" name="address" value="${index}" class="mt-1 mr-3" ${index === 0 ? 'checked' : ''}>
      <div class="flex-1">
        <div class="font-medium text-gray-900">${address.label || 'Alamat'}</div>
        <div class="text-sm text-gray-600 mt-1">
          <div>${address.name} • ${address.phone}</div>
          <div class="mt-1">${address.address}</div>
          <div>${address.city}, ${address.province} ${address.postalCode}</div>
        </div>
      </div>
    </label>
  `).join('');
  
  // Add event listener for address selection
  addressSelection.querySelectorAll('input[name="address"]').forEach(radio => {
    radio.addEventListener('change', () => {
      // Remove red border from all address options
      addressSelection.querySelectorAll('.address-option').forEach(option => {
        option.classList.remove('border-red-500');
        option.classList.add('border-gray-300');
      });
    });
  });
}

function validateAddressSelection() {
  const selectedAddress = document.querySelector('input[name="address"]:checked');
  const addressSelection = document.getElementById('address-selection');
  
  if (!selectedAddress) {
    // Add red border to address selection container
    if (addressSelection) {
      addressSelection.classList.add('border-red-500');
      addressSelection.classList.remove('border-gray-300');
    }
    return false;
  }
  
  // Remove red border if address is selected
  if (addressSelection) {
    addressSelection.classList.remove('border-red-500');
    addressSelection.classList.add('border-gray-300');
  }
  
  return true;
}

// ===== ADDRESS VALIDATION ===== //
function checkUserHasAddress() {
  const userId = getCurrentUserId();
  if (!userId) {
    // For guest users, we might allow checkout without address
    return true;
  }
  
  const addressesKey = `addresses_${userId}`;
  const addresses = JSON.parse(localStorage.getItem(addressesKey) || '[]');
  return addresses.length > 0;
}

function showAddressRequiredModal() {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4';
  modal.innerHTML = `
    <div class="bg-white rounded-xl shadow-xl w-full max-w-sm mx-auto">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900">Alamat Diperlukan</h3>
        <p class="text-sm text-gray-600 mt-1">Anda harus menambahkan alamat di profil sebelum dapat melakukan checkout.</p>
      </div>
      <div class="p-6">
        <div class="flex items-center gap-3 mb-4 p-3 bg-pending text-status-white border border-gray-200 rounded-lg">
          <svg class="w-5 h-5 text-status-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
          </svg>
          <p class="text-sm text-status-white">Silakan tambahkan alamat pengiriman di halaman profil Anda terlebih dahulu.</p>
        </div>
        <div class="flex justify-end gap-3">
          <button id="cancel-checkout" class="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100 text-gray-700">Batal</button>
          <button id="go-to-profile" class="px-4 py-2 rounded-md bg-[#DC9C84] text-white hover:bg-[#93392C]">Ke Profil</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Event listeners
  document.getElementById('cancel-checkout').addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  document.getElementById('go-to-profile').addEventListener('click', () => {
    document.body.removeChild(modal);
    window.location.href = 'profile.html';
  });
}

// ===== PLACE ORDER ===== //
async function placeOrder() {
  if (checkoutItems.length === 0) {
    alert('Your cart is empty!');
    return;
  }

  // Validate address selection
  if (!validateAddressSelection()) {
    // Show error message
    const addressSelection = document.getElementById('address-selection');
    if (addressSelection) {
      addressSelection.classList.add('border-red-500');
      addressSelection.classList.remove('border-gray-300');
    }
    
    // Show notification
    showAddressRequiredModal();
    return;
  }

  // Get form data
  const userId = getCurrentUserId();
  const orderData = {
    userId: userId, // Add userId for multi-user system
    items: checkoutItems,
    shipping: {
      method: (document.querySelector('input[name="shipping"]:checked')?.value) || 'standard'
    },
    payment: document.querySelector('input[name="payment"]:checked').value,
    orderDate: new Date().toISOString(),
    orderId: 'ORD-' + Date.now(),
    status: 'pending'
  };

  // Calculate totals
  const subtotal = checkoutItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const shipping = parseInt(document.querySelector('input[name="shipping"]:checked')?.dataset.cost || '10000');
  const tax = Math.round(subtotal * 0.1);
  const total = subtotal + shipping + tax;

  orderData.totals = {
    subtotal,
    shipping,
    tax,
    total
  };

  try {
    // Try to send order to Order Service
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:4003/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify(orderData)
    });

    if (response.ok) {
      const savedOrder = await response.json();
      console.log('Order saved to backend:', savedOrder);
    } else {
      console.warn('Failed to save order to backend, saving locally');
    }
  } catch (error) {
    console.warn('Order service not available, saving locally:', error);
  }

  // Always save to localStorage as backup (per user)
  const ordersKey = userId ? `orders_${userId}` : 'orders_guest';
  const orders = JSON.parse(localStorage.getItem(ordersKey)) || [];
  orders.push(orderData);
  localStorage.setItem(ordersKey, JSON.stringify(orders));

  // Remove only checked out items from cart, keep remaining items
  const cartKey = userId ? `cart_${userId}` : 'cart_guest';
  const currentCart = JSON.parse(localStorage.getItem(cartKey)) || [];
  
  // Get IDs of items that were checked out
  const checkedOutIds = checkoutItems.map(item => item._id || item.id || item.productId);
  
  // Filter out checked out items from cart
  const remainingCart = currentCart.filter(item => {
    const itemId = item._id || item.id || item.productId;
    return !checkedOutIds.includes(itemId);
  });
  
  // Save remaining cart items
  localStorage.setItem(cartKey, JSON.stringify(remainingCart));
  localStorage.removeItem('checkoutItems');

  // Show success message
  alert(`Order placed successfully!\nOrder ID: ${orderData.orderId}\nTotal: Rp ${total.toLocaleString('id-ID')}\n\nYou will receive a confirmation email shortly.`);

  // Redirect to orders page or home
  window.location.href = 'orders.html';
}

// ===== INITIALIZE CHECKOUT PAGE ===== //
document.addEventListener("DOMContentLoaded", () => {
  loadCheckoutItems();
  updateCartCount();

  // Place order button
  document.getElementById("place-order-btn")?.addEventListener("click", placeOrder);
  
  // Initialize search overlay for checkout page
  if (typeof initializeSearchOverlay === 'function') {
    initializeSearchOverlay();
  }
});