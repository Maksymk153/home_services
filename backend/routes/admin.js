const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { User, Business, Review, Category, Contact, Activity, Blog } = require('../models');
const { protect, authorize } = require('../middleware/auth');
const logActivity = require('../utils/logActivity');

// All routes require admin access
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
        attributes: ['id', 'name', 'email', 'createdAt']
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
    console.error('Get stats error:', error);
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
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/admin/businesses/:id/approve
// @desc    Approve business
// @access  Private (Admin only)
router.put('/businesses/:id/approve', async (req, res) => {
  try {
    const business = await Business.findByPk(req.params.id);
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }

    await business.update({ isActive: true, isVerified: true });

    await logActivity({
      type: 'business_approved',
      description: `Business "${business.name}" was approved by admin`,
      userId: req.user.id,
      metadata: { businessName: business.name, businessId: business.id }
    });

    res.json({
      success: true,
      message: 'Business approved successfully',
      business
    });
  } catch (error) {
    console.error('Approve business error:', error);
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
    console.error('Approve review error:', error);
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
    console.error('Admin get categories error:', error);
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
    console.error('Admin get users error:', error);
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
    console.error('Admin update user error:', error);
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
    console.error('Admin delete user error:', error);
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
    console.error('Admin get reviews error:', error);
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
    console.error('Admin delete review error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PUT /api/admin/businesses/:id
// @desc    Update business (admin)
// @access  Private (Admin only)
router.put('/businesses/:id', async (req, res) => {
  try {
    const business = await Business.findByPk(req.params.id);
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
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
    res.status(500).json({ error: 'Server error' });
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
    console.error('Admin delete business error:', error);
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
    console.error('Admin create category error:', error);
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
    console.error('Admin update category error:', error);
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
    console.error('Admin delete category error:', error);
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
    console.error('Admin get blogs error:', error);
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
    console.error('Admin create blog error:', error);
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
    console.error('Admin update blog error:', error);
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
    console.error('Admin delete blog error:', error);
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
    console.error('Admin get contacts error:', error);
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
    console.error('Admin update contact error:', error);
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
    console.error('Admin delete contact error:', error);
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
    console.error('Admin get activities error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

