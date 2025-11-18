// Use API_URL from global scope if available, otherwise declare it
if (typeof API_URL === 'undefined') {
    var API_URL = '/api';
}

// Show toast notification
function showToast(message, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) {
        existing.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    
    // Add icon based on type
    let icon = '';
    if (type === 'success') {
        icon = '<i class="fas fa-check-circle"></i>';
    } else if (type === 'error') {
        icon = '<i class="fas fa-exclamation-circle"></i>';
    } else {
        icon = '<i class="fas fa-info-circle"></i>';
    }
    
    toast.innerHTML = `<div style="display: flex; align-items: center; gap: 12px; justify-content: center;">${icon}<span>${message}</span></div>`;
    
    // Center bottom position with clean colors
    toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        padding: 16px 24px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        font-size: 15px;
        z-index: 10000;
        animation: slideUp 0.3s ease-out;
        box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        max-width: 500px;
        min-width: 300px;
        text-align: center;
    `;
    
    // Simple clean colors - no gradients
    if (type === 'success') {
        toast.style.background = '#27AE60';
    } else if (type === 'error') {
        toast.style.background = '#E74C3C';
    } else {
        toast.style.background = '#4A90E2';
    }
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideDown 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Add animation styles
const toastStyle = document.createElement('style');
toastStyle.textContent = `
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
document.head.appendChild(toastStyle);

// Load categories
async function loadCategories() {
    try {
        const response = await fetch(API_URL + '/categories');
        if (response.ok) {
            const data = await response.json();
            const select = document.getElementById('businessCategory');
            if (select) {
                data.categories.forEach(function(cat) {
                    const option = document.createElement('option');
                    option.value = cat._id;
                    option.textContent = cat.name;
                    select.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Location suggestions data
const US_STATES = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
    'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
    'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
    'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
    'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
    'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
    'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
];

const POPULAR_CITIES = [
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
    'Compton', 'Richmond', 'Antioch', 'Temecula', 'Norwalk', 'Daly City', 'Burbank', 'Santa Monica',
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

// Location suggestions functionality
function initLocationSuggestions() {
    const cityInput = document.getElementById('businessCity');
    const stateInput = document.getElementById('businessState');
    const citySuggestions = document.getElementById('citySuggestions');
    const stateSuggestions = document.getElementById('stateSuggestions');
    
    let selectedCityIndex = -1;
    let selectedStateIndex = -1;
    
    // City suggestions
    if (cityInput && citySuggestions) {
        cityInput.addEventListener('input', function(e) {
            const query = e.target.value.trim().toLowerCase();
            if (query.length < 2) {
                citySuggestions.style.display = 'none';
                return;
            }
            
            const matches = POPULAR_CITIES.filter(city => 
                city.toLowerCase().startsWith(query)
            ).slice(0, 8);
            
            if (matches.length > 0) {
                citySuggestions.innerHTML = matches.map((city, index) => 
                    `<div class="location-suggestion-item" data-index="${index}" data-value="${city}">${city}</div>`
                ).join('');
                citySuggestions.style.display = 'block';
                selectedCityIndex = -1;
            } else {
                citySuggestions.style.display = 'none';
            }
        });
        
        citySuggestions.addEventListener('click', function(e) {
            if (e.target.classList.contains('location-suggestion-item')) {
                cityInput.value = e.target.getAttribute('data-value');
                citySuggestions.style.display = 'none';
                cityInput.focus();
            }
        });
        
        cityInput.addEventListener('keydown', function(e) {
            const items = citySuggestions.querySelectorAll('.location-suggestion-item');
            if (items.length === 0) return;
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedCityIndex = (selectedCityIndex + 1) % items.length;
                updateCitySelection(items);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedCityIndex = selectedCityIndex <= 0 ? items.length - 1 : selectedCityIndex - 1;
                updateCitySelection(items);
            } else if (e.key === 'Enter' && selectedCityIndex >= 0) {
                e.preventDefault();
                cityInput.value = items[selectedCityIndex].getAttribute('data-value');
                citySuggestions.style.display = 'none';
            } else if (e.key === 'Escape') {
                citySuggestions.style.display = 'none';
            }
        });
        
        function updateCitySelection(items) {
            items.forEach((item, index) => {
                item.classList.toggle('selected', index === selectedCityIndex);
            });
            if (selectedCityIndex >= 0) {
                items[selectedCityIndex].scrollIntoView({ block: 'nearest' });
            }
        }
        
        // Close suggestions when clicking outside
        document.addEventListener('click', function(e) {
            if (!cityInput.contains(e.target) && !citySuggestions.contains(e.target)) {
                citySuggestions.style.display = 'none';
            }
        });
    }
    
    // State suggestions
    if (stateInput && stateSuggestions) {
        stateInput.addEventListener('input', function(e) {
            const query = e.target.value.trim().toLowerCase();
            if (query.length < 1) {
                stateSuggestions.style.display = 'none';
                return;
            }
            
            const matches = US_STATES.filter(state => 
                state.toLowerCase().startsWith(query)
            ).slice(0, 8);
            
            if (matches.length > 0) {
                stateSuggestions.innerHTML = matches.map((state, index) => 
                    `<div class="location-suggestion-item" data-index="${index}" data-value="${state}">${state}</div>`
                ).join('');
                stateSuggestions.style.display = 'block';
                selectedStateIndex = -1;
            } else {
                stateSuggestions.style.display = 'none';
            }
        });
        
        stateSuggestions.addEventListener('click', function(e) {
            if (e.target.classList.contains('location-suggestion-item')) {
                stateInput.value = e.target.getAttribute('data-value');
                stateSuggestions.style.display = 'none';
                stateInput.focus();
            }
        });
        
        stateInput.addEventListener('keydown', function(e) {
            const items = stateSuggestions.querySelectorAll('.location-suggestion-item');
            if (items.length === 0) return;
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedStateIndex = (selectedStateIndex + 1) % items.length;
                updateStateSelection(items);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedStateIndex = selectedStateIndex <= 0 ? items.length - 1 : selectedStateIndex - 1;
                updateStateSelection(items);
            } else if (e.key === 'Enter' && selectedStateIndex >= 0) {
                e.preventDefault();
                stateInput.value = items[selectedStateIndex].getAttribute('data-value');
                stateSuggestions.style.display = 'none';
            } else if (e.key === 'Escape') {
                stateSuggestions.style.display = 'none';
            }
        });
        
        function updateStateSelection(items) {
            items.forEach((item, index) => {
                item.classList.toggle('selected', index === selectedStateIndex);
            });
            if (selectedStateIndex >= 0) {
                items[selectedStateIndex].scrollIntoView({ block: 'nearest' });
            }
        }
        
        // Close suggestions when clicking outside
        document.addEventListener('click', function(e) {
            if (!stateInput.contains(e.target) && !stateSuggestions.contains(e.target)) {
                stateSuggestions.style.display = 'none';
            }
        });
    }
}

// Form submission
document.addEventListener('DOMContentLoaded', function() {
    loadCategories();
    initLocationSuggestions();
    
    // Cancel button
    const cancelBtn = document.querySelector('.btn-cancel');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            window.location.href = 'index.html';
        });
    }
    
    // Form submission
    const addBusinessForm = document.getElementById('addBusinessForm');
    if (addBusinessForm) {
        addBusinessForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            
            // Get form data - only send fields that match Business model
            const businessName = document.getElementById('businessName').value.trim();
            const category = document.getElementById('businessCategory').value;
            const description = document.getElementById('businessDescription').value.trim();
            const address = document.getElementById('businessAddress').value.trim();
            const city = document.getElementById('businessCity').value.trim();
            const state = document.getElementById('businessState').value.trim();
            const zipCode = document.getElementById('businessZip').value.trim();
            const phone = document.getElementById('businessPhone').value.trim();
            const email = document.getElementById('businessEmail').value.trim();
            const website = document.getElementById('businessWebsite').value.trim();
            
            const formData = {
                name: businessName,
                category: category,
                description: description,
                location: {
                    address: address,
                    city: city,
                    state: state,
                    country: 'USA'
                },
                contact: {
                    phone: phone
                }
            };
            
            // Only add optional fields if they have values (not empty strings)
            if (zipCode && zipCode.trim() !== '') {
                formData.location.zipCode = zipCode.trim();
            }
            
            if (email && email.trim() !== '') {
                formData.contact.email = email.trim();
            }
            
            if (website && website.trim() !== '') {
                formData.contact.website = website.trim();
            }
            
            // Validate required fields
            if (!formData.name || !formData.category || !formData.description) {
                showToast('Please fill in all required fields (Name, Category, Description)', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                return;
            }
            
            if (!formData.location.address || !formData.location.city || !formData.location.state) {
                showToast('Please fill in all required location fields (Address, City, State)', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                return;
            }
            
            if (!formData.contact.phone) {
                showToast('Please provide a phone number', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                return;
            }
            
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
            
            try {
                // First, check if user is logged in
                const token = localStorage.getItem('token') || localStorage.getItem('userToken');
                
                if (!token) {
                    // User not logged in, show message
                    showToast('Please login first to add your business', 'error');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                    return;
                }
                
                console.log('Submitting business form...', formData);
                console.log('Token:', token ? 'Present' : 'Missing');
                
                const response = await fetch(API_URL + '/businesses', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify(formData)
                });
                
                console.log('Response status:', response.status);
                console.log('Response ok:', response.ok);
                
                // Check if response is ok before parsing JSON
                let data;
                try {
                    data = await response.json();
                } catch (parseError) {
                    console.error('Failed to parse response:', parseError);
                    showToast('Server returned invalid response. Please try again.', 'error');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                    return;
                }
                
                if (response.ok && data.success) {
                    showToast('Business submitted successfully! Our team will review it soon.', 'success');
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 2000);
                } else {
                    // Show detailed error message
                    let errorMsg = 'Failed to submit business. ';
                    if (data.error) {
                        errorMsg += data.error;
                    } else if (data.message) {
                        errorMsg += data.message;
                    } else if (response.status === 401) {
                        errorMsg = 'Please login first to add your business';
                        setTimeout(() => {
                            window.location.href = 'login.html';
                        }, 2000);
                    } else if (response.status === 400) {
                        errorMsg += 'Please check all required fields and try again.';
                    } else {
                        errorMsg += 'Please check all required fields and try again.';
                    }
                    showToast(errorMsg, 'error');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
            } catch (error) {
                console.error('Submit error:', error);
                showToast('Network error. Please check your connection and try again.', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }
});

