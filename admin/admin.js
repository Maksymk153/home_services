// ====================
// CITYLOCAL 101 - COMPLETE ADMIN PANEL (PRODUCTION READY)
// ====================

const API_URL = '/api';
let authToken = localStorage.getItem('adminToken');
let currentUser = null;
let allCategories = [];
let allBusinesses = [];
let allUsers = [];
let allReviews = [];
let allBlogs = [];

// Check authentication on load
if (authToken) {
    checkAuth();
} else {
    showLogin();
}

// ====================
// AUTHENTICATION
// ====================

function showLogin() {
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('dashboardScreen').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('dashboardScreen').classList.remove('hidden');
}

async function checkAuth() {
    try {
        const response = await fetch(API_URL + '/auth/me', {
            headers: { 'Authorization': 'Bearer ' + authToken }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.user.role === 'admin') {
                currentUser = data.user;
                showDashboard();
                loadDashboardData();
            } else {
                showError('Access denied. Admin access required.');
                localStorage.removeItem('adminToken');
                showLogin();
            }
        } else {
            localStorage.removeItem('adminToken');
            showLogin();
        }
    } catch (error) {
        showLogin();
    }
}

// Login form
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');
    const submitBtn = this.querySelector('button[type="submit"]');
    
    errorEl.textContent = '';
    
    if (!email || !password) {
        errorEl.textContent = 'Please enter both email and password';
        return;
    }
    
    // Show loading
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Logging in...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch(API_URL + '/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            if (data.user.role !== 'admin') {
                errorEl.textContent = 'Access denied. Admin access required.';
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                return;
            }
            
            authToken = data.token;
            localStorage.setItem('adminToken', authToken);
            currentUser = data.user;
            
            showDashboard();
            loadDashboardData();
            showSuccess('Welcome back, ' + currentUser.name + '!');
        } else {
            errorEl.textContent = data.error || 'Invalid credentials';
        }
    } catch (error) {
        errorEl.textContent = 'Network error. Please check your connection and try again.';
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', function() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('adminToken');
        authToken = null;
        currentUser = null;
        showLogin();
        showSuccess('Logged out successfully');
    }
});

// ====================
// NAVIGATION
// ====================

document.querySelectorAll('.menu-link').forEach(function(link) {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Update active menu
        document.querySelectorAll('.menu-link').forEach(function(l) {
            l.classList.remove('active');
        });
        link.classList.add('active');
        
        // Show section
        const section = link.getAttribute('data-section');
        document.querySelectorAll('.section').forEach(function(s) {
            s.classList.remove('active');
        });
        document.getElementById(section).classList.add('active');
        
        // Update page title
        const titles = {
            dashboard: '<i class="fas fa-th-large"></i> Dashboard',
            businesses: '<i class="fas fa-building"></i> Manage Businesses',
            categories: '<i class="fas fa-tags"></i> Manage Categories',
            users: '<i class="fas fa-users"></i> Manage Users',
            reviews: '<i class="fas fa-star"></i> Manage Reviews',
            blogs: '<i class="fas fa-blog"></i> Manage Blog Posts'
        };
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle && titles[section]) {
            pageTitle.innerHTML = titles[section];
        }
        
        // Load data
        if (section === 'dashboard') loadDashboardData();
        if (section === 'categories') loadCategories();
        if (section === 'businesses') loadBusinesses();
        if (section === 'users') loadUsers();
        if (section === 'reviews') loadReviews();
        if (section === 'blogs') loadBlogs();
    });
});

// ====================
// DASHBOARD
// ====================

async function loadDashboardData() {
    try {
        const response = await fetch(API_URL + '/admin/stats', {
            headers: { 'Authorization': 'Bearer ' + authToken }
        });
        
        if (response.ok) {
            const data = await response.json();
            document.getElementById('statBusinesses').textContent = data.stats.businesses || 0;
            document.getElementById('statUsers').textContent = data.stats.users || 0;
            document.getElementById('statReviews').textContent = data.stats.reviews || 0;
            document.getElementById('statCategories').textContent = data.stats.categories || 0;
        } else {
            showError('Failed to load dashboard statistics');
        }
        } catch (error) {
            showError('Failed to load dashboard data');
        }
}

// ====================
// CATEGORIES
// ====================

