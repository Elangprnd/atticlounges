const USER_SERVICE = 'http://localhost:4001';
const PRODUCT_SERVICE = 'http://localhost:4002';

function loginModal() {
  const openBtn = document.getElementById("login");
  const closeBtn = document.getElementById("closeModal");
  const modal = document.getElementById("loginModal");
  const googleLoginBtn = document.getElementById("google-login");
  const userTab = document.getElementById("user-login-tab");
  const adminTab = document.getElementById("admin-login-tab");
  const userContent = document.getElementById("user-login-content");
  const adminContent = document.getElementById("admin-login-content");
  const adminForm = document.getElementById("admin-login-form");

  if (!openBtn || !closeBtn || !modal) return; 

  openBtn.addEventListener("click", () => {
    modal.classList.remove("hidden");
    switchToUserTab();
  });

  closeBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.add("hidden");
    }
  });

  userTab?.addEventListener("click", switchToUserTab);
  adminTab?.addEventListener("click", switchToAdminTab);

  function switchToUserTab() {
    userTab.classList.add("bg-white", "text-gray-900", "shadow-sm");
    userTab.classList.remove("text-gray-500");
    adminTab.classList.remove("bg-white", "text-gray-900", "shadow-sm");
    adminTab.classList.add("text-gray-500");
    userContent.classList.remove("hidden");
    adminContent.classList.add("hidden");
  }

  function switchToAdminTab() {
    adminTab.classList.add("bg-white", "text-gray-900", "shadow-sm");
    adminTab.classList.remove("text-gray-500");
    userTab.classList.remove("bg-white", "text-gray-900", "shadow-sm");
    userTab.classList.add("text-gray-500");
    adminContent.classList.remove("hidden");
    userContent.classList.add("hidden");
  }

  const userLoginForm = document.getElementById("user-login-form");
  if (userLoginForm) {
    userLoginForm.addEventListener("submit", handleUserLogin);
  }

  const switchToSignupBtn = document.getElementById("switch-to-signup");
  if (switchToSignupBtn) {
    switchToSignupBtn.addEventListener("click", () => {
      modal.classList.add("hidden");
      document.getElementById("signupModal").classList.remove("hidden");
    });
  }

  adminForm?.addEventListener("submit", handleAdminLogin);
}

function signupModal() {
  const openBtn = document.getElementById("sign-up");
  const closeBtn = document.getElementById("closeSignupModal");
  const modal = document.getElementById("signupModal");
  const signupForm = document.getElementById("signup-form");
  const switchToLoginBtn = document.getElementById("switch-to-login");

  if (!openBtn || !closeBtn || !modal) return;

  openBtn.addEventListener("click", () => {
    modal.classList.remove("hidden");
  });

  closeBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.add("hidden");
    }
  });

  if (signupForm) {
    signupForm.addEventListener("submit", handleSignup);
  }

  if (switchToLoginBtn) {
    switchToLoginBtn.addEventListener("click", () => {
      modal.classList.add("hidden");
      document.getElementById("loginModal").classList.remove("hidden");
    });
  }
}

async function handleUserLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('user-email').value;
  const password = document.getElementById('user-password').value;
  
  try {
    const response = await fetch(`${USER_SERVICE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }
    
    // Store user data
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userRole', data.user.role); // Simpan role untuk dropdown
    
    // Close modal and update UI
    document.getElementById('loginModal').classList.add('hidden');
    toggleHeader(true);
    showMessage('Login berhasil! Selamat datang!', 'success');
    
    // Clear form
    document.getElementById('user-login-form').reset();
    
  } catch (error) {
    console.error('User login error:', error);
    const msg = (error && error.message && error.message.includes('Failed to fetch'))
      ? 'Gagal terhubung ke User Service (4001). Pastikan backend berjalan.'
      : (error.message || 'Gagal login. Coba lagi.');
    showMessage(msg, 'error');
  }
}

// Handle user registration
async function handleSignup(e) {
  e.preventDefault();
  
  const name = document.getElementById('signup-name').value;
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  
  try {
    const response = await fetch(`${USER_SERVICE}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }
    
    // Store user data and login automatically
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userRole', data.user.role); // Simpan role untuk dropdown
    
    // Close modal and update UI
    document.getElementById('signupModal').classList.add('hidden');
    toggleHeader(true);
    showMessage('Registrasi berhasil! Selamat datang!', 'success');
    
    // Clear form
    document.getElementById('signup-form').reset();
    
  } catch (error) {
    console.error('Registration error:', error);
    const msg = (error && error.message && error.message.includes('Failed to fetch'))
      ? 'Gagal terhubung ke User Service (4001). Pastikan backend berjalan.'
      : (error.message || 'Gagal mendaftar. Coba lagi.');
    showMessage(msg, 'error');
  }
}

