// ===== PROFILE PAGE FUNCTIONALITY ===== //

// ===== CART FUNCTIONS ===== //
function getCurrentUserId() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.id || null;
}

function getCart() {
  const userId = getCurrentUserId();
  const cartKey = userId ? `cart_${userId}` : 'cart_guest';
  return JSON.parse(localStorage.getItem(cartKey)) || [];
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

// ===== RENDER PROFILE ===== //
async function renderProfile() {
  let user = {
    name: "User",
    email: "user@atticlounges.com",
    phone: "",
    address: "",
    memberSince: new Date().toISOString().split('T')[0]
  };

  try {
    // Try to fetch user data from User Service
    const token = localStorage.getItem('token');
    if (token) {
      const response = await fetch('http://localhost:4001/api/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        // Preserve birthDate from localStorage if backend doesn't have it
        const currentBirthDate = user.birthDate;
        user = { ...user, ...userData };
        if (currentBirthDate && !userData.birthDate) {
          user.birthDate = currentBirthDate;
        }
        console.log('Fetched user data from backend:', user);
      } else {
        console.warn('Failed to fetch user data from backend');
      }
    }
  } catch (error) {
    console.warn('User service not available, using fallback data:', error);
  }

  document.getElementById('profile-name').textContent = user.name;
  document.getElementById('profile-email').textContent = user.email;
  document.getElementById('member-since').textContent = new Date(user.memberSince).toLocaleDateString();
  
  // Display birth date
  const birthDateEl = document.getElementById('profile-birth-date');
  if (birthDateEl) {
    console.log('User birthDate:', user.birthDate); // Debug log
    
    // Check localStorage as fallback if user.birthDate is not available
    let birthDateToShow = user.birthDate;
    if (!birthDateToShow) {
      const localUser = JSON.parse(localStorage.getItem('user') || '{}');
      birthDateToShow = localUser.birthDate;
      console.log('Using localStorage birthDate:', birthDateToShow); // Debug log
    }
    
    if (birthDateToShow) {
      const birthDate = new Date(birthDateToShow);
      console.log('Parsed birthDate:', birthDate); // Debug log
      birthDateEl.textContent = birthDate.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } else {
      birthDateEl.textContent = 'Belum diisi';
    }
  }

  // Prefill account form fields if present
  const fullNameEl = document.getElementById('full-name');
  const emailEl = document.getElementById('email');
  const birthEl = document.getElementById('birth-date');
  if (fullNameEl) fullNameEl.value = user.name || '';
  if (emailEl) emailEl.value = user.email || '';
  if (birthEl && user.birthDate) birthEl.value = user.birthDate;
  
  // Also check localStorage for birthDate as fallback
  if (birthEl && !user.birthDate) {
    const localUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (localUser.birthDate) {
      user.birthDate = localUser.birthDate;
      if (birthEl) birthEl.value = localUser.birthDate;
    }
  }


}

// ===== UTILITY FUNCTIONS ===== //
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function showMessage(message, type) {
  // Remove existing messages
  const existingMessage = document.querySelector('.profile-message');
  if (existingMessage) {
    existingMessage.remove();
  }

  // Create new message
  const messageDiv = document.createElement('div');
  messageDiv.className = `profile-message fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
    type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
  }`;
  messageDiv.textContent = message;
  document.body.appendChild(messageDiv);

  // Auto remove after 3 seconds
  setTimeout(() => {
    if (messageDiv.parentNode) {
      messageDiv.remove();
    }
  }, 3000);
}

// ===== ADMIN ROLE CHECK ===== //
function checkAdminRole() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'owner' || localStorage.getItem('isAdmin') === 'true';
  
  if (isAdmin) {
    // Change orders section title and subtitle for admin
    const ordersTitle = document.getElementById('orders-title');
    const ordersSubtitle = document.getElementById('orders-subtitle');
    const ordersButtonText = document.getElementById('orders-button-text');
    const ordersLink = document.getElementById('orders-link');
    
    if (ordersTitle) ordersTitle.textContent = 'Pesanan User';
    if (ordersSubtitle) ordersSubtitle.textContent = 'Kelola dan lacak pesanan dari semua user';
    if (ordersButtonText) ordersButtonText.textContent = 'Kelola Semua Pesanan';
    
    // Change link destination for admin to go to admin orders page
    if (ordersLink) {
      ordersLink.href = 'admin-orders.html';
    }
    
    // Show recent orders section for admin but with different title
    const recentOrdersSection = document.getElementById('recent-orders-section');
    if (recentOrdersSection) {
      recentOrdersSection.style.display = 'block';
      const recentOrdersTitle = recentOrdersSection.querySelector('h3');
      if (recentOrdersTitle) {
        recentOrdersTitle.textContent = 'Pesanan Terbaru dari User';
      }
    }
    
    // Hide add address button for admin
    const addAddressBtn = document.getElementById('add-address-btn');
    if (addAddressBtn) {
      addAddressBtn.style.display = 'none';
    }
    
    // Change address section title for admin
    const addressTitle = document.querySelector('#address-section h2');
    if (addressTitle) {
      addressTitle.textContent = 'Alamat Gudang / Titik Pengiriman';
    }
    
    const addressSubtitle = document.querySelector('#address-section p');
    if (addressSubtitle) {
      addressSubtitle.textContent = 'Lokasi gudang untuk pengiriman produk';
    }
    
    // Hide address warning for admin
    const addressWarning = document.getElementById('address-warning');
    if (addressWarning) {
      addressWarning.style.display = 'none';
    }
    
    // Replace address list with fixed warehouse address for admin
    const addressList = document.getElementById('address-list');
    if (addressList) {
      addressList.innerHTML = `
        <div class="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
          <div class="text-sm text-gray-800">
            <div class="font-semibold text-gray-900 mb-2">Gudang Utama</div>
            <div class="text-gray-700 space-y-1">
              <div>UPN Veteran Jakarta, Gedung Fakultas Ilmu Komputer</div>
              <div>Jl. RS. Fatmawati Raya No.1, Pondok Labu, Cilandak,</div>
              <div>Jakarta Selatan, DKI Jakarta 12450</div>
            </div>
          </div>
        </div>
      `;
    }
  }
}

