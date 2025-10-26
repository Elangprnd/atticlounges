// ===== CART FUNCTIONALITY ===== //

// ===== CART FUNCTIONS ===== //
function getCart() {
  const userId = getCurrentUserId();
  const cartKey = userId ? `cart_${userId}` : 'cart_guest';
  return JSON.parse(localStorage.getItem(cartKey)) || [];
}

function saveCart(cart) {
  const userId = getCurrentUserId();
  const cartKey = userId ? `cart_${userId}` : 'cart_guest';
  localStorage.setItem(cartKey, JSON.stringify(cart));
  updateCartCount();
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

// ===== RENDER CART (new layout) ===== //
function renderCart() {
  const itemsContainer = document.getElementById('cart-items');
  const emptyEl = document.getElementById('empty-cart');
  const summaryEl = document.getElementById('cart-summary');
  if (!itemsContainer) return;

  itemsContainer.innerHTML = '';
  const cart = getCart();

  if (cart.length === 0) {
    itemsContainer.classList.add('hidden');
    summaryEl?.classList.add('hidden');
    emptyEl?.classList.remove('hidden');
    return;
  }

  emptyEl?.classList.add('hidden');
  itemsContainer.classList.remove('hidden');
  summaryEl?.classList.remove('hidden');

  cart.forEach((item, index) => {
    const itemTotal = item.price * item.qty;
    const row = document.createElement('div');
    row.className = 'cart-item flex justify-between items-center border-b border-gray-200 pb-4';
    row.setAttribute('data-item-id', item._id || item.id || index);
    row.innerHTML = `
      <div class="flex items-center space-x-4">
        <input type="checkbox" class="select-item w-5 h-5 text-[#DC9C84] rounded" data-index="${index}" />
        <div class="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
          <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover" />
        </div>
        <div>
          <p class="font-semibold text-gray-800">${item.name}</p>
          <p class="text-sm text-gray-500">${formatPrice(item.price)}</p>
        </div>
      </div>
      <div class="flex items-center space-x-4">
        <button class="delete-btn text-red-500 hover:text-red-600 text-sm font-medium" data-index="${index}">Hapus</button>
      </div>
    `;
    itemsContainer.appendChild(row);
  });

  // bind
  addCartEventListeners();
  updateSelectedSummary();
}

function formatPrice(value) {
  return 'Rp ' + Number(value || 0).toLocaleString('id-ID');
}

// ===== ADD CART EVENT LISTENERS ===== //
function addCartEventListeners() {
  // Quantity controls removed - thrift store only allows 1 item per product

  // Delete individual items
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const index = parseInt(e.target.dataset.index);
      let cart = getCart();
      cart.splice(index, 1);
      saveCart(cart);
      renderCart();
    });
  });

  // Selection
  document.querySelectorAll('.select-item').forEach(cb => {
    cb.addEventListener('change', updateSelectedSummary);
  });
}

function getSelectedIndexes() {
  return Array.from(document.querySelectorAll('.select-item:checked')).map(cb => parseInt(cb.dataset.index));
}

function getSelectedItems() {
  const cart = getCart();
  const indexes = getSelectedIndexes();
  return cart.filter((_, i) => indexes.includes(i));
}

function updateSelectedSummary() {
  const selected = getSelectedItems();
  const itemCount = selected.reduce((sum, it) => sum + it.qty, 0);
  const subtotal = selected.reduce((sum, it) => sum + it.price * it.qty, 0);
  const summaryCount = document.getElementById('summary-item-count');
  const subtotalEl = document.getElementById('subtotal');
  const totalEl = document.getElementById('total-price');
  if (summaryCount) summaryCount.textContent = itemCount;
  if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
  if (totalEl) totalEl.textContent = formatPrice(subtotal);
}

// ===== INITIALIZE CART PAGE ===== //
document.addEventListener("DOMContentLoaded", () => {
  renderCart();
  updateCartCount();

  // Delete selected items
  document.getElementById("delete-selected")?.addEventListener("click", () => {
    let cart = getCart();
    const indexes = getSelectedIndexes();
    if (indexes.length === 0) {
      alert("Please select items to delete");
      return;
    }
    if (confirm(`Are you sure you want to delete ${indexes.length} selected item(s)?`)) {
      cart = cart.filter((_, i) => !indexes.includes(i));
      saveCart(cart);
      renderCart();
    }
  });

  // Checkout only selected
  document.getElementById("checkout")?.addEventListener("click", () => {
    const selected = getSelectedItems();
    if (selected.length === 0) {
      alert('Please select at least one item.');
      return;
    }
    localStorage.setItem('checkoutItems', JSON.stringify(selected));
    window.location.href = 'payment.html';
  });
});