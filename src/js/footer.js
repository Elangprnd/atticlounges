// Inject a unified footer (same as index.html) across all pages
(function mountUnifiedFooter() {
  document.addEventListener('DOMContentLoaded', () => {
    // Remove any existing page-specific footers
    document.querySelectorAll('footer').forEach(f => f.remove());

    const isInPages = window.location.pathname.includes('/pages/');
    const base = isInPages ? '..' : '.';

    const footer = document.createElement('footer');
    footer.className = 'bg-gray-50 text-gray-700 mt-12 border-t border-gray-200';
    footer.innerHTML = `
      <div class="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div class="flex flex-col gap-4">
          <img id="atticLogo" src="${base}/src/img/Attic%20Lounges.png" alt="AtticLounges logo" class="w-36 h-auto md:w-48 object-contain" width="192" height="64"/>
          <div>
            <h3 class="text-lg font-semibold text-gray-800">AtticLounges</h3>
            <p class="text-sm text-gray-600 leading-relaxed mt-1">AtticLounges adalah proyek e-commerce fashion bertema <em>urban chill</em>. Nama dan konsepnya terinspirasi dari suasana loteng yang nyaman — simpel, personal, dan bergaya. Dibuat sebagai Capstone Project untuk menunjukkan keahlian desain & pengembangan web kami.</p>
          </div>
        </div>
        <div>
          <h4 class="text-md font-semibold text-gray-800 mb-3">Navigasi</h4>
          <ul class="text-sm space-y-2">
            <li><a href="${isInPages ? '../index.html#hero-section' : '#hero-section'}" class="hover:text-gray-900 transition">Home</a></li>
            <li><a href="${isInPages ? 'product.html' : 'pages/product.html'}" class="hover:text-gray-900 transition">Koleksi</a></li>
            <li><a href="${isInPages ? '../index.html#tentang' : '#tentang'}" class="hover:text-gray-900 transition">Tentang Kami</a></li>
            <li><a href="${isInPages ? '../index.html#kontak' : '#kontak'}" class="hover:text-gray-900 transition">Kontak</a></li>
            <li><a href="${isInPages ? '../index.html#portfolio' : '#portfolio'}" class="hover:text-gray-900 transition">Portofolio</a></li>
          </ul>
        </div>
        <div>
          <h4 class="text-md font-semibold text-gray-800 mb-3">Kontak</h4>
          <table class="text-sm text-gray-600 border-separate border-spacing-y-2"><tbody>
            <tr><td class="pr-4 font-medium text-gray-700 align-top">Email</td><td><span class="text-gray-500">:</span><a href="mailto:atticlounges@store.com" class="ml-1 hover:text-gray-900 transition">atticlounges@store.com</a></td></tr>
            <tr><td class="pr-4 font-medium text-gray-700 align-top">Phone</td><td><span class="text-gray-500">:</span><a href="tel:+6281234567890" class="ml-1 hover:text-gray-900 transition">+62 812-3456-7890</a></td></tr>
            <tr><td class="pr-4 font-medium text-gray-700 align-top">Instagram</td><td><span class="text-gray-500">:</span><a href="https://instagram.com/atticlounges" target="_blank" class="ml-1 hover:text-gray-900 transition">@atticlounges</a></td></tr>
          </tbody></table>
        </div>
      </div>
      <div class="bg-gray-100 border-t border-gray-200">
        <div class="max-w-6xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between text-xs text-gray-500">
          <div class="mb-2 md:mb-0">© <span id="year"></span> AtticLounges — Capstone Project • Dibuat oleh [Nama Kamu] & [Nama Rekan]</div>
          <div class="flex gap-4"><a href="#" class="hover:text-gray-700">Privacy</a><a href="#" class="hover:text-gray-700">Terms</a><a href="#" class="hover:text-gray-700">Credits</a></div>
        </div>
      </div>
    `;
    document.body.appendChild(footer);
  });
})();


