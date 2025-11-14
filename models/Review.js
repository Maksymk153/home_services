const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    business: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Business',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: [true, 'Please provide a rating'],
        min: 1,
        max: 5
    },
    title: {
        type: String,
        required: [true, 'Please provide a review title'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    comment: {
        type: String,
        required: [true, 'Please provide a review comment'],
        maxlength: [1000, 'Comment cannot be more than 1000 characters']
    },
    images: [{
        url: String,
        caption: String
    }],
    helpfulCount: {
        type: Number,
        default: 0
    },
    helpfulBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    response: {
        comment: String,
        respondedAt: Date,
        respondedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    isApproved: {
        type: Boolean,
        default: true
    },
    isReported: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Prevent duplicate reviews from same user for same business
reviewSchema.index({ business: 1, user: 1 }, { unique: true });

// Update business rating after review save
reviewSchema.post('save', async function() {
    await this.constructor.calculateAverageRating(this.business);
});

// Update business rating after review delete
reviewSchema.post('remove', async function() {
    await this.constructor.calculateAverageRating(this.business);
});

// Static method to calculate average rating
reviewSchema.statics.calculateAverageRating = async function(businessId) {
    const stats = await this.aggregate([
        {
            $match: { business: businessId, isApproved: true }
        },
        {
            $group: {
                _id: '$business',
                averageRating: { $avg: '$rating' },
                count: { $sum: 1 }
            }
        }
    ]);

    try {
        if (stats.length > 0) {
            await this.model('Business').findByIdAndUpdate(businessId, {
                'rating.average': Math.round(stats[0].averageRating * 10) / 10,
                'rating.count': stats[0].count
            });
        } else {
            await this.model('Business').findByIdAndUpdate(businessId, {
                'rating.average': 0,
                'rating.count': 0
            });
        }
    } catch (err) {
        console.error('Error calculating average rating:', err);
    }
};

module.exports = mongoose.model('Review', reviewSchema);

