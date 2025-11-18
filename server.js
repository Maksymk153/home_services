const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const businessRoutes = require('./routes/businesses');
const categoryRoutes = require('./routes/categories');
const reviewRoutes = require('./routes/reviews');
const blogRoutes = require('./routes/blogs');
const adminRoutes = require('./routes/admin');
const searchRoutes = require('./routes/search');
const contactRoutes = require('./routes/contact');

// Initialize Express app
const app = express();

// Security middleware - Configure CSP (no unsafe-inline since all scripts are external)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "https://cdnjs.cloudflare.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"]
        }
    }
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
    max: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Serve static files (frontend)
app.use(express.static(path.join(__dirname)));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/contact', contactRoutes);

// Admin panel route
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// Root route serves the main website
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Database connection
const connectDB = async () => {
    try {
        // Get MongoDB URI from environment or use local MongoDB as default
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/citylocal101';
        
        // Remove deprecated options - they're no longer needed in Mongoose 8+
        const conn = await mongoose.connect(mongoURI);
        
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📊 Database: ${conn.connection.name}`);
    } catch (error) {
        console.error(`\n❌ MongoDB Connection Error: ${error.message}\n`);
        
        // Provide helpful error messages based on the error type
        if (error.message.includes('IP') || error.message.includes('whitelist')) {
            console.error('⚠️  MongoDB Atlas IP Whitelist Issue:');
            console.error('   1. Go to: https://cloud.mongodb.com/');
            console.error('   2. Select your cluster → Security → Network Access');
            console.error('   3. Click "Add IP Address" and add your current IP');
            console.error('   4. Or use "0.0.0.0/0" for development (not recommended for production)\n');
        } else if (error.message.includes('authentication')) {
            console.error('⚠️  MongoDB Authentication Error:');
            console.error('   Check your MONGODB_URI connection string in .env file');
            console.error('   Format: mongodb+srv://username:password@cluster.mongodb.net/database\n');
        } else if (error.message.includes('ECONNREFUSED')) {
            console.error('⚠️  Local MongoDB Connection Refused:');
            console.error('   1. Make sure MongoDB is installed and running');
            console.error('   2. Start MongoDB service:');
            console.error('      - Windows: net start MongoDB');
            console.error('      - Mac/Linux: sudo systemctl start mongod');
            console.error('   3. Or install MongoDB Community Edition: https://www.mongodb.com/try/download/community\n');
        } else {
            console.error('⚠️  Troubleshooting Tips:');
            console.error('   1. Check if MONGODB_URI is set correctly in .env file');
            console.error('   2. Verify MongoDB server is running');
            console.error('   3. Check network connectivity\n');
        }
        
        console.error('💡 For local development, you can use: mongodb://localhost:27017/citylocal101');
        console.error('💡 Or set MONGODB_URI in your .env file\n');
        
        process.exit(1);
    }
};

// Start server
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`\n🚀 Server running on port ${PORT}`);
        console.log(`🌐 Website: http://localhost:${PORT}`);
        console.log(`🔧 Admin Panel: http://localhost:${PORT}/admin`);
        console.log(`📡 API: http://localhost:${PORT}/api`);
        console.log(`🔒 Environment: ${process.env.NODE_ENV || 'development'}\n`);
    });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.log('Unhandled Rejection! Shutting down...');
    console.error(err);
    process.exit(1);
});

module.exports = app;