async function loadCategories(options = {}) {
    const { silent = false } = options;
    
    try {
        if (!silent) {
            showLoading('Loading categories...');
        }
        
        const response = await fetch(API_URL + '/categories?includeInactive=true', {
            headers: { 'Authorization': 'Bearer ' + authToken }
        });
        
        if (response.ok) {
            const data = await response.json();
            allCategories = data.categories || [];
            
            populateCategoryOptions(allCategories);
            
            const tbody = document.querySelector('#categoriesTable tbody');
            if (tbody) {
                tbody.innerHTML = '';
                
                if (allCategories.length > 0) {
                    allCategories.forEach(function(category) {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td><strong>${escapeHtml(category.name)}</strong></td>
                            <td><code>${escapeHtml(category.slug || '')}</code></td>
                            <td>${category.businessCount || 0}</td>
                            <td>${category.order || 0}</td>
                            <td><span class="badge ${category.isActive ? 'badge-success' : 'badge-danger'}">${category.isActive ? 'Active' : 'Inactive'}</span></td>
                            <td class="action-buttons">
                                <button class="btn btn-primary btn-sm edit-category-btn" data-id="${category._id}">
                                    <i class="fas fa-edit"></i> Edit
                                </button>
                                <button class="btn btn-danger btn-sm delete-category-btn" data-id="${category._id}">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            </td>
                        `;
                        tbody.appendChild(row);
                    });
                    
                    document.querySelectorAll('.edit-category-btn').forEach(function(btn) {
                        btn.addEventListener('click', function() {
                            editCategory(this.getAttribute('data-id'));
                        });
                    });
                    
                    document.querySelectorAll('.delete-category-btn').forEach(function(btn) {
                        btn.addEventListener('click', function() {
                            deleteCategory(this.getAttribute('data-id'));
                        });
                    });
                } else {
                    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No categories yet</td></tr>';
                }
            }
        } else {
            showError('Failed to load categories');
        }
    } catch (error) {
        showError('Failed to load categories');
    } finally {
        if (!silent) {
            hideLoading();
        } else {
            hideLoading();
        }
    }
}

function populateCategoryOptions(categories = []) {
    const categoryFilter = document.getElementById('businessCategoryFilter');
    const categorySelect = document.getElementById('businessCategory');
    
    if (categoryFilter) {
        const previousValue = categoryFilter.value;
        categoryFilter.innerHTML = '<option value="">All Categories</option>';
        
        categories.forEach(function(category) {
            const option = document.createElement('option');
            option.value = category._id;
            option.textContent = category.name + (category.isActive ? '' : ' (Inactive)');
            categoryFilter.appendChild(option);
        });
        
        if (previousValue) {
            categoryFilter.value = previousValue;
        }
    }
    
    if (categorySelect) {
        const previousValue = categorySelect.value;
        categorySelect.innerHTML = '<option value="">Select Category</option>';
        
        categories
            .filter(function(category) { return category.isActive; })
            .forEach(function(category) {
                const option = document.createElement('option');
                option.value = category._id;
                option.textContent = category.name;
                categorySelect.appendChild(option);
            });
        
        if (previousValue) {
            categorySelect.value = previousValue;
        }
    }
}

// Add Category
document.getElementById('addCategoryBtn').addEventListener('click', function() {
    document.getElementById('categoryModalTitle').innerHTML = '<i class="fas fa-plus"></i> Add New Category';
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryId').value = '';
    document.getElementById('categoryActive').checked = true;
    const iconInput = document.getElementById('categoryIcon');
    if (iconInput) {
        iconInput.value = 'briefcase';
    }
    if (typeof updateIconPreview === 'function') {
        updateIconPreview();
    }
    document.getElementById('categoryModal').classList.add('active');
});

// Close Category Modal
document.getElementById('closeCategoryModal').addEventListener('click', function() {
    document.getElementById('categoryModal').classList.remove('active');
});
document.getElementById('cancelCategoryBtn').addEventListener('click', function() {
    document.getElementById('categoryModal').classList.remove('active');
});

// Save Category
document.getElementById('saveCategoryBtn').addEventListener('click', async function() {
    const categoryId = document.getElementById('categoryId').value;
    const categoryData = {
        name: document.getElementById('categoryName').value.trim(),
        icon: document.getElementById('categoryIcon').value.trim(),
        description: document.getElementById('categoryDescription').value.trim(),
        order: parseInt(document.getElementById('categoryOrder').value) || 0,
        isActive: document.getElementById('categoryActive').checked
    };
    
    if (!categoryData.name || !categoryData.icon) {
        showError('Please fill in all required fields');
        return;
    }
    
    const originalText = this.textContent;
    this.textContent = 'Saving...';
    this.disabled = true;
    
    try {
        const url = categoryId ? API_URL + '/categories/' + categoryId : API_URL + '/categories';
        const method = categoryId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + authToken
            },
            body: JSON.stringify(categoryData)
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showSuccess(categoryId ? 'Category updated successfully!' : 'Category created successfully!');
            document.getElementById('categoryModal').classList.remove('active');
            loadCategories();
        } else {
            showError(data.error || 'Failed to save category');
        }
        } catch (error) {
            showError('Network error. Failed to save category.');
        } finally {
        this.textContent = originalText;
        this.disabled = false;
    }
});

// Edit Category
function editCategory(id) {
    const category = allCategories.find(function(c) { return c._id === id; });
    if (!category) {
        showError('Category not found');
        return;
    }
    
    document.getElementById('categoryModalTitle').innerHTML = '<i class="fas fa-edit"></i> Edit Category';
    document.getElementById('categoryId').value = category._id;
    document.getElementById('categoryName').value = category.name;
    document.getElementById('categoryIcon').value = category.icon || '';
    document.getElementById('categoryDescription').value = category.description || '';
    document.getElementById('categoryOrder').value = category.order || 0;
    document.getElementById('categoryActive').checked = category.isActive;
    document.getElementById('categoryModal').classList.add('active');
    
    // Update icon preview when editing
    setTimeout(() => {
        const iconName = category.icon || '';
        const preview = document.getElementById('iconPreview');
        if (preview) {
            if (iconName) {
                preview.innerHTML = `<i class="fas fa-${iconName}"></i>`;
            } else {
                preview.innerHTML = `<i class="fas fa-question-circle"></i>`;
            }
        }
        // Update icon input
        const iconInput = document.getElementById('categoryIcon');
        if (iconInput) {
            iconInput.value = iconName;
        }
    }, 100);
};

// Delete Category
async function deleteCategory(id) {
    const category = allCategories.find(function(c) { return c._id === id; });
    if (!category) {
        showError('Category not found');
        return;
    }
    
    if (!confirm('Are you sure you want to delete "' + category.name + '"?\n\nThis action cannot be undone.')) {
        return;
    }
    
    showLoading('Deleting category...');
    
    try {
        const response = await fetch(API_URL + '/categories/' + id, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + authToken }
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showSuccess('Category deleted successfully!');
            loadCategories();
        } else {
            hideLoading();
            showError(data.error || 'Failed to delete category');
        }
    } catch (error) {
        hideLoading();
        showError('Network error. Failed to delete category.');
    }
};

// ====================
// BUSINESSES
// ====================

async function loadBusinesses() {
    try {
        showLoading('Loading businesses...');
        const response = await fetch(API_URL + '/admin/businesses', {
            headers: { 'Authorization': 'Bearer ' + authToken }
        });
        
        if (!response.ok) {
            showError('Failed to load businesses');
            return;
        }
        
        const data = await response.json();
        allBusinesses = data.businesses || [];
        
        if (!allCategories.length) {
            await loadCategories({ silent: true });
        } else {
            populateCategoryOptions(allCategories);
        }
        
        renderBusinesses(allBusinesses);
    } catch (error) {
        showError('Failed to load businesses');
    } finally {
        hideLoading();
    }
}

function renderBusinesses(businesses) {
    const tbody = document.querySelector('#businessesTable tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!businesses || businesses.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No businesses yet</td></tr>';
        return;
    }
    
    businesses.forEach(function(business) {
        const row = document.createElement('tr');
        const categoryName = business.category && business.category.name ? business.category.name : 'N/A';
        const city = business.location && business.location.city ? business.location.city : '';
        const state = business.location && business.location.state ? business.location.state : '';
        const location = (city || state) ? `${city}${city && state ? ', ' : ''}${state}` : 'N/A';
        const rating = business.rating && typeof business.rating.average === 'number'
            ? business.rating.average.toFixed(1)
            : '0.0';
        
        row.innerHTML = `
            <td><strong>${escapeHtml(business.name || 'Unnamed')}</strong></td>
            <td>${escapeHtml(categoryName)}</td>
            <td>${escapeHtml(location)}</td>
            <td><strong>${rating}</strong> ⭐</td>
            <td><span class="badge ${business.isActive ? 'badge-success' : 'badge-warning'}">${business.isActive ? 'Active' : 'Pending'}</span></td>
            <td class="action-buttons">
                <button class="btn btn-info btn-sm view-business-btn" data-id="${business._id}">
                    <i class="fas fa-eye"></i> View
                </button>
                ${!business.isActive ? '<button class="btn btn-success btn-sm approve-business-btn" data-id="' + business._id + '"><i class="fas fa-check"></i> Approve</button>' : ''}
                <button class="btn btn-${business.isFeatured ? 'warning' : 'info'} btn-sm toggle-feature-btn" data-id="${business._id}">
                    <i class="fas fa-star"></i> ${business.isFeatured ? 'Unfeature' : 'Feature'}
                </button>
                <button class="btn btn-danger btn-sm delete-business-btn" data-id="${business._id}">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    attachBusinessActionHandlers();
}

function attachBusinessActionHandlers() {
    document.querySelectorAll('.view-business-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            viewBusiness(this.getAttribute('data-id'));
        });
    });
    
    document.querySelectorAll('.approve-business-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            approveBusiness(this.getAttribute('data-id'));
        });
    });
    
    document.querySelectorAll('.toggle-feature-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            toggleFeature(this.getAttribute('data-id'));
        });
    });
    
    document.querySelectorAll('.delete-business-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            deleteBusiness(this.getAttribute('data-id'));
        });
    });
}

