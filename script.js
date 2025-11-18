// ====================
// CITYLOCAL 101 - COMPLETE PRODUCTION-READY WEBSITE
// ====================

// API Configuration
// Use API_URL from global scope if available, otherwise declare it
if (typeof API_URL === 'undefined') {
    var API_URL = '/api';
}

let currentUser = null;
let authToken = localStorage.getItem('userToken');

// Check if user is logged in on page load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize mobile menu
    initMobileMenu();
    
    // Check authentication
    if (authToken) {
        checkAuth();
    } else {
        updateUIForGuest();
    }
    
    // Initialize all features
    initLoginModal();
    initRegisterModal();
    initSupportModal();
    initReviewModal();
    initBlogModal();
    initAddBusinessModal();
    initBusinessModal();
    initSearch();
    initCategoryCards();
    initBusinessCards();
});

// ====================
// MOBILE MENU
// ====================
function initMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const navList = document.querySelector('.nav-list');
    
    if (mobileMenuToggle && navList) {
        mobileMenuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            navList.classList.toggle('active');
            
            // Toggle icon between bars and times
            const icon = mobileMenuToggle.querySelector('i');
            if (icon) {
                if (navList.classList.contains('active')) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-times');
                } else {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!mobileMenuToggle.contains(e.target) && !navList.contains(e.target)) {
                navList.classList.remove('active');
                const icon = mobileMenuToggle.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });
        
        // Close menu when clicking on a link
        navList.addEventListener('click', function(e) {
            if (e.target.tagName === 'A' || e.target.closest('a')) {
                navList.classList.remove('active');
                const icon = mobileMenuToggle.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });
    }
}

// ====================
// AUTHENTICATION
// ====================

