// Admin Panel JavaScript - Enhanced Version
const API_URL = '/api';
let authToken = localStorage.getItem('adminToken');
let currentUser = null;
let allCategories = [];
let allBusinesses = [];

// Check if already logged in
if (authToken) {
    checkAuth();
} else {
    showLogin();
}

// ======================
// AUTHENTICATION
// ======================

// Login Form
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');
    
    errorEl.textContent = '';
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            if (data.user.role !== 'admin') {
                errorEl.textContent = 'Access denied. Admin access required.';
                return;
            }
            
            authToken = data.token;
            localStorage.setItem('adminToken', authToken);
            localStorage.setItem('adminUser', JSON.stringify(data.user));
            currentUser = data.user;
            
            showDashboard();
            loadDashboardData();
        } else {
            errorEl.textContent = data.error || 'Login failed';
        }
    } catch (error) {
        console.error('Login error:', error);
        errorEl.textContent = 'Network error. Please try again.';
    }
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        authToken = null;
        currentUser = null;
        showLogin();
    }
});

function showLogin() {
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('dashboardScreen').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('dashboardScreen').classList.remove('hidden');
    
    if (currentUser) {
        document.getElementById('userName').textContent = currentUser.name;
        document.getElementById('userAvatar').textContent = currentUser.name.charAt(0).toUpperCase();
    }
}

async function checkAuth() {
    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.user.role === 'admin') {
                currentUser = data.user;
                showDashboard();
                loadDashboardData();
            } else {
                showLogin();
            }
        } else {
            showLogin();
        }
    } catch (error) {
        console.error('Auth check error:', error);
        showLogin();
    }
}

// ======================
// NAVIGATION
// ======================

document.querySelectorAll('.menu-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Update active menu item
        document.querySelectorAll('.menu-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        // Show corresponding section
        const section = link.getAttribute('data-section');
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.getElementById(section).classList.add('active');
        
        // Update page title
        const titles = {
            dashboard: '<i class="fas fa-th-large"></i> Dashboard',
            businesses: '<i class="fas fa-building"></i> Manage Businesses',
            categories: '<i class="fas fa-tags"></i> Manage Categories',
            users: '<i class="fas fa-users"></i> Manage Users',
            reviews: '<i class="fas fa-star"></i> Manage Reviews'
        };
        document.getElementById('pageTitle').innerHTML = titles[section];
        
        // Load section data
        loadSectionData(section);
    });
});

// ======================
// DASHBOARD
// ======================

async function loadDashboardData() {
    try {
        const response = await fetch(`${API_URL}/admin/stats`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            
            // Update stats
            document.getElementById('statBusinesses').textContent = data.stats.businesses;
            document.getElementById('statUsers').textContent = data.stats.users;
            document.getElementById('statReviews').textContent = data.stats.reviews;
            document.getElementById('statCategories').textContent = data.stats.categories;
            
            // Load recent businesses
            const tbody = document.querySelector('#recentBusinessesTable tbody');
            tbody.innerHTML = '';
            
            if (data.stats.recentBusinesses && data.stats.recentBusinesses.length > 0) {
                data.stats.recentBusinesses.forEach(business => {
                    const row = `
                        <tr>
                            <td><strong>${business.name}</strong></td>
                            <td>${business.category?.name || 'N/A'}</td>
                            <td>${business.location?.city || ''}, ${business.location?.state || ''}</td>
                            <td>${new Date(business.createdAt).toLocaleDateString()}</td>
                            <td>
                                <span class="badge ${business.isActive ? 'badge-success' : 'badge-danger'}">
                                    ${business.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </td>
                        </tr>
                    `;
                    tbody.innerHTML += row;
                });
            } else {
                tbody.innerHTML = '<tr><td colspan="5" class="empty-state"><i class="fas fa-inbox"></i><br>No recent businesses</td></tr>';
            }
        }
    } catch (error) {
        console.error('Load dashboard error:', error);
    }
}

// ======================
// SECTION LOADING
// ======================