function filterBusinesses() {
    const searchInput = document.getElementById('businessSearch');
    const categoryFilter = document.getElementById('businessCategoryFilter');
    
    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const selectedCategory = categoryFilter ? categoryFilter.value : '';
    
    let filtered = allBusinesses.slice();
    
    if (searchTerm) {
        filtered = filtered.filter(function(business) {
            const name = (business.name || '').toLowerCase();
            const city = (business.location && business.location.city ? business.location.city : '').toLowerCase();
            const state = (business.location && business.location.state ? business.location.state : '').toLowerCase();
            return name.includes(searchTerm) || city.includes(searchTerm) || state.includes(searchTerm);
        });
    }
    
    if (selectedCategory) {
        filtered = filtered.filter(function(business) {
            if (!business.category) return false;
            if (typeof business.category === 'string') {
                return business.category === selectedCategory;
            }
            return business.category._id === selectedCategory;
        });
    }
    
    renderBusinesses(filtered);
}

const businessSearchInput = document.getElementById('businessSearch');
if (businessSearchInput) {
    businessSearchInput.addEventListener('input', filterBusinesses);
}

const businessCategoryFilterSelect = document.getElementById('businessCategoryFilter');
if (businessCategoryFilterSelect) {
    businessCategoryFilterSelect.addEventListener('change', filterBusinesses);
}

const blogSearchInput = document.getElementById('blogSearch');
if (blogSearchInput) {
    blogSearchInput.addEventListener('input', filterBlogs);
}

const blogStatusFilterSelect = document.getElementById('blogStatusFilter');
if (blogStatusFilterSelect) {
    blogStatusFilterSelect.addEventListener('change', filterBlogs);
}

const addBusinessBtn = document.getElementById('addBusinessBtn');
if (addBusinessBtn) {
    addBusinessBtn.addEventListener('click', function() {
        openBusinessModal();
    });
}

const addBlogBtn = document.getElementById('addBlogBtn');
if (addBlogBtn) {
    addBlogBtn.addEventListener('click', function() {
        openBlogModal();
    });
}

const closeBusinessModalIcon = document.getElementById('closeBusinessModal');
if (closeBusinessModalIcon) {
    closeBusinessModalIcon.addEventListener('click', function() {
        closeBusinessModal();
    });
}

const cancelBusinessBtn = document.getElementById('cancelBusinessBtn');
if (cancelBusinessBtn) {
    cancelBusinessBtn.addEventListener('click', function(e) {
        e.preventDefault();
        closeBusinessModal();
    });
}

const businessModalContainer = document.getElementById('businessModal');
if (businessModalContainer) {
    businessModalContainer.addEventListener('click', function(e) {
        if (e.target === businessModalContainer) {
            closeBusinessModal();
        }
    });
}

const saveBusinessBtn = document.getElementById('saveBusinessBtn');
if (saveBusinessBtn) {
    saveBusinessBtn.addEventListener('click', function(e) {
        e.preventDefault();
        saveBusiness();
    });
}

const closeBlogModalIcon = document.getElementById('closeBlogModal');
if (closeBlogModalIcon) {
    closeBlogModalIcon.addEventListener('click', function() {
        closeBlogModal();
    });
}

const cancelBlogBtn = document.getElementById('cancelBlogBtn');
if (cancelBlogBtn) {
    cancelBlogBtn.addEventListener('click', function(e) {
        e.preventDefault();
        closeBlogModal();
    });
}

const blogModalContainer = document.getElementById('blogModal');
if (blogModalContainer) {
    blogModalContainer.addEventListener('click', function(e) {
        if (e.target === blogModalContainer) {
            closeBlogModal();
        }
    });
}

const saveBlogBtn = document.getElementById('saveBlogBtn');
if (saveBlogBtn) {
    saveBlogBtn.addEventListener('click', function(e) {
        e.preventDefault();
        saveBlog();
    });
}

const closeViewBlogModalIcon = document.getElementById('closeViewBlogModal');
if (closeViewBlogModalIcon) {
    closeViewBlogModalIcon.addEventListener('click', function() {
        const viewModal = document.getElementById('viewBlogModal');
        if (viewModal) {
            viewModal.classList.remove('active');
        }
    });
}

const closeViewBlogModalBtn = document.getElementById('closeViewBlogModalBtn');
if (closeViewBlogModalBtn) {
    closeViewBlogModalBtn.addEventListener('click', function() {
        const viewModal = document.getElementById('viewBlogModal');
        if (viewModal) {
            viewModal.classList.remove('active');
        }
    });
}

const viewBlogModalContainer = document.getElementById('viewBlogModal');
if (viewBlogModalContainer) {
    viewBlogModalContainer.addEventListener('click', function(e) {
        if (e.target === viewBlogModalContainer) {
            viewBlogModalContainer.classList.remove('active');
        }
    });
}

async function openBusinessModal() {
    try {
        if (!allCategories.length) {
            await loadCategories({ silent: true });
        } else {
            populateCategoryOptions(allCategories);
        }
        
        const form = document.getElementById('businessForm');
        if (form) {
            form.reset();
        }
        
        const businessIdField = document.getElementById('businessId');
        if (businessIdField) {
            businessIdField.value = '';
        }
        
        const activeCheckbox = document.getElementById('businessActive');
        if (activeCheckbox) {
            activeCheckbox.checked = true;
        }
        
        const featuredCheckbox = document.getElementById('businessFeatured');
        if (featuredCheckbox) {
            featuredCheckbox.checked = false;
        }
        
        const verifiedCheckbox = document.getElementById('businessVerified');
        if (verifiedCheckbox) {
            verifiedCheckbox.checked = false;
        }
        
        const modalTitle = document.getElementById('businessModalTitle');
        if (modalTitle) {
            modalTitle.innerHTML = '<i class="fas fa-building"></i> Add Business';
        }
        
        if (businessModalContainer) {
            businessModalContainer.classList.add('active');
        }
    } catch (error) {
        showError('Unable to open business form. Please try again.');
    }
}

