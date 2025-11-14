const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Category = require('../models/Category');
const Business = require('../models/Business');

dotenv.config();

// Categories data (matching the frontend)
const categories = [
    { name: 'Services', icon: 'briefcase', order: 1 },
    { name: 'Accounting & Tax Services', icon: 'calculator', order: 2 },
    { name: 'Arts, Culture & Entertainment', icon: 'palette', order: 3 },
    { name: 'Dentists & Orthodontists', icon: 'tooth', order: 4 },
    { name: 'Insurance', icon: 'shield-alt', order: 5 },
    { name: 'Internet & IT Services', icon: 'laptop', order: 6 },
    { name: 'Lodging & Travel', icon: 'hotel', order: 7 },
    { name: 'Wedding, Events & Meetings', icon: 'heart', order: 8 },
    { name: 'Utilities', icon: 'bolt', order: 9 },
    { name: 'Sports & Recreation', icon: 'football-ball', order: 10 },
    { name: 'Shopping & Retail', icon: 'shopping-bag', order: 11 },
    { name: 'Restaurants & Nightlife', icon: 'utensils', order: 12 },
    { name: 'News & Media', icon: 'newspaper', order: 13 },
    { name: 'Home Improvement & Contractors', icon: 'hammer', order: 14 },
    { name: 'Business Services', icon: 'building', order: 15 },
    { name: 'Real Estate', icon: 'home', order: 16 },
    { name: 'Health & Wellness', icon: 'heartbeat', order: 17 },
    { name: 'Legal Services', icon: 'gavel', order: 18 },
    { name: 'Auto Sales & Service', icon: 'car', order: 19 },
    { name: 'Transportation', icon: 'bus', order: 20 },
    { name: 'Marketing & Advertising', icon: 'chart-line', order: 21 },
    { name: 'Education', icon: 'graduation-cap', order: 22 },
    { name: 'Banking & Finance', icon: 'university', order: 23 },
    { name: 'Beauty & Spa', icon: 'spa', order: 24 },
    { name: 'Community Organizations', icon: 'users', order: 25 },
    { name: 'Pet Services', icon: 'paw', order: 26 }
];

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/citylocal101');
        console.log('✅ MongoDB Connected');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        process.exit(1);
    }
};