// Check if current user is admin
function isAdmin() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.role === 'owner' || localStorage.getItem('isAdmin') === 'true';
}

// This function is no longer needed for multi-user system
// Users should register/login through proper forms
async function loginSuccess() {
  console.warn('loginSuccess() is deprecated. Use proper registration/login forms instead.');
}

// Function to check if current user is owner
function isOwner() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.role === 'owner';
}

// Function to redirect to admin panel if user is owner
function checkOwnerAccess() {
  if (isOwner()) {
    window.location.href = 'pages/admin.html';
  }
}

// Handle admin login
async function handleAdminLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('admin-email').value;
  const password = document.getElementById('admin-password').value;
  
  try {
    const response = await fetch(`${USER_SERVICE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }
    
    // Check if user is admin/owner
    if (data.user.role !== 'owner') {
      throw new Error('Akses ditolak. Hanya admin yang bisa masuk.');
    }
    
    // Store user data
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('isAdmin', 'true');
    localStorage.setItem('userRole', data.user.role); // Simpan role untuk dropdown
    
    // Close modal and update UI
    document.getElementById('loginModal').classList.add('hidden');
    toggleHeader(true);
    showMessage('Login admin berhasil!', 'success');
    
    // Clear form
    document.getElementById('admin-login-form').reset();
    
  } catch (error) {
    console.error('Admin login error:', error);
    const msg = (error && error.message && error.message.includes('Failed to fetch'))
      ? 'Gagal terhubung ke User Service (4001). Pastikan backend berjalan.'
      : (error.message || 'Gagal login admin.');
    showMessage(msg, 'error');
  }
}

// ===== HEADER MANAGEMENT ===== //
function toggleHeader(isLoggedIn) {
  const guestButtons = document.getElementById("guestButtons");
    const userButtons = document.getElementById("userButtons");
    // ⭐ Ambil container baru
    const universalProfile = document.getElementById("universalProfile"); 

    if (isLoggedIn) {
        // Tampilkan Dropdown Profil Universal
        universalProfile?.classList.remove("hidden");
        
        guestButtons?.classList.add("hidden");

        // Cek apakah user adalah admin/owner
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const isAdminUser = user.role === 'owner' || localStorage.getItem('isAdmin') === 'true';
        
        if (isAdminUser) {
            // Sembunyikan cart, wishlist, chat untuk admin
            userButtons?.classList.add("hidden");
        } else {
            // Tampilkan Cart, Heart, Chat untuk user biasa
            userButtons?.classList.remove("hidden");
        }
        
        handleDropdownRole(); // <-- REFRESH ISI DROPDOWN
    } else {
        // Sembunyikan semua kecuali Guest
        guestButtons?.classList.remove("hidden");
        userButtons?.classList.add("hidden");
        universalProfile?.classList.add("hidden"); // Sembunyikan Dropdown Profil
    }
}

// Show message function
function showMessage(message, type) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
    type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
  }`;
  messageDiv.textContent = message;
  document.body.appendChild(messageDiv);
  
  setTimeout(() => {
    messageDiv.remove();
  }, 3000);
}

function logout() {
  const userId = getCurrentUserId();
  
  // Clear user session data only (keep cart and wishlist)
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("isAdmin");
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  
  // DON'T clear user cart and wishlist - keep them for when user logs back in
  // Cart and wishlist will be preserved: cart_${userId} and wishlist_${userId}
  
  // Clear guest data only
  localStorage.removeItem("cart_guest");
  localStorage.removeItem("wishlist_guest");
  
  toggleHeader(false);
  if (location.pathname.includes('/pages/')) {
    window.location.href = "../index.html";
  } else {
    window.location.href = "index.html";
  }
}

// Function to clear login state (prevent auto-login)
function clearLoginState() {
  // Only clear if we're on the main index.html page and user is not properly authenticated
  if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    
    // Only clear if user is not properly authenticated
    if (!isLoggedIn || !token || !user) {
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("isAdmin");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      console.log('Invalid session cleared to prevent auto-login');
    } else {
      console.log('Valid session preserved');
    }
  }
}


