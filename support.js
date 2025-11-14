const API_URL = '/api';

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

// Support form submission
document.addEventListener('DOMContentLoaded', function() {
    const supportForm = document.getElementById('supportForm');
    
    if (supportForm) {
        supportForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const name = document.getElementById('supportName').value.trim();
            const email = document.getElementById('supportEmail').value.trim();
            const subject = document.getElementById('supportSubject').value;
            const message = document.getElementById('supportMessage').value.trim();
            
            if (!name || !email || !subject || !message) {
                showToast('Please fill in all required fields', 'error');
                return;
            }
            
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            
            try {
                const response = await fetch(API_URL + '/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name, email, subject, message })
                });
                
                const data = await response.json();
                
                if (response.ok && data.success) {
                    showToast('Thank you, ' + name + '! Your message has been sent successfully. We will respond to ' + email + ' within 24 hours.', 'success');
                    
                    // Reset form
                    this.reset();
                    
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 2000);
                } else {
                    showToast(data.error || 'Failed to send message. Please try again.', 'error');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
            } catch (error) {
                console.error('Support form error:', error);
                showToast('Network error. Please try again.', 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }
});