// ===== INITIALIZE PROFILE PAGE ===== //
document.addEventListener("DOMContentLoaded", () => {
  renderProfile();
  updateCartCount();
  initAddressBook();
  initAccountForm();
  wireAccountModal();
  
  // Check if user is admin and modify UI accordingly
  checkAdminRole();
  
  // Create sample order for testing if no orders exist FIRST
  createSampleOrderIfNeeded();
  
  // Then load order summary with delay to ensure DOM is ready
  setTimeout(() => {
    loadOrderSummary();
  }, 200);
  
  // Initialize search overlay for profile page
  if (typeof initializeSearchOverlay === 'function') {
    initializeSearchOverlay();
  }
});

function initAccountForm() {
  const form = document.getElementById('account-form');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fullName = document.getElementById('full-name');
    const email = document.getElementById('email');
    const birth = document.getElementById('birth-date');
    const currentPw = document.getElementById('current-password');
    const newPw = document.getElementById('new-password');
    const confirmPw = document.getElementById('confirm-password');

    // Clear previous validation errors
    [fullName, email, currentPw, newPw, confirmPw].forEach(el => {
      if (el) el.classList.remove('border-red-500');
    });

    // Basic validation
    const required = [fullName, email];
    let hasError = false;
    
    for (const el of required) {
      if (!el.value.trim()) {
        el.classList.add('border-red-500');
        hasError = true;
      } else {
        el.classList.remove('border-red-500');
      }
    }
    
    // Email validation
    if (email.value && !isValidEmail(email.value)) {
      email.classList.add('border-red-500');
      hasError = true;
    }
    
    // Password validation
    if (currentPw.value || newPw.value || confirmPw.value) {
      if (!currentPw.value || !newPw.value || newPw.value.length < 6 || newPw.value !== confirmPw.value) {
        newPw.classList.add('border-red-500');
        confirmPw.classList.add('border-red-500');
        hasError = true;
      }
    }
    
    if (hasError) {
      showMessage('Mohon periksa kembali data yang diisi', 'error');
      return;
    }

    // persist to localStorage user object as fallback
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    user.name = fullName.value.trim();
    user.email = email.value.trim();
    
    // Handle birth date - save if filled, remove if empty
    if (birth.value) {
      user.birthDate = birth.value;
    } else {
      delete user.birthDate; // Remove birthDate if field is empty
    }
    
    localStorage.setItem('user', JSON.stringify(user));
    console.log('Updated user data:', user); // Debug log

    // optionally call backend if token exists
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch('http://localhost:4001/api/users/me', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: user.name,
            email: user.email,
            birthDate: user.birthDate,
            ...(newPw.value && currentPw.value ? { currentPassword: currentPw.value, newPassword: newPw.value } : {})
          })
        }).catch(() => {});
      }
    } catch (_) {}

    // refresh UI
    renderProfile();
    closeAccountModal();
    
    // Show success message
    showMessage('Profil berhasil diperbarui!', 'success');
  });
}

