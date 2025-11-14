// Modern Icon Picker
const iconLibrary = {
    all: [
        'utensils', 'pizza-slice', 'hamburger', 'coffee', 'wine-glass', 'beer',
        'briefcase', 'building', 'store', 'shopping-bag', 'shopping-cart', 'credit-card',
        'car', 'bus', 'plane', 'train', 'ship', 'bicycle', 'motorcycle',
        'home', 'hotel', 'bed', 'umbrella-beach', 'mountain', 'tree',
        'heart', 'heartbeat', 'hospital', 'user-md', 'tooth', 'pills', 'stethoscope',
        'laptop', 'mobile-alt', 'wifi', 'server', 'code', 'database',
        'graduation-cap', 'book', 'chalkboard-teacher', 'university', 'school',
        'palette', 'paint-brush', 'camera', 'music', 'film', 'theater-masks',
        'dumbbell', 'football-ball', 'basketball-ball', 'swimming-pool', 'biking',
        'spa', 'cut', 'hand-sparkles', 'gem', 'ring',
        'paw', 'dog', 'cat', 'fish', 'dove',
        'gavel', 'balance-scale', 'file-contract', 'handshake',
        'calculator', 'chart-line', 'chart-bar', 'money-bill-wave', 'university',
        'wrench', 'hammer', 'tools', 'paint-roller', 'hard-hat',
        'shield-alt', 'lock', 'key', 'user-shield',
        'newspaper', 'tv', 'radio', 'podcast', 'microphone',
        'users', 'user-friends', 'handshake', 'comments',
        'map-marker-alt', 'globe', 'flag', 'compass',
        'phone', 'envelope', 'fax', 'address-book',
        'calendar', 'clock', 'stopwatch', 'hourglass-half',
        'star', 'award', 'trophy', 'medal',
        'lightbulb', 'magic', 'wand-magic-sparkles', 'sparkles',
        'fire', 'bolt', 'sun', 'moon', 'cloud',
        'leaf', 'recycle', 'solar-panel', 'wind'
    ],
    business: ['briefcase', 'building', 'store', 'handshake', 'chart-line', 'chart-bar', 'calculator', 'file-contract', 'university', 'money-bill-wave'],
    food: ['utensils', 'pizza-slice', 'hamburger', 'coffee', 'wine-glass', 'beer', 'ice-cream', 'cake', 'fish', 'drumstick-bite'],
    health: ['heart', 'heartbeat', 'hospital', 'user-md', 'tooth', 'pills', 'stethoscope', 'syringe', 'band-aid', 'spa'],
    services: ['wrench', 'hammer', 'tools', 'paint-roller', 'hard-hat', 'paint-brush', 'cut', 'hand-sparkles', 'car', 'home'],
    shopping: ['shopping-bag', 'shopping-cart', 'credit-card', 'store', 'tags', 'gift', 'gem', 'ring', 'tshirt', 'shoe-prints'],
    travel: ['plane', 'train', 'bus', 'ship', 'car', 'hotel', 'bed', 'umbrella-beach', 'mountain', 'map-marker-alt'],
    other: ['star', 'heart', 'lightbulb', 'magic', 'fire', 'bolt', 'leaf', 'paw', 'users', 'globe']
};

let currentIconCategory = 'all';

function openIconPicker() {
    document.getElementById('iconPickerModal').classList.add('active');
    document.body.style.overflow = 'hidden';
    loadIcons();
}

function closeIconPicker() {
    document.getElementById('iconPickerModal').classList.remove('active');
    document.body.style.overflow = 'auto';
}

function switchIconCategory(category) {
    currentIconCategory = category;
    // Update active tab
    document.querySelectorAll('.icon-category-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-category') === category) {
            tab.classList.add('active');
        }
    });
    loadIcons();
}

function loadIcons() {
    const grid = document.getElementById('iconGrid');
    const icons = currentIconCategory === 'all' 
        ? iconLibrary.all 
        : iconLibrary[currentIconCategory] || [];
    
    grid.innerHTML = icons.map(icon => `
        <div class="icon-item" data-icon="${icon}">
            <i class="fas fa-${icon}"></i>
            <span>${icon.replace(/-/g, ' ')}</span>
        </div>
    `).join('');
    
    // Add click event listeners to icon items
    grid.querySelectorAll('.icon-item').forEach(item => {
        item.addEventListener('click', function() {
            const iconName = this.getAttribute('data-icon');
            if (iconName) {
                selectIcon(iconName);
            }
        });
    });
}

function selectIcon(iconName) {
    // Update visual selection
    document.querySelectorAll('.icon-item').forEach(item => {
        item.classList.remove('selected');
        if (item.getAttribute('data-icon') === iconName) {
            item.classList.add('selected');
        }
    });
    
    // Update the form field
    document.getElementById('categoryIcon').value = iconName;
    updateIconPreview();
    
    // Close picker after short delay
    setTimeout(() => {
        closeIconPicker();
    }, 300);
}

function filterIcons() {
    const searchTerm = document.getElementById('iconSearch').value.toLowerCase();
    const items = document.querySelectorAll('.icon-item');
    
    items.forEach(item => {
        const iconName = item.getAttribute('data-icon');
        if (iconName.includes(searchTerm)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

function updateIconPreview() {
    const iconName = document.getElementById('categoryIcon').value.trim();
    const preview = document.getElementById('iconPreview');
    
    if (preview) {
        if (iconName) {
            preview.innerHTML = `<i class="fas fa-${iconName}"></i>`;
        } else {
            preview.innerHTML = `<i class="fas fa-question-circle"></i>`;
        }
    }
}

// Update preview when editing category
document.addEventListener('DOMContentLoaded', function() {
    const iconInput = document.getElementById('categoryIcon');
    if (iconInput && iconInput.value) {
        updateIconPreview();
    }
    
    // Open icon picker button
    const openIconPickerBtn = document.getElementById('openIconPickerBtn');
    if (openIconPickerBtn) {
        openIconPickerBtn.addEventListener('click', openIconPicker);
    }
    
    // Close icon picker buttons
    const closeIconPickerX = document.getElementById('closeIconPickerX');
    if (closeIconPickerX) {
        closeIconPickerX.addEventListener('click', closeIconPicker);
    }
    
    const closeIconPickerBtn = document.getElementById('closeIconPickerBtn');
    if (closeIconPickerBtn) {
        closeIconPickerBtn.addEventListener('click', closeIconPicker);
    }
    
    // Category tab buttons
    document.querySelectorAll('.icon-category-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            switchIconCategory(category);
        });
    });
    
    // Search input
    const iconSearch = document.getElementById('iconSearch');
    if (iconSearch) {
        iconSearch.addEventListener('input', filterIcons);
    }
    
    // Close icon picker when clicking outside
    const iconPickerModal = document.getElementById('iconPickerModal');
    if (iconPickerModal) {
        iconPickerModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeIconPicker();
            }
        });
    }
});

