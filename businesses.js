const API_URL = '/api';
let currentCategory = null;
let allCategories = [];

// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);
const categoryId = urlParams.get('category');
const categoryName = urlParams.get('name');
const searchQuery = urlParams.get('search');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadCategories();
    
    if (categoryId) {
        currentCategory = categoryId;
        document.getElementById('pageTitle').textContent = categoryName || 'Business Listings';
        document.getElementById('categoryFilter').value = categoryId;
    }
    
    if (searchQuery) {
        document.getElementById('searchQuery').value = searchQuery;
        document.getElementById('pageTitle').textContent = `Search: "${searchQuery}"`;
    }
    
    loadBusinesses();
    
    // Event listeners
    document.getElementById('applyFilters').addEventListener('click', loadBusinesses);
    document.getElementById('clearFilters').addEventListener('click', clearFilters);
    document.getElementById('sortBy').addEventListener('change', loadBusinesses);
    document.getElementById('searchQuery').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            loadBusinesses();
        }
    });
    document.getElementById('locationFilter').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            loadBusinesses();
        }
    });
    
    // Modal close handlers
    const businessModal = document.getElementById('businessModal');
    const closeBtn = document.getElementById('closeBusinessModal');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            businessModal.classList.remove('active');
        });
    }
    
    if (businessModal) {
        businessModal.addEventListener('click', function(e) {
            if (e.target === businessModal) {
                businessModal.classList.remove('active');
            }
        });
    }
    
    // Write review button
    const writeReviewBtn = document.getElementById('writeReviewBtn');
    if (writeReviewBtn) {
        writeReviewBtn.addEventListener('click', function() {
            const businessId = this.getAttribute('data-business-id');
            if (businessId) {
                window.location.href = 'write-review.html?business=' + businessId;
            } else {
                window.location.href = 'write-review.html';
            }
        });
    }
    
    // Get directions button
    const getDirectionsBtn = document.getElementById('getDirectionsBtn');
    if (getDirectionsBtn) {
        getDirectionsBtn.addEventListener('click', function() {
            const location = document.getElementById('businessLocation').textContent;
            if (location && location !== 'Location not specified') {
                const mapsUrl = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(location);
                window.open(mapsUrl, '_blank');
            } else {
                alert('Location not available for directions.');
            }
        });
    }
});

