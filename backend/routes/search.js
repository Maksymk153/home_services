const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Business, Category } = require('../models');

// @route   GET /api/search
// @desc    Search businesses
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { q, category, city, state, minRating, sort } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const where = { isActive: true };

    // Search by name or description
    if (q) {
      where[Op.or] = [
        { name: { [Op.like]: `%${q}%` } },
        { description: { [Op.like]: `%${q}%` } }
      ];
    }

    // Filter by category
    if (category) {
      where.categoryId = category;
    }

    // Filter by location
    if (city) {
      where.city = { [Op.like]: `%${city}%` };
    }
    if (state) {
      where.state = { [Op.like]: `%${state}%` };
    }

    // Filter by rating
    if (minRating) {
      where.ratingAverage = { [Op.gte]: parseFloat(minRating) };
    }

    // Sorting
    let order = [['createdAt', 'DESC']];
    if (sort === 'rating') {
      order = [['ratingAverage', 'DESC'], ['ratingCount', 'DESC']];
    } else if (sort === 'name') {
      order = [['name', 'ASC']];
    } else if (sort === 'views') {
      order = [['views', 'DESC']];
    }

    const { count, rows: businesses } = await Business.findAndCountAll({
      where,
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug', 'icon'] }
      ],
      order,
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
    console.error('Search error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/search/suggestions
// @desc    Get search suggestions
// @access  Public
router.get('/suggestions', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json({ success: true, suggestions: [] });
    }

    // Search in business names
    const businesses = await Business.findAll({
      where: {
        name: { [Op.like]: `%${q}%` },
        isActive: true
      },
      attributes: ['id', 'name', 'slug'],
      limit: 5
    });

    // Search in categories
    const categories = await Category.findAll({
      where: {
        name: { [Op.like]: `%${q}%` },
        isActive: true
      },
      attributes: ['id', 'name', 'slug', 'icon'],
      limit: 5
    });

    const suggestions = [
      ...categories.map(cat => ({
        type: 'category',
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon
      })),
      ...businesses.map(biz => ({
        type: 'business',
        name: biz.name,
        slug: biz.slug,
        icon: 'building'
      }))
    ];

    res.json({
      success: true,
      suggestions
    });
  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

