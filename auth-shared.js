// ====================
// SHARED AUTHENTICATION MODULE
// Use this on all pages to maintain session persistence
// ====================

// Use API_URL from global scope if available, otherwise declare it
if (typeof API_URL === 'undefined') {
    var API_URL = '/api';
}

let currentUser = null;
let authToken = localStorage.getItem('userToken') || localStorage.getItem('token');

// Check authentication and update UI on page load
async function checkAuthAndUpdateUI() {
    const loginBtn = document.getElementById('loginBtn') || document.querySelector('.login-btn');
    
    if (!loginBtn) {
        return;
    }
    
    if (authToken) {
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
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                authToken = null;
                currentUser = null;
                updateUIForGuest();
            }
        } catch (error) {
            console.error('Auth check error:', error);
            updateUIForGuest();
        }
    } else {
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
        window.location.href = 'index.html';
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuthAndUpdateUI();
});

