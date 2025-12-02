const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const { User, Business, Review, Category, Contact, Activity, Blog, SubCategory, ReviewRequest } = require('../models');
const { protect, authorize } = require('../middleware/auth');
const logActivity = require('../utils/logActivity');

// @route   GET /api/admin/users/:id
// @desc    Get user by ID (public profile)
// @access  Public
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: ['id', 'name', 'email', 'phone', 'avatar', 'role', 'createdAt'],
      include: []
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// All other routes require admin access
router.use(protect, authorize('admin'));

// @route   GET /api/admin/stats
// @desc    Get dashboard statistics
// @access  Private (Admin only)
router.get('/stats', async (req, res) => {
  try {
    const stats = {
      users: await User.count(),
      businesses: await Business.count(),
      activeBusinesses: await Business.count({ where: { isActive: true } }),
      pendingBusinesses: await Business.count({ where: { isActive: false } }),
      reviews: await Review.count(),
      categories: await Category.count(),
      contacts: await Contact.count(),
      unreadContacts: await Contact.count({ where: { status: 'new' } }),
      recentUsers: await User.findAll({
        order: [['createdAt', 'DESC']],
        limit: 5,
        attributes: ['id', 'name', 'email', 'role', 'createdAt']
      }),
      recentBusinesses: await Business.findAll({
        order: [['createdAt', 'DESC']],
        limit: 5,
        include: [{ model: Category, as: 'category', attributes: ['name'] }]
      }),
      recentReviews: await Review.findAll({
        order: [['createdAt', 'DESC']],
        limit: 5,
        include: [
          { model: User, as: 'user', attributes: ['name'] },
          { model: Business, as: 'business', attributes: ['name'] }
        ]
      }),
      recentContacts: await Contact.findAll({
        order: [['createdAt', 'DESC']],
        limit: 5
      })
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/admin/businesses
// @desc    Get all businesses (admin)
// @access  Private (Admin only)
router.get('/businesses', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { count, rows: businesses } = await Business.findAndCountAll({
      include: [
        { model: Category, as: 'category', attributes: ['name'] },
        { model: User, as: 'owner', attributes: ['name', 'email'] }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.json({
      success: true,
      count: businesses.length,
      total: count,
      page,
      pages: Math.ceil(count / limit),
      businesses
    });
  } catch (error) {
    console.error('Admin get businesses error:', error);
    res.status(500).json({ 
      error: 'Server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/admin/businesses/:id/approve
// @desc    Approve business
// @access  Private (Admin only)
router.put('/businesses/:id/approve', async (req, res) => {
  try {
    const business = await Business.findByPk(req.params.id, {
      include: [{ model: User, as: 'owner', attributes: ['id', 'name', 'email'] }]
    });
    
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    await business.update({ 
      isActive: true, 
      isVerified: true,
      rejectionReason: null,
      rejectedAt: null,
      approvedAt: new Date()
    });

    await logActivity({
      type: 'business_approved',
      description: `Business "${business.name}" was approved by admin`,
      userId: req.user.id,
      metadata: { businessName: business.name, businessId: business.id }
    });

    // Send approval email to business owner
    if (business.owner && business.owner.email) {
      const sendEmail = require('../utils/sendEmail');
      await sendEmail({
        to: business.owner.email,
        subject: `Your Business Listing Has Been Approved! - ${business.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background-color: #4cd964; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 28px;">🎉 Congratulations!</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px;">Your business listing has been approved</p>
            </div>
            <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <p style="color: #333; font-size: 16px; line-height: 1.6;">
                Hello <strong>${business.owner.name}</strong>,
              </p>
              <p style="color: #333; font-size: 16px; line-height: 1.6;">
                Great news! Your business listing <strong>"${business.name}"</strong> has been approved and is now live on CityLocal 101.
              </p>
              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <h3 style="margin: 0 0 15px 0; color: #2c3e50;">What's Next?</h3>
                <ul style="margin: 0; padding-left: 20px; color: #555;">
                  <li style="margin-bottom: 10px;">Your listing is now visible to potential customers</li>
                  <li style="margin-bottom: 10px;">Manage your listing anytime from your dashboard</li>
                  <li style="margin-bottom: 10px;">Respond to customer reviews and inquiries</li>
                  <li style="margin-bottom: 10px;">Keep your information up-to-date</li>
                </ul>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/business-dashboard" 
                   style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; 
                          font-weight: 600; font-size: 16px;">
                  View My Dashboard
                </a>
              </div>
              <p style="color: #7f8c8d; font-size: 14px; margin-top: 30px; text-align: center;">
                Thank you for choosing CityLocal 101!
              </p>
            </div>
          </div>
        `
      }).catch(() => {});
    }

    res.json({
      success: true,
      message: 'Business approved successfully',
      business
    });
  } catch (error) {
    // Removed console.error'Approve business error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/admin/businesses/:id/reject
// @desc    Reject business with reason
// @access  Private (Admin only)
router.put('/businesses/:id/reject', async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    
    if (!rejectionReason || rejectionReason.trim().length === 0) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const business = await Business.findByPk(req.params.id, {
      include: [{ model: User, as: 'owner', attributes: ['id', 'name', 'email'] }]
    });
    
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    await business.update({ 
      isActive: false,
      isVerified: false,
      rejectionReason: rejectionReason.trim(),
      rejectedAt: new Date(),
      approvedAt: null
    });

    await logActivity({
      type: 'business_rejected',
      description: `Business "${business.name}" was rejected by admin`,
      userId: req.user.id,
      metadata: { 
        businessName: business.name, 
        businessId: business.id,
        rejectionReason: rejectionReason.trim()
      }
    });

    // Send rejection email to business owner
    if (business.owner && business.owner.email) {
      const sendEmail = require('../utils/sendEmail');
      await sendEmail({
        to: business.owner.email,
        subject: `Business Listing Review - ${business.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background-color: #e74c3c; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 28px;">⚠️ Business Listing Update</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px;">Action Required</p>
            </div>
            <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <p style="color: #333; font-size: 16px; line-height: 1.6;">
                Hello <strong>${business.owner.name}</strong>,
              </p>
              <p style="color: #333; font-size: 16px; line-height: 1.6;">
                We've reviewed your business listing <strong>"${business.name}"</strong> and need some additional information or corrections before we can approve it.
              </p>
              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; border-radius: 4px; margin: 25px 0;">
                <h3 style="margin: 0 0 15px 0; color: #856404;">Reason for Rejection:</h3>
                <p style="color: #856404; line-height: 1.6; margin: 0;">
                  ${rejectionReason.replace(/\n/g, '<br>')}
                </p>
              </div>
              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <h3 style="margin: 0 0 15px 0; color: #2c3e50;">What to Do Next:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #555;">
                  <li style="margin-bottom: 10px;">Review the reason above</li>
                  <li style="margin-bottom: 10px;">Update your business information as needed</li>
                  <li style="margin-bottom: 10px;">Resubmit your listing for review</li>
                  <li style="margin-bottom: 10px;">If you have questions, contact our support team</li>
                </ul>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/business-dashboard" 
                   style="display: inline-block; background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Update My Listing
                </a>
              </div>
              <p style="color: #7f8c8d; font-size: 14px; margin-top: 30px; text-align: center;">
                Thank you for your understanding.
              </p>
            </div>
          </div>
        `
      }).catch(() => {});
    }

    res.json({
      success: true,
      message: 'Business rejected successfully',
      business
    });
  } catch (error) {
    // Removed console.error'Reject business error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/admin/reviews/:id/approve
// @desc    Approve review
// @access  Private (Admin only)
router.put('/reviews/:id/approve', async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    await review.update({ isApproved: true });

    res.json({
      success: true,
      message: 'Review approved successfully',
      review
    });
  } catch (error) {
    // Removed console.error'Approve review error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/admin/categories
// @desc    Get all categories (admin)
// @access  Private (Admin only)
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.findAll({
      order: [['order', 'ASC'], ['name', 'ASC']]
    });

    res.json({
      success: true,
      count: categories.length,
      categories
    });
  } catch (error) {
    // Removed console.error'Admin get categories error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users (admin)
// @access  Private (Admin only)
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { count, rows: users } = await User.findAndCountAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.json({
      success: true,
      count: users.length,
      total: count,
      page,
      pages: Math.ceil(count / limit),
      users
    });
  } catch (error) {
    // Removed console.error'Admin get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user (admin)
// @access  Private (Admin only)
router.put('/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.update(req.body);

    await logActivity({
      type: 'user_updated',
      description: `User "${user.name}" was updated by admin`,
      userId: req.user.id,
      metadata: { updatedUserId: user.id, userName: user.name }
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    // Removed console.error'Admin update user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user (admin)
// @access  Private (Admin only)
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ error: 'Cannot delete admin user' });
    }

    await user.destroy();

    await logActivity({
      type: 'user_deleted',
      description: `User "${user.name}" was deleted by admin`,
      userId: req.user.id,
      metadata: { deletedUserId: user.id, userName: user.name }
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    // Removed console.error'Admin delete user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/admin/reviews
// @desc    Get all reviews (admin)
// @access  Private (Admin only)
router.get('/reviews', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const where = {};
    if (req.query.status === 'pending') {
      where.isApproved = false;
    }

    const { count, rows: reviews } = await Review.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
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
    // Removed console.error'Admin get reviews error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/admin/reviews/:id
// @desc    Delete review (admin)
// @access  Private (Admin only)
router.delete('/reviews/:id', async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    await review.destroy();

    await logActivity({
      type: 'review_deleted',
      description: `Review was deleted by admin`,
      userId: req.user.id,
      metadata: { reviewId: review.id }
    });

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    // Removed console.error'Admin delete review error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/admin/businesses/:id
// @desc    Update business (admin)
// @access  Private (Admin only)
router.put('/businesses/:id', [
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Business name cannot be empty')
    .isLength({ min: 2, max: 100 }).withMessage('Business name must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .notEmpty().withMessage('Description cannot be empty')
    .isLength({ min: 10, max: 2000 }).withMessage('Description must be between 10 and 2000 characters'),
  body('categoryId')
    .optional()
    .isInt().withMessage('Category ID must be a valid number'),
  body('address')
    .optional()
    .trim()
    .notEmpty().withMessage('Address cannot be empty')
    .isLength({ max: 255 }).withMessage('Address cannot exceed 255 characters'),
  body('city')
    .optional()
    .trim()
    .notEmpty().withMessage('City cannot be empty')
    .isLength({ max: 100 }).withMessage('City cannot exceed 100 characters'),
  body('state')
    .optional()
    .trim()
    .notEmpty().withMessage('State cannot be empty')
    .isLength({ min: 2, max: 50 }).withMessage('State must be between 2 and 50 characters'),
  body('zipCode')
    .optional()
    .trim()
    .matches(/^\d{5}(-\d{4})?$|^$/).withMessage('Zip code must be in format 12345 or 12345-6789'),
  body('phone')
    .optional()
    .trim()
    .notEmpty().withMessage('Phone number cannot be empty')
    .matches(/^[\d\s\-\+\(\)]+$/).withMessage('Phone number contains invalid characters')
    .isLength({ min: 10, max: 20 }).withMessage('Phone number must be between 10 and 20 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('website')
    .optional()
    .trim()
    .isURL().withMessage('Please provide a valid website URL')
    .matches(/^https?:\/\//).withMessage('Website URL must start with http:// or https://'),
  body('socialLinks.facebook')
    .optional()
    .trim()
    .isURL().withMessage('Facebook URL must be a valid URL'),
  body('socialLinks.twitter')
    .optional()
    .trim()
    .isURL().withMessage('Twitter URL must be a valid URL'),
  body('socialLinks.instagram')
    .optional()
    .trim()
    .isURL().withMessage('Instagram URL must be a valid URL'),
  body('socialLinks.linkedin')
    .optional()
    .trim()
    .isURL().withMessage('LinkedIn URL must be a valid URL')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = {};
      errors.array().forEach(error => {
        const field = error.param;
        if (!errorMessages[field]) {
          errorMessages[field] = [];
        }
        errorMessages[field].push(error.msg);
      });
      
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed. Please check your input.',
        errors: errorMessages
      });
    }

    const business = await Business.findByPk(req.params.id);
    if (!business) {
      return res.status(404).json({ 
        success: false,
        error: 'Business not found' 
      });
    }

    // Validate category exists if categoryId is being updated
    if (req.body.categoryId) {
      const category = await Category.findByPk(req.body.categoryId);
      if (!category) {
        return res.status(400).json({ 
          success: false,
          error: 'Selected category does not exist',
          errors: { categoryId: ['Please select a valid category'] }
        });
      }
    }

    // Validate image if provided (base64 image)
    if (req.body.image && typeof req.body.image === 'string' && req.body.image.startsWith('data:image')) {
      // Check image size (max 2MB for base64)
      const base64Size = req.body.image.length;
      const maxSize = 2 * 1024 * 1024; // 2MB in bytes
      
      if (base64Size > maxSize) {
        return res.status(400).json({ 
          success: false,
          error: 'Image is too large',
          errors: { image: ['Image size must be less than 2MB. Please use a smaller image.'] }
        });
      }

      // Check image type
      const imageType = req.body.image.match(/data:image\/(\w+);base64/);
      if (!imageType || !['jpeg', 'jpg', 'png', 'gif', 'webp'].includes(imageType[1].toLowerCase())) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid image type',
          errors: { image: ['Image must be in JPEG, PNG, GIF, or WebP format.'] }
        });
      }
    }

    await business.update(req.body);

    await logActivity({
      type: 'business_updated',
      description: `Business "${business.name}" was updated by admin`,
      userId: req.user.id,
      metadata: { businessName: business.name, businessId: business.id }
    });

    res.json({
      success: true,
      message: 'Business updated successfully',
      business
    });
  } catch (error) {
    console.error('Admin update business error:', error);
    
    // Handle Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
      const errorMessages = {};
      error.errors.forEach(err => {
        const field = err.path;
        if (!errorMessages[field]) {
          errorMessages[field] = [];
        }
        errorMessages[field].push(err.message);
      });
      
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed. Please check your input.',
        errors: errorMessages
      });
    }

    // Handle unique constraint errors
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        success: false,
        error: 'A business with this name already exists',
        errors: { name: ['This business name is already taken'] }
      });
    }

    res.status(500).json({ 
      success: false,
      error: 'Server error. Please try again later.' 
    });
  }
});

// @route   DELETE /api/admin/businesses/:id
// @desc    Delete business (admin)
// @access  Private (Admin only)
router.delete('/businesses/:id', async (req, res) => {
  try {
    const business = await Business.findByPk(req.params.id);
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    await business.destroy();

    await logActivity({
      type: 'business_deleted',
      description: `Business "${business.name}" was deleted by admin`,
      userId: req.user.id,
      metadata: { businessName: business.name, businessId: business.id }
    });

    res.json({
      success: true,
      message: 'Business deleted successfully'
    });
  } catch (error) {
    // Removed console.error'Admin delete business error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/admin/categories
// @desc    Create category (admin)
// @access  Private (Admin only)
router.post('/categories', async (req, res) => {
  try {
    const category = await Category.create(req.body);

    await logActivity({
      type: 'category_created',
      description: `Category "${category.name}" was created by admin`,
      userId: req.user.id,
      metadata: { categoryName: category.name, categoryId: category.id }
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    // Removed console.error'Admin create category error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// @route   PUT /api/admin/categories/:id
// @desc    Update category (admin)
// @access  Private (Admin only)
router.put('/categories/:id', async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    await category.update(req.body);

    await logActivity({
      type: 'category_updated',
      description: `Category "${category.name}" was updated by admin`,
      userId: req.user.id,
      metadata: { categoryName: category.name, categoryId: category.id }
    });

    res.json({
      success: true,
      message: 'Category updated successfully',
      category
    });
  } catch (error) {
    // Removed console.error'Admin update category error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/admin/categories/:id
// @desc    Delete category (admin)
// @access  Private (Admin only)
router.delete('/categories/:id', async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    await category.destroy();

    await logActivity({
      type: 'category_deleted',
      description: `Category "${category.name}" was deleted by admin`,
      userId: req.user.id,
      metadata: { categoryName: category.name, categoryId: category.id }
    });

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    // Removed console.error'Admin delete category error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/admin/blogs
// @desc    Get all blogs (admin)
// @access  Private (Admin only)
router.get('/blogs', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { count, rows: blogs } = await Blog.findAndCountAll({
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.json({
      success: true,
      count: blogs.length,
      total: count,
      page,
      pages: Math.ceil(count / limit),
      blogs
    });
  } catch (error) {
    // Removed console.error'Admin get blogs error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/admin/blogs
// @desc    Create blog (admin)
// @access  Private (Admin only)
router.post('/blogs', async (req, res) => {
  try {
    const blog = await Blog.create(req.body);

    await logActivity({
      type: 'blog_created',
      description: `Blog "${blog.title}" was created by admin`,
      userId: req.user.id,
      metadata: { blogTitle: blog.title, blogId: blog.id }
    });

    res.status(201).json({
      success: true,
      message: 'Blog created successfully',
      blog
    });
  } catch (error) {
    // Removed console.error'Admin create blog error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// @route   PUT /api/admin/blogs/:id
// @desc    Update blog (admin)
// @access  Private (Admin only)
router.put('/blogs/:id', async (req, res) => {
  try {
    const blog = await Blog.findByPk(req.params.id);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    await blog.update(req.body);

    await logActivity({
      type: 'blog_updated',
      description: `Blog "${blog.title}" was updated by admin`,
      userId: req.user.id,
      metadata: { blogTitle: blog.title, blogId: blog.id }
    });

    res.json({
      success: true,
      message: 'Blog updated successfully',
      blog
    });
  } catch (error) {
    // Removed console.error'Admin update blog error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/admin/blogs/:id
// @desc    Delete blog (admin)
// @access  Private (Admin only)
router.delete('/blogs/:id', async (req, res) => {
  try {
    const blog = await Blog.findByPk(req.params.id);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    await blog.destroy();

    await logActivity({
      type: 'blog_deleted',
      description: `Blog "${blog.title}" was deleted by admin`,
      userId: req.user.id,
      metadata: { blogTitle: blog.title, blogId: blog.id }
    });

    res.json({
      success: true,
      message: 'Blog deleted successfully'
    });
  } catch (error) {
    // Removed console.error'Admin delete blog error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/admin/contacts
// @desc    Get all contacts (admin)
// @access  Private (Admin only)
router.get('/contacts', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { count, rows: contacts } = await Contact.findAndCountAll({
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.json({
      success: true,
      count: contacts.length,
      total: count,
      page,
      pages: Math.ceil(count / limit),
      contacts
    });
  } catch (error) {
    // Removed console.error'Admin get contacts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/admin/contacts/:id
// @desc    Update contact status (admin)
// @access  Private (Admin only)
router.put('/contacts/:id', async (req, res) => {
  try {
    const contact = await Contact.findByPk(req.params.id);
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    await contact.update(req.body);

    res.json({
      success: true,
      message: 'Contact updated successfully',
      contact
    });
  } catch (error) {
    // Removed console.error'Admin update contact error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/admin/contacts/:id
// @desc    Delete contact (admin)
// @access  Private (Admin only)
router.delete('/contacts/:id', async (req, res) => {
  try {
    const contact = await Contact.findByPk(req.params.id);
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    await contact.destroy();

    res.json({
      success: true,
      message: 'Contact deleted successfully'
    });
  } catch (error) {
    // Removed console.error'Admin delete contact error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/admin/activities
// @desc    Get all activities (admin)
// @access  Private (Admin only)
router.get('/activities', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const { count, rows: activities } = await Activity.findAndCountAll({
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'], required: false }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.json({
      success: true,
      count: activities.length,
      total: count,
      page,
      pages: Math.ceil(count / limit),
      activities
    });
  } catch (error) {
    // Removed console.error'Admin get activities error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/admin/subcategories
// @desc    Get all subcategories (admin)
// @access  Private (Admin only)
router.get('/subcategories', async (req, res) => {
  try {
    const subcategories = await SubCategory.findAll({
      include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
      order: [['categoryId', 'ASC'], ['order', 'ASC'], ['name', 'ASC']]
    });

    res.json({
      success: true,
      count: subcategories.length,
      subcategories
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/admin/subcategories
// @desc    Create subcategory (admin)
// @access  Private (Admin only)
router.post('/subcategories', async (req, res) => {
  try {
    const subcategory = await SubCategory.create(req.body);

    await logActivity({
      type: 'subcategory_created',
      description: `Subcategory "${subcategory.name}" was created by admin`,
      userId: req.user.id,
      metadata: { subcategoryName: subcategory.name, subcategoryId: subcategory.id }
    });

    res.status(201).json({
      success: true,
      message: 'Subcategory created successfully',
      subcategory
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// @route   PUT /api/admin/subcategories/:id
// @desc    Update subcategory (admin)
// @access  Private (Admin only)
router.put('/subcategories/:id', async (req, res) => {
  try {
    const subcategory = await SubCategory.findByPk(req.params.id);
    if (!subcategory) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }

    await subcategory.update(req.body);

    res.json({
      success: true,
      message: 'Subcategory updated successfully',
      subcategory
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/admin/subcategories/:id
// @desc    Delete subcategory (admin)
// @access  Private (Admin only)
router.delete('/subcategories/:id', async (req, res) => {
  try {
    const subcategory = await SubCategory.findByPk(req.params.id);
    if (!subcategory) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }

    await subcategory.destroy();

    res.json({
      success: true,
      message: 'Subcategory deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/admin/reviews/request
// @desc    Send review request to customer
// @access  Private (Admin only)
router.post('/reviews/request', async (req, res) => {
  try {
    const { businessId, customerEmail, customerName } = req.body;

    if (!businessId || !customerEmail) {
      return res.status(400).json({ error: 'Business ID and customer email are required' });
    }

    const business = await Business.findByPk(businessId);
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    // Generate unique token for review link
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Create review request record
    const reviewRequest = await ReviewRequest.create({
      businessId,
      customerEmail,
      customerName: customerName || '',
      token,
      expiresAt,
      requestedBy: req.user.id,
      status: 'sent',
      sentAt: new Date()
    });

    // Send email to customer
    const sendEmail = require('../utils/sendEmail');
    const reviewLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/write-review?token=${token}&business=${businessId}`;
    
    await sendEmail({
      to: customerEmail,
      subject: `We'd love your feedback on ${business.name}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Share Your Experience!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Your feedback helps others make informed decisions</p>
          </div>
          <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              Hi${customerName ? ` ${customerName}` : ''},
            </p>
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              We hope you had a great experience with <strong>${business.name}</strong>! We'd really appreciate it if you could take a moment to share your feedback.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${reviewLink}" 
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; 
                        font-weight: 600; font-size: 16px;">
                Write a Review
              </a>
            </div>
            <p style="color: #7f8c8d; font-size: 14px; margin-top: 30px; text-align: center;">
              This link will expire in 30 days. Thank you for your time!
            </p>
          </div>
        </div>
      `
    });

    await logActivity({
      type: 'review_request_sent',
      description: `Review request sent to ${customerEmail} for "${business.name}"`,
      userId: req.user.id,
      metadata: { businessId, customerEmail, businessName: business.name }
    });

    res.json({
      success: true,
      message: 'Review request sent successfully',
      reviewRequest
    });
  } catch (error) {
    console.error('Send review request error:', error);
    res.status(500).json({ error: 'Failed to send review request' });
  }
});

// @route   GET /api/admin/review-requests
// @desc    Get all review requests
// @access  Private (Admin only)
router.get('/review-requests', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { count, rows: requests } = await ReviewRequest.findAndCountAll({
      include: [
        { model: Business, as: 'business', attributes: ['id', 'name'] },
        { model: User, as: 'requester', attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.json({
      success: true,
      count: requests.length,
      total: count,
      page,
      pages: Math.ceil(count / limit),
      requests
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