function closeBusinessModal() {
    if (businessModalContainer) {
        businessModalContainer.classList.remove('active');
    }
}

async function saveBusiness() {
    const submitBtn = document.getElementById('saveBusinessBtn');
    if (!submitBtn) {
        return;
    }
    
    const name = document.getElementById('businessName').value.trim();
    const category = document.getElementById('businessCategory').value;
    const description = document.getElementById('businessDescription').value.trim();
    const address = document.getElementById('businessAddress').value.trim();
    const city = document.getElementById('businessCity').value.trim();
    const state = document.getElementById('businessState').value.trim();
    const zipCode = document.getElementById('businessZip').value.trim();
    const phone = document.getElementById('businessPhone').value.trim();
    const email = document.getElementById('businessEmail').value.trim();
    const website = document.getElementById('businessWebsite').value.trim();
    const isActive = document.getElementById('businessActive').checked;
    const isFeatured = document.getElementById('businessFeatured').checked;
    const isVerified = document.getElementById('businessVerified').checked;
    
    if (!name || !category || !description || !address || !city || !state || !phone) {
        showError('Please fill in all required fields (marked with *)');
        return;
    }
    
    const businessData = {
        name,
        category,
        description,
        location: {
            address,
            city,
            state,
            country: 'USA'
        },
        contact: {
            phone
        },
        isActive,
        isFeatured,
        isVerified
    };
    
    if (zipCode) {
        businessData.location.zipCode = zipCode;
    }
    
    if (email) {
        businessData.contact.email = email;
    }
    
    if (website) {
        businessData.contact.website = website;
    }
    
    const originalHtml = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    
    try {
        const response = await fetch(API_URL + '/admin/businesses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + authToken
            },
            body: JSON.stringify(businessData)
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showSuccess(data.message || 'Business created successfully!');
            closeBusinessModal();
            await loadBusinesses();
            await loadDashboardData();
        } else {
            showError(data.error || 'Failed to save business');
        }
    } catch (error) {
        showError('Network error. Failed to save business.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHtml;
    }
}


// View Business Details
function viewBusiness(id) {
    const business = allBusinesses.find(function(b) { return b._id === id; });
    if (!business) {
        showError('Business not found');
        return;
    }
    
    // Populate modal with business details
    document.getElementById('viewBusinessName').textContent = business.name || 'N/A';
    document.getElementById('viewBusinessCategory').textContent = business.category ? business.category.name : 'N/A';
    document.getElementById('viewBusinessDescription').textContent = business.description || 'No description';
    document.getElementById('viewBusinessAddress').textContent = business.location ? 
        `${business.location.address || ''}, ${business.location.city || ''}, ${business.location.state || ''} ${business.location.zipCode || ''}`.trim() : 'N/A';
    document.getElementById('viewBusinessPhone').textContent = business.contact ? (business.contact.phone || 'N/A') : 'N/A';
    document.getElementById('viewBusinessEmail').textContent = business.contact ? (business.contact.email || 'N/A') : 'N/A';
    document.getElementById('viewBusinessWebsite').textContent = business.contact ? (business.contact.website || 'N/A') : 'N/A';
    document.getElementById('viewBusinessWebsite').href = business.contact && business.contact.website ? business.contact.website : '#';
    document.getElementById('viewBusinessRating').textContent = business.rating ? business.rating.average.toFixed(1) : '0.0';
    document.getElementById('viewBusinessReviews').textContent = business.rating ? (business.rating.count || 0) : 0;
    document.getElementById('viewBusinessStatus').textContent = business.isActive ? 'Active' : 'Pending';
    document.getElementById('viewBusinessStatus').className = 'badge ' + (business.isActive ? 'badge-success' : 'badge-warning');
    document.getElementById('viewBusinessFeatured').textContent = business.isFeatured ? 'Yes' : 'No';
    document.getElementById('viewBusinessFeatured').className = 'badge ' + (business.isFeatured ? 'badge-warning' : 'badge-secondary');
    document.getElementById('viewBusinessCreated').textContent = new Date(business.createdAt).toLocaleString();
    document.getElementById('viewBusinessViews').textContent = business.views || 0;
    
    // Show modal
    document.getElementById('viewBusinessModal').classList.add('active');
}

// View Review Details
function viewReview(id) {
    const review = allReviews.find(function(r) { return r._id === id; });
    if (!review) {
        showError('Review not found');
        return;
    }
    
    // Populate modal with review details
    document.getElementById('viewReviewBusiness').textContent = review.business ? review.business.name : 'Deleted Business';
    document.getElementById('viewReviewUser').textContent = review.user ? review.user.name : 'Anonymous';
    document.getElementById('viewReviewRating').textContent = '⭐'.repeat(review.rating);
    document.getElementById('viewReviewTitle').textContent = review.title || 'No title';
    document.getElementById('viewReviewComment').textContent = review.comment || 'No comment';
    document.getElementById('viewReviewDate').textContent = new Date(review.createdAt).toLocaleString();
    document.getElementById('viewReviewStatus').textContent = review.isApproved ? 'Approved' : 'Pending';
    document.getElementById('viewReviewStatus').className = 'badge ' + (review.isApproved ? 'badge-success' : 'badge-warning');
    document.getElementById('viewReviewHelpful').textContent = review.helpfulCount || 0;
    
    // Show business response if exists
    const responseDiv = document.getElementById('viewReviewResponse');
    if (review.response && review.response.comment) {
        responseDiv.innerHTML = `
            <div class="review-response">
                <h4><i class="fas fa-reply"></i> Business Response</h4>
                <p>${escapeHtml(review.response.comment)}</p>
                <small>Responded on ${new Date(review.response.respondedAt).toLocaleString()}</small>
            </div>
        `;
        responseDiv.style.display = 'block';
    } else {
        responseDiv.style.display = 'none';
    }
    
    // Show modal
    document.getElementById('viewReviewModal').classList.add('active');
}

