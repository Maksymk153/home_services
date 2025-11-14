const API_URL = '/api';

// Get URL parameters
function getURLParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        q: params.get('q') || '',
        location: params.get('location') || '',
        category: params.get('category') || '',
        city: params.get('city') || '',
        state: params.get('state') || '',
        minRating: params.get('minRating') || '',
        sort: params.get('sort') || 'relevance',
        page: parseInt(params.get('page')) || 1
    };
}

// Update URL parameters
function updateURLParams(params) {
    const url = new URL(window.location);
    Object.keys(params).forEach(key => {
        if (params[key]) {
            url.searchParams.set(key, params[key]);
        } else {
            url.searchParams.delete(key);
        }
    });
    url.searchParams.delete('page'); // Reset to page 1 when filters change
    window.history.pushState({}, '', url);
}

// Load categories for filter
async function loadCategories() {
    try {
        const response = await fetch(API_URL + '/categories');
        if (response.ok) {
            const data = await response.json();
            const select = document.getElementById('filterCategory');
            if (select && data.categories) {
                data.categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category._id;
                    option.textContent = category.name;
                    select.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Search businesses
async function searchBusinesses() {
    const params = getURLParams();
    const resultsList = document.getElementById('resultsList');
    const resultsInfo = document.getElementById('resultsInfo');
    const resultsCount = document.getElementById('resultsCount');
    const pagination = document.getElementById('pagination');
    
    // Show loading
    resultsList.innerHTML = `
        <div class="loading-results">
            <i class="fas fa-spinner"></i>
            <p>Loading results...</p>
        </div>
    `;
    pagination.style.display = 'none';
    
    try {
        // Build query string
        const queryParams = new URLSearchParams();
        if (params.q) queryParams.append('q', params.q);
        if (params.category) queryParams.append('category', params.category);
        if (params.city) queryParams.append('city', params.city);
        if (params.state) queryParams.append('state', params.state);
        if (params.minRating) queryParams.append('minRating', params.minRating);
        if (params.sort && params.sort !== 'relevance') {
            if (params.sort === 'rating') queryParams.append('sort', '-rating.average');
            else if (params.sort === 'name') queryParams.append('sort', 'name');
            else if (params.sort === 'views') queryParams.append('sort', '-views');
            else if (params.sort === 'newest') queryParams.append('sort', '-createdAt');
        }
        queryParams.append('page', params.page);
        queryParams.append('limit', '10');
        
        const response = await fetch(API_URL + '/search?' + queryParams.toString());
        const data = await response.json();
        
        if (response.ok && data.success) {
            const businesses = data.businesses || [];
            const total = data.total || 0;
            const currentPage = data.page || 1;
            const totalPages = data.pages || 1;
            
            // Update results count
            resultsCount.textContent = total;
            resultsInfo.innerHTML = `<strong>${total}</strong> result${total !== 1 ? 's' : ''} found`;
            
            // Display results
            if (businesses.length === 0) {
                resultsList.innerHTML = `
                    <div class="no-results">
                        <i class="fas fa-search"></i>
                        <h3>No businesses found</h3>
                        <p>Try adjusting your search criteria or filters</p>
                        <button class="btn-primary" onclick="clearAllFilters()" style="padding: 12px 30px; border: none; border-radius: 8px; background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%); color: white; cursor: pointer; font-weight: 600;">
                            Clear All Filters
                        </button>
                    </div>
                `;
                pagination.style.display = 'none';
            } else {
                resultsList.innerHTML = businesses.map(business => createBusinessCard(business)).join('');
                renderPagination(currentPage, totalPages);
            }
        } else {
            resultsList.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error loading results</h3>
                    <p>${data.error || 'Please try again later'}</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Search error:', error);
        resultsList.innerHTML = `
            <div class="no-results">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Network error</h3>
                <p>Please check your connection and try again</p>
            </div>
        `;
    }
}

// Create business card HTML
function createBusinessCard(business) {
    const rating = business.rating ? business.rating.average : 0;
    const ratingCount = business.rating ? business.rating.count : 0;
    const stars = '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
    const city = business.location ? business.location.city : 'N/A';
    const state = business.location ? business.location.state : '';
    const address = business.location ? business.location.address : '';
    const phone = business.contact ? business.contact.phone : '';
    const email = business.contact ? business.contact.email : '';
    const website = business.contact ? business.contact.website : '';
    const category = business.category ? business.category.name : 'Uncategorized';
    const categoryIcon = business.category && business.category.icon ? business.category.icon : 'briefcase';
    const description = business.description ? (business.description.substring(0, 200) + (business.description.length > 200 ? '...' : '')) : 'No description available.';
    const featuredBadge = business.isFeatured ? '<span class="business-featured-badge"><i class="fas fa-star"></i> Featured</span>' : '';
    
    return `
        <div class="business-card-result" onclick="window.location.href='businesses.html?business=${business._id}'">
            <div class="business-card-header">
                <div class="business-card-title">
                    <h3>
                        <a href="businesses.html?business=${business._id}">${escapeHtml(business.name)}</a>
                        ${featuredBadge}
                    </h3>
                    <div class="business-card-category">
                        <i class="fas fa-${categoryIcon}"></i>
                        <span>${escapeHtml(category)}</span>
                    </div>
                </div>
                <div class="business-rating">
                    <div class="business-rating-stars">${stars}</div>
                    <div class="business-rating-value">${rating.toFixed(1)}</div>
                    <div class="business-rating-count">(${ratingCount} review${ratingCount !== 1 ? 's' : ''})</div>
                </div>
            </div>
            <div class="business-card-body">
                <p class="business-description">${escapeHtml(description)}</p>
                <div class="business-location">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${escapeHtml(address)}${address && city ? ', ' : ''}${escapeHtml(city)}${city && state ? ', ' : ''}${escapeHtml(state)}</span>
                </div>
                <div class="business-contact">
                    ${phone ? `<div class="business-contact-item"><i class="fas fa-phone"></i> <span>${escapeHtml(phone)}</span></div>` : ''}
                    ${email ? `<div class="business-contact-item"><i class="fas fa-envelope"></i> <span>${escapeHtml(email)}</span></div>` : ''}
                    ${website ? `<div class="business-contact-item"><i class="fas fa-globe"></i> <a href="${escapeHtml(website)}" target="_blank" onclick="event.stopPropagation();">Visit Website</a></div>` : ''}
                </div>
            </div>
        </div>
    `;
}

// Render pagination
function renderPagination(currentPage, totalPages) {
    const pagination = document.getElementById('pagination');
    if (totalPages <= 1) {
        pagination.style.display = 'none';
        return;
    }
    
    pagination.style.display = 'flex';
    
    let html = '';
    const params = getURLParams();
    
    // Previous button
    html += `<button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="goToPage(${currentPage - 1})">
        <i class="fas fa-chevron-left"></i> Previous
    </button>`;
    
    // Page numbers
    const maxPages = 7;
    let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(totalPages, startPage + maxPages - 1);
    
    if (endPage - startPage < maxPages - 1) {
        startPage = Math.max(1, endPage - maxPages + 1);
    }
    
    if (startPage > 1) {
        html += `<button class="pagination-btn" onclick="goToPage(1)">1</button>`;
        if (startPage > 2) {
            html += `<span class="pagination-info">...</span>`;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            html += `<span class="pagination-info">...</span>`;
        }
        html += `<button class="pagination-btn" onclick="goToPage(${totalPages})">${totalPages}</button>`;
    }
    
    // Next button
    html += `<button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="goToPage(${currentPage + 1})">
        Next <i class="fas fa-chevron-right"></i>
    </button>`;
    
    // Page info
    html += `<span class="pagination-info">Page ${currentPage} of ${totalPages}</span>`;
    
    pagination.innerHTML = html;
}

// Go to page
function goToPage(page) {
    const params = getURLParams();
    params.page = page;
    updateURLParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    searchBusinesses();
}

// Apply filters
function applyFilters() {
    const params = {
        q: document.getElementById('searchQueryInput').value.trim(),
        location: document.getElementById('searchLocationInput').value.trim(),
        category: document.getElementById('filterCategory').value,
        city: document.getElementById('filterCity').value.trim(),
        state: document.getElementById('filterState').value.trim(),
        minRating: document.getElementById('filterRating').value,
        sort: document.getElementById('sortBy').value
    };
    
    // Parse location if provided
    if (params.location) {
        const locationParts = params.location.split(',').map(s => s.trim());
        if (locationParts.length >= 1 && !params.city) {
            params.city = locationParts[0];
        }
        if (locationParts.length >= 2 && !params.state) {
            params.state = locationParts[1];
        }
    }
    
    updateURLParams(params);
    searchBusinesses();
}

// Clear all filters
function clearAllFilters() {
    document.getElementById('searchQueryInput').value = '';
    document.getElementById('searchLocationInput').value = '';
    document.getElementById('filterCategory').value = '';
    document.getElementById('filterCity').value = '';
    document.getElementById('filterState').value = '';
    document.getElementById('filterRating').value = '';
    document.getElementById('sortBy').value = 'relevance';
    
    updateURLParams({});
    searchBusinesses();
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Load categories
    loadCategories();
    
    // Get URL parameters and populate form
    const params = getURLParams();
    if (params.q) {
        document.getElementById('searchQueryInput').value = params.q;
    }
    if (params.location) {
        document.getElementById('searchLocationInput').value = params.location;
    }
    if (params.category) {
        document.getElementById('filterCategory').value = params.category;
    }
    if (params.city) {
        document.getElementById('filterCity').value = params.city;
    }
    if (params.state) {
        document.getElementById('filterState').value = params.state;
    }
    if (params.minRating) {
        document.getElementById('filterRating').value = params.minRating;
    }
    if (params.sort) {
        document.getElementById('sortBy').value = params.sort;
    }
    
    // Perform initial search
    searchBusinesses();
    
    // Search button
    document.getElementById('searchBtn').addEventListener('click', applyFilters);
    
    // Enter key on search inputs
    document.getElementById('searchQueryInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            applyFilters();
        }
    });
    
    document.getElementById('searchLocationInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            applyFilters();
        }
    });
    
    // Apply filters button
    document.getElementById('applyFiltersBtn').addEventListener('click', applyFilters);
    
    // Clear filters button
    document.getElementById('clearFiltersBtn').addEventListener('click', clearAllFilters);
    
    // Sort change
    document.getElementById('sortBy').addEventListener('change', function() {
        const params = getURLParams();
        params.sort = this.value;
        updateURLParams(params);
        searchBusinesses();
    });
});

// Helper function to escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions available globally
window.goToPage = goToPage;
window.clearAllFilters = clearAllFilters;

