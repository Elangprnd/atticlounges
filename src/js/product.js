// Fungsi untuk halaman produk

let allProducts = [];
let filteredProducts = [];

// Ambil data keranjang dari localStorage
function getCart() {
  const userId = getCurrentUserId();
  const cartKey = userId ? `cart_${userId}` : 'cart_guest';
  return JSON.parse(localStorage.getItem(cartKey)) || [];
}

// Simpan data keranjang ke localStorage
function saveCart(cart) {
  const userId = getCurrentUserId();
  const cartKey = userId ? `cart_${userId}` : 'cart_guest';
  localStorage.setItem(cartKey, JSON.stringify(cart));
  updateCartCount();
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

// ===== SEARCH FUNCTIONALITY ===== //
async function searchProducts(query) {
  if (!allProducts.length) {
    await fetchProducts();
  }

  if (!query.trim()) {
    filteredProducts = [...allProducts];
    renderProducts(filteredProducts);
    return;
  }

  filteredProducts = allProducts.filter(product => 
    product.name.toLowerCase().includes(query.toLowerCase()) ||
    product.category.toLowerCase().includes(query.toLowerCase())
  );
  renderProducts(filteredProducts);
}

// ===== FILTER FUNCTIONALITY ===== //
async function filterProducts() {
  if (!allProducts.length) {
    await fetchProducts();
  }

  const categoryFilter = document.getElementById('category-filter')?.value || '';
  const priceFilter = document.getElementById('price-filter')?.value || '';
  const sortFilter = document.getElementById('sort-filter')?.value || 'name';

  let filtered = [...allProducts];

  // Category filter
  if (categoryFilter) {
    filtered = filtered.filter(product => product.category === categoryFilter);
  }

  // Price filter
  if (priceFilter) {
    const [min, max] = priceFilter.split('-').map(p => p === '+' ? Infinity : parseInt(p));
    filtered = filtered.filter(product => {
      if (max === Infinity) return product.price >= min;
      return product.price >= min && product.price <= max;
    });
  }

  // Sort
  filtered.sort((a, b) => {
    switch (sortFilter) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'name':
      default:
        return a.name.localeCompare(b.name);
    }
  });

  filteredProducts = filtered;
  renderProducts(filteredProducts);
}

// ===== RENDER PRODUCTS ===== //
async function fetchProducts() {
  try {
    const resp = await fetch('http://localhost:4002/api/products');
    allProducts = await resp.json();
    return allProducts;
  } catch (e) {
    console.error('Failed to fetch products', e);
    allProducts = [];
    return [];
  }
}

function renderProducts(productList) {
  const container = document.getElementById("product-list");
  const noProducts = document.getElementById("no-products");
  
  if (!container) return;

  container.innerHTML = "";
  updateResultsInfo(productList);

  if (!productList || productList.length === 0) {
    if (noProducts) noProducts.classList.remove('hidden');
    return;
  }

  if (noProducts) noProducts.classList.add('hidden');

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

// ===== ADD EVENT LISTENERS ===== //
function addProductEventListeners() {
  // Add to Cart
  document.querySelectorAll(".add-to-cart").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const productId = e.currentTarget.dataset.id;
      const product = allProducts.find((p) => p._id === productId);
      
      if (!product) return;

      let cart = getCart();
      const existing = cart.find((item) => item._id === productId);

      if (existing) {
        existing.qty += 1;
      } else {
        cart.push({ ...product, qty: 1 });
      }

      saveCart(cart);
      
      // Show success message
      const target = e.currentTarget;
      const originalText = target.textContent;
      target.textContent = "Added!";
      target.classList.add("bg-green-500");
      setTimeout(() => {
        target.textContent = originalText;
        target.classList.remove("bg-green-500");
      }, 1000);
    });
  });

  // Wishlist toggle
  document.querySelectorAll(".wishlist-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const productId = e.currentTarget.dataset.id;
      let wishlist = getWishlist();

      if (wishlist.includes(productId)) {
        wishlist = wishlist.filter((id) => id !== productId);
      } else {
        wishlist.push(productId);
      }

      saveWishlist(wishlist);
      renderProducts(filteredProducts.length ? filteredProducts : allProducts);
    });
  });

  // View Details
  document.querySelectorAll(".view-detail").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const productId = e.currentTarget.dataset.id;
      window.location.href = `detail.html?id=${productId}`;
    });
  });
}

// ===== RESULTS HEADER INFO ===== //
function updateResultsInfo(list) {
  const info = document.getElementById('results-info');
  if (!info) return;
  const urlParams = new URLSearchParams(window.location.search);
  const term = urlParams.get('search');
  const cat = urlParams.get('category');
  const activeSearch = document.getElementById('active-search');
  const activeSearchVal = activeSearch?.querySelector('span');
  const activeCategory = document.getElementById('active-category');
  const activeCategoryVal = activeCategory?.querySelector('span');
  const resultsCount = document.getElementById('results-count');
  const clearBtn = document.getElementById('clear-filters');

  let any = false;
  if (term) {
    activeSearch?.classList.remove('hidden');
    if (activeSearchVal) activeSearchVal.textContent = term;
    any = true;
  } else {
    activeSearch?.classList.add('hidden');
  }
  if (cat) {
    activeCategory?.classList.remove('hidden');
    if (activeCategoryVal) activeCategoryVal.textContent = cat;
    any = true;
  } else {
    activeCategory?.classList.add('hidden');
  }
  if (resultsCount) resultsCount.textContent = `${(list || []).length} results`;
  if (any) info.classList.remove('hidden'); else info.classList.add('hidden');
  clearBtn?.addEventListener('click', () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('search');
    url.searchParams.delete('category');
    window.location.href = url.toString();
  });
}

// ===== INITIALIZE PAGE ===== //
async function initializePage() {
  updateCartCount();

  const urlParams = new URLSearchParams(window.location.search);
  const searchQuery = urlParams.get('search');
  const categoryQuery = urlParams.get('category');
  
  await fetchProducts();

  if (searchQuery) {
    const searchInputs = document.querySelectorAll('#product-search, #product-search-user');
    searchInputs.forEach(input => {
      input.value = searchQuery;
    });
    await searchProducts(searchQuery);
    updateResultsInfo(filteredProducts);
  } else if (categoryQuery) {
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
      categoryFilter.value = categoryQuery;
    }
    await filterProducts();
    updateResultsInfo(filteredProducts);
  } else {
    filteredProducts = [...allProducts];
    renderProducts(filteredProducts);
    updateResultsInfo(filteredProducts);
  }

  // Search functionality
  const searchInputs = document.querySelectorAll('#product-search, #product-search-user');
  searchInputs.forEach(input => {
    input.addEventListener('input', (e) => {
      searchProducts(e.target.value);
    });
  });

  // Filter functionality
  const filterSelects = document.querySelectorAll('#category-filter, #price-filter, #sort-filter');
  filterSelects.forEach(select => {
    select.addEventListener('change', filterProducts);
  });

  // Search form submission
  const searchForms = document.querySelectorAll('form');
  searchForms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="search"]');
      if (input) {
        searchProducts(input.value);
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", initializePage);
