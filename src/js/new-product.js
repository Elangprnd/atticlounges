// ===== CONFIGURATION ===== //
const API_URL = '/api/products';
const MAX_PRODUCTS = 8; // batas untuk “new products”
let allProducts = [];
let filteredProducts = [];

// Normalize product id to a stable string
function getProductId(product) {
  const raw = product?._id ?? product?.id ?? '';
  return String(raw);
}

// Small helper to add a class temporarily for micro animations
function addTemporaryClass(el, className, durationMs = 300) {
  if (!el) return;
  el.classList.add(className);
  setTimeout(() => el.classList.remove(className), durationMs);
}

// ===== USER & CART UTILITIES ===== //
function getCurrentUserId() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.id || null;
}

// Check if current user is admin
function isAdmin() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.role === 'owner' || localStorage.getItem('isAdmin') === 'true';
}

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

function updateCartCount() {
  const cart = getCart();
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const cartCounts = document.querySelectorAll('#cart-count, #cart-count-user');
  cartCounts.forEach(el => {
    if (totalItems > 0) {
      el.textContent = totalItems;
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  });
}

// ===== WISHLIST UTILITIES ===== //
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

// ===== FETCH PRODUCTS ===== //
async function fetchProducts() {
  try {
    console.log('Fetching products from:', API_URL);
    const response = await fetch(API_URL, { mode: 'cors' });
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      console.error('HTTP Error:', response.status, response.statusText);
      throw new Error(`HTTP Error ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Fetched data:', data);

    if (!Array.isArray(data)) {
      if (data.products && Array.isArray(data.products)) {
        allProducts = data.products;
      } else {
        throw new Error('Format data API tidak valid');
      }
    } else {
      allProducts = data;
    }

    console.log('All products loaded:', allProducts.length);
    return allProducts;
  } catch (error) {
    console.error('Gagal fetch produk:', error);
    return [];
  }
}

// ===== INIT CAROUSEL NEW PRODUCTS ===== //
async function initNewProductsCarousel() {
    console.log('Initializing new products carousel...');
    const allProducts = await fetchProducts();
    console.log('All products received:', allProducts.length);
    
    // Asumsi: Produk terbaru berada di awal array, 
    // jika produk terbaru ada di akhir, gunakan .reverse() dulu.
    // Jika perlu mengurutkan berdasarkan tanggal buat (_createdAt), lakukan di sini.
    
    const newProducts = allProducts.slice(0, MAX_PRODUCTS); // Ambil 8 produk pertama
    console.log('New products to display:', newProducts.length);
    
    // Ganti teks "Memuat produk..." dengan produk yang sudah di-render
    await renderProducts(newProducts);
}

// ===== EVENT LISTENER UTAMA ===== //
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Starting initialization...');
    
    // 1. Inisialisasi hitungan keranjang
    updateCartCount();
    
    // 2. Inisialisasi hitungan wishlist
    updateWishlistCount();

    // 2. Test API connection first
    testAPIConnection().then(() => {
        // 3. Inisialisasi New Products Carousel
        initNewProductsCarousel();
    }).catch(error => {
        console.error('API connection failed:', error);
        const container = document.getElementById("productList");
        if (container) {
            container.innerHTML = `<p class="text-center w-full text-red-600">Error loading products. Please check console for details.</p>`;
        }
    });

    // Catatan: Pastikan elemen HTML untuk New Arrival sudah ada di halaman.
});

// Test API connection
async function testAPIConnection() {
    try {
        console.log('Testing API connection...');
        const response = await fetch('/api/test');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        console.log('API test successful:', data);
        return true;
    } catch (error) {
        console.error('API test failed:', error);
        throw error;
    }
}

// ===== FORMAT RUPIAH ===== //
function formatRupiah(amount) {
  const numericAmount = typeof amount === 'number' ? amount : 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(numericAmount);
}

// ===== RENDER PRODUCT LIST =====
async function renderProducts(productList) {
    console.log('Rendering products:', productList.length);
    const container = document.getElementById("productList");
    if (!container) {
        console.error('Container productList not found!');
        return;
    }

    try {
        if (!productList.length) {
            console.log('No products to display');
            container.innerHTML = `<p class="text-center w-full text-gray-600">Belum ada produk tersedia.</p>`;
            return;
        }

        // 1. Dapatkan daftar wishlist SEBELUM mapping, pastikan semuanya string
        const wishlist = getWishlist().map(String); // <-- Tambahkan .map(String) di sini juga

        // 2. Lakukan mapping sambil menentukan ikon dan kelas berdasarkan status wishlist
        container.innerHTML = productList
            .map((product) => {
              const idStr = String(getProductId(product));
              const isWishlisted = wishlist.includes(idStr); // ✅ gunakan variabel yang sudah ada
              const isSold = product.isSold === true; // Hanya cek isSold, tidak cek stock

              const wishlistIcon = isWishlisted
                ? "https://cdn-icons-png.flaticon.com/128/833/833472.png" // ❤ hati penuh
                : "https://cdn-icons-png.flaticon.com/128/833/833300.png"; // 🤍 hati kosong

                const imageUrl = product.image || "https://via.placeholder.com/280x250?text=No+Image";
                const productName = product.name || "Produk Tanpa Nama";
                const categoryName = (typeof product.category === 'string' ? product.category : (product.category?.name || "Tanpa Kategori"));
                const priceFormatted = formatRupiah(product.price); // Gunakan formatRupiah

                return `
                <div class="product-card flex-shrink-0 w-[280px] bg-white p-4 shadow-md hover:shadow-xl border border-gray-100 rounded-xl text-left snap-start transition-all duration-300 ${isSold ? 'opacity-75' : ''}">

                    <div class="relative h-64 mb-4 overflow-hidden rounded-lg bg-gray-100 group">
                        <img 
                            src="${imageUrl}" 
                            alt="${productName}" 
                            class="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                            onerror="this.onerror=null; this.src='https://via.placeholder.com/280x250?text=Gagal+Memuat+Gambar';"
                        >

                        ${isSold ? `<div class="absolute inset-0 bg-black/20 flex items-center justify-center">
                            <span class="bg-red-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">SOLD</span>
                        </div>` : ''}

                        ${!isAdmin() && !isSold ? `<button 
                            class="wishlist-btn absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-md hover:bg-white hover:scale-110 transition-all z-10"
                            data-id="${idStr}">
                            <img src="${wishlistIcon}" alt="Wishlist" class="w-5 h-5">
                        </button>` : ''}
                    </div>

                    <div class="space-y-2">
                        <span class="inline-block bg-[#F3E5D8] text-[#8C5E3C] rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                            ${categoryName}
                        </span>
                        
                        <h3 class="text-base font-bold text-gray-800 line-clamp-1 h-6">${productName}</h3>
                        
                        <p class="text-[#93392C] text-lg font-extrabold">${priceFormatted}</p>
                        
                        <div class="flex space-x-2 pt-2">
                            <button class="view-detail flex-1 px-3 py-2.5 text-xs font-bold text-[#382E2A] border-2 border-[#382E2A] hover:bg-[#382E2A] hover:text-white rounded-lg text-center transition-all duration-200" data-id="${idStr}">
                                DETAILS
                            </button>
                            <button class="add-to-cart flex-1 px-3 py-2.5 text-xs font-bold ${isSold ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#DC9C84] text-white hover:bg-[#93392C] shadow-md hover:shadow-lg'} rounded-lg transition-all duration-200" data-id="${idStr}" ${isSold ? 'disabled' : ''}>
                                ${isSold ? 'SOLD OUT' : (isAdmin() ? 'EDIT' : 'ADD TO CART')}
                            </button>
                        </div>
                    </div>
                </div>`;
            })
            .join("");
      
    container.querySelectorAll(".wishlist-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            const productId = e.currentTarget.dataset.id;
            toggleWishlist(productId, e.currentTarget);
        // micro feedback on wishlist click
        addTemporaryClass(e.currentTarget, 'ring-2 ring-red-300');
        addTemporaryClass(e.currentTarget, 'scale-90', 120);
        });
    });

    // ===== EVENT LISTENERS =====
    // View details
    container.querySelectorAll(".view-detail").forEach(btn => {
        btn.addEventListener("click", e => {
            const productId = e.currentTarget.dataset.id;
            window.location.href = `pages/detail.html?id=${productId}`;
        });
    });

    // Add to cart / Edit
    container.querySelectorAll('.add-to-cart').forEach(btn => {
      btn.addEventListener('click', async e => {
        // If admin, redirect to admin page
        if (isAdmin()) {
          window.location.href = 'pages/admin.html';
          return;
        }
        
        // If regular user, add to cart
        const productId = String(e.currentTarget.dataset.id);
        const clickedBtn = e.currentTarget;
        try {
          const response = await fetch(`${API_URL}/${productId}`);
          if (!response.ok) throw new Error('Product not found');
          const product = await response.json();
          
          // Check if product is sold
          if (product.isSold === true) {
            alert('Produk ini sudah terjual!');
            return;
          }
          
          const idStr = getProductId(product) || productId;
          const cartItem = {
            _id: idStr,
            id: idStr,
            name: product.name,
            price: product.price,
            image: product.image,
            qty: 1
          };
          let cart = getCart();
          const existing = cart.find(item => String(item._id ?? item.id) === idStr);
          if (existing) {
            alert('Produk ini sudah ada di keranjang! (Thrift store: setiap produk hanya ada 1)');
            return;
          } else {
            cart.push(cartItem);
          }
          saveCart(cart);
          updateCartCount();

          // visual feedback: button pulse + temporary label + cart badge bounce
          const originalText = clickedBtn.textContent;
          clickedBtn.disabled = true;
          addTemporaryClass(clickedBtn, 'scale-95', 120);
          clickedBtn.textContent = 'Added!';
          setTimeout(() => {
            clickedBtn.textContent = originalText;
            clickedBtn.disabled = false;
          }, 700);

          // bounce cart badge briefly if visible
          const cartBadges = document.querySelectorAll('#cart-count, #cart-count-user');
          cartBadges.forEach(b => addTemporaryClass(b, 'animate-bounce', 600));
        } catch (err) {
          console.error('Failed adding to cart', err);
          alert('Failed to add product to cart');
        }
      });
    });
  } catch (err) {
    console.error("Error rendering products:", err);
    container.innerHTML = `<p class="text-center w-full text-red-600">Gagal memuat produk.</p>`;
  }
}
 
// Tombol scroll kanan kiri
function scrollProducts(direction) {
    const productList = document.getElementById('productList');
    // Tentukan lebar geseran. Kita akan geser sebesar lebar kontainer
    // atau sedikit lebih kecil untuk menunjukkan produk berikutnya sebagian.
    const scrollAmount = productList.clientWidth; 
    
    if (direction === 'next') {
        // Geser ke kanan (maju)
        productList.scrollBy({
            left: scrollAmount,
            behavior: 'smooth'
        });
    } else if (direction === 'prev') {
        // Geser ke kiri (mundur)
        productList.scrollBy({
            left: -scrollAmount, // Nilai negatif untuk mundur
            behavior: 'smooth'
        });
    }
}

// ===== TOGGLE WISHLIST (Memastikan Logika Ikon Sesuai) ===== //
function toggleWishlist(productId, btn) {
  const idStr = String(productId);
  let wishlist = getWishlist().map(String);
  const img = btn.querySelector("img");

  const index = wishlist.indexOf(idStr);
  const isWishlisted = index !== -1;

  if (isWishlisted) {
    // Hapus dari wishlist
    wishlist.splice(index, 1);
    img.src = "https://cdn-icons-png.flaticon.com/128/833/833300.png"; // hati kosong 🤍
  } else {
    // Tambahkan ke wishlist
    wishlist.push(idStr);
    img.src = "https://cdn-icons-png.flaticon.com/128/833/833472.png"; // hati penuh ❤️
  }

  saveWishlist(wishlist);

  // Efek mikro (animasi klik)
  addTemporaryClass(btn, "ring-2 ring-red-300");
  addTemporaryClass(btn, "scale-90", 120);
}