async function checkAuth() {
    try {
        const response = await fetch(API_URL + '/auth/me', {
            headers: { 'Authorization': 'Bearer ' + authToken }
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            updateUIForUser(currentUser);
        } else {
            // Token invalid, clear it
            localStorage.removeItem('userToken');
            authToken = null;
            currentUser = null;
            updateUIForGuest();
        }
    } catch (error) {
        updateUIForGuest();
    }
}

function updateUIForUser(user) {
    const loginBtn = document.getElementById('loginBtn') || document.querySelector('.login-btn');
    if (loginBtn) {
        const firstName = user.name ? user.name.split(' ')[0] : 'Account';
        loginBtn.innerHTML = `<i class="fas fa-user-circle"></i> ${firstName}`;
        loginBtn.classList.add('logged-in');
        loginBtn.href = '#';
        loginBtn.onclick = function(e) {
            e.preventDefault();
            logout();
        };
    }
}

function updateUIForGuest() {
    const loginBtn = document.getElementById('loginBtn') || document.querySelector('.login-btn');
    if (loginBtn) {
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> LOGIN';
        loginBtn.classList.remove('logged-in');
        loginBtn.onclick = null;
        loginBtn.href = 'login.html';
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('userToken');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        authToken = null;
        currentUser = null;
        updateUIForGuest();
        showSuccess('Logged out successfully!');
    }
}

// ====================
// LOGIN MODAL
// ====================
function initLoginModal() {
    const loginBtn = document.getElementById('loginBtn');
    const loginModal = document.getElementById('loginModal');
    const closeModal = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const loginForm = document.getElementById('loginForm');
    
    if (!loginBtn || !loginModal) {
        return;
    }
    
    // Only prevent default if it's a hash link or modal trigger
    loginBtn.addEventListener('click', function(e) {
        // If href is '#' or empty, prevent default and show modal
        if (loginBtn.href && (loginBtn.href.endsWith('#') || loginBtn.href.endsWith('#'))) {
            e.preventDefault();
            if (currentUser) {
                logout();
            } else {
                // Navigate to login page instead of modal
                window.location.href = 'login.html';
            }
        }
        // Otherwise, let the link navigate normally
    });
    
    if (closeModal) {
        closeModal.addEventListener('click', function() {
            loginModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            loginModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }
    
    loginModal.addEventListener('click', function(e) {
        if (e.target === loginModal) {
            loginModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });
    
    // LOGIN FORM SUBMISSION
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            
            // Validation
            if (!email || !password) {
                showError('Please enter both email and password');
                return;
            }
            
            if (!isValidEmail(email)) {
                showError('Please enter a valid email address');
                return;
            }
            
            // Show loading
            const submitBtn = loginForm.querySelector('button[type="submit"]');
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
                    // Login successful
                    authToken = data.token;
                    currentUser = data.user;
                    localStorage.setItem('userToken', authToken);
                    
                    // Update UI
                    updateUIForUser(currentUser);
                    
                    // Close modal
                    loginModal.classList.remove('active');
                    document.body.style.overflow = 'auto';
                    loginForm.reset();
                    
                    showSuccess('Welcome back, ' + currentUser.name + '!');
                } else {
                    // Login failed
                    showError(data.error || 'Invalid email or password');
                }
            } catch (error) {
                showError('Network error. Please check your connection and try again.');
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }
}

// ====================
// REGISTER MODAL
// ====================
function initRegisterModal() {
    const registerModal = document.getElementById('registerModal');
    const closeRegisterModal = document.getElementById('closeRegisterModal');
    const cancelRegisterBtn = document.getElementById('cancelRegisterBtn');
    const showRegister = document.getElementById('showRegister');
    const showLogin = document.getElementById('showLogin');
    const loginModal = document.getElementById('loginModal');
    const registerForm = document.getElementById('registerForm');
    
    if (!registerModal) {
        return;
    }
    
    if (showRegister) {
        showRegister.addEventListener('click', function(e) {
            e.preventDefault();
            if (loginModal) loginModal.classList.remove('active');
            setTimeout(() => {
                registerModal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }, 300);
        });
    }
    
    if (showLogin) {
        showLogin.addEventListener('click', function(e) {
            e.preventDefault();
            registerModal.classList.remove('active');
            setTimeout(() => {
                if (loginModal) {
                    loginModal.classList.add('active');
                    document.body.style.overflow = 'hidden';
                }
            }, 300);
        });
    }
    
    if (closeRegisterModal) {
        closeRegisterModal.addEventListener('click', function() {
            registerModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }
    
    if (cancelRegisterBtn) {
        cancelRegisterBtn.addEventListener('click', function() {
            registerModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }
    
    registerModal.addEventListener('click', function(e) {
        if (e.target === registerModal) {
            registerModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });
    
    // REGISTER FORM SUBMISSION
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const name = document.getElementById('regName').value.trim();
            const email = document.getElementById('regEmail').value.trim();
            const password = document.getElementById('regPassword').value;
            const confirmPassword = document.getElementById('regConfirmPassword').value;
            const agreeTerms = document.getElementById('agreeTerms').checked;
            
            // Validation
            if (!name || !email || !password || !confirmPassword) {
                showError('Please fill in all fields');
                return;
            }
            
            if (!isValidEmail(email)) {
                showError('Please enter a valid email address');
                return;
            }
            
            if (password.length < 6) {
                showError('Password must be at least 6 characters long');
                return;
            }
            
            if (password !== confirmPassword) {
                showError('Passwords do not match');
                return;
            }
            
            if (!agreeTerms) {
                showError('Please agree to the Terms & Conditions');
                return;
            }
            
            // Show loading
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Creating account...';
            submitBtn.disabled = true;
            
            try {
                const response = await fetch(API_URL + '/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });
                
                const data = await response.json();
                
                if (response.ok && data.success) {
                    // Registration successful
                    authToken = data.token;
                    currentUser = data.user;
                    localStorage.setItem('userToken', authToken);
                    
                    // Update UI
                    updateUIForUser(currentUser);
                    
                    // Close modal
                    registerModal.classList.remove('active');
                    document.body.style.overflow = 'auto';
                    registerForm.reset();
                    
                    showSuccess('Welcome to CityLocal 101, ' + currentUser.name + '!');
                } else {
                    // Registration failed
                    showError(data.error || 'Registration failed. Please try again.');
                }
            } catch (error) {
                showError('Network error. Please check your connection and try again.');
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }
}

// ====================
// SUPPORT MODAL
// ====================
function initSupportModal() {
    const supportLinks = document.querySelectorAll('a[href="support.html"]');
    const supportModal = document.getElementById('supportModal');
    const closeSupportModal = document.getElementById('closeSupportModal');
    const cancelSupportBtn = document.getElementById('cancelSupportBtn');
    const supportForm = document.getElementById('supportForm');
    
    if (!supportModal) {
        return;
    }
    
    // Remove preventDefault - let links navigate to support.html
    // supportLinks.forEach(function(link) {
    //     link.addEventListener('click', function(e) {
    //         e.preventDefault();
    //         supportModal.classList.add('active');
    //         document.body.style.overflow = 'hidden';
    //     });
    // });
    
    if (closeSupportModal) {
        closeSupportModal.addEventListener('click', function() {
            supportModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }
    
    if (cancelSupportBtn) {
        cancelSupportBtn.addEventListener('click', function() {
            supportModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }
    
    supportModal.addEventListener('click', function(e) {
        if (e.target === supportModal) {
            supportModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });
    
    if (supportForm) {
        supportForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const name = document.getElementById('supportName').value.trim();
            const email = document.getElementById('supportEmail').value.trim();
            const subject = document.getElementById('supportSubject').value;
            const message = document.getElementById('supportMessage').value.trim();
            
            if (!name || !email || !subject || !message) {
                showError('Please fill in all fields');
                return;
            }
            
            if (!isValidEmail(email)) {
                showError('Please enter a valid email address');
                return;
            }
            
            const submitBtn = supportForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;
            
            try {
                const response = await fetch(API_URL + '/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, subject, message })
                });
                
                const data = await response.json();
                
                if (response.ok && data.success) {
                    showSuccess('Thank you! Your message has been sent. We will respond within 24 hours.');
                    supportForm.reset();
                    supportModal.classList.remove('active');
                    document.body.style.overflow = 'auto';
                } else {
                    showError(data.error || 'Failed to send message. Please try again.');
                }
            } catch (error) {
                showError('Network error. Please try again or call us at (555) 123-4567.');
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }
}

// ====================
// WRITE REVIEW MODAL
// ====================
function initReviewModal() {
    const writeReviewLinks = document.querySelectorAll('a[href="write-review.html"]');
    const writeReviewModal = document.getElementById('writeReviewModal');
    const closeReviewModal = document.getElementById('closeReviewModal');
    const cancelReviewBtn = document.getElementById('cancelReviewBtn');
    const writeReviewForm = document.getElementById('writeReviewForm');
    const starRating = document.getElementById('starRating');
    const reviewRatingInput = document.getElementById('reviewRating');
    
    if (!writeReviewModal) {
        return;
    }
    
    // Remove preventDefault - let links navigate to write-review.html
    // writeReviewLinks.forEach(function(link) {
    //     link.addEventListener('click', function(e) {
    //         e.preventDefault();
    //         writeReviewModal.classList.add('active');
    //         document.body.style.overflow = 'hidden';
    //     });
    // });
    
    if (closeReviewModal) {
        closeReviewModal.addEventListener('click', function() {
            writeReviewModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }
    
    if (cancelReviewBtn) {
        cancelReviewBtn.addEventListener('click', function() {
            writeReviewModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }
    
    writeReviewModal.addEventListener('click', function(e) {
        if (e.target === writeReviewModal) {
            writeReviewModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });
    
    // Star rating
    if (starRating && reviewRatingInput) {
        const stars = starRating.querySelectorAll('i');
        stars.forEach(function(star, index) {
            star.addEventListener('click', function() {
                const rating = index + 1;
                reviewRatingInput.value = rating;
                stars.forEach(function(s, i) {
                    if (i < rating) {
                        s.classList.remove('far');
                        s.classList.add('fas');
                    } else {
                        s.classList.remove('fas');
                        s.classList.add('far');
                    }
                });
            });
        });
    }
    
    if (writeReviewForm) {
        writeReviewForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const rating = reviewRatingInput.value;
            const name = document.getElementById('reviewerName').value.trim();
            
            if (!rating || rating === '0') {
                showError('Please select a star rating');
                return;
            }
            
            if (!name) {
                showError('Please enter your name');
                return;
            }
            
            showSuccess('Thank you, ' + name + '! Your ' + rating + '-star review has been submitted for approval.');
            writeReviewForm.reset();
            reviewRatingInput.value = '0';
            if (starRating) {
                const stars = starRating.querySelectorAll('i');
                stars.forEach(function(s) {
                    s.classList.remove('fas');
                    s.classList.add('far');
                });
            }
            writeReviewModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }
    
}

// ====================
// BLOG MODAL
// ====================
function initBlogModal() {
    const blogLinks = document.querySelectorAll('a[href="blog.html"]');
    const blogModal = document.getElementById('blogModal');
    const closeBlogModal = document.getElementById('closeBlogModal');
    
    if (!blogModal) {
        return;
    }
    
    // Remove preventDefault - let links navigate to blog.html
    // blogLinks.forEach(function(link) {
    //     link.addEventListener('click', function(e) {
    //         e.preventDefault();
    //         blogModal.classList.add('active');
    //         document.body.style.overflow = 'hidden';
    //     });
    // });
    
    if (closeBlogModal) {
        closeBlogModal.addEventListener('click', function() {
            blogModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }
    
    blogModal.addEventListener('click', function(e) {
        if (e.target === blogModal) {
            blogModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });
    
}

// ====================
// ADD BUSINESS MODAL
// ====================
function initAddBusinessModal() {
    const addBusinessLinks = document.querySelectorAll('a[href="add-business.html"]');
    const addBusinessBtns = document.querySelectorAll('.btn-primary');
    const addBusinessModal = document.getElementById('addBusinessModal');
    const closeAddBusinessModal = document.getElementById('closeAddBusinessModal');
    const cancelAddBusinessBtn = document.getElementById('cancelAddBusinessBtn');
    const addBusinessForm = document.getElementById('addBusinessForm');
    
    if (!addBusinessModal) {
        return;
    }
    
    // Remove preventDefault - let links navigate to add-business.html
    // addBusinessLinks.forEach(function(link) {
    //     link.addEventListener('click', function(e) {
    //         e.preventDefault();
    //         addBusinessModal.classList.add('active');
    //         document.body.style.overflow = 'hidden';
    //     });
    // });
    
    // Don't intercept navigation - let links go to add-business.html page
    // Only handle buttons that are NOT links (like the one in the info section)
    addBusinessBtns.forEach(function(btn) {
        // Only intercept if it's a button (not an anchor tag)
        if (btn.tagName === 'BUTTON' && !btn.closest('a')) {
        const text = btn.textContent.trim();
        if (text === 'Add Your Business' || text === 'Add Business') {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                    // Navigate to the page instead of opening modal
                    window.location.href = 'add-business.html';
            });
            }
        }
    });
    
    if (closeAddBusinessModal) {
        closeAddBusinessModal.addEventListener('click', function() {
            addBusinessModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }
    
    if (cancelAddBusinessBtn) {
        cancelAddBusinessBtn.addEventListener('click', function() {
            addBusinessModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }
    
    addBusinessModal.addEventListener('click', function(e) {
        if (e.target === addBusinessModal) {
            addBusinessModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });
    
    if (addBusinessForm) {
        addBusinessForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const businessName = document.getElementById('addBusinessName').value.trim();
            const ownerName = document.getElementById('addBusinessOwnerName').value.trim();
            
            if (!businessName || !ownerName) {
                showError('Please fill in all required fields');
                return;
            }
            
            showSuccess('Thank you, ' + ownerName + '! "' + businessName + '" has been submitted for review. Adding your business is FREE!');
            addBusinessForm.reset();
            addBusinessModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }
    
}

// ====================
// BUSINESS DETAIL MODAL
// ====================
function initBusinessModal() {
    const businessModal = document.getElementById('businessModal');
    const closeBusinessModal = document.getElementById('closeBusinessModal');
    
    if (!businessModal) {
        return;
    }
    
    if (closeBusinessModal) {
        closeBusinessModal.addEventListener('click', function() {
            businessModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }
    
    businessModal.addEventListener('click', function(e) {
        if (e.target === businessModal) {
            businessModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });
}

// Location suggestions data
const US_STATES_SEARCH = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
    'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
    'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
    'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
    'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
    'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
    'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
];

const POPULAR_CITIES_SEARCH = [
    'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio',
    'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus',
    'Charlotte', 'San Francisco', 'Indianapolis', 'Seattle', 'Denver', 'Washington', 'Boston',
    'El Paso', 'Nashville', 'Detroit', 'Oklahoma City', 'Portland', 'Las Vegas', 'Memphis',
    'Louisville', 'Baltimore', 'Milwaukee', 'Albuquerque', 'Tucson', 'Fresno', 'Sacramento',
    'Kansas City', 'Mesa', 'Atlanta', 'Omaha', 'Colorado Springs', 'Raleigh', 'Virginia Beach',
    'Miami', 'Oakland', 'Minneapolis', 'Tulsa', 'Cleveland', 'Wichita', 'Arlington', 'Tampa',
    'New Orleans', 'Honolulu', 'Miami Beach', 'Orlando', 'St. Louis', 'Pittsburgh', 'Cincinnati',
    'Buffalo', 'Riverside', 'St. Paul', 'Corpus Christi', 'Newark', 'Plano', 'Fort Wayne',
    'Irvine', 'Laredo', 'Lubbock', 'Garland', 'Hialeah', 'Glendale', 'Reno', 'Chesapeake',
    'Baton Rouge', 'Richmond', 'Spokane', 'Des Moines', 'Montgomery', 'Modesto', 'Fayetteville',
    'Shreveport', 'Tacoma', 'Oxnard', 'Fontana', 'Columbus', 'Moreno Valley', 'Santa Clarita',
    'Fremont', 'Yonkers', 'Huntington Beach', 'Glendale', 'Tempe', 'Grand Rapids', 'Tallahassee',
    'Cape Coral', 'Worcester', 'Providence', 'Overland Park', 'Sioux Falls', 'Port St. Lucie',
    'Chattanooga', 'Oceanside', 'Santa Rosa', 'Garden Grove', 'Vancouver', 'Springfield',
    'Pembroke Pines', 'Fort Lauderdale', 'Salem', 'Corona', 'Eugene', 'McKinney', 'Lancaster',
    'Salinas', 'Palmdale', 'Hayward', 'Pomona', 'Cary', 'Rockford', 'Alexandria', 'Escondido',
    'Kansas City', 'Joliet', 'Sunnyvale', 'Torrance', 'Bridgeport', 'Lakewood', 'Hollywood',
    'Paterson', 'Naperville', 'Syracuse', 'Mesquite', 'Dayton', 'Savannah', 'Clarksville',
    'Orange', 'Pasadena', 'Fullerton', 'Killeen', 'Frisco', 'Hampton', 'McAllen', 'Warren',
    'Bellevue', 'West Valley City', 'Columbia', 'Olathe', 'Sterling Heights', 'New Haven',
    'Miramar', 'Waco', 'Thousand Oaks', 'Cedar Rapids', 'Charleston', 'Visalia', 'Topeka',
    'Elizabeth', 'Gainesville', 'Thornton', 'Roseville', 'Carrollton', 'Coral Springs',
    'Stamford', 'Simi Valley', 'Concord', 'Hartford', 'Kent', 'Lafayette', 'Midland',
    'Surprise', 'Denton', 'Victorville', 'Evansville', 'Santa Clara', 'Abilene', 'Athens',
    'Vallejo', 'Allentown', 'Norman', 'Beaumont', 'Independence', 'Murfreesboro', 'Ann Arbor',
    'Springfield', 'Berkeley', 'Peoria', 'Provo', 'El Monte', 'Columbia', 'Lansing', 'Fargo',
    'Downey', 'Costa Mesa', 'Wilmington', 'Arvada', 'Inglewood', 'Miami Gardens', 'Carlsbad',
    'Westminster', 'Rochester', 'Odessa', 'Manchester', 'Elgin', 'West Jordan', 'Round Rock',
    'Clearwater', 'Waterbury', 'Gresham', 'Fairfield', 'Billings', 'Lowell', 'San Buenaventura',
    'Pueblo', 'High Point', 'West Covina', 'Richmond', 'Murrieta', 'Cambridge', 'Antioch',
    'Temecula', 'Norwalk', 'Centennial', 'Everett', 'Palm Bay', 'Wichita Falls', 'Green Bay',
    'Daly City', 'Burbank', 'Richardson', 'Pompano Beach', 'North Charleston', 'Broken Arrow',
    'Boulder', 'West Palm Beach', 'Santa Maria', 'El Cajon', 'Davenport', 'Rialto', 'Las Cruces',
    'San Mateo', 'Lewisville', 'South Bend', 'Lakeland', 'Erie', 'Tyler', 'Pearland', 'College Station',
    'Kenosha', 'Sandy Springs', 'Clovis', 'Flint', 'Roanoke', 'Albany', 'Jurupa Valley', 'Compton',
    'Beaverton', 'League City', 'Trenton', 'Bellingham', 'Nampa', 'Hammond', 'Fayetteville', 'Gary',
    'Carmel', 'Tuscaloosa', 'Bryan', 'Arlington', 'Pocatello', 'Appleton', 'Anderson', 'Napa',
    'Tulare', 'Bloomington', 'Atascocita', 'Sparks', 'Yakima', 'Lee\'s Summit', 'Hemet', 'Longview',
    'Brentwood', 'Buckeye', 'Mission Viejo', 'Racine', 'Edinburg', 'Spokane Valley', 'Conroe',
    'San Angelo', 'Kenner', 'Baytown', 'Port Arthur', 'Layton', 'Iowa City', 'Saginaw', 'Utica',
    'Auburn', 'Fall River', 'Muncie', 'Turlock', 'Temple', 'Sioux City', 'Greenville', 'Lakewood',
    'New Bedford', 'Chico', 'Marietta', 'Redding', 'Bellingham', 'Westminster', 'Boulder', 'Santa Monica',
    'Beverly Hills', 'Pasadena', 'Berkeley', 'Oakland', 'San Francisco', 'San Jose', 'Sacramento',
    'Fresno', 'Long Beach', 'Los Angeles', 'San Diego', 'Santa Ana', 'Riverside', 'Stockton',
    'Irvine', 'Chula Vista', 'Fremont', 'San Bernardino', 'Modesto', 'Fontana', 'Oxnard', 'Moreno Valley',
    'Huntington Beach', 'Glendale', 'Santa Clarita', 'Garden Grove', 'Oceanside', 'Rancho Cucamonga',
    'Santa Rosa', 'Ontario', 'Lancaster', 'Elk Grove', 'Corona', 'Palmdale', 'Salinas', 'Pomona',
    'Hayward', 'Escondido', 'Torrance', 'Sunnyvale', 'Orange', 'Fullerton', 'Pasadena', 'Thousand Oaks',
    'Visalia', 'Simi Valley', 'Concord', 'Roseville', 'Victorville', 'Santa Clara', 'Vallejo',
    'Fairfield', 'Inglewood', 'El Monte', 'Berkeley', 'Downey', 'Costa Mesa', 'Carlsbad', 'San Mateo',
    'Rialto', 'Burbank', 'El Cajon', 'Ventura', 'Daly City', 'West Covina', 'Jurupa Valley',
    'Compton', 'Richmond', 'Antioch', 'Temecula', 'Norwalk', 'Daly City', 'Burbank', 'Santa Monica'
];

// Create combined location suggestions (City, State format)
const LOCATION_SUGGESTIONS = [];

// First add all states
US_STATES_SEARCH.forEach(state => {
    LOCATION_SUGGESTIONS.push(state);
});

// Then add all cities
POPULAR_CITIES_SEARCH.forEach(city => {
    // Add city alone
    if (!LOCATION_SUGGESTIONS.includes(city)) {
        LOCATION_SUGGESTIONS.push(city);
    }
    // Add city with common states
    const commonStates = ['California', 'New York', 'Texas', 'Florida', 'Illinois', 'Pennsylvania', 'Ohio', 'Georgia', 'North Carolina', 'Michigan'];
    commonStates.forEach(state => {
        const cityState = `${city}, ${state}`;
        if (!LOCATION_SUGGESTIONS.includes(cityState)) {
            LOCATION_SUGGESTIONS.push(cityState);
        }
    });
});


// ====================
// SEARCH
// ====================
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const locationInput = document.getElementById('locationInput');
    const searchBtn = document.querySelector('.search-btn');
    
    if (!searchInput) {
        return;
    }
    
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            performSearch();
        });
        
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
        
        if (locationInput) {
            locationInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    if (e.target.value.trim()) {
                        performSearch();
                    } else {
                        // If Enter pressed with arrow keys, select suggestion
                        const suggestions = document.getElementById('locationSuggestions');
                        const selected = suggestions.querySelector('.suggestion-item.selected');
                        if (selected) {
                            locationInput.value = selected.getAttribute('data-value');
                            hideLocationSuggestions();
                        }
                    }
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    navigateLocationSuggestions(1);
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    navigateLocationSuggestions(-1);
                } else if (e.key === 'Escape') {
                    hideLocationSuggestions();
                }
            });
        }
    }
    
    // Search suggestions
    let searchTimeout;
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            const query = this.value.trim();
            
            if (query.length < 2) {
                hideSearchSuggestions();
                return;
            }
            
            searchTimeout = setTimeout(() => {
                loadSearchSuggestions(query);
            }, 300);
        });
    }
    
    // Location suggestions
    let locationTimeout;
    let selectedLocationIndex = -1;
    
    if (locationInput) {
        locationInput.addEventListener('input', function(e) {
            clearTimeout(locationTimeout);
            const query = this.value.trim();
            
            if (query.length < 1) {
                hideLocationSuggestions();
                selectedLocationIndex = -1;
                return;
            }
            
            locationTimeout = setTimeout(() => {
                showLocationSuggestions(query);
                selectedLocationIndex = -1;
            }, 200);
        });
        
        locationInput.addEventListener('focus', function() {
            const query = this.value.trim();
            if (query.length >= 1) {
                showLocationSuggestions(query);
            }
        });
        
        // Handle clicks on location suggestions
        const locationSuggestions = document.getElementById('locationSuggestions');
        if (locationSuggestions) {
            locationSuggestions.addEventListener('click', function(e) {
                const item = e.target.closest('.suggestion-item');
                if (item) {
                    locationInput.value = item.getAttribute('data-value');
                    hideLocationSuggestions();
                    locationInput.focus();
                }
            });
        }
    }
    
    // Close location suggestions when clicking outside
    document.addEventListener('click', function(e) {
        const locationSuggestions = document.getElementById('locationSuggestions');
        if (locationInput && locationSuggestions && 
            !locationInput.contains(e.target) && 
            !locationSuggestions.contains(e.target)) {
            hideLocationSuggestions();
        }
    });
    
}

function showLocationSuggestions(query) {
    const locationSuggestions = document.getElementById('locationSuggestions');
    if (!locationSuggestions) {
        return;
    }
    
    if (!query || query.length === 0) {
        hideLocationSuggestions();
        return;
    }
    
    // Filter suggestions - prioritize exact matches and city, state format
    const queryLower = query.toLowerCase().trim();
    const matches = LOCATION_SUGGESTIONS
        .filter(location => {
            const locationLower = location.toLowerCase();
            return locationLower.startsWith(queryLower) || 
                   locationLower.includes(queryLower);
        })
        .sort((a, b) => {
            // Prioritize exact starts
            const aStarts = a.toLowerCase().startsWith(queryLower);
            const bStarts = b.toLowerCase().startsWith(queryLower);
            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;
            // Then prioritize shorter matches (more specific)
            return a.length - b.length;
        })
        .slice(0, 10);
    
    if (matches.length === 0) {
        hideLocationSuggestions();
        return;
    }
    
    // Create smooth fade-in effect
    locationSuggestions.style.opacity = '0';
    locationSuggestions.style.transform = 'translateY(-10px)';
    locationSuggestions.style.visibility = 'visible';
    locationSuggestions.style.display = 'block';
    locationSuggestions.style.zIndex = '10000';
    
    locationSuggestions.innerHTML = matches.map((location, index) => {
        const isCityState = location.includes(',');
        const icon = isCityState ? 'map-marker-alt' : (US_STATES_SEARCH.includes(location) ? 'flag' : 'city');
        return `<div class="suggestion-item" data-index="${index}" data-value="${location}">
            <i class="fas fa-${icon}"></i>
            <span>${escapeHtml(location)}</span>
        </div>`;
    }).join('');
    
    // Force reflow and then trigger animation
    locationSuggestions.offsetHeight; // Force reflow
    
        // Trigger animation - use setTimeout to ensure DOM is updated
        setTimeout(() => {
            locationSuggestions.classList.add('active');
            // Force style update with !important equivalent
            locationSuggestions.setAttribute('style', 
                'opacity: 1 !important; ' +
                'transform: translateY(0) !important; ' +
                'visibility: visible !important; ' +
                'display: block !important; ' +
                'z-index: 10000 !important; ' +
                'position: absolute !important; ' +
                'top: calc(100% + 8px) !important; ' +
                'left: 0 !important; ' +
                'right: 0 !important;'
            );
            
            // Also set individual styles
            locationSuggestions.style.opacity = '1';
            locationSuggestions.style.transform = 'translateY(0)';
            locationSuggestions.style.visibility = 'visible';
            locationSuggestions.style.display = 'block';
            locationSuggestions.style.zIndex = '10000';
        }, 10);
}

function hideLocationSuggestions() {
    const locationSuggestions = document.getElementById('locationSuggestions');
    if (locationSuggestions) {
        locationSuggestions.classList.remove('active');
        // Small delay to allow fade-out animation
        setTimeout(() => {
            if (!locationSuggestions.classList.contains('active')) {
                locationSuggestions.innerHTML = '';
                locationSuggestions.style.visibility = 'hidden';
            }
        }, 200);
    }
}

function navigateLocationSuggestions(direction) {
    const locationSuggestions = document.getElementById('locationSuggestions');
    if (!locationSuggestions || !locationSuggestions.classList.contains('active')) return;
    
    const items = locationSuggestions.querySelectorAll('.suggestion-item');
    if (items.length === 0) return;
    
    let selectedLocationIndex = -1;
    items.forEach((item, index) => {
        if (item.classList.contains('selected')) {
            selectedLocationIndex = index;
            item.classList.remove('selected');
        }
    });
    
    if (direction === 1) {
        selectedLocationIndex = (selectedLocationIndex + 1) % items.length;
    } else {
        selectedLocationIndex = selectedLocationIndex <= 0 ? items.length - 1 : selectedLocationIndex - 1;
    }
    
    items[selectedLocationIndex].classList.add('selected');
    items[selectedLocationIndex].scrollIntoView({ block: 'nearest' });
}

function performSearch() {
    const searchInput = document.getElementById('searchInput');
    const locationInput = document.getElementById('locationInput');
    
    const query = searchInput ? searchInput.value.trim() : '';
    const location = locationInput ? locationInput.value.trim() : '';
    
    if (!query && !location) {
        showError('Please enter a search term or location');
        return;
    }
    
    // Navigate to search results page
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (location) params.append('location', location);
    
    window.location.href = 'search-results.html?' + params.toString();
}

async function loadSearchSuggestions(query) {
    try {
        const response = await fetch(API_URL + '/search/suggestions?q=' + encodeURIComponent(query));
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.suggestions) {
                showSearchSuggestions(data.suggestions);
            }
        }
    } catch (error) {
        // Error loading suggestions
    }
}

function showSearchSuggestions(suggestions) {
    const suggestionsDiv = document.getElementById('searchSuggestions');
    if (!suggestionsDiv) return;
    
    if (suggestions.length === 0) {
        hideSearchSuggestions();
        return;
    }
    
    suggestionsDiv.innerHTML = suggestions.map(suggestion => `
        <div class="suggestion-item" onclick="selectSuggestion('${suggestion.type}', '${suggestion.slug || suggestion.name}')">
            <i class="fas fa-${suggestion.icon || 'building'}"></i>
            <span>${escapeHtml(suggestion.name)}</span>
            <span style="color: #999; font-size: 12px; margin-left: auto;">${suggestion.type}</span>
        </div>
    `).join('');
    
    suggestionsDiv.classList.add('active');
}

function hideSearchSuggestions() {
    const suggestionsDiv = document.getElementById('searchSuggestions');
    if (suggestionsDiv) {
        suggestionsDiv.classList.remove('active');
    }
}

function selectSuggestion(type, identifier) {
    if (type === 'category') {
        window.location.href = `businesses.html?category=${identifier}`;
    } else if (type === 'business') {
        window.location.href = `businesses.html?business=${identifier}`;
    }
    hideSearchSuggestions();
}

// Close suggestions when clicking outside
document.addEventListener('click', function(e) {
    const searchInput = document.getElementById('searchInput');
    const suggestionsDiv = document.getElementById('searchSuggestions');
    
    if (searchInput && suggestionsDiv && 
        !searchInput.contains(e.target) && 
        !suggestionsDiv.contains(e.target)) {
        hideSearchSuggestions();
    }
});

// ====================
// CATEGORY CARDS
// ====================
function initCategoryCards() {
    // View More Categories Button
    const viewMoreCategoriesBtn = document.getElementById('viewMoreCategoriesBtn');
    if (viewMoreCategoriesBtn) {
        viewMoreCategoriesBtn.addEventListener('click', function() {
            // Show all categories
            showAllCategories();
            // Scroll to categories section
            const categoriesSection = document.querySelector('.categories');
            if (categoriesSection) {
                categoriesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }
    // Load categories from API and make them clickable
    loadCategoriesFromAPI();
}

// Store all categories for "View More" functionality
let allCategories = [];
let displayedCategoriesCount = 12; // Number of categories to display initially

async function loadCategoriesFromAPI() {
    try {
        const response = await fetch(API_URL + '/categories');
        if (response.ok) {
            const data = await response.json();
            allCategories = data.categories || [];
            
            const categoriesGrid = document.getElementById('categoriesGrid');
            if (!categoriesGrid) return;
            
            // Get view more container
            const viewMoreContainer = document.getElementById('viewMoreCategoriesContainer') || document.querySelector('.view-more-categories');
            
            // Clear loading message
            categoriesGrid.innerHTML = '';
            
            if (allCategories.length === 0) {
                categoriesGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #666;">No categories available yet.</div>';
                // Hide "View More" button if no categories
                if (viewMoreContainer) {
                    viewMoreContainer.style.display = 'none';
                }
                return;
            }
            
            // Display only initial categories (first 12)
            const categoriesToDisplay = allCategories.slice(0, displayedCategoriesCount);
            
            categoriesToDisplay.forEach(function(category) {
                const categoryCard = document.createElement('div');
                categoryCard.className = 'category-card';
                categoryCard.style.cursor = 'pointer';
                
                const iconName = category.icon || 'briefcase';
                categoryCard.innerHTML = `
                    <i class="fas fa-${iconName}"></i>
                    <h3>${escapeHtml(category.name)}</h3>
                `;
                
                // Make clickable
                categoryCard.addEventListener('click', function() {
                    window.location.href = `businesses.html?category=${category._id}&name=${encodeURIComponent(category.name)}`;
                });
                
                categoriesGrid.appendChild(categoryCard);
            });
            
            // Show or hide "View More" button based on whether there are more categories
            if (viewMoreContainer) {
                if (allCategories.length > displayedCategoriesCount) {
                    viewMoreContainer.style.display = 'block';
                    } else {
                    viewMoreContainer.style.display = 'none';
                }
            }
            
        } else {
            const categoriesGrid = document.getElementById('categoriesGrid');
            const viewMoreContainer = document.querySelector('.view-more-categories');
            if (categoriesGrid) {
                categoriesGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #E74C3C;">Failed to load categories. Please refresh the page.</div>';
            }
            if (viewMoreContainer) {
                viewMoreContainer.style.display = 'none';
            }
        }
    } catch (error) {
        const categoriesGrid = document.getElementById('categoriesGrid');
        const viewMoreContainer = document.querySelector('.view-more-categories');
        if (categoriesGrid) {
            categoriesGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #E74C3C;">Error loading categories. Please check your connection.</div>';
        }
        if (viewMoreContainer) {
            viewMoreContainer.style.display = 'none';
        }
    }
}

// Function to show all categories
function showAllCategories() {
    const categoriesGrid = document.getElementById('categoriesGrid');
    const viewMoreContainer = document.getElementById('viewMoreCategoriesContainer') || document.querySelector('.view-more-categories');
    
    if (!categoriesGrid || allCategories.length === 0) return;
    
    // Clear current categories
    categoriesGrid.innerHTML = '';
    
    // Display all categories
    allCategories.forEach(function(category) {
        const categoryCard = document.createElement('div');
        categoryCard.className = 'category-card';
        categoryCard.style.cursor = 'pointer';
        
        const iconName = category.icon || 'briefcase';
        categoryCard.innerHTML = `
            <i class="fas fa-${iconName}"></i>
            <h3>${escapeHtml(category.name)}</h3>
        `;
        
        // Make clickable
        categoryCard.addEventListener('click', function() {
            window.location.href = `businesses.html?category=${category._id}&name=${encodeURIComponent(category.name)}`;
        });
        
        categoriesGrid.appendChild(categoryCard);
    });
    
    // Hide "View More" button since all categories are now displayed
    if (viewMoreContainer) {
        viewMoreContainer.style.display = 'none';
    }
    
}

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ====================
// BUSINESS CARDS
// ====================
function initBusinessCards() {
    // Load businesses from API (only active ones)
    loadBusinessesFromAPI();
}

async function loadBusinessesFromAPI() {
    try {
        // Load top rated active businesses (featured first, then by rating)
        const response = await fetch(API_URL + '/businesses?limit=8');
        if (response.ok) {
            const data = await response.json();
            const businesses = data.businesses || [];
            
            const businessGrid = document.getElementById('businessListingsGrid');
            if (!businessGrid) return;
            
            // Clear loading message
            businessGrid.innerHTML = '';
            
            if (businesses.length === 0) {
                businessGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #666;">No businesses available yet. Be the first to add your business!</div>';
                return;
            }
            
            // Display businesses dynamically (only active ones from API)
            businesses.forEach(function(business) {
                const listingCard = document.createElement('div');
                listingCard.className = 'listing-card';
                listingCard.style.cursor = 'pointer';
                
                const rating = business.rating ? business.rating.average : 0;
                const ratingCount = business.rating ? business.rating.count : 0;
                const stars = '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
                const city = business.location ? business.location.city : 'Location TBD';
                const description = business.description ? (business.description.substring(0, 100) + '...') : 'No description available.';
                
                listingCard.innerHTML = `
                    <div class="listing-header">
                        <h3>${escapeHtml(business.name)}</h3>
                        <div class="rating">
                            <span class="stars">${stars}</span>
                            <span class="rating-value">${rating.toFixed(1)}</span>
                        </div>
                    </div>
                    <p>${escapeHtml(description)}</p>
                    <div class="listing-footer">
                        <span class="location"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(city)}</span>
                        <span class="status ${business.isActive ? 'open' : 'closed'}">${business.isActive ? 'Opened Now!' : 'Pending'}</span>
                    </div>
                `;
                
                // Make clickable
                listingCard.addEventListener('click', function() {
                    window.location.href = `businesses.html?business=${business._id}`;
                });
                
                businessGrid.appendChild(listingCard);
            });
            
            
            // Add click handler to "View All" button
            const viewAllBtn = document.getElementById('viewAllBusinessesBtn');
            if (viewAllBtn) {
                viewAllBtn.addEventListener('click', function() {
                    window.location.href = 'businesses.html';
                });
            }
        } else {
            const businessGrid = document.getElementById('businessListingsGrid');
            if (businessGrid) {
                businessGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #E74C3C;">Failed to load businesses. Please refresh the page.</div>';
            }
        }
    } catch (error) {
        const businessGrid = document.getElementById('businessListingsGrid');
        if (businessGrid) {
            businessGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #E74C3C;">Error loading businesses. Please check your connection.</div>';
        }
    }
}

// ====================
// UTILITY FUNCTIONS
// ====================

function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
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

function showNotification(message, type) {
    // Remove existing notifications
    const existing = document.querySelector('.notification-toast');
    if (existing) {
        existing.remove();
    }
    
    // Create notification
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
    
    notification.innerHTML = `<div style="display: flex; align-items: center; gap: 12px;">${icon}<span>${message}</span></div>`;
    
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

// Add animation styles
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
`;
document.head.appendChild(notificationStyle);

// ====================
// ESC KEY TO CLOSE MODALS
// ====================
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modals = document.querySelectorAll('.modal.active');
        modals.forEach(function(modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }
});

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

