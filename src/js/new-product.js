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
        container.innerHTML = '<p class="text-center w-full py-10">Belum ada koleksi terbaru.</p>';
        return;
      }

      const displayProducts = products.slice(0, MAX_PRODUCTS);
      const wishlist = getWishlist().map(String);

      container.innerHTML = displayProducts.map(product => {
        const idStr = String(product._id || product.id);
        const isWishlisted = wishlist.includes(idStr);
        const isSold = product.is_sold === true || product.isSold === true;
        
        return `
          <div class="product-card flex-shrink-0 w-[280px] bg-white p-4 shadow-md hover:shadow-xl border border-gray-100 rounded-xl text-left snap-start transition-all duration-300 ${isSold ? 'opacity-75' : ''}">
            <div class="relative h-64 mb-4 overflow-hidden rounded-lg bg-gray-100 group">
              <img src="${product.image}" alt="${product.name}" class="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110">
              ${isSold ? '<div class="absolute inset-0 bg-black/20 flex items-center justify-center"><span class="bg-red-600 text-white px-4 py-1 rounded-full text-sm font-bold">SOLD</span></div>' : ''}
            </div>
            <div class="space-y-2">
              <span class="inline-block bg-[#F3E5D8] text-[#8C5E3C] rounded-full px-3 py-0.5 text-[10px] font-bold uppercase">${product.category}</span>
              <h3 class="text-base font-bold text-gray-800 line-clamp-1">${product.name}</h3>
              <p class="text-[#93392C] text-lg font-extrabold">Rp ${Number(product.price).toLocaleString('id-ID')}</p>
              <div class="flex space-x-2 pt-2">
                <button onclick="window.location.href='pages/detail.html?id=${idStr}'" class="flex-1 px-3 py-2.5 text-xs font-bold text-[#382E2A] border-2 border-[#382E2A] hover:bg-[#382E2A] hover:text-white rounded-lg text-center transition-all">DETAILS</button>
                <button class="flex-1 px-3 py-2.5 text-xs font-bold ${isSold ? 'bg-gray-300 text-gray-500' : 'bg-[#DC9C84] text-white hover:bg-[#93392C]'} rounded-lg transition-all" ${isSold ? 'disabled' : ''}>${isSold ? 'SOLD' : 'ADD TO CART'}</button>
              </div>
            </div>
          </div>`;
      }).join('');

    } catch (error) {
      console.error('New Arrival Error:', error);
      container.innerHTML = '<p class="text-center w-full py-10 text-red-500">Gagal memuat produk terbaru.</p>';
    }
  }

  document.addEventListener('DOMContentLoaded', initNewArrivals);
}