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
  
  // Debug logging to help identify the issue
  console.log('Cart items:', cart);
  console.log('Cart length:', cart.length);
  console.log('Total items (sum of qty):', totalItems);
  
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

  // Debug logging for cart rendering
  console.log('Rendering cart with items:', cart);
  console.log('Cart length for rendering:', cart.length);

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
    row.className = 'cart-item border-b border-gray-200 py-3';
    row.setAttribute('data-item-id', item._id || item.id || index);
    row.innerHTML = `
      <div class="flex items-start gap-3">
        <input type="checkbox"
          class="select-item mt-1 w-5 h-5 text-[#DC9C84] border-gray-300 focus:ring-[#DC9C84] flex-shrink-0"
          data-index="${index}" />

        <div class="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 cursor-pointer hover:bg-gray-200 transition-colors"
          data-index="${index}">
          <img src="${item.image}"
            alt="${item.name}"
            class="w-full h-full object-cover" />
        </div>

        <div class="flex-1 min-w-0 cursor-pointer hover:bg-gray-50 p-2 -m-2 rounded transition-colors" data-index="${index}">
          <p class="font-medium text-gray-800 leading-tight line-clamp-2 text-base sm:text-lg">${item.name}</p>
          <p class="text-gray-700 mt-1 font-semibold text-base sm:text-lg">${formatPrice(item.price)}</p>
        </div>

        <button class="delete-btn hidden sm:inline text-red-500 hover:text-red-600 text-xs sm:text-sm font-medium transition-colors flex-shrink-0"
          data-index="${index}">
          Hapus
        </button>
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

  // Click on product area to toggle selection
  document.querySelectorAll('[data-index]').forEach(element => {
    // Skip if it's the checkbox itself or delete button
    if (element.classList.contains('select-item') || element.classList.contains('delete-btn')) {
      return;
    }
    
    element.addEventListener('click', (e) => {
      // Prevent event bubbling to avoid conflicts
      e.stopPropagation();
      
      const index = parseInt(element.dataset.index);
      const checkbox = document.querySelector(`input[data-index="${index}"]`);
      
      if (checkbox) {
        checkbox.checked = !checkbox.checked;
        updateSelectedSummary();
      }
    });
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
      <div class="px-6 py-4 border-b">
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

// ===== CART DATA CLEANUP ===== //
function cleanupCartData() {
  const cart = getCart();
  console.log('Original cart before cleanup:', cart);
  
  // Remove any items with invalid data
  const cleanedCart = cart.filter(item => {
    return item && 
           item.name && 
           typeof item.price === 'number' && 
           typeof item.qty === 'number' && 
           item.qty > 0;
  });
  
  // For thrift store, each item should have qty = 1
  cleanedCart.forEach(item => {
    item.qty = 1;
  });
  
  console.log('Cleaned cart after cleanup:', cleanedCart);
  
  if (cleanedCart.length !== cart.length) {
    console.log('Cart data was cleaned up, saving changes...');
    saveCart(cleanedCart);
  }
  
  return cleanedCart;
}

// ===== INITIALIZE CART PAGE ===== //
document.addEventListener("DOMContentLoaded", () => {
  // Clean up cart data first
  cleanupCartData();
  
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
    
    // Check if user has address before proceeding to checkout
    if (!checkUserHasAddress()) {
      showAddressRequiredModal();
      return;
    }
    
    localStorage.setItem('checkoutItems', JSON.stringify(selected));
    window.location.href = 'payment.html';
  });
  
  // Initialize search overlay for cart page
  if (typeof initializeSearchOverlay === 'function') {
    initializeSearchOverlay();
  }
});