async function loadSectionData(section) {
    switch (section) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'businesses':
            await loadCategories(); // Load categories first for filter
            loadBusinesses();
            break;
        case 'categories':
            loadCategories();
            break;
        case 'users':
            loadUsers();
            break;
        case 'reviews':
            loadReviews();
            break;
    }
}

// ======================
// CATEGORIES MANAGEMENT
// ======================

async function loadCategories() {
    try {
        const response = await fetch(`${API_URL}/categories`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            allCategories = data.categories;
            
            // Populate category table
            const tbody = document.querySelector('#categoriesTable tbody');
            tbody.innerHTML = '';
            
            if (allCategories.length > 0) {
                allCategories.forEach(category => {
                    const row = `
                        <tr>
                            <td><i class="fas fa-${category.icon}"></i></td>
                            <td><strong>${category.name}</strong></td>
                            <td><code>${category.slug}</code></td>
                            <td>${category.businessCount}</td>
                            <td>${category.order}</td>
                            <td>
                                <span class="badge ${category.isActive ? 'badge-success' : 'badge-danger'}">
                                    ${category.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </td>
                            <td class="action-buttons">
                                <button class="btn btn-primary btn-sm" onclick="editCategory('${category._id}')">
                                    <i class="fas fa-edit"></i> Edit
                                </button>
                                <button class="btn btn-danger btn-sm" onclick="deleteCategory('${category._id}')">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            </td>
                        </tr>
                    `;
                    tbody.innerHTML += row;
                });
            } else {
                tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><i class="fas fa-tags"></i><br>No categories yet</td></tr>';
            }
            
            // Populate category filters and selects
            const filterSelect = document.getElementById('businessCategoryFilter');
            const businessCategorySelect = document.getElementById('businessCategory');
            
            if (filterSelect) {
                filterSelect.innerHTML = '<option value="">All Categories</option>';
                allCategories.forEach(cat => {
                    filterSelect.innerHTML += `<option value="${cat._id}">${cat.name}</option>`;
                });
            }
            
            if (businessCategorySelect) {
                businessCategorySelect.innerHTML = '<option value="">Select Category</option>';
                allCategories.forEach(cat => {
                    businessCategorySelect.innerHTML += `<option value="${cat._id}">${cat.name}</option>`;
                });
            }
        }
    } catch (error) {
        console.error('Load categories error:', error);
    }
}

// Add Category Modal
document.getElementById('addCategoryBtn').addEventListener('click', () => {
    document.getElementById('categoryModalTitle').innerHTML = '<i class="fas fa-plus"></i> Add New Category';
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryId').value = '';
    document.getElementById('categoryModal').classList.add('active');
});

// Close Category Modal
document.getElementById('closeCategoryModal').addEventListener('click', closeCategoryModal);
document.getElementById('cancelCategoryBtn').addEventListener('click', closeCategoryModal);

function closeCategoryModal() {
    document.getElementById('categoryModal').classList.remove('active');
}

// Save Category
document.getElementById('saveCategoryBtn').addEventListener('click', async () => {
    const categoryId = document.getElementById('categoryId').value;
    const categoryData = {
        name: document.getElementById('categoryName').value,
        icon: document.getElementById('categoryIcon').value,
        description: document.getElementById('categoryDescription').value,
        order: parseInt(document.getElementById('categoryOrder').value) || 0,
        isActive: document.getElementById('categoryActive').checked
    };
    
    if (!categoryData.name || !categoryData.icon) {
        alert('Please fill in all required fields');
        return;
    }
    
    try {
        const url = categoryId ? `${API_URL}/categories/${categoryId}` : `${API_URL}/categories`;
        const method = categoryId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(categoryData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert(categoryId ? 'Category updated successfully!' : 'Category created successfully!');
            closeCategoryModal();
            loadCategories();
        } else {
            alert(data.error || 'Error saving category');
        }
    } catch (error) {
        console.error('Save category error:', error);
        alert('Error saving category');
    }
});

