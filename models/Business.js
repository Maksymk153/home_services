const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a business name'],
        trim: true,
        maxlength: [100, 'Name cannot be more than 100 characters']
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true
    },
    description: {
        type: String,
        required: [true, 'Please provide a description'],
        maxlength: [2000, 'Description cannot be more than 2000 characters']
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Please select a category']
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    location: {
        address: {
            type: String,
            required: [true, 'Please provide an address']
        },
        city: {
            type: String,
            required: [true, 'Please provide a city']
        },
        state: {
            type: String,
            required: [true, 'Please provide a state']
        },
        zipCode: {
            type: String
        },
        country: {
            type: String,
            default: 'USA'
        },
        coordinates: {
            lat: Number,
            lng: Number
        }
    },
    contact: {
        phone: {
            type: String,
            required: [true, 'Please provide a phone number']
        },
        email: {
            type: String,
            match: [
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                'Please provide a valid email'
            ]
        },
        website: {
            type: String
        }
    },
    hours: {
        monday: { open: String, close: String, closed: Boolean },
        tuesday: { open: String, close: String, closed: Boolean },
        wednesday: { open: String, close: String, closed: Boolean },
        thursday: { open: String, close: String, closed: Boolean },
        friday: { open: String, close: String, closed: Boolean },
        saturday: { open: String, close: String, closed: Boolean },
        sunday: { open: String, close: String, closed: Boolean }
    },
    rating: {
        average: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        count: {
            type: Number,
            default: 0
        }
    },
    images: [{
        url: String,
        caption: String,
        isPrimary: Boolean
    }],
    tags: [String],
    isVerified: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    views: {
        type: Number,
        default: 0
    },
    claimedAt: {
        type: Date
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Create slug from name
businessSchema.pre('save', function(next) {
    if (this.isModified('name')) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim() + '-' + Date.now();
    }
    next();
});

// Virtual for reviews
businessSchema.virtual('reviews', {
    ref: 'Review',
    localField: '_id',
    foreignField: 'business',
    justOne: false
});

// Check if business is currently open
businessSchema.methods.isOpenNow = function() {
    const now = new Date();
    const day = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
    const hours = this.hours[day];
    
    if (!hours || hours.closed) {
        return false;
    }
    
    // Simplified check - in production, implement proper time comparison
    return true;
};

// Increment view count
businessSchema.methods.incrementViews = function() {
    this.views += 1;
    return this.save();
};

module.exports = mongoose.model('Business', businessSchema);

