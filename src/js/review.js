// ===== REVIEW SYSTEM ===== //

let currentOrder = null;
let currentRating = 0;

// ===== INITIALIZATION ===== //
document.addEventListener('DOMContentLoaded', async () => {
    // Get order ID from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('review');
    
    if (orderId) {
        // Load order info and show review modal
        await loadOrderInfo(orderId);
        showReviewModal();
    }
    
    // Setup event listeners
    setupReviewEventListeners();
    
    // Render existing reviews on homepage
    renderReviewsOnHomepage();
});

// ===== LOAD ORDER INFO ===== //
async function loadOrderInfo(orderId) {
    try {
        const userId = getCurrentUserId();
        if (!userId) {
            showError('Anda harus login untuk memberikan review');
            return;
        }
        
        const response = await fetch(`http://localhost:4003/api/orders/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch orders');
        
        const orders = await response.json();
        const order = orders.find(o => o._id === orderId);
        
        if (!order) {
            showError('Order tidak ditemukan');
            return;
        }
        
        if (order.status !== 'completed') {
            showError('Hanya order yang sudah selesai yang bisa direview');
            return;
        }
        
        currentOrder = order;
        renderOrderInfo();
        
    } catch (error) {
        console.error('Error loading order:', error);
        showError('Gagal memuat informasi order');
    }
}

function renderOrderInfo() {
    const orderInfo = document.getElementById('order-info');
    if (!orderInfo || !currentOrder) return;
    
    orderInfo.innerHTML = `
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Order #${currentOrder._id.slice(-8)}</h3>
        <div class="space-y-3">
            ${currentOrder.items.map(item => `
                <div class="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                    <img src="${item.imageUrl}" alt="${item.name}" class="w-16 h-16 object-cover rounded">
                    <div class="flex-1">
                        <h4 class="font-medium text-gray-800">${item.name}</h4>
                        <p class="text-sm text-gray-600">Qty: ${item.quantity}</p>
                        <p class="text-sm text-gray-600">Rp ${item.price.toLocaleString('id-ID')}</p>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// ===== SHOW REVIEW MODAL ===== //
function showReviewModal() {
    // Create review modal if it doesn't exist
    let modal = document.getElementById('review-modal');
    if (!modal) {
        modal = createReviewModal();
        document.body.appendChild(modal);
    }
    
    // Show modal
    modal.classList.remove('hidden');
}

function createReviewModal() {
    const modal = document.createElement('div');
    modal.id = 'review-modal';
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-auto p-8 relative max-h-[90vh] overflow-y-auto">
            <!-- Close Button -->
            <button id="close-review-modal" class="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl">&times;</button>

            <!-- Modal Content -->
            <h2 class="text-2xl font-semibold mb-6 text-center">Review Produk</h2>
            
            <!-- Order Info -->
            <div id="order-info" class="mb-6">
                <!-- Order info will be loaded here -->
            </div>
            
            <!-- Review Form -->
            <form id="submit-review-form" class="space-y-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                    <div class="flex space-x-2" id="rating-stars">
                        <button type="button" class="star-btn text-2xl text-gray-300 hover:text-yellow-400" data-rating="1">★</button>
                        <button type="button" class="star-btn text-2xl text-gray-300 hover:text-yellow-400" data-rating="2">★</button>
                        <button type="button" class="star-btn text-2xl text-gray-300 hover:text-yellow-400" data-rating="3">★</button>
                        <button type="button" class="star-btn text-2xl text-gray-300 hover:text-yellow-400" data-rating="4">★</button>
                        <button type="button" class="star-btn text-2xl text-gray-300 hover:text-yellow-400" data-rating="5">★</button>
                    </div>
                    <input type="hidden" id="rating-value" name="rating" required>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Review</label>
                    <textarea id="review-text" name="review" rows="4" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#DC9C84]" placeholder="Bagikan pengalaman Anda dengan produk ini..." required></textarea>
                </div>
                
                <div class="flex justify-end space-x-4">
                    <button type="button" id="cancel-review" class="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition">
                        Batal
                    </button>
                    <button type="submit" class="px-6 py-2 bg-[#DC9C84] hover:bg-[#93392C] text-white rounded-md transition">
                        Submit Review
                    </button>
                </div>
            </form>
        </div>
    `;
    
    return modal;
}

// ===== EVENT LISTENERS ===== //
function setupReviewEventListeners() {
    // Close modal
    document.addEventListener('click', (e) => {
        if (e.target.id === 'close-review-modal' || e.target.id === 'cancel-review') {
            closeReviewModal();
        }
    });
    
    // Form submission
    document.addEventListener('submit', (e) => {
        if (e.target.id === 'submit-review-form') {
            e.preventDefault();
            handleSubmitReview(e);
        }
    });
    
    // Star rating (delegated event listeners)
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('star-btn')) {
            currentRating = parseInt(e.target.dataset.rating);
            updateStarDisplay();
        }
    });
    
    document.addEventListener('mouseenter', (e) => {
        if (e.target.classList.contains('star-btn')) {
            highlightStars(parseInt(e.target.dataset.rating));
        }
    }, true);
    
    document.addEventListener('mouseleave', (e) => {
        if (e.target.id === 'rating-stars') {
            updateStarDisplay();
        }
    }, true);
}

function closeReviewModal() {
    const modal = document.getElementById('review-modal');
    if (modal) {
        modal.classList.add('hidden');
        // Clear form
        currentRating = 0;
        document.getElementById('review-text').value = '';
        updateStarDisplay();
    }
}

// ===== STAR RATING FUNCTIONS ===== //
function updateStarDisplay() {
    const starButtons = document.querySelectorAll('.star-btn');
    starButtons.forEach((btn, index) => {
        if (index < currentRating) {
            btn.classList.remove('text-gray-300');
            btn.classList.add('text-yellow-400');
        } else {
            btn.classList.remove('text-yellow-400');
            btn.classList.add('text-gray-300');
        }
    });
    
    document.getElementById('rating-value').value = currentRating;
}

function highlightStars(rating) {
    const starButtons = document.querySelectorAll('.star-btn');
    starButtons.forEach((btn, index) => {
        if (index < rating) {
            btn.classList.remove('text-gray-300');
            btn.classList.add('text-yellow-400');
        } else {
            btn.classList.remove('text-yellow-400');
            btn.classList.add('text-gray-300');
        }
    });
}

// ===== SUBMIT REVIEW ===== //
async function handleSubmitReview(e) {
    e.preventDefault();
    
    if (currentRating === 0) {
        showError('Silakan berikan rating');
        return;
    }
    
    const reviewText = document.getElementById('review-text').value.trim();
    if (!reviewText) {
        showError('Silakan tulis review');
        return;
    }
    
    try {
        // Simpan review ke localStorage
        const review = {
            id: Date.now().toString(),
            orderId: currentOrder._id,
            userId: getCurrentUserId(),
            userName: getCurrentUserName(),
            rating: currentRating,
            review: reviewText,
            createdAt: new Date().toISOString(),
            items: currentOrder.items,
            reviewPhoto: null // Akan diisi jika user upload foto
        };
        
        // Simpan ke localStorage
        const reviews = JSON.parse(localStorage.getItem('reviews') || '[]');
        reviews.push(review);
        localStorage.setItem('reviews', JSON.stringify(reviews));
        
        showSuccess('Review berhasil dikirim! Terima kasih atas feedback Anda.');
        
        // Close modal and refresh reviews
        closeReviewModal();
        renderReviewsOnHomepage();
        
        // Clear URL parameter
        const url = new URL(window.location);
        url.searchParams.delete('review');
        window.history.replaceState({}, '', url);
        
    } catch (error) {
        console.error('Error submitting review:', error);
        showError('Gagal mengirim review');
    }
}

// ===== UTILITY FUNCTIONS ===== //
function getCurrentUserId() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id || null;
}