// ====== SEARCH OVERLAY SYSTEM ======
function initializeSearchOverlay() {
  const searchBtn = document.getElementById("searchBtn");
  const searchOverlay = document.getElementById("searchOverlay");
  const closeSearch = document.getElementById("closeSearch");

  console.log('Initializing search overlay...', {
    searchBtn: !!searchBtn,
    searchOverlay: !!searchOverlay,
    closeSearch: !!closeSearch,
    currentPath: window.location.pathname
  });

  // Pastikan hanya jalan kalau semua elemen ada
  if (searchBtn && searchOverlay && closeSearch) {
    // Remove existing listeners to prevent duplicates
    searchBtn.removeEventListener("click", handleSearchClick);
    closeSearch.removeEventListener("click", handleCloseSearch);
    
    // Add new listeners
    searchBtn.addEventListener("click", handleSearchClick);
    closeSearch.addEventListener("click", handleCloseSearch);
    
    console.log('Search overlay initialized successfully');
  } else {
    console.log('Search elements not found, retrying...');
    // Retry after a short delay for dynamically loaded content
    setTimeout(initializeSearchOverlay, 100);
  }
}

function handleSearchClick() {
  const searchOverlay = document.getElementById("searchOverlay");
  if (searchOverlay) {
    searchOverlay.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }
}

function handleCloseSearch() {
  const searchOverlay = document.getElementById("searchOverlay");
  if (searchOverlay) {
    searchOverlay.classList.add("hidden");
    document.body.style.overflow = "auto";
  }
}

// ====== SEARCH FUNCTIONALITY ======
function initializeSearch() {
  const searchInputs = document.querySelectorAll('input[type="search"]');
  const searchForms = document.querySelectorAll('form');

  // --- Saat user ngetik di search input (live feedback, belum redirect) ---
  searchInputs.forEach((input) => {
    // Remove existing listeners to prevent duplicates
    input.removeEventListener("input", handleSearchInput);
    input.addEventListener("input", handleSearchInput);
  });

  // --- Saat user tekan Enter atau submit form ---
  searchForms.forEach((form) => {
    // Remove existing listeners to prevent duplicates
    form.removeEventListener("submit", handleSearchSubmit);
    form.addEventListener("submit", handleSearchSubmit);
  });
}

function handleSearchInput(e) {
  const query = e.target.value.trim().toLowerCase();
  if (query.length > 2) {
    console.log("Searching for:", query);
    // nanti bisa dikembangin: fetch hasil pencarian real-time
  }
}

function handleSearchSubmit(e) {
  e.preventDefault();
  const input = e.target.querySelector('input[type="search"]');
  if (input && input.value.trim()) {
    const searchQuery = encodeURIComponent(input.value.trim());
    
    // Check if we're already in pages directory
    const isInPages = window.location.pathname.includes('/pages/');
    const targetURL = isInPages ? `product.html?search=${searchQuery}` : `pages/product.html?search=${searchQuery}`;

    // Tutup overlay (kalau ada)
    const searchOverlay = document.getElementById("searchOverlay");
    if (searchOverlay) {
      searchOverlay.classList.add("hidden");
      document.body.style.overflow = "auto";
    }

    // Redirect ke halaman product
    window.location.href = targetURL;
  }
}

