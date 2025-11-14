const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Business = require('../models/Business');
const Category = require('../models/Category');
const User = require('../models/User');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const logActivity = require('../utils/logActivity');

// @route   GET /api/businesses
// @desc    Get all businesses
// @access  Public
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = { isActive: true };

        // Filter by category
        if (req.query.category) {
            query.category = req.query.category;
        }

        // Filter by city
        if (req.query.city) {
            query['location.city'] = new RegExp(req.query.city, 'i');
        }

        // Filter by rating
        if (req.query.minRating) {
            query['rating.average'] = { $gte: parseFloat(req.query.minRating) };
        }

        // Featured only
        if (req.query.featured === 'true') {
            query.isFeatured = true;
        }

        // Sort: Featured businesses first, then by rating, then by date
        // Default sort prioritizes featured and highly rated businesses
        const businesses = await Business.find(query)
            .populate('category', 'name slug icon')
            .sort({ isFeatured: -1, 'rating.average': -1, 'rating.count': -1, createdAt: -1 })
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
        console.error('Get businesses error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET /api/businesses/:id
// @desc    Get single business
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const business = await Business.findById(req.params.id)
            .populate('category', 'name slug icon')
            .populate('owner', 'name email');

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
        console.log('Creating business - User ID:', req.user.id);
        console.log('Request body:', JSON.stringify(req.body, null, 2));
        
        // Validate category exists and is valid ObjectId
        if (!req.body.category || !mongoose.Types.ObjectId.isValid(req.body.category)) {
            return res.status(400).json({ 
                success: false,
                error: 'Please select a valid category' 
            });
        }
        
        const category = await Category.findById(req.body.category);
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
        
        if (!req.body.location || !req.body.location.address || !req.body.location.city || !req.body.location.state) {
            return res.status(400).json({ 
                success: false,
                error: 'Address, city, and state are required' 
            });
        }
        
        if (!req.body.contact || !req.body.contact.phone) {
            return res.status(400).json({ 
                success: false,
                error: 'Phone number is required' 
            });
        }
        
        // Clean up empty optional fields
        if (req.body.contact.email === '') {
            delete req.body.contact.email;
        }
        if (req.body.contact.website === '') {
            delete req.body.contact.website;
        }
        if (req.body.location.zipCode === '') {
            delete req.body.location.zipCode;
        }
        
        // Add user as owner
        req.body.owner = req.user.id;
        
        // Set default values
        req.body.isActive = false; // New businesses need approval
        req.body.isVerified = false;

        console.log('Creating business in database...');
        const business = await Business.create(req.body);
        console.log('Business created successfully:', business._id);

        // Update user role to business_owner (use findByIdAndUpdate to avoid password issues)
        console.log('Updating user role...');
        await User.findByIdAndUpdate(req.user.id, {
            role: 'business_owner',
            businessId: business._id
        }, { new: true, runValidators: false });
        console.log('User updated successfully');

        // Log activity
        await logActivity({
            type: 'business_submitted',
            description: `New business "${business.name}" was submitted for approval`,
            user: req.user.id,
            business: business._id,
            metadata: { businessName: business.name, ownerName: req.user.name }
        });

        res.status(201).json({
            success: true,
            message: 'Business created successfully. It will be reviewed and approved soon.',
            business
        });
    } catch (error) {
        console.error('Create business error:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        // Send detailed error message
        let errorMessage = 'Failed to create business';
        let statusCode = 500;
        
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            errorMessage = errors.join(', ');
            statusCode = 400;
        } else if (error.code === 11000) {
            errorMessage = 'A business with this name already exists';
            statusCode = 400;
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        res.status(statusCode).json({ 
            success: false,
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? {
                message: error.message,
                name: error.name,
                stack: error.stack
            } : undefined
        });
    }
});

// @route   PUT /api/businesses/:id
// @desc    Update business
// @access  Private (Owner or Admin)
router.put('/:id', protect, async (req, res) => {
    try {
        let business = await Business.findById(req.params.id);

        if (!business) {
            return res.status(404).json({ error: 'Business not found' });
        }

        // Check ownership
        if (business.owner.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized to update this business' });
        }

        business = await Business.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

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
        const business = await Business.findById(req.params.id);

        if (!business) {
            return res.status(404).json({ error: 'Business not found' });
        }

        // Check ownership
        if (business.owner.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized to delete this business' });
        }

        await Business.findByIdAndDelete(req.params.id);

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

