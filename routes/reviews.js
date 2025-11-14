const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Review = require('../models/Review');
const Business = require('../models/Business');
const { protect, optionalAuth } = require('../middleware/auth');
const logActivity = require('../utils/logActivity');

// @route   GET /api/reviews
// @desc    Get all reviews or reviews for a business
// @access  Public
router.get('/', async (req, res) => {
    try {
        const query = { isApproved: true };

        if (req.query.business) {
            query.business = req.query.business;
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const reviews = await Review.find(query)
            .populate('user', 'name avatar')
            .populate('business', 'name slug')
            .sort('-createdAt')
            .skip(skip)
            .limit(limit);

        const total = await Review.countDocuments(query);

        res.json({
            success: true,
            count: reviews.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            reviews
        });
    } catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET /api/reviews/:id
// @desc    Get single review
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const review = await Review.findById(req.params.id)
            .populate('user', 'name avatar')
            .populate('business', 'name slug');

        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }

        res.json({
            success: true,
            review
        });
    } catch (error) {
        console.error('Get review error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST /api/reviews
// @desc    Create a review
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        // Validate required fields
        if (!req.body.business) {
            return res.status(400).json({ 
                success: false,
                error: 'Please select a business' 
            });
        }
        
        if (!req.body.rating || req.body.rating < 1 || req.body.rating > 5) {
            return res.status(400).json({ 
                success: false,
                error: 'Please provide a valid rating (1-5 stars)' 
            });
        }
        
        if (!req.body.title || !req.body.comment) {
            return res.status(400).json({ 
                success: false,
                error: 'Review title and comment are required' 
            });
        }
        
        // Validate business ID format
        if (!mongoose.Types.ObjectId.isValid(req.body.business)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid business ID' 
            });
        }
        
        // Check if business exists
        const business = await Business.findById(req.body.business);
        if (!business) {
            return res.status(404).json({ 
                success: false,
                error: 'Business not found' 
            });
        }

        // Check if user already reviewed this business
        const existingReview = await Review.findOne({
            business: req.body.business,
            user: req.user.id
        });

        if (existingReview) {
            return res.status(400).json({ 
                success: false,
                error: 'You have already reviewed this business' 
            });
        }

        // Add user to review
        req.body.user = req.user.id;
        
        // Set default approval status
        req.body.isApproved = false; // Reviews need admin approval

        const review = await Review.create(req.body);

        // Log activity
        await logActivity({
            type: 'review_submitted',
            description: `New ${review.rating}-star review for "${business.name}" was submitted`,
            user: req.user.id,
            review: review._id,
            business: business._id,
            metadata: { businessName: business.name, rating: review.rating, reviewerName: req.user.name }
        });

        res.status(201).json({
            success: true,
            message: 'Review created successfully',
            review
        });
    } catch (error) {
        console.error('Create review error:', error);
        console.error('Error details:', error.stack);
        
        // Send detailed error message
        let errorMessage = 'Failed to create review';
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            errorMessage = errors.join(', ');
        } else if (error.code === 11000) {
            errorMessage = 'You have already reviewed this business';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        res.status(500).json({ 
            success: false,
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @route   PUT /api/reviews/:id
// @desc    Update review
// @access  Private (Owner only)
router.put('/:id', protect, async (req, res) => {
    try {
        let review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }

        // Check ownership
        if (review.user.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to update this review' });
        }

        review = await Review.findByIdAndUpdate(
            req.params.id,
            { 
                rating: req.body.rating,
                title: req.body.title,
                comment: req.body.comment 
            },
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: 'Review updated successfully',
            review
        });
    } catch (error) {
        console.error('Update review error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   DELETE /api/reviews/:id
// @desc    Delete review
// @access  Private (Owner or Admin)
router.delete('/:id', protect, async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }

        // Check ownership
        if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized to delete this review' });
        }

        await Review.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST /api/reviews/:id/helpful
// @desc    Mark review as helpful
// @access  Private
router.post('/:id/helpful', protect, async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }

        // Check if user already marked as helpful
        if (review.helpfulBy.includes(req.user.id)) {
            // Remove from helpful
            review.helpfulBy = review.helpfulBy.filter(
                id => id.toString() !== req.user.id.toString()
            );
            review.helpfulCount -= 1;
        } else {
            // Add to helpful
            review.helpfulBy.push(req.user.id);
            review.helpfulCount += 1;
        }

        await review.save();

        res.json({
            success: true,
            message: 'Review helpful status updated',
            helpfulCount: review.helpfulCount
        });
    } catch (error) {
        console.error('Mark helpful error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST /api/reviews/:id/respond
// @desc    Business owner responds to review
// @access  Private (Business Owner)
router.post('/:id/respond', protect, async (req, res) => {
    try {
        const review = await Review.findById(req.params.id).populate('business');

        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }

        // Check if user is business owner
        if (review.business.owner.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ 
                error: 'Only business owner can respond to reviews' 
            });
        }

        review.response = {
            comment: req.body.comment,
            respondedAt: Date.now(),
            respondedBy: req.user.id
        };

        await review.save();

        res.json({
            success: true,
            message: 'Response added successfully',
            review
        });
    } catch (error) {
        console.error('Respond to review error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;

