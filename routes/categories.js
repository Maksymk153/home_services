const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Business = require('../models/Business');
const { protect, authorize } = require('../middleware/auth');
const logActivity = require('../utils/logActivity');

// @route   GET /api/categories
// @desc    Get all categories
// @access  Public
router.get('/', async (req, res) => {
    try {
        const includeInactive = req.query.includeInactive === 'true';
        const filter = includeInactive ? {} : { isActive: true };

        const categories = await Category.find(filter)
            .sort('order name')
            .lean();

        const businessMatch = {
            category: { $ne: null }
        };

        if (!includeInactive) {
            businessMatch.isActive = true;
        }

        const businessCounts = await Business.aggregate([
            { $match: businessMatch },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            }
        ]);

        const countMap = new Map(
            businessCounts
                .filter(item => item._id)
                .map(item => [item._id.toString(), item.count])
        );

        const responseCategories = categories.map(category => ({
            ...category,
            businessCount: countMap.get(category._id.toString()) || 0
        }));

        res.json({
            success: true,
            count: responseCategories.length,
            categories: responseCategories
        });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET /api/categories/:id
// @desc    Get single category
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        // Get businesses in this category
        const businesses = await Business.find({ 
            category: category._id,
            isActive: true 
        }).limit(10);

        res.json({
            success: true,
            category,
            businesses
        });
    } catch (error) {
        console.error('Get category error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST /api/categories
// @desc    Create category
// @access  Private (Admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
    try {
        const category = await Category.create(req.body);

        // Log activity
        await logActivity({
            type: 'category_created',
            description: `Category "${category.name}" was created by admin`,
            user: req.user.id,
            category: category._id,
            metadata: { categoryName: category.name }
        });

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            category
        });
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   PUT /api/categories/:id
// @desc    Update category
// @access  Private (Admin only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const category = await Category.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        // Log activity
        await logActivity({
            type: 'category_updated',
            description: `Category "${category.name}" was updated by admin`,
            user: req.user.id,
            category: category._id,
            metadata: { categoryName: category.name }
        });

        res.json({
            success: true,
            message: 'Category updated successfully',
            category
        });
    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   DELETE /api/categories/:id
// @desc    Delete category
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        // Check if category has businesses
        const businessCount = await Business.countDocuments({ category: category._id });
        
        // If force delete is requested or no businesses exist, proceed
        if (businessCount > 0) {
            // Set businesses to null category (uncategorized)
            await Business.updateMany(
                { category: category._id },
                { $unset: { category: 1 } }
            );
        }

        const categoryName = category.name;
        await Category.findByIdAndDelete(req.params.id);

        // Log activity
        await logActivity({
            type: 'category_deleted',
            description: `Category "${categoryName}" was deleted by admin`,
            user: req.user.id,
            metadata: { categoryName }
        });

        res.json({
            success: true,
            message: 'Category deleted successfully' + (businessCount > 0 ? ` (${businessCount} businesses uncategorized)` : '')
        });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;