// Panggil otomatis pas DOM siap
document.addEventListener("DOMContentLoaded", initializeSearch);


// ===== CART MANAGEMENT ===== //
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
  const userId = user.id || null;
  
  // Log untuk debugging
  if (userId) {
    console.log('Current User ID:', userId, 'Type:', typeof userId);
  }
  
  return userId;
}

// Clean up old inconsistent user data
function cleanupUserData() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Check if user ID is in old format (user-001, user-002, etc.)
  if (user.id && typeof user.id === 'string' && user.id.startsWith('user-')) {
    console.warn('Found old format user ID:', user.id, '- Clearing user data');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    
    // Clear all user-specific data
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('cart_') || key.startsWith('orders_') || key.startsWith('wishlist_')) {
        localStorage.removeItem(key);
      }
    });
    
    // Reload page to reset state
    window.location.reload();
    return false;
  }
  
  return true;
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

// ===== WISHLIST MANAGEMENT ===== //
function getWishlist() {
  const userId = getCurrentUserId();
  const wishlistKey = userId ? `wishlist_${userId}` : 'wishlist_guest';
  return JSON.parse(localStorage.getItem(wishlistKey)) || [];
}

function saveWishlist(wishlist) {
  const userId = getCurrentUserId();
  const wishlistKey = userId ? `wishlist_${userId}` : 'wishlist_guest';
  localStorage.setItem(wishlistKey, JSON.stringify(wishlist));
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

// ===== CATEGORY NAVIGATION ===== //
function navigateToCategory(category) {
  localStorage.setItem('selectedCategory', category);
  window.location.href = `pages/product.html?category=${encodeURIComponent(category)}`;
}

// Handle category link click from navbar
function handleCategoryClick(event) {
  event.preventDefault();
  
  // Check if we're already on the home page
  const isOnHomePage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/');
  
  if (isOnHomePage) {
    // If on home page, just scroll to categories section
    const categoriesSection = document.getElementById('categories-section');
    if (categoriesSection) {
      // Add offset for fixed header
      const headerHeight = 80; // Approximate header height
      const elementPosition = categoriesSection.offsetTop;
      const offsetPosition = elementPosition - headerHeight;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    } else {
      console.warn('Categories section not found');
    }
  } else {
    // If on other pages, navigate to home page with categories section
    window.location.href = '../index.html#categories-section';
  }
}

// Handle hash navigation (e.g., #categories-section)
function handleHashNavigation() {
  const hash = window.location.hash;
  if (hash === '#categories-section') {
    // Wait a bit for the page to fully load, then scroll to categories
    setTimeout(() => {
      const categoriesSection = document.getElementById('categories-section');
      if (categoriesSection) {
        // Add offset for fixed header
        const headerHeight = 80; // Approximate header height
        const elementPosition = categoriesSection.offsetTop;
        const offsetPosition = elementPosition - headerHeight;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }, 200); // Increased timeout to ensure page is fully loaded
  }
}

// ===== PRODUCT RENDERING ===== //
async function renderProducts(productList) {
  const container = document.getElementById("product-list");
  if (!container) return;

  try {
    // If no list provided, fetch from API
    if (!productList) {
      const resp = await fetch('http://localhost:4002/api/products');
      if (!resp.ok) {
        throw new Error(`HTTP error! status: ${resp.status}`);
      }
      productList = await resp.json();
      console.log('Fetched products:', productList);
    }
  } catch (e) {
    console.error('Failed to fetch products', e);
    container.innerHTML = `
      <div class="text-center py-8">
        <p class="text-red-500 mb-4">Failed to load products. Make sure Product Service is running on port 4002.</p>
        <p class="text-sm text-gray-500">Error: ${e.message}</p>
        <button onclick="location.reload()" class="mt-4 px-4 py-2 bg-[#DC9C84] text-white rounded-lg hover:bg-[#93392C] transition">
          Retry
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = "";
  const wishlist = getWishlist();

  productList.forEach((product) => {
    const isWishlisted = wishlist.includes(product._id);

    const card = document.createElement("div");
    card.className = "group bg-white rounded-lg shadow-md overflow-hidden transition hover:shadow-xl hover:-translate-y-2 relative";

    card.innerHTML = `
      <!-- Wishlist Button -->
      <button 
        class="wishlist-btn absolute right-4 top-4 z-20 rounded-full bg-white p-1.5 transition-colors shadow-md"
        data-id="${product._id}">
        <svg xmlns="http://www.w3.org/2000/svg" fill="${isWishlisted ? "red" : "none"}" 
          viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" 
          class="size-5 ${isWishlisted ? "text-red-500" : "text-gray-900"}">
          <path stroke-linecap="round" stroke-linejoin="round" 
            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 
            0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733
            -4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 
            7.22 9 12 9 12s9-4.78 9-12z"/>
        </svg>
      </button>

      <!-- Product Image -->
      <div class="aspect-square overflow-hidden">
        <img src="${product.image}" alt="${product.name}" 
          class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105">
      </div>

      <!-- Product Info -->
      <div class="p-4 flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <span class="bg-gray-100 px-2 py-1 text-xs font-medium rounded-full text-gray-600">
            ${product.category}
          </span>
        </div>
        <h3 class="text-sm font-semibold text-gray-900 line-clamp-2">${product.name}</h3>
        <p class="text-lg font-bold text-gray-900">Rp ${product.price.toLocaleString("id-ID")}</p>
        
        <!-- Action Buttons -->
        <div class="mt-3 flex space-x-2">
          <button class="view-detail flex-1 text-center rounded-md text-xs py-2 font-medium text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 transition" 
                  data-id="${product._id}">
            View Details
          </button>
          <button class="add-to-cart flex-1 text-center rounded-md text-xs py-2 font-medium text-white bg-[#DC9C84] hover:bg-[#93392C] transition" 
                  data-id="${product._id}">
            Add to Cart
          </button>
        </div>
      </div>
    `;

    container.appendChild(card);
  });

  // Add event listeners
  addProductEventListeners();
}

// ===== PRODUCT EVENT LISTENERS ===== //
function addProductEventListeners() {
  // Add to Cart
  document.querySelectorAll(".add-to-cart").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const productId = e.target.dataset.id;
      
      try {
        // Fetch product details from API
        const response = await fetch(`http://localhost:4002/api/products/${productId}`);
        if (!response.ok) throw new Error('Product not found');
        const product = await response.json();
        
        let cart = getCart();
        const existing = cart.find((item) => item._id === productId);

        if (existing) {
          alert('Produk ini sudah ada di keranjang! (Thrift store: setiap produk hanya ada 1)');
          return;
        } else {
          cart.push({ ...product, qty: 1 });
        }

        saveCart(cart);
        updateCartCount();
        
        // Show success message
        const originalText = e.target.textContent;
        e.target.textContent = "Added!";
        e.target.classList.add("bg-green-500");
        setTimeout(() => {
          e.target.textContent = originalText;
          e.target.classList.remove("bg-green-500");
        }, 1000);
      } catch (error) {
        console.error('Error adding to cart:', error);
        alert('Failed to add product to cart');
      }
    });
  });

  // Wishlist toggle
  document.querySelectorAll(".wishlist-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const productId = btn.dataset.id;
      let wishlist = getWishlist();

      if (wishlist.includes(productId)) {
        wishlist = wishlist.filter((id) => id !== productId);
      } else {
        wishlist.push(productId);
      }

      saveWishlist(wishlist);
      // Re-render to update wishlist icons
      renderProducts();
    });
  });

  // View Details
  document.querySelectorAll(".view-detail").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const productId = e.currentTarget.dataset.id;
      window.location.href = `pages/detail.html?id=${productId}`;
    });
  });
}