// Load categories for filter
async function loadCategories() {
    try {
        const response = await fetch(API_URL + '/categories');
        if (response.ok) {
            const data = await response.json();
            allCategories = data.categories || [];
            
            const select = document.getElementById('categoryFilter');
            allCategories.forEach(function(cat) {
                const option = document.createElement('option');
                option.value = cat._id;
                option.textContent = cat.name;
                if (cat._id === categoryId) {
                    option.selected = true;
                }
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Load businesses
async function loadBusinesses() {
    const grid = document.getElementById('businessGrid');
    grid.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading businesses...</p></div>';
    
    try {
        // Build query
        let query = '?isActive=true&';
        const category = document.getElementById('categoryFilter').value;
        const search = document.getElementById('searchQuery').value.trim();
        const location = document.getElementById('locationFilter').value.trim();
        const rating = document.getElementById('ratingFilter').value;
        const sort = document.getElementById('sortBy').value;
        
        if (category) query += 'category=' + category + '&';
        if (search) query += 'q=' + encodeURIComponent(search) + '&';
        if (location) query += 'city=' + encodeURIComponent(location) + '&';
        if (rating) query += 'minRating=' + rating + '&';
        if (sort) query += 'sort=' + sort + '&';
        
        const response = await fetch(API_URL + '/search' + query);
        
        if (response.ok) {
            const data = await response.json();
            const businesses = data.businesses || [];
            
            document.getElementById('resultsCount').textContent = 
                businesses.length + ' ' + (businesses.length === 1 ? 'business' : 'businesses') + ' found';
            
            if (businesses.length === 0) {
                grid.innerHTML = `
                    <div class="no-results">
                        <i class="fas fa-search"></i>
                        <h3>No businesses found</h3>
                        <p>Try adjusting your filters or search terms</p>
                    </div>
                `;
                return;
            }
            
            grid.innerHTML = '';
            businesses.forEach(function(business) {
                const card = createBusinessCard(business);
                grid.appendChild(card);
            });
        } else {
            grid.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error loading businesses</h3>
                    <p>Please try again later</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading businesses:', error);
        grid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Network error</h3>
                <p>Please check your connection and try again</p>
            </div>
        `;
    }
}

// Create business card
function createBusinessCard(business) {
    const card = document.createElement('div');
    card.className = 'business-card';
    
    const categoryName = business.category ? business.category.name : 'Uncategorized';
    const location = business.location ? business.location.city + ', ' + business.location.state : 'Location not specified';
    const rating = business.rating ? business.rating.average.toFixed(1) : '0.0';
    const ratingCount = business.rating ? business.rating.count : 0;
    const roundedRating = Math.round(business.rating?.average || 0);
    const stars = '★'.repeat(roundedRating) + '☆'.repeat(5 - roundedRating);
    
    card.innerHTML = `
        <div class="business-header">
            <h3>${escapeHtml(business.name)}</h3>
            <div class="rating">
                <span class="stars">${stars}</span>
                <span class="rating-value">${rating}</span>
            </div>
        </div>
        <span class="business-category">${escapeHtml(categoryName)}</span>
        <p class="business-description">${escapeHtml(business.description || 'No description available')}</p>
        <div class="business-footer">
            <span class="location">
                <i class="fas fa-map-marker-alt"></i>
                ${escapeHtml(location)}
            </span>
            <span class="status open">Open Now</span>
        </div>
    `;
    
    card.addEventListener('click', function() {
        showBusinessDetails(business);
    });
    
    return card;
}

// Show business details modal
async function showBusinessDetails(business) {
    const modal = document.getElementById('businessModal');
    if (!modal) {
        alert('Business modal not found. Please refresh the page.');
        return;
    }
    
    // Show modal immediately with basic info
    modal.classList.add('active');
    
    // Populate with available data first
    document.getElementById('businessName').textContent = business.name;
    
    const rating = business.rating ? business.rating.average : 0;
    const roundedRating = Math.round(rating);
    const stars = '★'.repeat(roundedRating) + '☆'.repeat(5 - roundedRating);
    document.getElementById('businessStars').textContent = stars;
    document.getElementById('businessRating').textContent = rating.toFixed(1) + ' (' + (business.rating ? business.rating.count : 0) + ' reviews)';
    
    document.getElementById('businessDescription').textContent = business.description || 'No description available.';
    
    const location = business.location ? 
        (business.location.address || '') + ', ' + business.location.city + ', ' + business.location.state + ' ' + (business.location.zipCode || '') : 
        'Location not specified';
    document.getElementById('businessLocation').textContent = location.trim();
    
    document.getElementById('businessPhone').textContent = business.contact?.phone || 'Not available';
    document.getElementById('businessEmail').textContent = business.contact?.email || 'Not available';
    
    const websiteEl = document.getElementById('businessWebsite');
    if (business.contact?.website) {
        websiteEl.innerHTML = '<a href="' + escapeHtml(business.contact.website) + '" target="_blank" rel="noopener">' + escapeHtml(business.contact.website) + '</a>';
    } else {
        websiteEl.textContent = 'Not available';
    }
    
    // Hours
    const hoursEl = document.getElementById('businessHours');
    if (business.hours && business.hours.length > 0) {
        const today = new Date().getDay();
        const todayHours = business.hours.find(function(h) { return h.day === today; });
        if (todayHours && todayHours.open && todayHours.close) {
            hoursEl.textContent = 'Open: ' + todayHours.open + ' - ' + todayHours.close;
            hoursEl.className = 'status open';
        } else {
            hoursEl.textContent = 'Hours not specified';
            hoursEl.className = 'status closed';
        }
    } else {
        hoursEl.textContent = 'Hours not specified';
        hoursEl.className = 'status';
    }
    
    // Store business ID for review button
    const writeReviewBtn = document.getElementById('writeReviewBtn');
    if (writeReviewBtn) {
        writeReviewBtn.setAttribute('data-business-id', business._id);
    }
    
    // Try to fetch full details from API
    try {
        const response = await fetch(API_URL + '/businesses/' + business._id);
        if (response.ok) {
            const data = await response.json();
            const fullBusiness = data.business || business;
            
            // Update with full details
            const fullRating = fullBusiness.rating ? fullBusiness.rating.average : 0;
            const fullRoundedRating = Math.round(fullRating);
            const fullStars = '★'.repeat(fullRoundedRating) + '☆'.repeat(5 - fullRoundedRating);
            document.getElementById('businessStars').textContent = fullStars;
            document.getElementById('businessRating').textContent = fullRating.toFixed(1) + ' (' + (fullBusiness.rating ? fullBusiness.rating.count : 0) + ' reviews)';
            
            document.getElementById('businessDescription').textContent = fullBusiness.description || 'No description available.';
            
            const fullLocation = fullBusiness.location ? 
                (fullBusiness.location.address || '') + ', ' + fullBusiness.location.city + ', ' + fullBusiness.location.state + ' ' + (fullBusiness.location.zipCode || '') : 
                'Location not specified';
            document.getElementById('businessLocation').textContent = fullLocation.trim();
            
            document.getElementById('businessPhone').textContent = fullBusiness.contact?.phone || 'Not available';
            document.getElementById('businessEmail').textContent = fullBusiness.contact?.email || 'Not available';
            
            if (fullBusiness.contact?.website) {
                websiteEl.innerHTML = '<a href="' + escapeHtml(fullBusiness.contact.website) + '" target="_blank" rel="noopener">' + escapeHtml(fullBusiness.contact.website) + '</a>';
            } else {
                websiteEl.textContent = 'Not available';
            }
            
            // Update hours
            if (fullBusiness.hours && fullBusiness.hours.length > 0) {
                const today = new Date().getDay();
                const todayHours = fullBusiness.hours.find(function(h) { return h.day === today; });
                if (todayHours && todayHours.open && todayHours.close) {
                    hoursEl.textContent = 'Open: ' + todayHours.open + ' - ' + todayHours.close;
                    hoursEl.className = 'status open';
                } else {
                    hoursEl.textContent = 'Hours not specified';
                    hoursEl.className = 'status closed';
                }
            }
        }
    } catch (error) {
        console.error('Error loading full business details:', error);
        // Modal already shows basic info, so we continue
    }
}

// Clear filters
function clearFilters() {
    document.getElementById('searchQuery').value = '';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('locationFilter').value = '';
    document.getElementById('ratingFilter').value = '';
    document.getElementById('sortBy').value = '-createdAt';
    
    // Update page title
    document.getElementById('pageTitle').textContent = 'All Businesses';
    
    // Clear URL parameters
    window.history.replaceState({}, document.title, window.location.pathname);
    
    loadBusinesses();
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