const seedDatabase = async () => {
    try {
        console.log('\n🌱 Starting database seeding...\n');

        // Clear existing data
        console.log('🗑️  Clearing existing data...');
        await User.deleteMany({});
        await Category.deleteMany({});
        await Business.deleteMany({});
        console.log('✅ Existing data cleared\n');

        // Create admin user
        console.log('👤 Creating admin user...');
        const admin = await User.create({
            name: 'Admin',
            email: process.env.ADMIN_EMAIL || 'admin@citylocal101.com',
            password: process.env.ADMIN_PASSWORD || 'Admin@123456',
            role: 'admin',
            isActive: true
        });
        console.log(`✅ Admin user created: ${admin.email}`);
        console.log(`   Password: ${process.env.ADMIN_PASSWORD || 'Admin@123456'}\n`);

        // Create categories one by one to ensure slug generation
        console.log('📂 Creating categories...');
        const createdCategories = [];
        for (const categoryData of categories) {
            const category = await Category.create(categoryData);
            createdCategories.push(category);
        }
        console.log(`✅ ${createdCategories.length} categories created\n`);

        // Create sample businesses
        console.log('🏢 Creating sample businesses...');

        const photographyCategory = createdCategories.find(c => c.name === 'Services');
        const plumbingCategory = createdCategories.find(c => c.name === 'Home Improvement & Contractors');
        const autoCategory = createdCategories.find(c => c.name === 'Auto Sales & Service');

        const restaurantCategory = createdCategories.find(c => c.name === 'Restaurants & Nightlife');
        const beautyCategory = createdCategories.find(c => c.name === 'Beauty & Spa');
        const legalCategory = createdCategories.find(c => c.name === 'Legal Services');

        // Keep only 5 businesses as requested
        const sampleBusinesses = [
            {
                name: 'Professional Photography',
                description: 'Need a professional photography service? Look no further, we\'ve got you covered. Professional Photography offers high-quality services for weddings, events, portraits, and more. Our experienced photographers capture your special moments with creativity and precision.',
                category: photographyCategory._id,
                location: {
                    address: '123 Main St',
                    city: 'New York City',
                    state: 'NY',
                    zipCode: '10001',
                    country: 'USA'
                },
                contact: {
                    phone: '(555) 123-4567',
                    email: 'info@professionalphotography.com',
                    website: 'https://professionalphotography.com'
                },
                hours: {
                    monday: { open: '09:00', close: '18:00', closed: false },
                    tuesday: { open: '09:00', close: '18:00', closed: false },
                    wednesday: { open: '09:00', close: '18:00', closed: false },
                    thursday: { open: '09:00', close: '18:00', closed: false },
                    friday: { open: '09:00', close: '18:00', closed: false },
                    saturday: { open: '10:00', close: '16:00', closed: false },
                    sunday: { open: '', close: '', closed: true }
                },
                rating: { average: 4.8, count: 45 },
                isVerified: true,
                isActive: true,
                isFeatured: true,
                tags: ['photography', 'wedding', 'events', 'portraits']
            },
            {
                name: 'Plumb Rite Plumbing',
                description: 'Plumb Rite Plumbing is a professional plumbing service provider dedicated to delivering top-quality solutions for residential and commercial needs. We handle everything from routine repairs to emergency services with expertise and reliability.',
                category: plumbingCategory._id,
                location: {
                    address: '456 Oak Avenue',
                    city: 'Laguna Niguel',
                    state: 'CA',
                    zipCode: '92677',
                    country: 'USA'
                },
                contact: {
                    phone: '(555) 234-5678',
                    email: 'service@plumbrite.com',
                    website: 'https://plumbrite.com'
                },
                hours: {
                    monday: { open: '08:00', close: '17:00', closed: false },
                    tuesday: { open: '08:00', close: '17:00', closed: false },
                    wednesday: { open: '08:00', close: '17:00', closed: false },
                    thursday: { open: '08:00', close: '17:00', closed: false },
                    friday: { open: '08:00', close: '17:00', closed: false },
                    saturday: { open: '09:00', close: '14:00', closed: false },
                    sunday: { open: '', close: '', closed: true }
                },
                rating: { average: 4.9, count: 87 },
                isVerified: true,
                isActive: true,
                isFeatured: true,
                tags: ['plumbing', 'repair', 'installation', 'emergency']
            },
            {
                name: 'Portland Windshields',
                description: 'If you have a broken or damaged auto glass problem which needs to be resolved, then we are the ones to call. Portland Windshields specializes in expert windshield repair and replacement services. We use only the highest quality materials and offer mobile service.',
                category: autoCategory._id,
                location: {
                    address: '789 Pine Street',
                    city: 'Portland',
                    state: 'OR',
                    zipCode: '97201',
                    country: 'USA'
                },
                contact: {
                    phone: '(555) 345-6789',
                    email: 'service@portlandwindshields.com',
                    website: 'https://portlandwindshields.com'
                },
                hours: {
                    monday: { open: '07:00', close: '19:00', closed: false },
                    tuesday: { open: '07:00', close: '19:00', closed: false },
                    wednesday: { open: '07:00', close: '19:00', closed: false },
                    thursday: { open: '07:00', close: '19:00', closed: false },
                    friday: { open: '07:00', close: '19:00', closed: false },
                    saturday: { open: '08:00', close: '17:00', closed: false },
                    sunday: { open: '09:00', close: '15:00', closed: false }
                },
                rating: { average: 4.7, count: 62 },
                isVerified: true,
                isActive: true,
                isFeatured: true,
                tags: ['windshield', 'auto glass', 'repair', 'mobile service']
            },
            {
                name: 'Bella Vista Restaurant',
                description: 'Experience fine dining at its best at Bella Vista Restaurant. We offer an exquisite menu featuring Italian and Mediterranean cuisine, prepared with the freshest ingredients. Our elegant atmosphere and exceptional service make every visit memorable.',
                category: restaurantCategory._id,
                location: {
                    address: '321 Broadway Avenue',
                    city: 'Chicago',
                    state: 'IL',
                    zipCode: '60601',
                    country: 'USA'
                },
                contact: {
                    phone: '(555) 456-7890',
                    email: 'info@bellavista.com',
                    website: 'https://bellavista.com'
                },
                hours: {
                    monday: { open: '11:00', close: '22:00', closed: false },
                    tuesday: { open: '11:00', close: '22:00', closed: false },
                    wednesday: { open: '11:00', close: '22:00', closed: false },
                    thursday: { open: '11:00', close: '22:00', closed: false },
                    friday: { open: '11:00', close: '23:00', closed: false },
                    saturday: { open: '11:00', close: '23:00', closed: false },
                    sunday: { open: '12:00', close: '21:00', closed: false }
                },
                rating: { average: 4.6, count: 124 },
                isVerified: true,
                isActive: true,
                isFeatured: true,
                tags: ['restaurant', 'italian', 'fine dining', 'mediterranean']
            },
            {
                name: 'Serenity Spa & Wellness',
                description: 'Escape the stress of daily life at Serenity Spa & Wellness. We provide a full range of spa services including massages, facials, body treatments, and wellness programs. Our certified therapists use premium products to help you relax, rejuvenate, and restore your natural glow.',
                category: beautyCategory._id,
                location: {
                    address: '654 Wellness Boulevard',
                    city: 'Miami',
                    state: 'FL',
                    zipCode: '33101',
                    country: 'USA'
                },
                contact: {
                    phone: '(555) 567-8901',
                    email: 'bookings@serenityspa.com',
                    website: 'https://serenityspa.com'
                },
                hours: {
                    monday: { open: '09:00', close: '20:00', closed: false },
                    tuesday: { open: '09:00', close: '20:00', closed: false },
                    wednesday: { open: '09:00', close: '20:00', closed: false },
                    thursday: { open: '09:00', close: '20:00', closed: false },
                    friday: { open: '09:00', close: '21:00', closed: false },
                    saturday: { open: '08:00', close: '20:00', closed: false },
                    sunday: { open: '10:00', close: '18:00', closed: false }
                },
                rating: { average: 4.9, count: 98 },
                isVerified: true,
                isActive: true,
                isFeatured: true,
                tags: ['spa', 'massage', 'wellness', 'beauty', 'relaxation']
            },
            {
                name: 'Johnson & Associates Law Firm',
                description: 'Trusted legal representation for over 25 years. Johnson & Associates Law Firm specializes in personal injury, family law, business law, and estate planning. Our experienced attorneys are committed to protecting your rights and achieving the best possible outcomes for your case.',
                category: legalCategory._id,
                location: {
                    address: '987 Justice Plaza',
                    city: 'Boston',
                    state: 'MA',
                    zipCode: '02101',
                    country: 'USA'
                },
                contact: {
                    phone: '(555) 678-9012',
                    email: 'info@johnsonlaw.com',
                    website: 'https://johnsonlaw.com'
                },
                hours: {
                    monday: { open: '08:00', close: '18:00', closed: false },
                    tuesday: { open: '08:00', close: '18:00', closed: false },
                    wednesday: { open: '08:00', close: '18:00', closed: false },
                    thursday: { open: '08:00', close: '18:00', closed: false },
                    friday: { open: '08:00', close: '18:00', closed: false },
                    saturday: { open: '', close: '', closed: true },
                    sunday: { open: '', close: '', closed: true }
                },
                rating: { average: 4.8, count: 76 },
                isVerified: true,
                isActive: true,
                isFeatured: true,
                tags: ['law', 'attorney', 'legal services', 'personal injury', 'family law']
            }
        ].slice(0, 5); // Keep only first 5 businesses

        // Create businesses one by one to ensure unique slugs
        const createdBusinesses = [];
        for (const businessData of sampleBusinesses) {
            const business = await Business.create(businessData);
            createdBusinesses.push(business);
            await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
        }
        console.log(`✅ ${createdBusinesses.length} sample businesses created\n`);

        console.log('🎉 Database seeding completed successfully!\n');
        console.log('='.repeat(60));
        console.log('📝 IMPORTANT INFORMATION:');
        console.log('='.repeat(60));
        console.log(`\n🔐 Admin Login Credentials:`);
        console.log(`   Email: ${admin.email}`);
        console.log(`   Password: ${process.env.ADMIN_PASSWORD || 'Admin@123456'}`);
        console.log(`\n🌐 Access Points:`);
        console.log(`   Website: http://localhost:${process.env.PORT || 5000}`);
        console.log(`   Admin Panel: http://localhost:${process.env.PORT || 5000}/admin`);
        console.log(`   API: http://localhost:${process.env.PORT || 5000}/api`);
        console.log('\n' + '='.repeat(60) + '\n');

    } catch (error) {
        console.error('❌ Seeding Error:', error.message);
        process.exit(1);
    }
};

// Run seeder
const run = async () => {
    await connectDB();
    await seedDatabase();
    mongoose.connection.close();
    console.log('👋 Database connection closed\n');
};

run();

