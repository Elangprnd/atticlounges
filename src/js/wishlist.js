// ===== WISHLIST PAGE =====

function getCurrentUserId() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.id || null;
}

function getWishlist() {
  const userId = getCurrentUserId();
  const key = userId ? `wishlist_${userId}` : 'wishlist_guest';
  return JSON.parse(localStorage.getItem(key) || '[]');
}

function saveWishlist(list) {
  const userId = getCurrentUserId();
  const key = userId ? `wishlist_${userId}` : 'wishlist_guest';
  localStorage.setItem(key, JSON.stringify(list));
  updateWishlistCount();
}

function updateWishlistCount() {
  const wishlist = getWishlist();
  const count = wishlist.length;
  
  // Update wishlist counter in navbar
  const wishlistCounts = document.querySelectorAll('#wishlist-count, #wishlist-count-user');
  wishlistCounts.forEach(el => {
    if (count > 0) {
      el.textContent = count;
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  });
}

function getCart() {
  const userId = getCurrentUserId();
  const key = userId ? `cart_${userId}` : 'cart_guest';
  return JSON.parse(localStorage.getItem(key) || '[]');
}

function saveCart(cart) {
  const userId = getCurrentUserId();
  const key = userId ? `cart_${userId}` : 'cart_guest';
  localStorage.setItem(key, JSON.stringify(cart));
}

function updateCartCount() {
  const cart = getCart();
  const total = cart.reduce((s, it) => s + (it.qty || 0), 0);
  document.querySelectorAll('#cart-count, #cart-count-user').forEach(el => {
    if (total > 0) { el.textContent = total; el.classList.remove('hidden'); } else { el.classList.add('hidden'); }
  });
}

const PRODUCT_API = 'http://localhost:4002/api/products';

async function fetchProduct(id) {
  const res = await fetch(`${PRODUCT_API}/${id}`);
  if (!res.ok) throw new Error('not found');
  return await res.json();
}

function formatRupiah(amount) {
  const n = typeof amount === 'number' ? amount : 0;
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
}

async function renderWishlist() {
  const container = document.getElementById('wishlist-container');
  const empty = document.getElementById('wishlist-empty');
  if (!container || !empty) return;

  container.innerHTML = '';
  const ids = getWishlist().map(String);
  if (ids.length === 0) {
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  // Fetch sequentially to keep simple; could be parallel later
  for (const id of ids) {
    try {
      const p = await fetchProduct(id);
      const card = document.createElement('div');
      card.className = 'bg-white rounded-xl shadow-md p-6 flex flex-col';
      const imageUrl = p.image || 'https://via.placeholder.com/400x300?text=No+Image';
      card.innerHTML = `
        <div class="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4 flex items-center justify-center">
          <img src="${imageUrl}" alt="${p.name}" class="w-full h-full object-cover">
        </div>
        <div class="text-xs uppercase text-gray-500 mb-1">${typeof p.category === 'string' ? p.category : (p.category?.name || '')}</div>
        <div class="font-semibold text-gray-900 line-clamp-1">${p.name}</div>
        <div class="text-[#93392C] font-semibold mt-1 mb-3">${formatRupiah(p.price)}</div>
        <div class="mt-auto grid grid-cols-3 gap-2">
          <button class="view-detail px-3 py-2 text-xs border border-gray-300 text-[#364153] rounded hover:bg-gray-50" data-id="${id}">View Details</button>
          <button class="to-cart px-3 py-2 text-xs bg-[#DC9C84] text-white rounded hover:bg-[#93392C]" data-id="${id}">Add to Cart</button>
          <button class="remove-wish px-3 py-2 text-xs border border-red-300 text-red-600 rounded hover:bg-red-50" data-id="${id}">Remove</button>
        </div>
      `;
      container.appendChild(card);
    } catch (_) {
      // skip broken id
    }
  }

  container.querySelectorAll('.view-detail').forEach(btn => btn.addEventListener('click', e => {
    const id = e.currentTarget.dataset.id;
    window.location.href = `detail.html?id=${id}`;
  }));

  container.querySelectorAll('.to-cart').forEach(btn => btn.addEventListener('click', async e => {
    const id = e.currentTarget.dataset.id;
    try {
      const p = await fetchProduct(id);
      const idStr = String(p._id ?? p.id ?? id);
      const cart = getCart();
      const found = cart.find(it => String(it._id ?? it.id) === idStr);
      if (found) found.qty += 1; else cart.push({ _id: idStr, id: idStr, name: p.name, price: p.price, image: p.image, qty: 1 });
      saveCart(cart);
      updateCartCount();
    } catch (_) { alert('Gagal menambahkan ke cart'); }
  }));

  container.querySelectorAll('.remove-wish').forEach(btn => btn.addEventListener('click', e => {
    const id = String(e.currentTarget.dataset.id);
    const list = getWishlist().map(String).filter(x => x !== id);
    saveWishlist(list);
    renderWishlist();
  }));
}

document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  updateWishlistCount();
  renderWishlist();
  
  // Initialize search overlay for wishlist page
  if (typeof initializeSearchOverlay === 'function') {
    initializeSearchOverlay();
  }
});


