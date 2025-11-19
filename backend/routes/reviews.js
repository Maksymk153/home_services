const express = require('express');
const router = express.Router();
const { Review, Business, User } = require('../models');
const { protect } = require('../middleware/auth');
const logActivity = require('../utils/logActivity');

// @route   GET /api/reviews
// @desc    Get all reviews or reviews for a business
// @access  Public
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const where = { isApproved: true };

    if (req.query.business) {
      where.businessId = req.query.business;
    }

    const { count, rows: reviews } = await Review.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'avatar'] },
        { model: Business, as: 'business', attributes: ['id', 'name', 'slug'] }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.json({
      success: true,
      count: reviews.length,
      total: count,
      page,
      pages: Math.ceil(count / limit),
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
    const review = await Review.findByPk(req.params.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'avatar'] },
        { model: Business, as: 'business', attributes: ['id', 'name', 'slug'] }
      ]
    });

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
    if (!req.body.businessId) {
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
    
    // Check if business exists
    const business = await Business.findByPk(req.body.businessId);
    if (!business) {
      return res.status(404).json({ 
        success: false,
        error: 'Business not found' 
      });
    }

    // Check if user already reviewed this business
    const existingReview = await Review.findOne({
      where: {
        businessId: req.body.businessId,
        userId: req.user.id
      }
    });

    if (existingReview) {
      return res.status(400).json({ 
        success: false,
        error: 'You have already reviewed this business' 
      });
    }

    // Create review
    const review = await Review.create({
      businessId: req.body.businessId,
      userId: req.user.id,
      rating: req.body.rating,
      title: req.body.title,
      comment: req.body.comment,
      isApproved: false // Reviews need admin approval
    });

    // Log activity
    await logActivity({
      type: 'review_submitted',
      description: `New ${review.rating}-star review for "${business.name}" was submitted`,
      userId: req.user.id,
      metadata: { 
        businessName: business.name, 
        rating: review.rating, 
        reviewerName: req.user.name,
        reviewId: review.id,
        businessId: business.id
      }
    });

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      review
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to create review'
    });
  }
});

// @route   PUT /api/reviews/:id
// @desc    Update review
// @access  Private (Owner only)
router.put('/:id', protect, async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Check ownership
    if (review.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this review' });
    }

    await review.update({
      rating: req.body.rating,
      title: req.body.title,
      comment: req.body.comment
    });

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
    const review = await Review.findByPk(req.params.id);

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Check ownership
    if (review.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this review' });
    }

    await review.destroy();

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
    const review = await Review.findByPk(req.params.id);

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const helpfulBy = review.helpfulBy || [];
    const userIndex = helpfulBy.indexOf(req.user.id);

    if (userIndex > -1) {
      // Remove from helpful
      helpfulBy.splice(userIndex, 1);
      review.helpfulCount = Math.max(0, review.helpfulCount - 1);
    } else {
      // Add to helpful
      helpfulBy.push(req.user.id);
      review.helpfulCount += 1;
    }

    review.helpfulBy = helpfulBy;
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
    const review = await Review.findByPk(req.params.id, {
      include: [{ model: Business, as: 'business' }]
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Check if user is business owner
    if (review.business.ownerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Only business owner can respond to reviews' 
      });
    }

    await review.update({
      responseComment: req.body.comment,
      respondedAt: new Date(),
      respondedBy: req.user.id
    });

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