// ===== HORIZONTAL SCROLL FOR NEW ARRIVAL CAROUSEL ===== //
function scrollProducts(direction) {
  const list = document.getElementById('productList');
  if (!list) return;
  const card = list.querySelector('div');
  const step = card ? card.clientWidth + 20 : 300; // approximate gap
  const delta = direction === 'next' ? step : -step;
  list.scrollBy({ left: delta, behavior: 'smooth' });
}

// ===== INITIALIZATION ===== //
document.addEventListener("DOMContentLoaded", () => {
  console.log('DOM loaded, initializing...');
  
  try {
    // Clean up old user data first
    console.log('Checking for old user data...');
    if (!cleanupUserData()) {
      return; // Page will reload if cleanup was needed
    }
    
    // Initialize modals
    console.log('Initializing modals...');
    loginModal();
    signupModal();
    
    // Check login status and update header
    console.log('Checking login status...');
    checkAndUpdateLoginStatus();
    
    // Clean up cart data first
    console.log('Cleaning up cart data...');
    cleanupCartData();
    
    // Initialize cart count
    console.log('Initializing cart count...');
    updateCartCount();
    
    // Initialize wishlist count
    console.log('Initializing wishlist count...');
    updateWishlistCount();
    
    // Initialize search
    console.log('Initializing search...');
    initializeSearch();
    
    // Initialize search overlay with retry mechanism for dynamic content
    console.log('Initializing search overlay...');
    initializeSearchOverlay();
    
    // Also try again after a delay to catch dynamically loaded content
    setTimeout(() => {
      console.log('Retrying search initialization...');
      initializeSearch();
      initializeSearchOverlay();
    }, 500);
    
    // Initialize manage products button
    console.log('Initializing manage products buttons...');
    const manageProductsBtn = document.getElementById("manage-products-btn");
    const manageProductsBtnUser = document.getElementById("manage-products-btn-user");
    
    if (manageProductsBtn) {
      manageProductsBtn.addEventListener("click", () => {
        console.log('Manage products clicked (guest)');
        window.location.href = "pages/admin.html";
      });
    }
    
    if (manageProductsBtnUser) {
      manageProductsBtnUser.addEventListener("click", () => {
        console.log('Manage products clicked (user)');
        window.location.href = "pages/admin.html";
      });
    }
    
    // Initialize logout button
    console.log('Initializing logout button...');
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", logout);
    }
    
    // Initialize dropdown menu
    console.log('Initializing dropdown menu...');
    handleAccountDropdown();
    
    // Render products on homepage - DISABLED to prevent conflict with new-product.js
    // if (document.getElementById("product-list")) {
    //   console.log('Rendering products...');
    //   renderProducts(); // Fetch products from API instead of undefined variable
    // }
    
    // Handle hash navigation for categories section
    handleHashNavigation();
    
    console.log('Initialization complete!');
  } catch (error) {
    console.error('Error during initialization:', error);
  }
  // Quick health check for backend services
  ;(async () => {
    try {
      const resp = await fetch(`${USER_SERVICE}/health`);
      if (!resp.ok) throw new Error('User service unhealthy');
    } catch (e) {
      showMessage('User Service tidak tersedia di :4001. Jalankan services/user-service.', 'error');
    }
  })();
  // Footer year
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
});

