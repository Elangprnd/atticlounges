// Fungsi untuk checkout

let checkoutItems = [];

// Ambil data keranjang dari localStorage
function getCart() {
  const userId = getCurrentUserId();
  const cartKey = userId ? `cart_${userId}` : 'cart_guest';
  return JSON.parse(localStorage.getItem(cartKey)) || [];
}

// Ambil ID user yang sedang login
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
}

// Address form removed — validation not needed here

// ===== PLACE ORDER ===== //
async function placeOrder() {
  if (checkoutItems.length === 0) {
    alert('Your cart is empty!');
    return;
  }

  // Address form removed; assume profile holds shipping details

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

  // Clear cart using multi-user system
  const cartKey = userId ? `cart_${userId}` : 'cart_guest';
  localStorage.removeItem(cartKey);
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
});