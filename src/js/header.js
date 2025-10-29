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
    <header id="mainHeader" class="fixed top-0 left-0 w-full z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200">
      <nav class="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <!-- Logo dan Hamburger Menu -->
        <div class="flex items-center gap-2">
          <!-- Hamburger Menu Button (Mobile) -->
          <button id="mobileMenuBtn" class="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-md text-gray-700 hover:bg-gray-100 transition-colors" aria-label="Toggle menu" aria-expanded="false">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
          <!-- Logo -->
          <img id="logo" src="${base}/src/img/Attic%20Lounges.png" alt="AtticLounges logo" class="h-8 w-auto md:h-10 object-contain" />
        </div>

        <!-- Desktop Navigation Menu -->
        <ul class="hidden md:flex items-center justify-center gap-8 font-medium text-[18px] text-gray-700">
          <li><a href="${isInPages ? '../index.html#hero-section' : '#hero-section'}" class="hover:text-gray-900 transition-colors duration-200">HOME</a></li>
          <li><a href="${pageHref('product.html')}" class="hover:text-gray-900 transition-colors duration-200">PRODUCT</a></li>
          <li><a href="${isInPages ? '../index.html#categories-section' : '#categories-section'}" class="hover:text-gray-900 transition-colors duration-200" onclick="handleCategoryClick(event)">CATEGORY</a></li>
          <li>
            <button id="searchBtn" class="hover:text-gray-900 transition-colors duration-200 flex items-center">
              <img src="https://cdn-icons-png.flaticon.com/128/3031/3031293.png" alt="Search Icon" class="w-5 h-5 object-contain"/>
            </button>
          </li>
        </ul>

        <!-- Right Side Buttons -->
        <div id="headerRight" class="flex items-center gap-4">
          <!-- Guest Buttons -->
          <div id="guestButtons" class="flex items-center gap-2">
            <button id="login" class="px-4 py-1.5 rounded-[4px] text-base font-bold hover:text-[#382E2A] text-[#8C5E3C] transition">LOGIN</button>
            <button id="sign-up" class="px-4 py-1.5 rounded-[4px] text-sm font-medium bg-[#8C5E3C] hover:bg-[#382E2A] text-white shadow-md transition">SIGN UP</button>
          </div>
          
          <!-- User Buttons -->
          <div id="userButtons" class="hidden items-center flex gap-4">
            <a href="${pageHref('cart.html')}" id="cartBtn" class="relative hover:text-gray-900 transition">
              <img src="https://cdn-icons-png.flaticon.com/128/1170/1170678.png" alt="Cart" class="w-6 h-6">
              <span id="cart-count-user" class="hidden absolute -top-1 -right-2 bg-red-500 text-white text-[10px] leading-none px-1.5 py-0.5 rounded-full"></span>
            </a>
            <a href="${pageHref('wishlist.html')}" id="heartBtn" class="relative hover:text-gray-900 transition">
              <img src="https://cdn-icons-png.flaticon.com/128/1077/1077035.png" alt="Wishlist" class="w-6 h-6">
              <span id="wishlist-count-user" class="hidden absolute -top-1 -right-2 bg-red-500 text-white text-[10px] leading-none px-1.5 py-0.5 rounded-full"></span>
            </a>
            <a href="${pageHref('chat.html')}" id="chatBtn" class="hover:text-gray-900 transition">
              <img src="https://cdn-icons-png.flaticon.com/128/9458/9458241.png" alt="Chat" class="w-6 h-6">
            </a>
          </div>

          <!-- Admin Buttons -->
          <div id="adminButtons" class="hidden items-center gap-4">
            <button id="manage-products-btn-user" class="px-5 py-2 text-sm font-semibold bg-[#382E2A] text-white rounded-[5px] hover:bg-[#8C5E3C] transition-all duration-200 shadow-sm">Manage Products</button>
          </div>
          
          <!-- Profile Dropdown -->
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

      <!-- Mobile Menu -->
      <div id="mobileMenu" class="md:hidden absolute left-0 right-0 top-full bg-white border-t border-gray-200 shadow-lg transform -translate-y-full opacity-0 transition-all duration-300 ease-in-out" style="max-height: 0; overflow: hidden;">
        <div class="px-4 py-3 space-y-3">
          <!-- Mobile Search -->
          <div class="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2">
            <img src="https://cdn-icons-png.flaticon.com/128/3031/3031293.png" alt="Search" class="w-4 h-4 opacity-80"/>
            <input id="mobileSearchInput" type="search" placeholder="Search products..." class="flex-1 text-sm outline-none" />
            <button id="mobileSearchBtn" class="text-sm font-medium text-white bg-[#8C5E3C] hover:bg-[#382E2A] px-3 py-1 rounded-md">Go</button>
          </div>
          
          <!-- Mobile Navigation Links -->
          <a href="${isInPages ? '../index.html#hero-section' : '#hero-section'}" class="block text-gray-800 text-base font-medium py-2 rounded-md hover:bg-gray-50 px-2">HOME</a>
          <a href="${pageHref('product.html')}" class="block text-gray-800 text-base font-medium py-2 rounded-md hover:bg-gray-50 px-2">PRODUCT</a>
          <a href="${isInPages ? '../index.html#categories-section' : '#categories-section'}" class="block text-gray-800 text-base font-medium py-2 rounded-md hover:bg-gray-50 px-2">CATEGORY</a>
          
          <!-- Mobile User Actions -->
          <div id="mobileUserActions" class="hidden pt-3 border-t border-gray-200 space-y-2">
            <a href="${pageHref('cart.html')}" class="flex items-center gap-3 text-gray-800 text-base font-medium py-2 rounded-md hover:bg-gray-50 px-2">
              <img src="https://cdn-icons-png.flaticon.com/128/1170/1170678.png" alt="Cart" class="w-5 h-5">
              <span>Cart</span>
            </a>
            <a href="${pageHref('wishlist.html')}" class="flex items-center gap-3 text-gray-800 text-base font-medium py-2 rounded-md hover:bg-gray-50 px-2">
              <img src="https://cdn-icons-png.flaticon.com/128/1077/1077035.png" alt="Wishlist" class="w-5 h-5">
              <span>Wishlist</span>
            </a>
            <a href="${pageHref('chat.html')}" class="flex items-center gap-3 text-gray-800 text-base font-medium py-2 rounded-md hover:bg-gray-50 px-2">
              <img src="https://cdn-icons-png.flaticon.com/128/9458/9458241.png" alt="Chat" class="w-5 h-5">
              <span>Chat</span>
            </a>
          </div>
        </div>
      </div>
    </header>
    <div id="searchOverlay" class="hidden fixed inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center pt-28 z-40">
      <div class="bg-white w-full max-w-3xl mx-auto p-6 rounded-2xl shadow-lg relative">
        <form>
          <input type="search" placeholder="Search products..." class="w-full p-3 text-gray-700 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400" />
        </form>
        <button id="closeSearch" class="absolute top-1 right-2 text-gray-400 hover:text-gray-700 transition text-lg font-semibold">&times;</button>
      </div>
    </div>
    <div class="h-16 md:h-20"></div>
    `;

    document.body.prepend(wrapper);

    // Add CSS to ensure header covers the brown strip properly
    const style = document.createElement('style');
    style.textContent = `
      #mainHeader {
        background: linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.95) 100%);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
      }
      @media (min-width: 1280px) {
        #mainHeader {
          background: rgba(255,255,255,0.98);
        }
      }
    `;
    document.head.appendChild(style);

    // Mobile Menu Functionality
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const searchBtn = document.getElementById('searchBtn');
    const searchOverlay = document.getElementById('searchOverlay');
    const closeSearch = document.getElementById('closeSearch');
    const searchInput = document.getElementById('searchInput');
    const mobileSearchBtn = document.getElementById('mobileSearchBtn');
    const mobileSearchInput = document.getElementById('mobileSearchInput');

    let isMobileMenuOpen = false;

    // Toggle Mobile Menu
    function toggleMobileMenu() {
      isMobileMenuOpen = !isMobileMenuOpen;
      
      if (isMobileMenuOpen) {
        // Open menu
        mobileMenu.style.maxHeight = '500px';
        mobileMenu.style.transform = 'translateY(0)';
        mobileMenu.style.opacity = '1';
        mobileMenuBtn.setAttribute('aria-expanded', 'true');
        
        // Change hamburger to X
        mobileMenuBtn.innerHTML = `
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        `;
      } else {
        // Close menu
        mobileMenu.style.maxHeight = '0';
        mobileMenu.style.transform = 'translateY(-100%)';
        mobileMenu.style.opacity = '0';
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
        
        // Change X back to hamburger
        mobileMenuBtn.innerHTML = `
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        `;
      }
    }

    // Close Mobile Menu
    function closeMobileMenu() {
      if (isMobileMenuOpen) {
        toggleMobileMenu();
      }
    }

    // Event Listeners
    if (mobileMenuBtn && mobileMenu) {
      mobileMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMobileMenu();
      });
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
      if (isMobileMenuOpen && !mobileMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
        closeMobileMenu();
      }
    });

    // Close mobile menu when window is resized to desktop
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 768 && isMobileMenuOpen) {
        closeMobileMenu();
      }
    });

    // Close mobile menu when clicking on menu links
    if (mobileMenu) {
      mobileMenu.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') {
          setTimeout(closeMobileMenu, 100);
        }
      });
    }

    // Search Overlay Functionality
    if (searchBtn && searchOverlay) {
      searchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        searchOverlay.classList.remove('hidden');
        setTimeout(() => searchInput && searchInput.focus(), 100);
      });
    }

    if (closeSearch && searchOverlay) {
      closeSearch.addEventListener('click', () => {
        searchOverlay.classList.add('hidden');
      });
    }

    // Close search overlay when clicking outside
    if (searchOverlay) {
      searchOverlay.addEventListener('click', (e) => {
        if (e.target === searchOverlay) {
          searchOverlay.classList.add('hidden');
        }
      });
    }

    // Mobile Search Functionality
    if (mobileSearchBtn && mobileSearchInput) {
      mobileSearchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const query = mobileSearchInput.value.trim();
        if (query) {
          const dest = pageHref('product.html') + `?q=${encodeURIComponent(query)}`;
          window.location.href = dest;
        }
      });
    }

    // Close mobile menu on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (isMobileMenuOpen) {
          closeMobileMenu();
        }
        if (searchOverlay && !searchOverlay.classList.contains('hidden')) {
          searchOverlay.classList.add('hidden');
        }
      }
    });

  });
})();