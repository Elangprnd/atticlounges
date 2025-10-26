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
        user = { ...user, ...userData };
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

  // Prefill account form fields if present
  const fullNameEl = document.getElementById('full-name');
  const emailEl = document.getElementById('email');
  const birthEl = document.getElementById('birth-date');
  if (fullNameEl) fullNameEl.value = user.name || '';
  if (emailEl) emailEl.value = user.email || '';
  if (birthEl && user.birthDate) birthEl.value = user.birthDate;


}

// ===== INITIALIZE PROFILE PAGE ===== //
document.addEventListener("DOMContentLoaded", () => {
  renderProfile();
  updateCartCount();
  initAddressBook();
  initAccountForm();
  wireAccountModal();
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

    // basic validation
    const required = [fullName, email];
    for (const el of required) {
      if (!el.value.trim()) {
        el.classList.add('border-red-500');
        return;
      } else {
        el.classList.remove('border-red-500');
      }
    }
    if ((currentPw.value || newPw.value || confirmPw.value)) {
      if (!currentPw.value || !newPw.value || newPw.value.length < 6 || newPw.value !== confirmPw.value) {
        newPw.classList.add('border-red-500');
        confirmPw.classList.add('border-red-500');
        return;
      }
    }

    // persist to localStorage user object as fallback
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    user.name = fullName.value.trim();
    user.email = email.value.trim();
    if (birth.value) user.birthDate = birth.value;
    localStorage.setItem('user', JSON.stringify(user));

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
    if (fullNameEl) fullNameEl.value = name;
    if (emailEl) emailEl.value = email;
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
  if (!list) return;
  const addresses = loadAddresses();
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
