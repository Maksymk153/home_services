// Use API_URL from global scope if available, otherwise declare it
if (typeof API_URL === 'undefined') {
    var API_URL = '/api';
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    if (!registerForm) return;

    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;
        const acceptTerms = document.getElementById('acceptTerms').checked;

        if (!name || !email || !password || !confirmPassword) {
            showToast('Please fill in all required fields.', 'error');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showToast('Please enter a valid email address.', 'error');
            return;
        }

        if (password.length < 6) {
            showToast('Password must be at least 6 characters long.', 'error');
            return;
        }

        if (password !== confirmPassword) {
            showToast('Passwords do not match.', 'error');
            return;
        }

        if (!acceptTerms) {
            showToast('Please accept the Terms & Conditions to continue.', 'error');
            return;
        }

        const submitBtn = registerForm.querySelector('button[type="submit"]');
        const originalHtml = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';

        try {
            const response = await fetch(API_URL + '/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Store token (use consistent key for all pages)
                if (data.token) {
                    localStorage.setItem('userToken', data.token);
                    localStorage.setItem('token', data.token); // Keep for compatibility
                }
                if (data.user) {
                    localStorage.setItem('user', JSON.stringify(data.user));
                }

                showToast('Account created successfully! Redirecting...', 'success');
                registerForm.reset();

                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            } else {
                showToast(data.error || 'Registration failed. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            showToast('Network error. Please try again.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalHtml;
        }
    });
});

