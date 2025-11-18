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

// Login form handler
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            
            // Validation
            if (!email || !password) {
                showToast('Please fill in all fields', 'error');
                return;
            }
            
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
            
            try {
                const response = await fetch(API_URL + '/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                
                if (response.ok && data.success) {
                    // Store token (use consistent key for all pages)
                    if (data.token) {
                        localStorage.setItem('userToken', data.token);
                        localStorage.setItem('token', data.token); // Keep for compatibility
                        localStorage.setItem('user', JSON.stringify(data.user));
                    }
                    
                    showToast('Login successful! Redirecting...', 'success');
                    
                    // Redirect based on user role
                    setTimeout(() => {
                        if (data.user.role === 'admin') {
                            window.location.href = '/admin';
                        } else {
                            window.location.href = 'index.html';
                        }
                    }, 1500);
                } else {
                    showToast(data.error || 'Invalid email or password', 'error');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
            } catch (error) {
                console.error('Login error:', error);
                showToast('Network error. Please try again.', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }
});