// Approve Business
async function approveBusiness(id) {
    if (!confirm('Approve this business listing?')) return;
    
    showLoading('Approving business...');
    
    try {
        const response = await fetch(API_URL + '/admin/businesses/' + id + '/approve', {
            method: 'PUT',
            headers: { 'Authorization': 'Bearer ' + authToken }
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showSuccess('Business approved successfully!');
            loadBusinesses();
        } else {
            hideLoading();
            showError(data.error || 'Failed to approve business');
        }
    } catch (error) {
        hideLoading();
        showError('Failed to approve business');
    }
};

// Toggle Feature
async function toggleFeature(id) {
    showLoading('Updating business...');
    
    try {
        const response = await fetch(API_URL + '/admin/businesses/' + id + '/feature', {
            method: 'PUT',
            headers: { 'Authorization': 'Bearer ' + authToken }
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showSuccess(data.message);
            loadBusinesses();
        } else {
            hideLoading();
            showError(data.error || 'Failed to update business');
        }
    } catch (error) {
        hideLoading();
        showError('Failed to update business');
    }
};

// Edit Business
function editBusiness(id) {
    const business = allBusinesses.find(function(b) { return b._id === id; });
    if (!business) {
        showError('Business not found');
        return;
    }
    
    // For now, show business details in alert
    // In a full implementation, you'd create an edit modal
    const details = `
Business: ${business.name}
Category: ${business.category ? business.category.name : 'N/A'}
Location: ${business.location ? business.location.city + ', ' + business.location.state : 'N/A'}
Phone: ${business.contact ? business.contact.phone : 'N/A'}
Email: ${business.contact ? business.contact.email : 'N/A'}
Status: ${business.isActive ? 'Active' : 'Pending'}
Featured: ${business.isFeatured ? 'Yes' : 'No'}

To edit business details, please use the API endpoint:
PUT /api/businesses/${id}
    `.trim();
    
    alert(details);
    showInfo('Full edit modal can be implemented. For now, use API to edit business details.');
};

// Delete Business
async function deleteBusiness(id) {
    const business = allBusinesses.find(function(b) { return b._id === id; });
    if (!business) {
        showError('Business not found');
        return;
    }
    
    if (!confirm('Are you sure you want to delete "' + business.name + '"?\n\nThis action cannot be undone.')) {
        return;
    }
    
    showLoading('Deleting business...');
    
    try {
        const response = await fetch(API_URL + '/admin/businesses/' + id, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + authToken }
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showSuccess('Business deleted successfully!');
            loadBusinesses();
            loadDashboardData(); // Refresh stats
        } else {
            hideLoading();
            showError(data.error || 'Failed to delete business');
        }
    } catch (error) {
        hideLoading();
        showError('Network error. Failed to delete business.');
    }
};

// ====================
// USERS
// ====================

async function loadUsers() {
    try {
        showLoading('Loading users...');
        const response = await fetch(API_URL + '/admin/users', {
            headers: { 'Authorization': 'Bearer ' + authToken }
        });
        
        if (response.ok) {
            const data = await response.json();
            allUsers = data.users || [];
            const tbody = document.querySelector('#usersTable tbody');
            tbody.innerHTML = '';
            
            if (allUsers.length > 0) {
                allUsers.forEach(function(user) {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td><strong>${escapeHtml(user.name)}</strong></td>
                        <td>${escapeHtml(user.email)}</td>
                        <td><span class="badge badge-info">${user.role}</span></td>
                        <td><span class="badge ${user.isActive ? 'badge-success' : 'badge-danger'}">${user.isActive ? 'Active' : 'Inactive'}</span></td>
                        <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                        <td>
                            ${user.role !== 'admin' ? '<button class="btn btn-danger btn-sm delete-user-btn" data-id="' + user._id + '"><i class="fas fa-trash"></i> Delete</button>' : '<span class="badge badge-warning">Protected</span>'}
                        </td>
                    `;
                    tbody.appendChild(row);
                });
                
                // Add event listeners
                document.querySelectorAll('.delete-user-btn').forEach(function(btn) {
                    btn.addEventListener('click', function() {
                        deleteUser(this.getAttribute('data-id'));
                    });
                });
            } else {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No users yet</td></tr>';
            }
            hideLoading();
        } else {
            hideLoading();
            showError('Failed to load users');
        }
    } catch (error) {
        hideLoading();
        showError('Failed to load users');
    }
}

// Delete User
async function deleteUser(id) {
    const user = allUsers.find(function(u) { return u._id === id; });
    if (!user) {
        showError('User not found');
        return;
    }
    
    if (!confirm('Are you sure you want to delete user "' + user.name + '" (' + user.email + ')?\n\nThis action cannot be undone.')) {
        return;
    }
    
    showLoading('Deleting user...');
    
    try {
        const response = await fetch(API_URL + '/admin/users/' + id, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + authToken }
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showSuccess('User deleted successfully!');
            loadUsers();
            loadDashboardData(); // Refresh stats
        } else {
            hideLoading();
            showError(data.error || 'Failed to delete user');
        }
    } catch (error) {
        hideLoading();
        showError('Network error. Failed to delete user.');
    }
};

// ====================
// REVIEWS
// ====================

async function loadReviews() {
    try {
        showLoading('Loading reviews...');
        const response = await fetch(API_URL + '/admin/reviews', {
            headers: { 'Authorization': 'Bearer ' + authToken }
        });
        
        if (response.ok) {
            const data = await response.json();
            allReviews = data.reviews || [];
            const tbody = document.querySelector('#reviewsTable tbody');
            tbody.innerHTML = '';
            
            if (allReviews.length > 0) {
                allReviews.forEach(function(review) {
                    const row = document.createElement('tr');
                    const businessName = review.business ? review.business.name : 'Deleted';
                    const userName = review.user ? review.user.name : 'Deleted';
                    const comment = review.comment ? review.comment.substring(0, 50) + '...' : '';
                    
                    row.innerHTML = `
                        <td><strong>${escapeHtml(businessName)}</strong></td>
                        <td>${escapeHtml(userName)}</td>
                        <td>${'⭐'.repeat(review.rating)}</td>
                        <td>${escapeHtml(comment)}</td>
                        <td>${new Date(review.createdAt).toLocaleDateString()}</td>
                        <td><span class="badge ${review.isApproved ? 'badge-success' : 'badge-warning'}">${review.isApproved ? 'Approved' : 'Pending'}</span></td>
                        <td class="action-buttons">
                            <button class="btn btn-info btn-sm view-review-btn" data-id="${review._id}">
                                <i class="fas fa-eye"></i> View
                            </button>
                            ${!review.isApproved ? '<button class="btn btn-success btn-sm approve-review-btn" data-id="' + review._id + '"><i class="fas fa-check"></i> Approve</button>' : ''}
                            <button class="btn btn-danger btn-sm delete-review-btn" data-id="${review._id}"><i class="fas fa-trash"></i> Delete</button>
                        </td>
                    `;
                    tbody.appendChild(row);
                });
                
                // Add event listeners
                document.querySelectorAll('.view-review-btn').forEach(function(btn) {
                    btn.addEventListener('click', function() {
                        viewReview(this.getAttribute('data-id'));
                    });
                });
                
                document.querySelectorAll('.approve-review-btn').forEach(function(btn) {
                    btn.addEventListener('click', function() {
                        approveReview(this.getAttribute('data-id'));
                    });
                });
                
                document.querySelectorAll('.delete-review-btn').forEach(function(btn) {
                    btn.addEventListener('click', function() {
                        deleteReview(this.getAttribute('data-id'));
                    });
                });
            } else {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No reviews yet</td></tr>';
            }
            hideLoading();
        } else {
            hideLoading();
            showError('Failed to load reviews');
        }
    } catch (error) {
        hideLoading();
        showError('Failed to load reviews');
    }
}

// Approve Review
async function approveReview(id) {
    showLoading('Approving review...');
    
    try {
        const response = await fetch(API_URL + '/admin/reviews/' + id + '/approve', {
            method: 'PUT',
            headers: { 'Authorization': 'Bearer ' + authToken }
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showSuccess('Review approved successfully!');
            loadReviews();
        } else {
            hideLoading();
            showError(data.error || 'Failed to approve review');
        }
    } catch (error) {
        hideLoading();
        showError('Failed to approve review');
    }
};

// Delete Review
async function deleteReview(id) {
    if (!confirm('Are you sure you want to delete this review?\n\nThis action cannot be undone.')) {
        return;
    }
    
    showLoading('Deleting review...');
    
    try {
        const response = await fetch(API_URL + '/admin/reviews/' + id, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + authToken }
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showSuccess('Review deleted successfully!');
            loadReviews();
            loadDashboardData(); // Refresh stats
        } else {
            hideLoading();
            showError(data.error || 'Failed to delete review');
        }
    } catch (error) {
        hideLoading();
        showError('Failed to delete review');
    }
};

// ====================
// BLOGS
// ====================

async function loadBlogs() {
    try {
        showLoading('Loading blog posts...');
        const response = await fetch(API_URL + '/admin/blogs', {
            headers: { 'Authorization': 'Bearer ' + authToken }
        });

        if (!response.ok) {
            showError('Failed to load blog posts');
            return;
        }

        const data = await response.json();
        allBlogs = data.blogs || [];
        renderBlogs(allBlogs);
    } catch (error) {
        showError('Failed to load blog posts');
    } finally {
        hideLoading();
    }
}

function renderBlogs(blogs) {
    const tbody = document.querySelector('#blogsTable tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!blogs || blogs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No blog posts yet</td></tr>';
        return;
    }

    blogs.forEach(function(blog) {
        const row = document.createElement('tr');
        const isPublished = blog.isPublished;
        const updatedAt = blog.updatedAt ? new Date(blog.updatedAt).toLocaleString() : 'N/A';
        row.innerHTML = `
            <td><strong>${escapeHtml(blog.title || 'Untitled')}</strong></td>
            <td>${escapeHtml(blog.author || 'CityLocal 101 Team')}</td>
            <td><span class="badge ${isPublished ? 'badge-success' : 'badge-warning'}">${isPublished ? 'Published' : 'Draft'}</span></td>
            <td>${updatedAt}</td>
            <td class="action-buttons">
                <button class="btn btn-info btn-sm view-blog-btn" data-id="${blog._id}">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="btn btn-primary btn-sm edit-blog-btn" data-id="${blog._id}">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-${isPublished ? 'warning' : 'success'} btn-sm toggle-blog-btn" data-id="${blog._id}">
                    <i class="fas fa-${isPublished ? 'ban' : 'check'}"></i> ${isPublished ? 'Unpublish' : 'Publish'}
                </button>
                <button class="btn btn-danger btn-sm delete-blog-btn" data-id="${blog._id}">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    attachBlogActionHandlers();
}

function attachBlogActionHandlers() {
    document.querySelectorAll('.view-blog-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            viewBlog(this.getAttribute('data-id'));
        });
    });

    document.querySelectorAll('.edit-blog-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            openBlogModal(this.getAttribute('data-id'));
        });
    });

    document.querySelectorAll('.toggle-blog-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            toggleBlogPublish(this.getAttribute('data-id'));
        });
    });

    document.querySelectorAll('.delete-blog-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            deleteBlog(this.getAttribute('data-id'));
        });
    });
}