function wireAccountModal() {
  const openBtn = document.getElementById('edit-profile-btn');
  const closeBtn = document.getElementById('close-account-modal');
  const cancelBtn = document.getElementById('cancel-account');
  openBtn?.addEventListener('click', () => {
    // prefill from current rendered values if needed
    const name = document.getElementById('profile-name')?.textContent || '';
    const email = document.getElementById('profile-email')?.textContent || '';
    const fullNameEl = document.getElementById('full-name');
    const emailEl = document.getElementById('email');
    const birthEl = document.getElementById('birth-date');
    
    if (fullNameEl) fullNameEl.value = name;
    if (emailEl) emailEl.value = email;
    
    // Prefill birth date from user data
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    console.log('Prefilling form with user data:', user); // Debug log
    if (birthEl && user.birthDate) {
      birthEl.value = user.birthDate;
      console.log('Set birth date field to:', user.birthDate); // Debug log
    }
    
    openAccountModal();
  });
  closeBtn?.addEventListener('click', closeAccountModal);
  cancelBtn?.addEventListener('click', closeAccountModal);
}

function openAccountModal() {
  document.getElementById('account-modal')?.classList.remove('hidden');
}

function closeAccountModal() {
  document.getElementById('account-modal')?.classList.add('hidden');
}

// ===== ADDRESS BOOK (PER-USER, LOCAL STORAGE) ===== //
function getAddressStorageKey() {
  const userId = getCurrentUserId();
  return userId ? `addresses_${userId}` : 'addresses_guest';
}

function loadAddresses() {
  try {
    return JSON.parse(localStorage.getItem(getAddressStorageKey()) || '[]');
  } catch (_) {
    return [];
  }
}

function saveAddresses(addresses) {
  localStorage.setItem(getAddressStorageKey(), JSON.stringify(addresses));
}

function renderAddressList() {
  const list = document.getElementById('address-list');
  const warning = document.getElementById('address-warning');
  if (!list) return;
  
  const addresses = loadAddresses();
  
  // Show/hide warning based on address count
  if (warning) {
    if (addresses.length === 0) {
      warning.classList.remove('hidden');
    } else {
      warning.classList.add('hidden');
    }
  }
  
  if (addresses.length === 0) {
    list.innerHTML = `
      <div class="text-center py-10">
        <p class="text-gray-500 mb-3">Belum ada alamat.</p>
        <button id="add-address-inline" class="bg-[#DC9C84] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#93392C] transition">Tambah Alamat Pertama</button>
      </div>
    `;
    document.getElementById('add-address-inline')?.addEventListener('click', openAddressModal);
    return;
  }

  list.innerHTML = addresses.map((a, idx) => `
    <div class="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
      <div class="flex items-start justify-between">
        <div class="text-sm text-gray-800">
          <div class="font-semibold">${escapeHtml(a.label || '')}</div>
          <div class="text-gray-700">${escapeHtml(a.name || '')} • ${escapeHtml(a.phone || '')}</div>
          <div class="text-gray-700 mt-1">${escapeHtml(a.address || '')}</div>
          <div class="text-gray-700">${escapeHtml(a.city || '')}, ${escapeHtml(a.province || '')} ${escapeHtml(a.postalCode || '')}</div>
        </div>
        <div class="flex items-center gap-2 ml-4">
          <button data-idx="${idx}" class="edit-address px-3 py-1 text-xs rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 transition">Edit</button>
          <button data-idx="${idx}" class="delete-address px-3 py-1 text-xs rounded-md border border-red-300 text-red-600 hover:bg-red-50">Hapus</button>
        </div>
      </div>
    </div>
  `).join('');

  list.querySelectorAll('.edit-address').forEach(btn => btn.addEventListener('click', (e) => {
    const idx = Number(e.currentTarget.getAttribute('data-idx'));
    openAddressModal(idx);
  }));
  list.querySelectorAll('.delete-address').forEach(btn => btn.addEventListener('click', (e) => {
    const idx = Number(e.currentTarget.getAttribute('data-idx'));
    deleteAddress(idx);
  }));
}

