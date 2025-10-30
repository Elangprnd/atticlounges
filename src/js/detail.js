// ===== PRODUCT DETAIL PAGE FUNCTIONALITY ===== //

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

// Check if current user is admin
function isAdmin() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.role === 'owner' || localStorage.getItem('isAdmin') === 'true';
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

// ===== WISHLIST FUNCTIONS ===== //
function getWishlist() {
  const userId = getCurrentUserId();
  const wishlistKey = userId ? `wishlist_${userId}` : 'wishlist_guest';
  return JSON.parse(localStorage.getItem(wishlistKey)) || [];
}

function saveWishlist(wishlist) {
  const userId = getCurrentUserId();
  const wishlistKey = userId ? `wishlist_${userId}` : 'wishlist_guest';
  localStorage.setItem(wishlistKey, JSON.stringify(wishlist));
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

function isInCart(productId) {
  const pid = String(productId);
  return getCart().some(it => String(it._id ?? it.id) === pid);
}

function getUserOrdersLocal() {
  const userId = getCurrentUserId();
  if (!userId) return [];
  try { return JSON.parse(localStorage.getItem(`orders_${userId}`) || '[]'); } catch (_) { return []; }
}

function isInOrders(productId) {
  const pid = String(productId);
  return getUserOrdersLocal().some(o => Array.isArray(o.items) && o.items.some(it => String(it._id ?? it.id) === pid));
}

// ===== SAMPLE REVIEWS ===== //
const productReviews = [
  {
    id: 1,
    productId: 1,
    author: "Sari M.",
    rating: 5,
    comment: "Jaket vintage yang sangat bagus! Kondisi seperti yang dijelaskan, pengiriman cepat. Recommended!",
    date: "2024-10-15",
    avatar: "https://cdn-icons-png.flaticon.com/128/1077/1077012.png"
  },
  {
    id: 2,
    productId: 1,
    author: "Budi K.",
    rating: 4,
    comment: "Produk berkualitas dengan harga terjangkau. Sedikit lebih aus dari yang diharapkan tapi masih layak pakai.",
    date: "2024-10-10",
    avatar: "https://cdn-icons-png.flaticon.com/128/1077/1077012.png"
  },
  {
    id: 3,
    productId: 2,
    author: "Maya S.",
    rating: 5,
    comment: "Tas branded dalam kondisi sangat baik! Terlihat seperti baru. Sangat puas dengan pembelian ini.",
    date: "2024-10-12",
    avatar: "https://cdn-icons-png.flaticon.com/128/1077/1077012.png"
  }
];

// ===== RENDER PRODUCT DETAILS ===== //
async function renderProductDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');
  let product = null;
  try {
    const resp = await fetch(`http://localhost:4002/api/products/${productId}`);
    if (resp.ok) product = await resp.json();
  } catch (e) {
    console.error('Failed to fetch product detail', e);
  }

  if (!product) {
    document.getElementById('product-details').innerHTML = '<p class="text-center text-red-500 text-xl">Product not found!</p>';
    return;
  }

  const container = document.getElementById('product-details');
  if (!container) return;
  const categoryName = (typeof product.category === 'string' ? product.category : (product.category?.name || ''));

  container.innerHTML = `
    <div class="product-card-bg py-6 md:py-10">
      <div class="max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div class="bg-white overflow-hidden flex flex-col lg:flex-row">
          <div class="lg:w-2/5 p-6 border-r border-gray-100 flex flex-col">
            <div class="relative w-full pb-[100%] border border-gray-200 rounded-lg overflow-hidden mb-6">
              <img id="product-image" src="${product.image}" alt="${product.name}" class="absolute h-full w-full object-cover">
              ${!isAdmin() ? `<button id="wishlist-btn" class="absolute top-4 right-4 bg-white p-2 rounded-full shadow-md cursor-pointer">
                <svg class="h-6 w-6 ${getWishlist().includes(product._id || product.id) ? 'text-red-500' : 'text-gray-400'}" fill="${getWishlist().includes(product._id || product.id) ? 'currentColor' : 'none'}" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>` : ''}
            </div>
            <div class="flex space-x-4">
              <a href="${location.pathname.includes('/pages/') ? 'chat.html' : 'pages/chat.html'}" class="flex-1 flex items-center justify-center py-3 px-4 border border-gray-300 text-[#8C5E3C] rounded-[5px] shadow-md text-lg hover:bg-gray-50">
                Chat
              </a>
              <button id="add-to-cart-btn" class="flex-1 flex items-center justify-center py-3 px-4 border border-transparent rounded-[5px] shadow-md text-lg ${isAdmin() ? 'bg-[#8C5E3C] text-white hover:bg-[#382E2A]' : 'bg-[#DC9C84] text-white hover:bg-[#93392C]'}">
                ${isAdmin() ? 'Edit Product' : 'Add to cart'}
              </button>
            </div>
          </div>
          <div class="lg:w-3/5 p-6">
            <h1 id="product-name" class="text-2xl font-semibold text-gray-900 mb-2">${product.name}</h1>
            <p id="product-price" class="text-xl text-[#8C5E3C] font-bold mb-4">Rp ${product.price.toLocaleString('id-ID')}</p>
            <h2 class="text-lg font-semibold text-gray-900 mb-2">Description</h2>
            <div id="product-description" class="text-gray-700 mb-6 leading-relaxed whitespace-pre-line">${(product.description || `High-quality ${categoryName.toLowerCase()} in excellent condition.`).replace(/\n/g, '<br>')}</div>
            <h2 class="text-lg font-semibold text-gray-900 mb-2">Specification</h2>
            <div class="bg-gray-50 p-4 rounded-lg grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
              <div><span class="text-gray-500">Brand :</span> <span id="spec-brand" class="font-medium text-gray-800">${product.brand || 'N/A'}</span></div>
              <div><span class="text-gray-500">Size :</span> <span id="spec-size" class="font-medium text-gray-800">${product.size || 'One Size'}</span></div>
              <div><span class="text-gray-500">Condition :</span> <span id="spec-condition" class="font-medium text-gray-800">${product.condition || 'Good'}</span></div>
              <div><span class="text-gray-500">Category :</span> <span id="spec-category" class="font-medium text-gray-800">${categoryName}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Add to Cart / Edit button event listener
  const addToCartBtn = document.getElementById('add-to-cart-btn');
  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', () => {
      // If admin, redirect to admin page
      if (isAdmin()) {
        window.location.href = '../pages/admin.html';
        return;
      }
      
      // If regular user, add to cart
      let cart = getCart();
      const key = product._id || product.id;
      const existing = cart.find(item => item._id === key || item.id === key);
      if (existing) {
        alert('Produk ini sudah ada di keranjang! (Thrift store: setiap produk hanya ada 1)');
        return;
      } else {
        cart.push({ ...product, qty: 1 });
      }
      saveCart(cart);
      alert(`${product.name} added to cart!`);
    });
  }

  // Buy Now button event listener
  const buyNowBtn = document.getElementById('buy-now-btn');
  if (buyNowBtn) {
    buyNowBtn.addEventListener('click', () => {
      // Directly go to checkout with this single item
      localStorage.setItem("checkoutItems", JSON.stringify([{ ...product, qty: 1 }]));
      window.location.href = "../pages/payment.html";
    });
  }

  // Wishlist button event listener
  const wishlistBtn = document.getElementById('wishlist-btn');
  if (wishlistBtn) {
    wishlistBtn.addEventListener('click', () => {
      // Block admin from adding to wishlist
      if (isAdmin()) {
        alert('Admin tidak bisa menambah produk ke wishlist!');
        return;
      }
      // Prevent if already in cart or already ordered
      const key = product._id || product.id;
      if (isInCart(key)) {
        alert('Produk sudah ada di keranjang. Hapus dari keranjang dahulu jika ingin memindahkan ke wishlist.');
        return;
      }
      if (isInOrders(key)) {
        alert('Produk sudah ada pada pesanan Anda. Tidak bisa ditambahkan ke wishlist.');
        return;
      }
      
      let wishlist = getWishlist();
      if (wishlist.includes(key)) {
        wishlist = wishlist.filter(id => id !== key);
      } else {
        wishlist.push(key);
      }
      saveWishlist(wishlist);
      updateWishlistCount();
      renderProductDetails(); // Re-render to update wishlist icon
    });
  }

  // Render reviews for this product
  renderReviews(parseInt(productId));
}

// ===== RENDER REVIEWS ===== //
function renderReviews(productId) {
  const reviewsContainer = document.getElementById('reviews-container');
  if (!reviewsContainer) return;

  reviewsContainer.innerHTML = '';
  const reviewsForProduct = productReviews.filter(review => review.productId === productId);

  if (reviewsForProduct.length === 0) {
    reviewsContainer.innerHTML = '<p class="text-gray-500">No reviews yet for this product.</p>';
    return;
  }

  reviewsForProduct.forEach(review => {
    const reviewDiv = document.createElement('div');
    reviewDiv.className = 'bg-gray-50 p-4 rounded-lg shadow-sm';
    reviewDiv.innerHTML = `
      <div class="flex items-center mb-2">
        <img src="${review.avatar}" alt="${review.author}" class="w-10 h-10 rounded-full mr-3">
        <div>
          <p class="font-semibold text-gray-800">${review.author}</p>
          <div class="flex text-yellow-400 text-sm">
            ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}
          </div>
        </div>
      </div>
      <p class="text-gray-700 mt-2">${review.comment}</p>
      <p class="text-xs text-gray-500 mt-2">Reviewed on: ${new Date(review.date).toLocaleDateString()}</p>
    `;
    reviewsContainer.appendChild(reviewDiv);
  });
}

// ===== INITIALIZE DETAIL PAGE ===== //
document.addEventListener("DOMContentLoaded", () => {
  renderProductDetails();
  updateCartCount();
  updateWishlistCount();
  
  // Initialize search overlay for detail page
  if (typeof initializeSearchOverlay === 'function') {
    initializeSearchOverlay();
  }
});