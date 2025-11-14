const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: [
            'business_submitted',
            'business_approved',
            'business_updated',
            'business_deleted',
            'business_featured',
            'review_submitted',
            'review_approved',
            'review_deleted',
            'user_registered',
            'user_deleted',
            'category_created',
            'category_updated',
            'category_deleted',
            'contact_submitted'
        ]
    },
    description: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    business: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Business'
    },
    review: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review'
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// Index for efficient queries
activitySchema.index({ createdAt: -1 });
activitySchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);