function initAddressBook() {
  document.getElementById('add-address-btn')?.addEventListener('click', openAddressModal);
  document.getElementById('close-address-modal')?.addEventListener('click', closeAddressModal);
  document.getElementById('cancel-address')?.addEventListener('click', closeAddressModal);
  const form = document.getElementById('address-form');
  if (form) {
    form.addEventListener('submit', handleAddressSubmit);
  }
  renderAddressList();
}

function openAddressModal(editIndex) {
  const modal = document.getElementById('address-modal');
  if (!modal) return;
  const addresses = loadAddresses();
  const label = document.getElementById('address-label');
  const name = document.getElementById('recipient-name');
  const phone = document.getElementById('recipient-phone');
  const addr = document.getElementById('full-address');
  const city = document.getElementById('city');
  const province = document.getElementById('province');
  const postal = document.getElementById('postal-code');
  const idEl = document.getElementById('address-id');

  if (typeof editIndex === 'number') {
    const a = addresses[editIndex];
    idEl.value = String(editIndex);
    label.value = a?.label || '';
    name.value = a?.name || '';
    phone.value = a?.phone || '';
    addr.value = a?.address || '';
    city.value = a?.city || '';
    province.value = a?.province || '';
    postal.value = a?.postalCode || '';
  } else {
    idEl.value = '';
    label.value = '';
    name.value = '';
    phone.value = '';
    addr.value = '';
    city.value = '';
    province.value = '';
    postal.value = '';
  }

  modal.classList.remove('hidden');
}

function closeAddressModal() {
  document.getElementById('address-modal')?.classList.add('hidden');
}

function handleAddressSubmit(e) {
  e.preventDefault();
  const label = document.getElementById('address-label');
  const name = document.getElementById('recipient-name');
  const phone = document.getElementById('recipient-phone');
  const addr = document.getElementById('full-address');
  const city = document.getElementById('city');
  const province = document.getElementById('province');
  const postal = document.getElementById('postal-code');
  const idEl = document.getElementById('address-id');

  // basic validation
  const required = [label, name, phone, addr, city, province, postal];
  for (const el of required) {
    if (!el.value.trim()) {
      el.classList.add('border-red-500');
      return;
    } else {
      el.classList.remove('border-red-500');
    }
  }

  const addresses = loadAddresses();
  const payload = {
    label: label.value.trim(),
    name: name.value.trim(),
    phone: phone.value.trim(),
    address: addr.value.trim(),
    city: city.value.trim(),
    province: province.value.trim(),
    postalCode: postal.value.trim()
  };

  if (idEl.value !== '') {
    const idx = Number(idEl.value);
    addresses[idx] = payload;
  } else {
    addresses.push(payload);
  }
  saveAddresses(addresses);
  closeAddressModal();
  renderAddressList();
}

function deleteAddress(index) {
  const addresses = loadAddresses();
  if (index < 0 || index >= addresses.length) return;
  addresses.splice(index, 1);
  saveAddresses(addresses);
  renderAddressList();
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ===== LOAD ALL USER ORDERS (FOR ADMIN) ===== //
function loadAllUserOrders() {
  const allOrders = [];
  
  // Get all localStorage keys that start with 'orders_'
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('orders_')) {
      try {
        const userOrders = JSON.parse(localStorage.getItem(key) || '[]');
        allOrders.push(...userOrders);
      } catch (error) {
        console.warn('Error parsing orders for key:', key, error);
      }
    }
  }
  
  // Sort by date (newest first)
  return allOrders.sort((a, b) => {
    const dateA = new Date(a.createdAt || a.orderDate || 0);
    const dateB = new Date(b.createdAt || b.orderDate || 0);
    return dateB - dateA;
  });
}

