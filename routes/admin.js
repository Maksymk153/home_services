const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Business = require('../models/Business');
const Review = require('../models/Review');
const Category = require('../models/Category');
const Contact = require('../models/Contact');
const Activity = require('../models/Activity');
const Blog = require('../models/Blog');
const { protect, authorize } = require('../middleware/auth');
const logActivity = require('../utils/logActivity');

// All routes require admin access
router.use(protect, authorize('admin'));

// @route   GET /api/admin/categories
// @desc    Get all categories (including inactive) with business counts
// @access  Private (Admin only)
router.get('/categories', async (req, res) => {
    try {
        const categories = await Category.find().sort('order name').lean();

        const businessCounts = await Business.aggregate([
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
            businessCount: countMap.get(category._id.toString()) || category.businessCount || 0
        }));

        res.json({
            success: true,
            count: responseCategories.length,
            categories: responseCategories
        });
    } catch (error) {
        console.error('Admin get categories error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET /api/admin/stats
// @desc    Get dashboard statistics
// @access  Private (Admin only)
router.get('/stats', async (req, res) => {
    try {
        const stats = {
            users: await User.countDocuments(),
            businesses: await Business.countDocuments(),
            activeBusinesses: await Business.countDocuments({ isActive: true }),
            pendingBusinesses: await Business.countDocuments({ isActive: false }),
            reviews: await Review.countDocuments(),
            categories: await Category.countDocuments(),
            contacts: await Contact.countDocuments(),
            unreadContacts: await Contact.countDocuments({ isRead: false }),
            recentUsers: await User.find().sort('-createdAt').limit(5).select('name email createdAt'),
            recentBusinesses: await Business.find().sort('-createdAt').limit(5).populate('category', 'name'),
            recentReviews: await Review.find().sort('-createdAt').limit(5).populate('user business', 'name'),
            recentContacts: await Contact.find().sort('-createdAt').limit(5)
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

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private (Admin only)
router.get('/users', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const users = await User.find()
            .select('-password')
            .sort('-createdAt')
            .skip(skip)
            .limit(limit);

        const total = await User.countDocuments();

        res.json({
            success: true,
            count: users.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            users
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user
// @access  Private (Admin only)
router.put('/users/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            {
                name: req.body.name,
                email: req.body.email,
                role: req.body.role,
                isActive: req.body.isActive
            },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            success: true,
            message: 'User updated successfully',
            user
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Private (Admin only)
router.delete('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Prevent deleting yourself
        if (user._id.toString() === req.user.id) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        const userName = user.name;
        await User.findByIdAndDelete(req.params.id);

        // Log activity
        await logActivity({
            type: 'user_deleted',
            description: `User "${userName}" was deleted by admin`,
            user: req.user.id,
            metadata: { deletedUserName: userName, deletedUserEmail: user.email }
        });

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET /api/admin/businesses
// @desc    Get all businesses (including inactive)
// @access  Private (Admin only)
router.get('/businesses', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const businesses = await Business.find()
            .populate('category', 'name')
            .populate('owner', 'name email')
            .sort('-createdAt')
            .skip(skip)
            .limit(limit);

        const total = await Business.countDocuments();

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

// @route   GET /api/admin/blogs
// @desc    Get all blog posts (including unpublished)
// @access  Private (Admin only)
router.get('/blogs', async (req, res) => {
    try {
        const blogs = await Blog.find().sort('-createdAt');
        res.json({
            success: true,
            count: blogs.length,
            blogs
        });
    } catch (error) {
        console.error('Get blogs error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST /api/admin/blogs
// @desc    Create a new blog post
// @access  Private (Admin only)
router.post('/blogs', async (req, res) => {
    try {
        const {
            title,
            summary,
            content,
            coverImage,
            author,
            tags,
            isPublished
        } = req.body;

        if (!title || !summary || !content) {
            return res.status(400).json({ error: 'Title, summary, and content are required' });
        }

        const blog = await Blog.create({
            title,
            summary,
            content,
            coverImage,
            author,
            tags,
            isPublished: Boolean(isPublished)
        });

        await logActivity({
            type: 'blog_created',
            description: `Blog "${blog.title}" was created by admin`,
            user: req.user.id,
            metadata: { blogTitle: blog.title }
        });

        res.status(201).json({
            success: true,
            message: 'Blog post created successfully',
            blog
        });
    } catch (error) {
        console.error('Create blog error:', error);
        if (error.code === 11000) {
            return res.status(400).json({ error: 'A blog post with this title already exists' });
        }
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   PUT /api/admin/blogs/:id
// @desc    Update a blog post
// @access  Private (Admin only)
router.put('/blogs/:id', async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json({ error: 'Blog post not found' });
        }

        const updatableFields = ['title', 'summary', 'content', 'coverImage', 'author', 'tags', 'isPublished'];
        updatableFields.forEach(field => {
            if (req.body[field] !== undefined) {
                blog[field] = req.body[field];
            }
        });

        await blog.save();

        await logActivity({
            type: 'blog_updated',
            description: `Blog "${blog.title}" was updated by admin`,
            user: req.user.id,
            metadata: { blogTitle: blog.title }
        });

        res.json({
            success: true,
            message: 'Blog post updated successfully',
            blog
        });
    } catch (error) {
        console.error('Update blog error:', error);
        if (error.code === 11000) {
            return res.status(400).json({ error: 'A blog post with this title already exists' });
        }
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   DELETE /api/admin/blogs/:id
// @desc    Delete a blog post
// @access  Private (Admin only)
router.delete('/blogs/:id', async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json({ error: 'Blog post not found' });
        }

        const blogTitle = blog.title;
        await blog.deleteOne();

        await logActivity({
            type: 'blog_deleted',
            description: `Blog "${blogTitle}" was deleted by admin`,
            user: req.user.id,
            metadata: { blogTitle }
        });

        res.json({
            success: true,
            message: 'Blog post deleted successfully'
        });
    } catch (error) {
        console.error('Delete blog error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST /api/admin/businesses
// @desc    Create a business as admin
// @access  Private (Admin only)
router.post('/businesses', async (req, res) => {
    try {
        const {
            name,
            description,
            category,
            location = {},
            contact = {},
            isActive,
            isFeatured,
            isVerified,
            tags,
            hours,
            owner
        } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Business name is required' });
        }

        if (!description || !description.trim()) {
            return res.status(400).json({ error: 'Business description is required' });
        }

        if (!category) {
            return res.status(400).json({ error: 'Category is required' });
        }

        const categoryDoc = await Category.findById(category);
        if (!categoryDoc) {
            return res.status(400).json({ error: 'Selected category does not exist' });
        }

        if (!location.address || !location.city || !location.state) {
            return res.status(400).json({ error: 'Address, city, and state are required' });
        }

        if (!contact.phone || !contact.phone.trim()) {
            return res.status(400).json({ error: 'Phone number is required' });
        }

        const businessData = {
            name: name.trim(),
            description: description.trim(),
            category,
            location: {
                address: location.address.trim(),
                city: location.city.trim(),
                state: location.state.trim(),
                zipCode: location.zipCode ? location.zipCode.trim() : undefined,
                country: location.country ? location.country.trim() : 'USA',
                coordinates: location.coordinates
            },
            contact: {
                phone: contact.phone.trim(),
                email: contact.email ? contact.email.trim() : undefined,
                website: contact.website ? contact.website.trim() : undefined
            },
            isActive: typeof isActive === 'boolean' ? isActive : true,
            isFeatured: Boolean(isFeatured),
            isVerified: Boolean(isVerified),
            tags,
            hours,
            owner: owner || null
        };

        if (!businessData.contact.email) {
            delete businessData.contact.email;
        }

        if (!businessData.contact.website) {
            delete businessData.contact.website;
        }

        if (!businessData.location.zipCode) {
            delete businessData.location.zipCode;
        }

        const business = await Business.create(businessData);

        if (owner) {
            await User.findByIdAndUpdate(owner, {
                role: 'business_owner',
                businessId: business._id
            }, { new: true, runValidators: false });
        }

        const businessCount = await Business.countDocuments({ category });
        await Category.findByIdAndUpdate(category, { businessCount });

        await logActivity({
            type: 'business_created',
            description: `Business "${business.name}" was created by admin`,
            user: req.user.id,
            business: business._id,
            metadata: { businessName: business.name }
        });

        res.status(201).json({
            success: true,
            message: 'Business created successfully',
            business
        });
    } catch (error) {
        console.error('Admin create business error:', error);

        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ error: errors.join(', ') });
        }

        if (error.code === 11000) {
            return res.status(400).json({ error: 'A business with this name already exists' });
        }

        res.status(500).json({ error: 'Server error while creating business' });
    }
});

// @route   PUT /api/admin/businesses/:id/approve
// @desc    Approve/activate business
// @access  Private (Admin only)
router.put('/businesses/:id/approve', async (req, res) => {
    try {
        const business = await Business.findByIdAndUpdate(
            req.params.id,
            { 
                isActive: true,
                isVerified: true
            },
            { new: true }
        ).populate('category', 'name');

        if (!business) {
            return res.status(404).json({ error: 'Business not found' });
        }

        // Log activity
        await logActivity({
            type: 'business_approved',
            description: `Business "${business.name}" was approved by admin`,
            user: req.user.id,
            business: business._id,
            metadata: { businessName: business.name }
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

// @route   PUT /api/admin/businesses/:id/feature
// @desc    Feature/unfeature business
// @access  Private (Admin only)
router.put('/businesses/:id/feature', async (req, res) => {
    try {
        const business = await Business.findById(req.params.id);

        if (!business) {
            return res.status(404).json({ error: 'Business not found' });
        }

        const wasFeatured = business.isFeatured;
        business.isFeatured = !business.isFeatured;
        await business.save();

        // Log activity
        await logActivity({
            type: 'business_featured',
            description: `Business "${business.name}" was ${business.isFeatured ? 'featured' : 'unfeatured'} by admin`,
            user: req.user.id,
            business: business._id,
            metadata: { businessName: business.name, isFeatured: business.isFeatured }
        });

        res.json({
            success: true,
            message: `Business ${business.isFeatured ? 'featured' : 'unfeatured'} successfully`,
            business
        });
    } catch (error) {
        console.error('Feature business error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   DELETE /api/admin/businesses/:id
// @desc    Delete business (Admin only)
// @access  Private (Admin only)
router.delete('/businesses/:id', async (req, res) => {
    try {
        const business = await Business.findById(req.params.id);

        if (!business) {
            return res.status(404).json({ error: 'Business not found' });
        }

        const businessName = business.name;
        await Business.findByIdAndDelete(req.params.id);

        // Log activity
        await logActivity({
            type: 'business_deleted',
            description: `Business "${businessName}" was deleted by admin`,
            user: req.user.id,
            metadata: { businessName }
        });

        res.json({
            success: true,
            message: 'Business deleted successfully'
        });
    } catch (error) {
        console.error('Delete business error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET /api/admin/reviews
// @desc    Get all reviews (including unapproved)
// @access  Private (Admin only)
router.get('/reviews', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const reviews = await Review.find()
            .populate('user', 'name email')
            .populate('business', 'name')
            .sort('-createdAt')
            .skip(skip)
            .limit(limit);

        const total = await Review.countDocuments();

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

// @route   PUT /api/admin/reviews/:id/approve
// @desc    Approve review
// @access  Private (Admin only)
router.put('/reviews/:id/approve', async (req, res) => {
    try {
        const review = await Review.findByIdAndUpdate(
            req.params.id,
            { isApproved: true },
            { new: true }
        ).populate('business', 'name').populate('user', 'name');

        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }

        // Log activity
        await logActivity({
            type: 'review_approved',
            description: `Review for "${review.business?.name || 'Business'}" was approved by admin`,
            user: req.user.id,
            review: review._id,
            business: review.business?._id,
            metadata: { businessName: review.business?.name, reviewerName: review.user?.name }
        });

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

// @route   DELETE /api/admin/reviews/:id
// @desc    Delete review
// @access  Private (Admin only)
router.delete('/reviews/:id', async (req, res) => {
    try {
        const review = await Review.findById(req.params.id).populate('business', 'name').populate('user', 'name');

        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }

        const businessName = review.business?.name || 'Business';
        await Review.findByIdAndDelete(req.params.id);

        // Log activity
        await logActivity({
            type: 'review_deleted',
            description: `Review for "${businessName}" was deleted by admin`,
            user: req.user.id,
            metadata: { businessName, reviewerName: review.user?.name }
        });

        res.json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET /api/admin/contacts
// @desc    Get all contact submissions
// @access  Private (Admin only)
router.get('/contacts', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const contacts = await Contact.find()
            .sort('-createdAt')
            .skip(skip)
            .limit(limit);

        const total = await Contact.countDocuments();

        res.json({
            success: true,
            count: contacts.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            contacts
        });
    } catch (error) {
        console.error('Get contacts error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   PUT /api/admin/contacts/:id/read
// @desc    Mark contact as read
// @access  Private (Admin only)
router.put('/contacts/:id/read', async (req, res) => {
    try {
        const contact = await Contact.findByIdAndUpdate(
            req.params.id,
            { isRead: true, status: 'read' },
            { new: true }
        );

        if (!contact) {
            return res.status(404).json({ error: 'Contact not found' });
        }

        res.json({
            success: true,
            message: 'Contact marked as read',
            contact
        });
    } catch (error) {
        console.error('Mark contact as read error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   DELETE /api/admin/contacts/:id
// @desc    Delete contact submission
// @access  Private (Admin only)
router.delete('/contacts/:id', async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id);

        if (!contact) {
            return res.status(404).json({ error: 'Contact not found' });
        }

        await Contact.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Contact deleted successfully'
        });
    } catch (error) {
        console.error('Delete contact error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET /api/admin/activities
// @desc    Get recent activities
// @access  Private (Admin only)
router.get('/activities', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;

        const activities = await Activity.find()
            .populate('user', 'name email')
            .populate('business', 'name')
            .populate('review', 'title rating')
            .populate('category', 'name')
            .sort('-createdAt')
            .skip(skip)
            .limit(limit);

        const total = await Activity.countDocuments();

        res.json({
            success: true,
            count: activities.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            activities
        });
    } catch (error) {
        console.error('Get activities error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;