function filterBlogs() {
    const searchInput = document.getElementById('blogSearch');
    const statusFilter = document.getElementById('blogStatusFilter');

    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const status = statusFilter ? statusFilter.value : '';

    let filtered = allBlogs.slice();

    if (searchTerm) {
        filtered = filtered.filter(function(blog) {
            const title = (blog.title || '').toLowerCase();
            const author = (blog.author || '').toLowerCase();
            const summary = (blog.summary || '').toLowerCase();
            const tags = Array.isArray(blog.tags) ? blog.tags.join(',').toLowerCase() : '';
            return title.includes(searchTerm) || author.includes(searchTerm) || summary.includes(searchTerm) || tags.includes(searchTerm);
        });
    }

    if (status) {
        filtered = filtered.filter(function(blog) {
            return status === 'published' ? blog.isPublished : !blog.isPublished;
        });
    }

    renderBlogs(filtered);
}

async function openBlogModal(id) {
    try {
        const form = document.getElementById('blogForm');
        if (form) {
            form.reset();
        }

        const blogIdInput = document.getElementById('blogId');
        const modalTitle = document.getElementById('blogModalTitle');
        const publishedCheckbox = document.getElementById('blogPublished');

        if (blogIdInput) {
            blogIdInput.value = '';
        }

        if (publishedCheckbox) {
            publishedCheckbox.checked = false;
        }

        if (id) {
            const blog = allBlogs.find(function(b) { return b._id === id; });
            if (!blog) {
                showError('Blog post not found');
                return;
            }

            if (modalTitle) {
                modalTitle.innerHTML = '<i class="fas fa-edit"></i> Edit Blog Post';
            }

            if (blogIdInput) {
                blogIdInput.value = blog._id;
            }

            document.getElementById('blogTitle').value = blog.title || '';
            document.getElementById('blogSummary').value = blog.summary || '';
            document.getElementById('blogContent').value = blog.content || '';
            document.getElementById('blogAuthor').value = blog.author || '';
            document.getElementById('blogCoverImage').value = blog.coverImage || '';
            document.getElementById('blogTags').value = Array.isArray(blog.tags) ? blog.tags.join(', ') : '';
            if (publishedCheckbox) {
                publishedCheckbox.checked = Boolean(blog.isPublished);
            }
        } else if (modalTitle) {
            modalTitle.innerHTML = '<i class="fas fa-blog"></i> Add Blog Post';
        }

        const blogModal = document.getElementById('blogModal');
        if (blogModal) {
            blogModal.classList.add('active');
        }
    } catch (error) {
        showError('Unable to open blog form. Please try again.');
    }
}

function closeBlogModal() {
    const blogModal = document.getElementById('blogModal');
    if (blogModal) {
        blogModal.classList.remove('active');
    }
}