// ===== ORDER SUMMARY FUNCTIONALITY ===== //
function loadOrderSummary() {
  const userId = getCurrentUserId();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'owner' || localStorage.getItem('isAdmin') === 'true';
  
  console.log('Loading order summary for userId:', userId, 'isAdmin:', isAdmin);
  
  if (!userId) {
    console.log('User not logged in, skipping order summary');
    return;
  }

  let orders = [];
  
  if (isAdmin) {
    // For admin, load orders from all users
    orders = loadAllUserOrders();
  } else {
    // For regular users, load only their orders
    orders = JSON.parse(localStorage.getItem(`orders_${userId}`) || '[]');
  }
  
  console.log('Found orders:', orders);
  
  // Count orders by status
  const counts = {
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0
  };

  orders.forEach(order => {
    switch (order.status) {
      case 'pending':
        counts.pending++;
        break;
      case 'processing':
        counts.processing++;
        break;
      case 'shipped':
        counts.shipped++;
        break;
      case 'delivered':
        counts.delivered++;
        break;
      case 'cancelled':
        counts.cancelled++;
        break;
    }
  });

  // Update count displays
  document.getElementById('pending-count').textContent = counts.pending;
  document.getElementById('processing-count').textContent = counts.processing;
  document.getElementById('shipped-count').textContent = counts.shipped;
  document.getElementById('delivered-count').textContent = counts.delivered;
  document.getElementById('cancelled-count').textContent = counts.cancelled;

  // Load recent orders (last 2 for preview)
  const recentOrders = orders
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 2);

  console.log('Recent orders after sorting and slicing:', recentOrders);
  
  // Debug: Show alert if no recent orders
  if (recentOrders.length === 0) {
    console.log('No recent orders found, checking orders array:', orders);
  }
  
  renderRecentOrders(recentOrders);
}

