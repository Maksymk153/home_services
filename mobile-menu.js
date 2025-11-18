// ====================
// SHARED MOBILE MENU FUNCTIONALITY
// Use this on all pages to enable mobile menu toggle
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

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initMobileMenu();
});

