const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Business, Category, User } = require('../models');
const { protect, optionalAuth } = require('../middleware/auth');
const logActivity = require('../utils/logActivity');

// @route   GET /api/businesses
// @desc    Get all businesses
// @access  Public
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const where = { isActive: true };

    // Search by name or description
    if (req.query.search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${req.query.search}%` } },
        { description: { [Op.like]: `%${req.query.search}%` } }
      ];
    }

    // Filter by category
    if (req.query.category) {
      where.categoryId = req.query.category;
    }

    // Filter by city
    if (req.query.city) {
      where.city = { [Op.like]: `%${req.query.city}%` };
    }
    
    // Filter by state
    if (req.query.state) {
      where.state = req.query.state;
    }

    // Filter by rating
    if (req.query.minRating) {
      where.ratingAverage = { [Op.gte]: parseFloat(req.query.minRating) };
    }

    // Featured only
    if (req.query.featured === 'true') {
      where.isFeatured = true;
    }

    const { count, rows: businesses } = await Business.findAndCountAll({
      where,
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug', 'icon'] },
        { model: User, as: 'owner', attributes: ['id', 'name', 'email'] }
      ],
      order: [
        ['isFeatured', 'DESC'],
        ['ratingAverage', 'DESC'],
        ['ratingCount', 'DESC'],
        ['createdAt', 'DESC']
      ],
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
    console.error('Get businesses error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/businesses/:id
// @desc    Get single business
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const business = await Business.findByPk(req.params.id, {
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug', 'icon'] },
        { model: User, as: 'owner', attributes: ['id', 'name', 'email'] }
      ]
    });

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    // Increment views
    await business.incrementViews();

    res.json({
      success: true,
      business
    });
  } catch (error) {
    console.error('Get business error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/businesses
// @desc    Create a business
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    // Validate category exists
    if (!req.body.categoryId) {
      return res.status(400).json({ 
        success: false,
        error: 'Please select a valid category' 
      });
    }
    
    const category = await Category.findByPk(req.body.categoryId);
    if (!category) {
      return res.status(400).json({ 
        success: false,
        error: 'Selected category does not exist' 
      });
    }
    
    // Validate required fields
    if (!req.body.name || !req.body.description) {
      return res.status(400).json({ 
        success: false,
        error: 'Business name and description are required' 
      });
    }
    
    if (!req.body.address || !req.body.city || !req.body.state) {
      return res.status(400).json({ 
        success: false,
        error: 'Address, city, and state are required' 
      });
    }
    
    if (!req.body.phone) {
      return res.status(400).json({ 
        success: false,
        error: 'Phone number is required' 
      });
    }
    
    // Generate slug from business name
    const generateSlug = (name) => {
      return name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim() + '-' + Date.now();
    };
    
    const slug = generateSlug(req.body.name);
    
    // Create business
    const business = await Business.create({
      name: req.body.name,
      slug: slug,
      description: req.body.description,
      categoryId: req.body.categoryId,
      ownerId: req.user.id,
      address: req.body.address,
      city: req.body.city,
      state: req.body.state,
      zipCode: req.body.zipCode || null,
      country: req.body.country || 'USA',
      phone: req.body.phone,
      email: req.body.email || null,
      website: req.body.website || null,
      hours: req.body.hours || null,
      isActive: false, // New businesses need approval
      isVerified: false,
      tags: req.body.tags || null
    });

    // Update user role to business_owner
    await User.update(
      { role: 'business_owner', businessId: business.id },
      { where: { id: req.user.id } }
    );

    // Log activity
    await logActivity({
      type: 'business_submitted',
      description: `New business "${business.name}" was submitted for approval`,
      userId: req.user.id,
      metadata: { businessName: business.name, ownerName: req.user.name, businessId: business.id }
    });

    res.status(201).json({
      success: true,
      message: 'Business created successfully. It will be reviewed and approved soon.',
      business
    });
  } catch (error) {
    console.error('Create business error:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to create business'
    });
  }
});

// @route   PUT /api/businesses/:id
// @desc    Update business
// @access  Private (Owner or Admin)
router.put('/:id', protect, async (req, res) => {
  try {
    const business = await Business.findByPk(req.params.id);

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    // Check ownership
    if (business.ownerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this business' });
    }

    // Update business
    await business.update(req.body);

    res.json({
      success: true,
      message: 'Business updated successfully',
      business
    });
  } catch (error) {
    console.error('Update business error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/businesses/:id
// @desc    Delete business
// @access  Private (Owner or Admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const business = await Business.findByPk(req.params.id);

    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    // Check ownership
    if (business.ownerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this business' });
    }

    await business.destroy();

    res.json({
      success: true,
      message: 'Business deleted successfully'
    });
  } catch (error) {
    console.error('Delete business error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

