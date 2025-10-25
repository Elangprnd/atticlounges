// Inject a unified header and search overlay across all pages
(function mountUnifiedHeader() {
  document.addEventListener('DOMContentLoaded', () => {
    // Skip if unified header already present (index.html)
    if (document.getElementById('mainHeader')) return;

    // Remove any existing page-specific headers to prevent duplicates
    document.querySelectorAll('header').forEach(h => h.remove());

    const isInPages = window.location.pathname.includes('/pages/');
    const base = isInPages ? '..' : '.';
    const to = (p) => isInPages ? p.replace('pages/', '') : p; // link to pages when at root
    const pageHref = (p) => isInPages ? p : `pages/${p}`;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
    <header id="mainHeader" class="fixed top-0 left-0 w-full z-50 bg-white/60 backdrop-blur-md shadow-sm border-b border-gray-200">
      <nav class="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <img id="logo" src="${base}/src/img/Attic%20Lounges.png" alt="AtticLounges logo" class="h-8 w-auto md:h-10 object-contain" />
        </div>
        <ul class="hidden md:flex items-center justify-center gap-8 font-medium text-[18px] text-gray-700">
          <li><a href="${isInPages ? '../index.html#hero-section' : '#hero-section'}" class="hover:text-gray-900 transition-colors duration-200">HOME</a></li>
          <li><a href="${pageHref('product.html')}" class="hover:text-gray-900 transition-colors duration-200">PRODUCT</a></li>
          <li><a href="${isInPages ? '../index.html#categories-section' : '#categories-section'}" class="hover:text-gray-900 transition-colors duration-200">CATEGORY</a></li>
          <li>
            <button id="searchBtn" class="hover:text-gray-900 transition-colors duration-200 flex items-center">
              <img src="https://cdn-icons-png.flaticon.com/128/3031/3031293.png" alt="Search Icon" class="w-5 h-5 object-contain"/>
            </button>
          </li>
        </ul>
        <div id="headerRight" class="flex items-center gap-4">
          <div id="guestButtons" class="flex items-center gap-2">
            <button id="login" class="px-4 py-1.5 rounded-[4px] text-base font-bold hover:text-[#382E2A] text-[#8C5E3C] transition">LOGIN</button>
            <button id="sign-up" class="px-4 py-1.5 rounded-[4px] text-sm font-medium bg-[#8C5E3C] hover:bg-[#382E2A] text-white shadow-md transition">SIGN UP</button>
          </div>
          <div id="userButtons" class="hidden items-center flex gap-4">
            <a href="${pageHref('cart.html')}" id="cartBtn" class="relative hover:text-gray-900 transition">
              <img src="https://cdn-icons-png.flaticon.com/128/1170/1170678.png" alt="" class="w-6 h-6">
              <span id="cart-count-user" class="hidden absolute -top-1 -right-2 bg-red-500 text-white text-[10px] leading-none px-1.5 py-0.5 rounded-full"></span>
            </a>
            <a href="${pageHref('wishlist.html')}" id="heartBtn" class="hover:text-gray-900 transition">
              <img src="https://cdn-icons-png.flaticon.com/128/1077/1077035.png" alt="" class="w-6 h-6">
            </a>
            <a href="${pageHref('chat.html')}" id="chatBtn" class="hover:text-gray-900 transition">
              <img src="https://cdn-icons-png.flaticon.com/128/9458/9458241.png" alt="" class="w-6 h-6">
            </a>
          </div>
          
          <div id="universalProfile" class="relative group hidden">
            <button id="my-account-btn" class="flex items-center gap-2 px-4 py-1 rounded-md text-sm font-medium border border-gray-300 hover:bg-gray-100 transition">
              <img id="profile-img" src="https://res.cloudinary.com/dxf64h9fe/image/upload/v1760354998/download_13_z7b0lk.jpg" alt="User" class="w-7 h-7 rounded-full">
              <span id="profile-text">Account</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            <div id="account-dropdown" class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden"></div>
          </div>
        </div>
      </nav>
    </header>
    <div id="searchOverlay" class="hidden fixed inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center pt-28 z-40">
      <div class="bg-white w-full max-w-3xl mx-auto p-6 rounded-2xl shadow-lg relative">
        <form>
          <input type="search" placeholder="Search products..." class="w-full p-3 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400" />
        </form>
        <button id="closeSearch" class="absolute top-1 right-2 text-gray-400 hover:text-gray-700 transition text-lg font-semibold">&times;</button>
      </div>
    </div>
    <div class="h-16 md:h-20 bg-[#EDE0D4]"></div>
    `;

    document.body.prepend(wrapper);
  });
})();


