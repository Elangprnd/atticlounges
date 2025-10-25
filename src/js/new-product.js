// ===== CONFIGURATION ===== //
const API_URL = 'http://localhost:4002/api/products';
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
      el.classList.remove('bg-red-500');
      el.classList.add('text-gray-800', 'font-semibold');
    } else el.classList.add('hidden');
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
}

// ===== FETCH PRODUCTS ===== //
async function fetchProducts() {
  try {
    const response = await fetch(API_URL, { mode: 'cors' });
    if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
    const data = await response.json();

    if (!Array.isArray(data)) {
      if (data.products && Array.isArray(data.products)) {
        allProducts = data.products;
      } else {
        throw new Error('Format data API tidak valid');
      }
    } else {
      allProducts = data;
    }

    return allProducts;
  } catch (error) {
    console.error('Gagal fetch produk:', error);
    return [];
  }
}

// ===== INIT CAROUSEL NEW PRODUCTS ===== //
async function initNewProductsCarousel() {
    const allProducts = await fetchProducts();
    
    // Asumsi: Produk terbaru berada di awal array, 
    // jika produk terbaru ada di akhir, gunakan .reverse() dulu.
    // Jika perlu mengurutkan berdasarkan tanggal buat (_createdAt), lakukan di sini.
    
    const newProducts = allProducts.slice(0, MAX_PRODUCTS); // Ambil 8 produk pertama
    
    // Ganti teks "Memuat produk..." dengan produk yang sudah di-render
    await renderProducts(newProducts);
}

// ===== EVENT LISTENER UTAMA ===== //
document.addEventListener('DOMContentLoaded', () => {
    // 1. Inisialisasi hitungan keranjang
    updateCartCount();

    // 2. Inisialisasi New Products Carousel
    initNewProductsCarousel();

    // Catatan: Pastikan elemen HTML untuk New Arrival sudah ada di halaman.
});

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
    const container = document.getElementById("productList");
    if (!container) return;

    try {
        if (!productList.length) {
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

              const wishlistIcon = isWishlisted
                ? "https://cdn-icons-png.flaticon.com/128/833/833472.png" // ❤ hati penuh
                : "https://cdn-icons-png.flaticon.com/128/833/833300.png"; // 🤍 hati kosong

                const imageUrl = product.image || "https://via.placeholder.com/280x250?text=No+Image";
                const productName = product.name || "Produk Tanpa Nama";
                const categoryName = (typeof product.category === 'string' ? product.category : (product.category?.name || "Tanpa Kategori"));
                const priceFormatted = formatRupiah(product.price); // Gunakan formatRupiah

                return `
                <div class="product-card flex-shrink-0 w-72 md:w-[280px] bg-white p-4 shadow-lg border border-gray-100 rounded-[5px] text-left snap-start">

                    <div class="relative h-64 mb-3 overflow-hidden flex items-center justify-center bg-gray-100">
                        <img 
                            src="${imageUrl}" 
                            alt="${productName}" 
                            class="object-cover w-full h-full"
                            onerror="this.onerror=null; this.src='https://via.placeholder.com/280x250?text=Gagal+Memuat+Gambar';"
                        >

                        <button 
                            class="wishlist-btn absolute top-2 right-2 bg-white/80 backdrop-blur-md rounded-full p-2 shadow hover:bg-red-100 transition"
                            data-id="${idStr}">
                            <img src="${wishlistIcon}" alt="Wishlist" class="w-5 h-5">
                        </button>
                    </div>

                    <span class="inline-block bg-[#E4CDA7] rounded-[5px] px-2 py-1 text-xs font-semibold uppercase mb-2">
                        ${categoryName}
                    </span>
                    
                    <h3 class="text-lg font-bold uppercase truncate mb-1">${productName}</h3>
                    
                    <p class="text-red-700 text-lg font-semibold mb-4">${priceFormatted}</p>
                    
                    <div class="flex space-x-2">
                        <button class="view-detail flex-1 px-3 py-2 text-sm text-[#382E2A] border border-[#382E2A] hover:bg-gray-100 rounded-[5px] text-center transition duration-150" data-id="${idStr}">
                            View Detail
                        </button>
                        <button class="add-to-cart flex-1 px-3 py-2 text-sm bg-[#8C5E3C] text-white hover:bg-[#382E2A] rounded-[5px] transition duration-150" data-id="${idStr}">
                            Add To Cart
                        </button>
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

    // Add to cart
    container.querySelectorAll('.add-to-cart').forEach(btn => {
      btn.addEventListener('click', async e => {
        const productId = String(e.currentTarget.dataset.id);
        const clickedBtn = e.currentTarget;
        try {
          const response = await fetch(`${API_URL}/${productId}`);
          if (!response.ok) throw new Error('Product not found');
          const product = await response.json();
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
          if (existing) existing.qty += 1; else cart.push(cartItem);
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
    img.src = "https://cdn-icons-png.flaticon.com/128/833/833472.png"; // hati kosong 🤍
  } else {
    // Tambahkan ke wishlist
    wishlist.push(idStr);
    img.src = "https://cdn-icons-png.flaticon.com/128/833/833300.png"; // hati penuh ❤️
  }

  saveWishlist(wishlist);

  // Efek mikro (animasi klik)
  addTemporaryClass(btn, "ring-2 ring-red-300");
  addTemporaryClass(btn, "scale-90", 120);
}