function getCurrentUserName() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.name || 'Anonymous';
}

function showSuccess(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function showError(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// ===== GET REVIEWS FOR HOMEPAGE ===== //
function getReviews() {
    let reviews = JSON.parse(localStorage.getItem('reviews') || '[]');
    
    // If no reviews exist, create some sample reviews
    if (reviews.length === 0) {
        reviews = createSampleReviews();
        localStorage.setItem('reviews', JSON.stringify(reviews));
    }
    
    // Check if we need to update sample reviews (for fixing product names)
    const hasOldSampleData = reviews.some(review => 
        review.items && review.items[0] && 
        (review.items[0].name === 'Classic White Shirt' || 
         review.items[0].name === 'High-Waist Jeans' || 
         review.items[0].name === 'Vintage Denim Jacket' || 
         review.items[0].name === 'Casual T-Shirt')
    );
    
    if (hasOldSampleData) {
        // Replace with corrected sample reviews
        reviews = createSampleReviews();
        localStorage.setItem('reviews', JSON.stringify(reviews));
    }
    
    return reviews;
}

// ===== CREATE SAMPLE REVIEWS ===== //
function createSampleReviews() {
    return [
        {
            id: '1',
            orderId: 'sample-order-1',
            userId: 'sample-user-1',
            userName: 'Sarah Johnson',
            rating: 5,
            review: 'Produknya sangat bagus! Kualitas bahan premium dan desain yang elegan. Pasti akan beli lagi.',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
            items: [{ name: 'Digital Camera', price: 180000 }],
            reviewPhoto: 'https://res.cloudinary.com/do3t3ubyd/image/upload/v1761276538/download_10_vvlbuy.jpg'
        },
        {
            id: '2',
            orderId: 'sample-order-2',
            userId: 'sample-user-2',
            userName: 'Michael Chen',
            rating: 4,
            review: 'Pengiriman cepat dan packaging rapi. Produk sesuai dengan deskripsi. Recommended!',
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
            items: [{ name: 'Nike Air Force 1', price: 250000 }],
            reviewPhoto: 'https://res.cloudinary.com/do3t3ubyd/image/upload/v1761276514/download_12_apm2fh.jpg'
        },
        {
            id: '3',
            orderId: 'sample-order-3',
            userId: 'sample-user-3',
            userName: 'Emma Wilson',
            rating: 5,
            review: 'Customer service sangat responsif dan membantu. Produk berkualitas tinggi dengan harga yang reasonable.',
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
            items: [{ name: 'Fujifilm Instax Camera', price: 120000 }],
            reviewPhoto: 'https://res.cloudinary.com/do3t3ubyd/image/upload/v1761276506/download_11_drxvbn.jpg'
        },
        {
            id: '4',
            orderId: 'sample-order-4',
            userId: 'sample-user-4',
            userName: 'David Rodriguez',
            rating: 4,
            review: 'Sizing guide sangat akurat. Produk sesuai ekspektasi dan nyaman dipakai.',
            createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
            items: [{ name: 'Samsung Galaxy Watch', price: 95000 }],
            reviewPhoto: 'https://res.cloudinary.com/do3t3ubyd/image/upload/v1761276483/Galaxy_Watch_FE__Samsung_lancia_uno_smartwatch_entry-level_dal_prezzo_contenuto_qvjmhq.jpg'
        },
        {
            id: '5',
            orderId: 'sample-order-5',
            userId: 'sample-user-5',
            userName: 'Lisa Park',
            rating: 5,
            review: 'Love the design! Very trendy and comfortable. Will definitely shop here again.',
            createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
            items: [{ name: 'Summer Dress', price: 200000 }],
            reviewPhoto: 'https://res.cloudinary.com/do3t3ubyd/image/upload/v1761276473/download_9_xqgkiy.jpg'
        }
    ];
}

// ===== RENDER REVIEWS ON HOMEPAGE ===== //
function renderReviewsOnHomepage() {
    const reviews = getReviews();
    const reviewList = document.getElementById('reviewList');
    
    if (!reviewList) {
        console.log('Review list element not found');
        return;
    }
    
    if (reviews.length === 0) {
        reviewList.innerHTML = '<p class="text-gray-500 text-center">No reviews yet. Be the first to review!</p>';
        return;
    }
    
    // Show only latest 5 reviews
    const latestReviews = reviews.slice(-5).reverse();
    
    reviewList.innerHTML = latestReviews.map(review => `
        <div class="bg-white rounded-lg p-4 shadow-sm flex-none w-72 md:w-80">
            <div class="flex items-center space-x-3 mb-3">
                <img src="https://cdn-icons-png.flaticon.com/128/16683/16683419.png" alt="${review.userName}" class="w-8 h-8 rounded-full">
                <div>
                    <h4 class="font-medium text-gray-800">${review.userName}</h4>
                    <div class="flex items-center space-x-1">
                        ${Array.from({length: 5}, (_, i) => 
                            `<span class="text-sm ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}">★</span>`
                        ).join('')}
                    </div>
                </div>
            </div>
            <div class="mb-3 text-xs text-gray-500">
                ${review.items[0]?.name || 'Product'}
            </div>
            ${review.reviewPhoto ? `
                <div class="mb-3 aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img src="${review.reviewPhoto}" alt="Review photo" class="w-full h-full object-cover">
                </div>
            ` : ''}
            <p class="text-gray-600 text-sm">${review.review}</p>
        </div>
    `).join('');
}

// Make function globally available
window.renderReviewsOnHomepage = renderReviewsOnHomepage;

// ==== SCROLL MANUAL DENGAN DRAG ==== //
let isDragging = false;
let startX;
let scrollLeft;

reviewList.addEventListener("mousedown", (e) => {
  isDragging = true;
  startX = e.pageX - reviewList.offsetLeft;
  scrollLeft = reviewList.scrollLeft;
  reviewList.classList.add("cursor-grabbing");
});

reviewList.addEventListener("mouseleave", () => {
  isDragging = false;
  reviewList.classList.remove("cursor-grabbing");
});

reviewList.addEventListener("mouseup", () => {
  isDragging = false;
  reviewList.classList.remove("cursor-grabbing");
});

reviewList.addEventListener("mousemove", (e) => {
  if (!isDragging) return;
  e.preventDefault();
  const x = e.pageX - reviewList.offsetLeft;
  const walk = (x - startX) * 1.5; // atur kecepatan geser
  reviewList.scrollLeft = scrollLeft - walk;
});

// Support sentuhan (mobile)
reviewList.addEventListener("touchstart", (e) => {
  isDragging = true;
  startX = e.touches[0].pageX - reviewList.offsetLeft;
  scrollLeft = reviewList.scrollLeft;
});

reviewList.addEventListener("touchend", () => {
  isDragging = false;
});

reviewList.addEventListener("touchmove", (e) => {
  if (!isDragging) return;
  const x = e.touches[0].pageX - reviewList.offsetLeft;
  const walk = (x - startX) * 1.5;
  reviewList.scrollLeft = scrollLeft - walk;
});