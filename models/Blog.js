const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a blog title'],
        trim: true,
        maxlength: [150, 'Title cannot be more than 150 characters']
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true
    },
    summary: {
        type: String,
        required: [true, 'Please provide a summary'],
        maxlength: [300, 'Summary cannot be more than 300 characters']
    },
    content: {
        type: String,
        required: [true, 'Please provide blog content']
    },
    coverImage: {
        type: String,
        trim: true
    },
    author: {
        type: String,
        trim: true,
        default: 'CityLocal 101 Team'
    },
    tags: [{
        type: String,
        trim: true
    }],
    isPublished: {
        type: Boolean,
        default: false
    },
    publishedAt: {
        type: Date
    }
}, {
    timestamps: true
});

blogSchema.pre('save', function(next) {
    if (this.isModified('title')) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    }

    if (this.isModified('isPublished')) {
        if (this.isPublished && !this.publishedAt) {
            this.publishedAt = new Date();
        }
        if (!this.isPublished) {
            this.publishedAt = null;
        }
    }

    next();
});

module.exports = mongoose.model('Blog', blogSchema);