async function saveBlog() {
    const submitBtn = document.getElementById('saveBlogBtn');
    if (!submitBtn) return;

    const blogId = document.getElementById('blogId').value;
    const title = document.getElementById('blogTitle').value.trim();
    const summary = document.getElementById('blogSummary').value.trim();
    const content = document.getElementById('blogContent').value.trim();
    const author = document.getElementById('blogAuthor').value.trim();
    const coverImage = document.getElementById('blogCoverImage').value.trim();
    const tagsInput = document.getElementById('blogTags').value.trim();
    const isPublished = document.getElementById('blogPublished').checked;

    if (!title || !summary || !content) {
        showError('Please fill in all required fields (marked with *)');
        return;
    }

    const blogData = {
        title,
        summary,
        content,
        author,
        coverImage,
        isPublished
    };

    if (tagsInput) {
        blogData.tags = tagsInput.split(',').map(tag => tag.trim()).filter(Boolean);
    } else {
        blogData.tags = [];
    }

    const originalHtml = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    try {
        const url = blogId ? `${API_URL}/admin/blogs/${blogId}` : `${API_URL}/admin/blogs`;
        const method = blogId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + authToken
            },
            body: JSON.stringify(blogData)
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showSuccess(data.message || 'Blog post saved successfully!');
            closeBlogModal();
            await loadBlogs();
        } else {
            showError(data.error || 'Failed to save blog post');
        }
    } catch (error) {
        showError('Network error. Failed to save blog post.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHtml;
    }
}

async function toggleBlogPublish(id) {
    const blog = allBlogs.find(function(b) { return b._id === id; });
    if (!blog) {
        showError('Blog post not found');
        return;
    }

    const confirmMessage = blog.isPublished
        ? 'Are you sure you want to unpublish this blog post?'
        : 'Publish this blog post now?';

    if (!confirm(confirmMessage)) {
        return;
    }

    showLoading(blog.isPublished ? 'Unpublishing blog...' : 'Publishing blog...');

    try {
        const response = await fetch(API_URL + '/admin/blogs/' + id, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + authToken
            },
            body: JSON.stringify({ isPublished: !blog.isPublished })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showSuccess(data.message || 'Blog status updated successfully!');
            await loadBlogs();
        } else {
            hideLoading();
            showError(data.error || 'Failed to update blog status');
        }
    } catch (error) {
        hideLoading();
        showError('Failed to update blog status');
    }
}

async function deleteBlog(id) {
    const blog = allBlogs.find(function(b) { return b._id === id; });
    if (!blog) {
        showError('Blog post not found');
        return;
    }

    if (!confirm(`Are you sure you want to delete "${blog.title}"?\n\nThis action cannot be undone.`)) {
        return;
    }

    showLoading('Deleting blog post...');

    try {
        const response = await fetch(API_URL + '/admin/blogs/' + id, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + authToken }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showSuccess('Blog post deleted successfully!');
            await loadBlogs();
        } else {
            hideLoading();
            showError(data.error || 'Failed to delete blog post');
        }
    } catch (error) {
        hideLoading();
        showError('Network error. Failed to delete blog post.');
    }
}

function viewBlog(id) {
    const blog = allBlogs.find(function(b) { return b._id === id; });
    if (!blog) {
        showError('Blog post not found');
        return;
    }

    document.getElementById('viewBlogTitle').textContent = blog.title || 'Untitled';

    const metaParts = [];
    if (blog.author) {
        metaParts.push(`By ${blog.author}`);
    }
    if (blog.publishedAt) {
        metaParts.push(`Published ${new Date(blog.publishedAt).toLocaleString()}`);
    } else {
        metaParts.push('Draft');
    }
    document.getElementById('viewBlogMeta').textContent = metaParts.join(' • ');

    document.getElementById('viewBlogSummary').textContent = blog.summary || '';
    document.getElementById('viewBlogContent').textContent = blog.content || '';

    const viewModal = document.getElementById('viewBlogModal');
    if (viewModal) {
        viewModal.classList.add('active');
    }
}

// ====================
// RECENT ACTIVITIES
// ====================

async function loadActivities() {
    try {
        const activitiesList = document.getElementById('activitiesList');
        if (!activitiesList) return;

        activitiesList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #999;">
                <i class="fas fa-spinner fa-spin" style="font-size: 24px; margin-bottom: 10px;"></i>
                <p>Loading activities...</p>
            </div>
        `;

        const response = await fetch(API_URL + '/admin/activities?limit=20', {
            headers: { 'Authorization': 'Bearer ' + authToken }
        });

        if (response.ok) {
            const data = await response.json();
            
            if (data.success && data.activities && data.activities.length > 0) {
                activitiesList.innerHTML = '';
                
                data.activities.forEach(function(activity) {
                    const activityItem = createActivityItem(activity);
                    activitiesList.appendChild(activityItem);
                });
            } else {
                activitiesList.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #999;">
                        <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 20px; opacity: 0.3;"></i>
                        <p>No activities yet</p>
                        <p style="font-size: 14px; margin-top: 10px;">Activities will appear here as users interact with the platform</p>
                    </div>
                `;
            }
        } else {
            activitiesList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #E74C3C;">
                    <i class="fas fa-exclamation-circle" style="font-size: 24px; margin-bottom: 10px;"></i>
                    <p>Failed to load activities</p>
                </div>
            `;
        }
    } catch (error) {
        const activitiesList = document.getElementById('activitiesList');
        if (activitiesList) {
            activitiesList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #E74C3C;">
                    <i class="fas fa-exclamation-circle" style="font-size: 24px; margin-bottom: 10px;"></i>
                    <p>Error loading activities</p>
                </div>
            `;
        }
    }
}