// ===== DROPDOWN ACCOUNT HANDLER (Perbaikan Utama di sini) ===== //
function handleAccountDropdown() {
    try {
        const myAccountBtn = document.getElementById('my-account-btn');
        const accountDropdown = document.getElementById('account-dropdown');

        if (!myAccountBtn || !accountDropdown) {
            console.warn('Dropdown elements not found, skipping initialization.');
            return;
        }

        // 🎯 LOGIKA INI SUDAH BENAR, HANYA DIPASTIKAN TIDAK ADA DUPLIKASI
        // Toggle dropdown saat tombol akun diklik
        myAccountBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            accountDropdown.classList.toggle('hidden');
            console.log('Account dropdown toggled. Current state:', accountDropdown.classList.contains('hidden') ? 'hidden' : 'visible');
        });

        // Tutup dropdown kalau klik di luar area
        document.addEventListener('click', (e) => {
            // Cek apakah klik berasal dari luar elemen .group DAN dropdown sedang terlihat
            if (!e.target.closest('.group') && !accountDropdown.classList.contains('hidden')) {
                accountDropdown.classList.add('hidden');
                console.log('Account dropdown closed (outside click).');
            }
        });

        console.log('Account dropdown initialized successfully!');
    } catch (error) {
        console.error('Error initializing account dropdown:', error);
    }
}

