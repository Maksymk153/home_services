const express = require('express');
const router = express.Router();
const Business = require('../models/Business');
const Category = require('../models/Category');

// @route   GET /api/search
// @desc    Search businesses
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { q, category, city, state, minRating, sort } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        let query = { isActive: true };

        // Search by name or description
        if (q) {
            query.$or = [
                { name: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
                { tags: { $in: [new RegExp(q, 'i')] } }
            ];
        }

        // Filter by category
        if (category) {
            query.category = category;
        }

        // Filter by location
        if (city) {
            query['location.city'] = new RegExp(city, 'i');
        }
        if (state) {
            query['location.state'] = new RegExp(state, 'i');
        }

        // Filter by rating
        if (minRating) {
            query['rating.average'] = { $gte: parseFloat(minRating) };
        }

        // Sorting
        let sortOption = '-createdAt';
        if (sort === 'rating') {
            sortOption = '-rating.average -rating.count';
        } else if (sort === 'name') {
            sortOption = 'name';
        } else if (sort === 'views') {
            sortOption = '-views';
        }

        const businesses = await Business.find(query)
            .populate('category', 'name slug icon')
            .sort(sortOption)
            .skip(skip)
            .limit(limit);

        const total = await Business.countDocuments(query);

        res.json({
            success: true,
            count: businesses.length,
            total,
            page,
            pages: Math.ceil(total / limit),
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
        const businesses = await Business.find({
            name: { $regex: q, $options: 'i' },
            isActive: true
        })
        .select('name slug')
        .limit(5);

        // Search in categories
        const categories = await Category.find({
            name: { $regex: q, $options: 'i' },
            isActive: true
        })
        .select('name slug icon')
        .limit(5);

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