function createActivityItem(activity) {
    const item = document.createElement('div');
    item.className = 'activity-item';
    item.style.cssText = `
        display: flex;
        align-items: flex-start;
        gap: 15px;
        padding: 15px;
        border-bottom: 1px solid #E0E0E0;
        transition: background-color 0.2s;
    `;

    // Get icon and color based on activity type
    let icon = 'fa-circle';
    let iconColor = '#999';
    let bgColor = '#F5F5F5';
    
    switch(activity.type) {
        case 'business_submitted':
            icon = 'fa-building';
            iconColor = '#3498DB';
            bgColor = '#EBF5FB';
            break;
        case 'business_approved':
            icon = 'fa-check-circle';
            iconColor = '#27AE60';
            bgColor = '#E8F8F5';
            break;
        case 'business_deleted':
            icon = 'fa-trash';
            iconColor = '#E74C3C';
            bgColor = '#FADBD8';
            break;
        case 'business_featured':
            icon = 'fa-star';
            iconColor = '#F39C12';
            bgColor = '#FEF5E7';
            break;
        case 'review_submitted':
            icon = 'fa-comment';
            iconColor = '#3498DB';
            bgColor = '#EBF5FB';
            break;
        case 'review_approved':
            icon = 'fa-check-circle';
            iconColor = '#27AE60';
            bgColor = '#E8F8F5';
            break;
        case 'review_deleted':
            icon = 'fa-trash';
            iconColor = '#E74C3C';
            bgColor = '#FADBD8';
            break;
        case 'user_registered':
            icon = 'fa-user-plus';
            iconColor = '#3498DB';
            bgColor = '#EBF5FB';
            break;
        case 'user_deleted':
            icon = 'fa-user-times';
            iconColor = '#E74C3C';
            bgColor = '#FADBD8';
            break;
        case 'category_created':
            icon = 'fa-plus-circle';
            iconColor = '#27AE60';
            bgColor = '#E8F8F5';
            break;
        case 'category_updated':
            icon = 'fa-edit';
            iconColor = '#3498DB';
            bgColor = '#EBF5FB';
            break;
        case 'category_deleted':
            icon = 'fa-trash';
            iconColor = '#E74C3C';
            bgColor = '#FADBD8';
            break;
        case 'contact_submitted':
            icon = 'fa-envelope';
            iconColor = '#9B59B6';
            bgColor = '#F4ECF7';
            break;
        default:
            icon = 'fa-circle';
            iconColor = '#999';
            bgColor = '#F5F5F5';
    }

    // Format time
    const timeAgo = getTimeAgo(new Date(activity.createdAt));
    
    item.innerHTML = `
        <div style="
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: ${bgColor};
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        ">
            <i class="fas ${icon}" style="color: ${iconColor}; font-size: 18px;"></i>
        </div>
        <div style="flex: 1; min-width: 0;">
            <div style="
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 5px;
            ">
                <p style="
                    margin: 0;
                    font-size: 15px;
                    color: #333;
                    font-weight: 500;
                    line-height: 1.4;
                ">${escapeHtml(activity.description)}</p>
                <span style="
                    font-size: 12px;
                    color: #999;
                    white-space: nowrap;
                    margin-left: 15px;
                ">${timeAgo}</span>
            </div>
            ${activity.user ? `
                <div style="font-size: 13px; color: #666; margin-top: 5px;">
                    <i class="fas fa-user" style="margin-right: 5px;"></i>
                    ${activity.user.name || 'Admin'}
                </div>
            ` : ''}
        </div>
    `;

    item.addEventListener('mouseenter', function() {
        this.style.backgroundColor = '#F0F0F0';
    });
    item.addEventListener('mouseleave', function() {
        this.style.backgroundColor = '';
    });

    return item;
}

function getTimeAgo(date) {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
        return days === 1 ? '1 day ago' : `${days} days ago`;
    } else if (hours > 0) {
        return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
    } else if (minutes > 0) {
        return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
    } else {
        return 'Just now';
    }
}

// ====================
// MODAL CLOSE HANDLERS
// ====================

// View Business Modal Close Handlers
document.addEventListener('DOMContentLoaded', function() {
    const closeViewBusinessModal = document.getElementById('closeViewBusinessModal');
    const closeViewBusinessModalBtn = document.getElementById('closeViewBusinessModalBtn');
    const viewBusinessModal = document.getElementById('viewBusinessModal');
    
    if (closeViewBusinessModal) {
        closeViewBusinessModal.addEventListener('click', function() {
            viewBusinessModal.classList.remove('active');
        });
    }
    
    if (closeViewBusinessModalBtn) {
        closeViewBusinessModalBtn.addEventListener('click', function() {
            viewBusinessModal.classList.remove('active');
        });
    }
    
    // View Review Modal Close Handlers
    const closeViewReviewModal = document.getElementById('closeViewReviewModal');
    const closeViewReviewModalBtn = document.getElementById('closeViewReviewModalBtn');
    const viewReviewModal = document.getElementById('viewReviewModal');
    
    if (closeViewReviewModal) {
        closeViewReviewModal.addEventListener('click', function() {
            viewReviewModal.classList.remove('active');
        });
    }
    
    if (closeViewReviewModalBtn) {
        closeViewReviewModalBtn.addEventListener('click', function() {
            viewReviewModal.classList.remove('active');
        });
    }
    
    // Close modals when clicking outside
    if (viewBusinessModal) {
        viewBusinessModal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    }
    
    if (viewReviewModal) {
        viewReviewModal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    }
});

// ====================
// UTILITY FUNCTIONS
// ====================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showSuccess(message) {
    showNotification(message, 'success');
}

function showError(message) {
    showNotification(message, 'error');
}

function showInfo(message) {
    showNotification(message, 'info');
}

function showLoading(message) {
    const existing = document.querySelector('.loading-overlay');
    if (existing) return;
    
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>${message || 'Loading...'}</p>
        </div>
    `;
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 99999;
    `;
    document.body.appendChild(overlay);
}

function hideLoading() {
    const overlay = document.querySelector('.loading-overlay');
    if (overlay) {
        overlay.remove();
    }
}

function showNotification(message, type) {
    const existing = document.querySelector('.notification-toast');
    if (existing) {
        existing.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = 'notification-toast notification-' + type;
    
    // Add icon based on type
    let icon = '';
    if (type === 'success') {
        icon = '<i class="fas fa-check-circle"></i>';
    } else if (type === 'error') {
        icon = '<i class="fas fa-exclamation-circle"></i>';
    } else {
        icon = '<i class="fas fa-info-circle"></i>';
    }
    
    notification.innerHTML = `<div style="display: flex; align-items: center; gap: 12px; justify-content: center;">${icon}<span>${message}</span></div>`;
    
    // Add styles - center bottom position
    notification.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        padding: 16px 24px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        font-size: 15px;
        z-index: 99999;
        animation: slideUp 0.3s ease-out;
        box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        max-width: 500px;
        min-width: 300px;
        text-align: center;
    `;
    
    // Simple clean colors - no gradients
    if (type === 'success') {
        notification.style.background = '#27AE60';
    } else if (type === 'error') {
        notification.style.background = '#E74C3C';
    } else {
        notification.style.background = '#4A90E2';
    }
    
    document.body.appendChild(notification);
    
    // Auto remove after 4 seconds
    setTimeout(function() {
        notification.style.animation = 'slideDown 0.3s ease-out';
        setTimeout(function() {
            notification.remove();
        }, 300);
    }, 4000);
}

// Add notification animation styles
const notificationStyle = document.createElement('style');
notificationStyle.textContent = `
    @keyframes slideUp {
        from {
            transform: translateX(-50%) translateY(100px);
            opacity: 0;
        }
        to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
    }
    @keyframes slideDown {
        from {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
        to {
            transform: translateX(-50%) translateY(100px);
            opacity: 0;
        }
    }
    .spinner {
        border: 4px solid rgba(255,255,255,0.3);
        border-top: 4px solid white;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        animation: spin 1s linear infinite;
        margin: 0 auto 20px;
    }
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    .loading-spinner {
        background: rgba(0,0,0,0.9);
        padding: 30px;
        border-radius: 10px;
        text-align: center;
        color: white;
    }
`;
document.head.appendChild(notificationStyle);