// ===== HANDLE DROPDOWN BERDASARKAN ROLE (Memastikan konten lengkap) ===== //
function handleDropdownRole() {
    const dropdown = document.getElementById('account-dropdown');
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

    if (!dropdown || !isLoggedIn) {
         dropdown?.classList.add('hidden'); 
         return;
    }

    // Cek role user dari localStorage
    const userRole = localStorage.getItem("userRole") || "user";

    // Hapus semua item lama
    dropdown.innerHTML = '';

    // Prefix path sesuai lokasi saat ini
    const inPages = window.location.pathname.includes('/pages/');
    const p = (relPath) => inPages ? relPath : `pages/${relPath}`;

    // Tambahkan item umum
    const profile = document.createElement('a');
    profile.href = p('profile.html'); // Tautkan ke Profile page
    profile.className = 'block px-4 py-2 text-gray-700 hover:bg-gray-100';
    profile.textContent = 'Profile';
    dropdown.appendChild(profile);
    
    // Hanya tampilkan "My Orders" untuk user biasa, bukan untuk admin/owner
    if (userRole === "user") {
        const orders = document.createElement('a');
        orders.href = p('orders.html');
        orders.className = 'block px-4 py-2 text-gray-700 hover:bg-gray-100';
        orders.textContent = 'My Orders';
        dropdown.appendChild(orders);
    }

    // Tambahkan "Manage Product" untuk admin/owner
    if (userRole === "owner" || userRole === "admin") {
        const manageProduct = document.createElement('a');
        manageProduct.href = p('admin.html');
        manageProduct.className = 'block px-4 py-2 text-gray-700 hover:bg-gray-100';
        manageProduct.textContent = 'Manage Product';
        dropdown.appendChild(manageProduct);
    }

    // Pemisah
    const divider = document.createElement('hr');
    divider.className = 'my-1 border-gray-100';
    dropdown.appendChild(divider);

    // Logout
    const logoutBtn = document.createElement('button');
    logoutBtn.id = 'logout-btn';
    // Gunakan class sesuai desain admin, tapi pastikan terlihat baik
    logoutBtn.className = 'block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition';
    logoutBtn.textContent = 'Logout';
    logoutBtn.addEventListener('click', logout); 
    dropdown.appendChild(logoutBtn);
}




// Function to check and update login status
function checkAndUpdateLoginStatus() {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");
  
  console.log('Login status check:', { isLoggedIn, hasToken: !!token, hasUser: !!user });
  
  // Check if user is properly authenticated
  if (isLoggedIn && token && user) {
    try {
      // Try to parse user data to validate it
      const userData = JSON.parse(user);
      if (userData.id && userData.email) {
        console.log('User is properly authenticated, showing user header');
        toggleHeader(true);
        return;
      }
    } catch (e) {
      console.log('Invalid user data, clearing session');
    }
  }
  
  // If not properly authenticated, clear session and show guest header
  console.log('User not properly authenticated, showing guest header');
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("isAdmin");
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  toggleHeader(false);
}