// Edit Category - Make it global
window.editCategory = async function(id) {
    const category = allCategories.find(c => c._id === id);
    if (!category) return;
    
    document.getElementById('categoryModalTitle').innerHTML = '<i class="fas fa-edit"></i> Edit Category';
    document.getElementById('categoryId').value = category._id;
    document.getElementById('categoryName').value = category.name;
    document.getElementById('categoryIcon').value = category.icon;
    document.getElementById('categoryDescription').value = category.description || '';
    document.getElementById('categoryOrder').value = category.order;
    document.getElementById('categoryActive').checked = category.isActive;
    document.getElementById('categoryModal').classList.add('active');
}

// Delete Category - Make it global
window.deleteCategory = async function(id) {
    const category = allCategories.find(c => c._id === id);
    if (!category) return;
    
    if (!confirm(`Are you sure you want to delete "${category.name}"?`)) return;
    
    try {
        const response = await fetch(`${API_URL}/categories/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            alert('Category deleted successfully!');
            loadCategories();
        } else {
            const data = await response.json();
            alert(data.error || 'Error deleting category');
        }
    } catch (error) {
        console.error('Delete category error:', error);
        alert('Error deleting category');
    }
}

// ======================
// BUSINESSES MANAGEMENT
// ======================

async function loadBusinesses() {
    try {
        const response = await fetch(`${API_URL}/admin/businesses`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            allBusinesses = data.businesses;
            displayBusinesses(allBusinesses);
        }
    } catch (error) {
        console.error('Load businesses error:', error);
    }
}

function displayBusinesses(businesses) {
    const tbody = document.querySelector('#businessesTable tbody');
    tbody.innerHTML = '';
    
    if (businesses.length > 0) {
        businesses.forEach(business => {
            const row = `
                <tr>
                    <td><strong>${business.name}</strong></td>
                    <td>${business.category?.name || 'N/A'}</td>
                    <td>${business.location.city}, ${business.location.state}</td>
                    <td>
                        <strong>${business.rating.average.toFixed(1)}</strong> ⭐
                        <small>(${business.rating.count})</small>
                    </td>
                    <td>
                        <span class="badge ${business.isActive ? 'badge-success' : 'badge-danger'}">
                            ${business.isActive ? 'Active' : 'Inactive'}
                        </span>
                        ${business.isFeatured ? '<span class="badge badge-warning">Featured</span>' : ''}
                        ${business.isVerified ? '<span class="badge badge-info">Verified</span>' : ''}
                    </td>
                    <td class="action-buttons">
                        <button class="btn btn-primary btn-sm" onclick="editBusiness('${business._id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        ${!business.isActive ? `<button class="btn btn-success btn-sm" onclick="approveBusiness('${business._id}')"><i class="fas fa-check"></i> Approve</button>` : ''}
                        <button class="btn btn-${business.isFeatured ? 'warning' : 'info'} btn-sm" onclick="toggleFeature('${business._id}')">
                            <i class="fas fa-star"></i> ${business.isFeatured ? 'Unfeature' : 'Feature'}
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="deleteBusiness('${business._id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    } else {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><i class="fas fa-building"></i><br>No businesses yet</td></tr>';
    }
}

// Business Search
document.getElementById('businessSearch')?.addEventListener('input', filterBusinesses);
document.getElementById('businessCategoryFilter')?.addEventListener('change', filterBusinesses);

function filterBusinesses() {
    const searchTerm = document.getElementById('businessSearch').value.toLowerCase();
    const categoryFilter = document.getElementById('businessCategoryFilter').value;
    
    let filtered = allBusinesses;
    
    if (searchTerm) {
        filtered = filtered.filter(b => 
            b.name.toLowerCase().includes(searchTerm) ||
            b.location.city.toLowerCase().includes(searchTerm)
        );
    }
    
    if (categoryFilter) {
        filtered = filtered.filter(b => b.category._id === categoryFilter);
    }
    
    displayBusinesses(filtered);
}

// Add Business Modal
document.getElementById('addBusinessBtn').addEventListener('click', () => {
    document.getElementById('businessModalTitle').innerHTML = '<i class="fas fa-plus"></i> Add New Business';
    document.getElementById('businessForm').reset();
    document.getElementById('businessId').value = '';
    document.getElementById('businessModal').classList.add('active');
});

// Close Business Modal
document.getElementById('closeBusinessModal').addEventListener('click', closeBusinessModal);
document.getElementById('cancelBusinessBtn').addEventListener('click', closeBusinessModal);

function closeBusinessModal() {
    document.getElementById('businessModal').classList.remove('active');
}

// Save Business
document.getElementById('saveBusinessBtn').addEventListener('click', async () => {
    const businessId = document.getElementById('businessId').value;
    const businessData = {
        name: document.getElementById('businessName').value,
        category: document.getElementById('businessCategory').value,
        description: document.getElementById('businessDescription').value,
        location: {
            address: document.getElementById('businessAddress').value,
            city: document.getElementById('businessCity').value,
            state: document.getElementById('businessState').value,
            zipCode: document.getElementById('businessZip').value,
            country: 'USA'
        },
        contact: {
            phone: document.getElementById('businessPhone').value,
            email: document.getElementById('businessEmail').value,
            website: document.getElementById('businessWebsite').value
        },
        isActive: document.getElementById('businessActive').checked,
        isFeatured: document.getElementById('businessFeatured').checked,
        isVerified: document.getElementById('businessVerified').checked
    };
    
    if (!businessData.name || !businessData.category || !businessData.description) {
        alert('Please fill in all required fields');
        return;
    }
    
    try {
        const url = businessId ? `${API_URL}/businesses/${businessId}` : `${API_URL}/businesses`;
        const method = businessId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(businessData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert(businessId ? 'Business updated successfully!' : 'Business created successfully!');
            closeBusinessModal();
            loadBusinesses();
        } else {
            alert(data.error || 'Error saving business');
        }
    } catch (error) {
        console.error('Save business error:', error);
        alert('Error saving business');
    }
});

// Edit Business - Make it global
window.editBusiness = async function(id) {
    const business = allBusinesses.find(b => b._id === id);
    if (!business) return;
    
    document.getElementById('businessModalTitle').innerHTML = '<i class="fas fa-edit"></i> Edit Business';
    document.getElementById('businessId').value = business._id;
    document.getElementById('businessName').value = business.name;
    document.getElementById('businessCategory').value = business.category._id;
    document.getElementById('businessDescription').value = business.description;
    document.getElementById('businessAddress').value = business.location.address;
    document.getElementById('businessCity').value = business.location.city;
    document.getElementById('businessState').value = business.location.state;
    document.getElementById('businessZip').value = business.location.zipCode || '';
    document.getElementById('businessPhone').value = business.contact.phone;
    document.getElementById('businessEmail').value = business.contact.email || '';
    document.getElementById('businessWebsite').value = business.contact.website || '';
    document.getElementById('businessActive').checked = business.isActive;
    document.getElementById('businessFeatured').checked = business.isFeatured;
    document.getElementById('businessVerified').checked = business.isVerified;
    document.getElementById('businessModal').classList.add('active');
}

// Delete Business - Make it global
window.deleteBusiness = async function(id) {
    const business = allBusinesses.find(b => b._id === id);
    if (!business) return;
    
    if (!confirm(`Are you sure you want to delete "${business.name}"?`)) return;
    
    try {
        const response = await fetch(`${API_URL}/businesses/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            alert('Business deleted successfully!');
            loadBusinesses();
        } else {
            const data = await response.json();
            alert(data.error || 'Error deleting business');
        }
    } catch (error) {
        console.error('Delete business error:', error);
        alert('Error deleting business');
    }
}

// Approve Business - Make it global
window.approveBusiness = async function(id) {
    try {
        const response = await fetch(`${API_URL}/admin/businesses/${id}/approve`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            alert('Business approved successfully!');
            loadBusinesses();
        }
    } catch (error) {
        console.error('Approve business error:', error);
        alert('Error approving business');
    }
}

// Toggle Feature - Make it global
window.toggleFeature = async function(id) {
    try {
        const response = await fetch(`${API_URL}/admin/businesses/${id}/feature`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            alert('Business feature status updated!');
            loadBusinesses();
        }
    } catch (error) {
        console.error('Toggle feature error:', error);
        alert('Error updating business');
    }
}

// ======================
// USERS MANAGEMENT
// ======================

async function loadUsers() {
    try {
        const response = await fetch(`${API_URL}/admin/users`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            const tbody = document.querySelector('#usersTable tbody');
            tbody.innerHTML = '';
            
            if (data.users.length > 0) {
                data.users.forEach(user => {
                    const row = `
                        <tr>
                            <td><strong>${user.name}</strong></td>
                            <td>${user.email}</td>
                            <td><span class="badge badge-${user.role === 'admin' ? 'warning' : 'info'}">${user.role}</span></td>
                            <td>
                                <span class="badge ${user.isActive ? 'badge-success' : 'badge-danger'}">
                                    ${user.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </td>
                            <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                            <td class="action-buttons">
                                ${user.role !== 'admin' ? `
                                    <button class="btn btn-danger btn-sm" onclick="deleteUser('${user._id}')">
                                        <i class="fas fa-trash"></i> Delete
                                    </button>
                                ` : '<span class="badge badge-warning">Protected</span>'}
                            </td>
                        </tr>
                    `;
                    tbody.innerHTML += row;
                });
            } else {
                tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><i class="fas fa-users"></i><br>No users yet</td></tr>';
            }
        }
    } catch (error) {
        console.error('Load users error:', error);
    }
}

// Delete User - Make it global
window.deleteUser = async function(id) {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
        const response = await fetch(`${API_URL}/admin/users/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            alert('User deleted successfully!');
            loadUsers();
        }
    } catch (error) {
        console.error('Delete user error:', error);
        alert('Error deleting user');
    }
}

// ======================
// REVIEWS MANAGEMENT
// ======================

async function loadReviews() {
    try {
        const response = await fetch(`${API_URL}/admin/reviews`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            const tbody = document.querySelector('#reviewsTable tbody');
            tbody.innerHTML = '';
            
            if (data.reviews.length > 0) {
                data.reviews.forEach(review => {
                    const row = `
                        <tr>
                            <td><strong>${review.business?.name || 'Deleted'}</strong></td>
                            <td>${review.user?.name || 'Deleted'}</td>
                            <td>${'⭐'.repeat(review.rating)}</td>
                            <td>${review.comment.substring(0, 50)}${review.comment.length > 50 ? '...' : ''}</td>
                            <td>${new Date(review.createdAt).toLocaleDateString()}</td>
                            <td>
                                <span class="badge ${review.isApproved ? 'badge-success' : 'badge-warning'}">
                                    ${review.isApproved ? 'Approved' : 'Pending'}
                                </span>
                            </td>
                            <td class="action-buttons">
                                ${!review.isApproved ? `
                                    <button class="btn btn-success btn-sm" onclick="approveReview('${review._id}')">
                                        <i class="fas fa-check"></i> Approve
                                    </button>
                                ` : ''}
                                <button class="btn btn-danger btn-sm" onclick="deleteReview('${review._id}')">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            </td>
                        </tr>
                    `;
                    tbody.innerHTML += row;
                });
            } else {
                tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><i class="fas fa-star"></i><br>No reviews yet</td></tr>';
            }
        }
    } catch (error) {
        console.error('Load reviews error:', error);
    }
}

// Approve Review - Make it global
window.approveReview = async function(id) {
    try {
        const response = await fetch(`${API_URL}/admin/reviews/${id}/approve`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            alert('Review approved successfully!');
            loadReviews();
        }
    } catch (error) {
        console.error('Approve review error:', error);
        alert('Error approving review');
    }
}

// Delete Review - Make it global
window.deleteReview = async function(id) {
    if (!confirm('Are you sure you want to delete this review?')) return;
    
    try {
        const response = await fetch(`${API_URL}/admin/reviews/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (response.ok) {
            alert('Review deleted successfully!');
            loadReviews();
        }
    } catch (error) {
        console.error('Delete review error:', error);
        alert('Error deleting review');
    }
}

// Console welcome message
console.log('%c🎉 CityLocal 101 Admin Panel', 'color: #4A90E2; font-size: 24px; font-weight: bold;');
console.log('%cWelcome Administrator!', 'color: #2C3E50; font-size: 16px; font-weight: bold;');
console.log('%cFull CRUD operations available for all entities', 'color: #666; font-size: 14px;');
