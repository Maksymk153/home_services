const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide your name'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        trim: true,
        lowercase: true
    },
    subject: {
        type: String,
        required: [true, 'Please provide a subject'],
        trim: true
    },
    message: {
        type: String,
        required: [true, 'Please provide a message'],
        trim: true
    },
    status: {
        type: String,
        enum: ['new', 'read', 'replied', 'resolved'],
        default: 'new'
    },
    isRead: {
        type: Boolean,
        default: false
    },
    repliedAt: {
        type: Date
    },
    resolvedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Index for faster queries
contactSchema.index({ status: 1, createdAt: -1 });
contactSchema.index({ isRead: 1 });

module.exports = mongoose.model('Contact', contactSchema);

