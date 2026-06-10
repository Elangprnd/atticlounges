// ===== NEW ARRIVAL CAROUSEL ===== //
{
  const API_URL = '/api/products';
  const MAX_PRODUCTS = 8;
  let localProducts = [];

  // Update wishlist icon and logic
  function getWishlist() {
    const userId = JSON.parse(localStorage.getItem('user') || '{}').id;
    const wishlistKey = userId ? `wishlist_${userId}` : 'wishlist_guest';
    return JSON.parse(localStorage.getItem(wishlistKey) || '[]');
  }

  async function initNewArrivals() {
    const container = document.getElementById("productList");
    if (!container) return;

    try {
      console.log('Fetching New Arrivals...');
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('API Error: ' + response.status);
      
      const data = await response.json();
      const products = Array.isArray(data) ? data : (data.products || []);
      
      if (products.length === 0) {
        container.innerHTML = '<p class="text-center col-span-full py-10">Belum ada koleksi terbaru.</p>';
        return;
      }

      const displayProducts = products.slice(0, MAX_PRODUCTS);
      // Use the global getWishlist from app.js if available
      const wishlist = (typeof getWishlist === 'function' ? getWishlist() : []).map(String);
      const adminStatus = typeof isAdmin === 'function' ? isAdmin() : false;

      container.innerHTML = displayProducts.map(product => {
        const idStr = String(product._id || product.id);
        const isWishlisted = wishlist.includes(idStr);
        const isSold = product.is_sold === true || product.isSold === true;
        
        return `
          <div class="group flex-shrink-0 w-72 md:w-80 bg-white rounded-lg shadow-md overflow-hidden transition ${isSold ? 'opacity-75' : 'hover:shadow-xl hover:-translate-y-2'} relative snap-start">
            ${isSold ? `<!-- SOLD Badge -->
            <div class="absolute left-4 top-4 z-20 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-md">
              SOLD
            </div>` : ''}
            
            ${!adminStatus && !isSold ? `<!-- Wishlist Button -->
            <button 
              class="wishlist-btn absolute right-4 top-4 z-20 rounded-full bg-white p-1.5 transition-colors shadow-md"
              data-id="${idStr}">
              <svg xmlns="http://www.w3.org/2000/svg" fill="${isWishlisted ? "red" : "none"}" 
                viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" 
                class="size-5 ${isWishlisted ? "text-red-500" : "text-gray-900"}">
                <path stroke-linecap="round" stroke-linejoin="round" 
                  d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 
                  0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733
                  -4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 
                  7.22 9 12 9 12s9-4.78 9-12z"/>
              </svg>
            </button>` : ''}

            <!-- Product Image -->
            <div class="aspect-square overflow-hidden">
              <img src="${product.image}" alt="${product.name}" 
                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105">
            </div>

            <!-- Product Info -->
            <div class="p-4 flex flex-col gap-2 text-left">
              <div class="flex items-center justify-between">
                <span class="bg-gray-100 px-2 py-1 text-xs font-medium rounded-full text-gray-600">
                  ${product.category}
                </span>
              </div>
              <h3 class="text-sm sm:text-base font-semibold text-gray-900 line-clamp-2">${product.name}</h3>
              <p class="text-base sm:text-lg font-bold text-gray-900">Rp ${Number(product.price).toLocaleString("id-ID")}</p>
              
              <!-- Action Buttons -->
              <div class="mt-3 flex space-x-2">
                <button class="view-detail flex-1 text-center rounded-md text-xs sm:text-sm py-2 font-medium text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 transition" 
                        data-id="${idStr}">
                  View Details
                </button>
                <button class="add-to-cart flex-1 text-center rounded-md text-xs sm:text-sm py-2 font-medium text-white ${isSold ? 'bg-gray-400 cursor-not-allowed' : (adminStatus ? 'bg-[#8C5E3C] hover:bg-[#382E2A]' : 'bg-[#DC9C84] hover:bg-[#93392C]')} transition" 
                        data-id="${idStr}" ${isSold ? 'disabled' : ''}>
                  ${isSold ? 'SOLD' : (adminStatus ? 'Edit' : 'Add to Cart')}
                </button>
              </div>
            </div>
          </div>`;
      }).join('');

      // Add event listeners for the newly rendered products
      if (typeof addProductEventListeners === 'function') {
        addProductEventListeners();
      }

    } catch (error) {
      console.error('New Arrival Error:', error);
      container.innerHTML = '<p class="text-center w-full py-10 text-red-500">Gagal memuat produk terbaru.</p>';
    }
  }

  document.addEventListener('DOMContentLoaded', initNewArrivals);
}