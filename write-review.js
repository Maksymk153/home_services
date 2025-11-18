// Use API_URL from global scope if available, otherwise declare it
if (typeof API_URL === 'undefined') {
    var API_URL = '/api';
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.textContent = message;
    toast.style.cssText = 'position: fixed; top: 100px; right: 20px; padding: 15px 25px; border-radius: 8px; color: white; font-weight: 600; z-index: 10000; animation: slideIn 0.3s; box-shadow: 0 4px 12px rgba(0,0,0,0.2);';
    if (type === 'success') toast.style.background = '#27AE60';
    if (type === 'error') toast.style.background = '#E74C3C';
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Star rating functionality
document.addEventListener('DOMContentLoaded', function() {
    const starRating = document.getElementById('starRating');
    const ratingInput = document.getElementById('rating');
    const ratingText = document.getElementById('ratingText');
    
    if (!starRating || !ratingInput || !ratingText) {
        return;
    }
    
    const stars = starRating.querySelectorAll('i');
    
    const ratingTexts = {
        1: 'Poor',
        2: 'Fair',
        3: 'Good',
        4: 'Very Good',
        5: 'Excellent'
    };
    
    stars.forEach((star, index) => {
        star.addEventListener('click', function() {
            const rating = parseInt(this.getAttribute('data-rating'));
            ratingInput.value = rating;
            ratingText.textContent = ratingTexts[rating];
            ratingText.style.color = rating >= 4 ? '#27AE60' : rating >= 3 ? '#F39C12' : '#E74C3C';
            
            // Update star display
            stars.forEach((s, i) => {
                if (i < rating) {
                    s.classList.remove('far');
                    s.classList.add('fas');
                } else {
                    s.classList.remove('fas');
                    s.classList.add('far');
                }
            });
        });
        
        star.addEventListener('mouseenter', function() {
            const rating = parseInt(this.getAttribute('data-rating'));
            stars.forEach((s, i) => {
                if (i < rating) {
                    s.classList.remove('far');
                    s.classList.add('fas');
                }
            });
        });
    });
    
    starRating.addEventListener('mouseleave', function() {
        const currentRating = parseInt(ratingInput.value) || 0;
        stars.forEach((s, i) => {
            if (i < currentRating) {
                s.classList.remove('far');
                s.classList.add('fas');
            } else {
                s.classList.remove('fas');
                s.classList.add('far');
            }
        });
    });
    
    // Load businesses for dropdown
    async function loadBusinesses() {
        try {
            const response = await fetch(API_URL + '/businesses?limit=100');
            if (response.ok) {
                const data = await response.json();
                const select = document.getElementById('businessName');
                if (select && data.businesses) {
                    // Clear existing options except the first one
                    while (select.options.length > 1) {
                        select.remove(1);
                    }
                    data.businesses.forEach(function(business) {
                        const option = document.createElement('option');
                        option.value = business._id;
                        option.textContent = business.name;
                        select.appendChild(option);
                    });
                }
            } else {
                console.error('Failed to load businesses:', response.status);
                showToast('Failed to load businesses. Please refresh the page.', 'error');
            }
        } catch (error) {
            console.error('Error loading businesses:', error);
            showToast('Error loading businesses. Please check your connection.', 'error');
        }
    }
    
    // Get business ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const businessId = urlParams.get('business');
    if (businessId) {
        loadBusinesses().then(() => {
            const select = document.getElementById('businessName');
            if (select) {
                select.value = businessId;
            }
        });
    } else {
        loadBusinesses();
    }
    
    // Review form submission
    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const rating = ratingInput.value;
            if (rating === '0' || rating === '') {
                showToast('Please select a star rating', 'error');
                return;
            }
            
            // Check if user is logged in FIRST (required for review)
            const token = localStorage.getItem('token') || localStorage.getItem('userToken');
            
            if (!token) {
                showToast('Please login first to submit a review', 'error');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
                return;
            }
            
            const businessId = document.getElementById('businessName').value;
            const title = document.getElementById('reviewTitle').value.trim();
            const comment = document.getElementById('reviewComment').value.trim();
            
            // Validate required fields (user info comes from token, not form)
            if (!businessId || !title || !comment) {
                showToast('Please fill in all required fields (Business, Title, Comment)', 'error');
                return;
            }
            
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
            
            try {
                const response = await fetch(API_URL + '/reviews', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify({
                        business: businessId,
                        rating: parseInt(rating),
                        title: title,
                        comment: comment
                    })
                });
                
                const data = await response.json();
                
                if (response.ok && data.success) {
                    showToast('Review submitted successfully! It will be published after moderation.', 'success');
                    
                    // Reset form
                    this.reset();
                    ratingInput.value = '0';
                    ratingText.textContent = 'Click on stars to rate';
                    ratingText.style.color = '#999';
                    stars.forEach(s => {
                        s.classList.remove('fas');
                        s.classList.add('far');
                    });
                    
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 2000);
                } else {
                    // Show detailed error message
                    let errorMsg = 'Failed to submit review. ';
                    if (data.error) {
                        errorMsg += data.error;
                    } else if (data.message) {
                        errorMsg += data.message;
                    } else {
                        errorMsg += 'Please check all required fields and try again.';
                    }
                    showToast(errorMsg, 'error');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
            } catch (error) {
                console.error('Review submission error:', error);
                showToast('Network error. Please check your connection and try again.', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }
});