function renderRecentOrders(orders) {
  const container = document.getElementById('recent-orders');
  console.log('Rendering recent orders:', orders);
  console.log('Container found:', !!container);
  
  if (!container) {
    console.error('Recent orders container not found!');
    return;
  }

  // Remove loading state
  const loadingEl = document.getElementById('loading-orders');
  if (loadingEl) {
    loadingEl.remove();
  }

  if (orders.length === 0) {
    console.log('No orders to display, showing empty state');
    container.innerHTML = `
      <div class="text-center py-8 text-gray-500">
        <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
        </svg>
        <p>Belum ada pesanan</p>
      </div>
    `;
    return;
  }

  console.log('Rendering orders HTML...');
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'owner' || localStorage.getItem('isAdmin') === 'true';
  
  const ordersHTML = orders.map(order => {
    console.log('Processing order:', order);
    
    // Get first item for display
    const firstItem = order.items && order.items.length > 0 ? order.items[0] : null;
    const itemImage = firstItem?.image || 'https://via.placeholder.com/60x60?text=No+Image';
    const itemName = firstItem?.name || 'Unknown Product';
    const additionalItems = order.items.length > 1 ? `+${order.items.length - 1} item${order.items.length > 2 ? 's' : ''}` : '';
    
    // For admin, show user info
    const userInfo = isAdmin ? `
      <div class="flex items-center gap-2 mb-1">
        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white border border-blue-300 text-blue-600">
          User ID: ${order.userId || 'Unknown'}
        </span>
        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}">
          ${getStatusText(order.status)}
        </span>
      </div>
    ` : `
      <div class="flex items-center gap-2 mb-1">
        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}">
          ${getStatusText(order.status)}
        </span>
      </div>
    `;
    
    return `
      <div class="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer" onclick="window.location.href='orders.html'">
        <div class="flex items-center gap-4">
          <!-- Product Image -->
          <div class="flex-shrink-0">
            <img src="${itemImage}" alt="${itemName}" class="w-16 h-16 rounded-lg object-cover border border-gray-200">
          </div>
          
          <!-- Order Info -->
          <div class="flex-1 min-w-0">
            ${userInfo}
            <p class="text-sm font-medium text-gray-900 mb-1">Order #${order.id || order.orderId}</p>
            <p class="text-sm text-gray-600 mb-1">${itemName}</p>
            ${additionalItems ? `<p class="text-xs text-gray-500">${additionalItems}</p>` : ''}
            <p class="text-xs text-gray-500">${formatDate(order.createdAt || order.orderDate)}</p>
          </div>
          
          <!-- Price -->
          <div class="flex-shrink-0 text-right">
            <p class="text-sm font-medium text-gray-900">Rp ${(order.total || order.totals?.total || 0).toLocaleString('id-ID')}</p>
            <p class="text-xs text-gray-500">${order.items.length} item${order.items.length > 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  console.log('Generated HTML:', ordersHTML);
  
  // Get total orders count for display
  const totalOrders = orders.length;
  const allOrders = isAdmin ? loadAllUserOrders() : JSON.parse(localStorage.getItem(`orders_${getCurrentUserId()}`) || '[]');
  const totalAllOrders = allOrders.length;
  
  // Create view all button
  const viewAllButton = totalAllOrders > 2 ? `
    <div class="mt-4 text-center">
      <button onclick="window.location.href='${isAdmin ? 'admin-orders.html' : 'orders.html'}'" 
              class="inline-flex items-center gap-2 px-4 py-2 bg-[#DC9C84] text-white rounded-lg text-sm font-medium hover:bg-[#93392C] transition">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
        </svg>
        Lihat Semua Pesanan (${totalAllOrders})
      </button>
    </div>
  ` : '';
  
  container.innerHTML = ordersHTML + viewAllButton;
}

function getStatusColor(status) {
  switch (status) {
    case 'pending':
      return 'text-pending bg-white border border-pending';
    case 'processing':
      return 'text-processing bg-white border border-processing';
    case 'shipped':
      return 'text-shipped bg-white border border-shipped';
    case 'delivered':
      return 'text-delivered bg-white border border-delivered';
    case 'cancelled':
      return 'text-cancelled bg-white border border-cancelled';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getStatusText(status) {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'processing':
      return 'Processing';
    case 'shipped':
      return 'Shipped';
    case 'delivered':
      return 'Delivered';
    case 'cancelled':
      return 'Cancelled';
    default:
      return 'Unknown';
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

// ===== SAMPLE ORDER CREATION ===== //
function createSampleOrderIfNeeded() {
  const userId = getCurrentUserId();
  if (!userId) return;

  const ordersKey = `orders_${userId}`;
  const existingOrders = JSON.parse(localStorage.getItem(ordersKey) || '[]');
  
  if (existingOrders.length === 0) {
    console.log('Creating sample orders for testing...');
    
    const sampleOrders = [
      {
        id: 'ORD-001',
        userId: userId,
        items: [
          { name: 'Vintage Denim Jacket', price: 150000, qty: 1, image: 'https://i.pinimg.com/1200x/c0/2b/dd/c02bddac3a2ad03ceec74b86dc0e7d3e.jpg' },
          { name: 'Classic White T-Shirt', price: 75000, qty: 2, image: 'https://i.pinimg.com/1200x/8b/5a/8b/8b5a8b8b8b8b8b8b8b8b8b8b8b8b8b8b.jpg' }
        ],
        status: 'pending',
        total: 315000,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        shipping: { method: 'standard' },
        payment: 'credit_card'
      },
      {
        id: 'ORD-002',
        userId: userId,
        items: [
          { name: 'Headphone Wireless Sony', price: 420000, qty: 1, image: 'https://res.cloudinary.com/do3t3ubyd/image/upload/v1761276441/b8ukdvul25esvxn11ou6.jpg' }
        ],
        status: 'processing',
        total: 462000,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        shipping: { method: 'express' },
        payment: 'bank_transfer'
      },
      {
        id: 'ORD-003',
        userId: userId,
        items: [
          { name: 'Buku Resep Impor', price: 55000, qty: 1, image: 'https://res.cloudinary.com/do3t3ubyd/image/upload/v1761330099/images_6_gypt4d.jpg' },
          { name: 'Buku Masakan Indonesia', price: 45000, qty: 1, image: 'https://res.cloudinary.com/do3t3ubyd/image/upload/v1761330099/images_7_abc123.jpg' },
          { name: 'Buku Baking Guide', price: 65000, qty: 1, image: 'https://res.cloudinary.com/do3t3ubyd/image/upload/v1761330099/images_8_def456.jpg' }
        ],
        status: 'shipped',
        total: 195500,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        shipping: { method: 'standard' },
        payment: 'credit_card'
      },
      {
        id: 'ORD-004',
        userId: userId,
        items: [
          { name: 'Designer Handbag', price: 450000, qty: 1, image: 'https://i.pinimg.com/1200x/22/c5/7b/22c57b231bfe81ec1802624fe152f7bb.jpg' }
        ],
        status: 'delivered',
        total: 495000,
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
        shipping: { method: 'express' },
        payment: 'bank_transfer'
      }
    ];
    
    localStorage.setItem(ordersKey, JSON.stringify(sampleOrders));
    console.log('Sample orders created:', sampleOrders);
    
    // Reload order summary after a short delay to ensure DOM is ready
    setTimeout(() => {
      loadOrderSummary();
    }, 100);
  }
}
