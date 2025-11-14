# 🏙️ CityLocal 101 - Local Business Directory Platform

A complete, production-ready local business directory platform with full-featured admin panel and user interface.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-green.svg)
![MongoDB](https://img.shields.io/badge/mongodb-required-green.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

---

## 🌟 Features

### **Frontend (Public Website)**
- 🔍 **Advanced Search** - Search businesses by name, category, or location with autocomplete
- 📱 **Responsive Design** - Works perfectly on desktop, tablet, and mobile devices
- ⭐ **Star Rating System** - Interactive 5-star rating for reviews
- 📝 **Review System** - Users can write and submit reviews for businesses
- 🏢 **Business Listings** - Detailed business profiles with contact information, hours, and location
- 📂 **26 Categories** - Comprehensive business categorization with icons
- 💬 **Support System** - Built-in contact/support forms with email notifications
- 📰 **Blog Section** - News and articles display
- 🔐 **User Authentication** - Secure login and registration system
- 🎨 **Modern UI** - Clean, professional design with smooth animations
- 📍 **Location Suggestions** - Smart autocomplete for cities and states

### **Backend (Admin Panel)**
- 👨‍💼 **Complete Dashboard** - Real-time statistics and analytics
- 🏷️ **Category Management** - Full CRUD operations (Create, Read, Update, Delete) with icon picker
- 🏢 **Business Management** - Approve, feature, verify, edit, and delete businesses
- 👥 **User Management** - View, search, and manage registered users
- ⭐ **Review Moderation** - Approve and manage user reviews
- 🔍 **Search & Filter** - Advanced filtering and search capabilities
- 🎨 **Professional UI** - Modern, clean interface with smooth animations
- 🔒 **Secure Authentication** - JWT-based authentication with role management
- 📧 **Email Notifications** - Automated emails for business submissions, approvals, and reviews

### **Technical Features**
- 🚀 **RESTful API** - Clean, documented API endpoints
- 🔐 **Security** - Helmet, rate limiting, CORS protection
- 📊 **Database** - MongoDB with Mongoose ODM
- 🎯 **MVC Architecture** - Organized, maintainable code structure
- ⚡ **Performance** - Optimized queries and caching
- 📝 **Logging** - Morgan for HTTP request logging
- 🔄 **Hot Reload** - Nodemon for development
- 📧 **Email Integration** - Nodemailer for sending notifications

---

## 📋 Table of Contents

- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Running the Application](#-running-the-application)
- [Usage Guide](#-usage-guide)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Tech Stack](#-tech-stack)
- [Troubleshooting](#-troubleshooting)
- [Email Setup](#-email-setup)

---

## 🔧 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v4.4 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **MongoDB Compass** (Optional, for database management) - [Download](https://www.mongodb.com/try/download/compass)
- **Git** (Optional, for version control) - [Download](https://git-scm.com/)

---

## 📥 Installation

### **Step 1: Install MongoDB**

1. Download and install MongoDB Community Server
2. Install MongoDB as a service (recommended)
3. MongoDB will run on `mongodb://localhost:27017` by default

### **Step 2: Install Project Dependencies**

```bash
# Navigate to project directory
cd C:\Users\aliha\OneDrive\Desktop\Clone

# Install all dependencies
npm install
```

### **Step 3: Seed the Database**

```bash
# Populate database with initial data (5 sample businesses, 26 categories, admin user)
npm run seed
```

You should see:
```
✅ MongoDB Connected
✅ Admin user created: admin@citylocal101.com
✅ 26 categories created
✅ 5 sample businesses created
```

---

## ⚙️ Configuration

### **Environment Variables**

Create a `.env` file in the root directory (optional):

```env
# Server Configuration
PORT=5000
NODE_ENV=development
BASE_URL=http://localhost:5000

# Database
MONGODB_URI=mongodb://localhost:27017/citylocal101

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Session Secret
SESSION_SECRET=your-session-secret-change-this

# CORS
CORS_ORIGIN=*

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# Email Configuration (Optional - for real email sending)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=CityLocal 101 <noreply@citylocal101.com>

# Admin Email (where support forms are sent)
ADMIN_EMAIL=admin@citylocal101.com
```

*Note: The application will work with default settings if `.env` is not created. Email notifications will be simulated if email credentials are not configured.*

---

## 🚀 Running the Application

### **Development Mode**

```bash
npm run dev
```

The server will start with hot reload enabled.

### **Production Mode**

```bash
npm start
```

### **Access Points**

Once running, access the application at:

- **Website**: http://localhost:5000
- **Admin Panel**: http://localhost:5000/admin
- **API**: http://localhost:5000/api

---

## 📖 Usage Guide

### **For Users (Public Website)**

#### **Browsing Businesses**
1. Open http://localhost:5000
2. Browse categories on the homepage
3. Click on any category to filter businesses
4. Click on a business card to view details

#### **Searching**
1. Use the search box in the hero section
2. Enter business name or keyword
3. Enter location (city/state) - autocomplete suggestions will appear
4. Click Search to view results

#### **Writing Reviews**
1. Click "Write A Review" in the header
2. Select a business from the dropdown
3. Select star rating (1-5 stars)
4. Write your review title and comment
5. Enter your name and email
6. Submit (review will be pending admin approval)

#### **Adding Your Business**
1. Click "Add Your Business" in the header
2. Fill in all business details:
   - Business name, category, phone, description
   - Street address, city, state, zip code
   - Email, website (optional)
   - Owner name and email
3. Submit for approval (FREE!)
4. You'll receive an email confirmation

#### **Contact Support**
1. Click "Support" in the header
2. Fill in your name and email
3. Select issue category
4. Write your message
5. Submit (admin will receive email notification)

### **For Administrators (Admin Panel)**

#### **Login**
1. Open http://localhost:5000/admin
2. Email: `admin@citylocal101.com`
3. Password: `Admin@123456`
4. Click "Sign In"

#### **Managing Categories**
1. Click "Categories" in sidebar
2. **Add**: Click "Add New Category" → Fill form → Select icon from icon picker → Save
3. **Edit**: Click "Edit" button → Modify details → Change icon if needed → Save
4. **Delete**: Click "Delete" button → Confirm

#### **Managing Businesses**
1. Click "Businesses" in sidebar
2. **View**: Click "View" to see complete business details in a modal
3. **Approve**: Click "Approve" to activate pending businesses
4. **Feature**: Click "Feature/Unfeature" to showcase on homepage
5. **Edit**: Click "Edit" button → Modify details → Save
6. **Delete**: Click "Delete" → Confirm
7. **Search**: Use search box to find businesses
8. **Filter**: Use category dropdown to filter

#### **Managing Users**
1. Click "Users" in sidebar
2. View all registered users
3. Search users by name or email
4. Delete spam accounts (admin users are protected)

#### **Managing Reviews**
1. Click "Reviews" in sidebar
2. **View**: Click "View" to see complete review details in a modal
3. **Approve**: Click "Approve" on pending reviews
4. **Delete**: Click "Delete" to remove inappropriate reviews

---

## 🔌 API Documentation

### **Authentication**

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123!"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "Password123!"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### **Categories**

#### Get All Categories
```http
GET /api/categories
```

#### Create Category (Admin)
```http
POST /api/categories
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Restaurants",
  "icon": "utensils",
  "description": "Dining establishments",
  "order": 1
}
```

### **Businesses**

#### Get All Businesses
```http
GET /api/businesses?page=1&limit=10&category=<categoryId>&featured=true
```

#### Get Single Business
```http
GET /api/businesses/:id
```

#### Create Business
```http
POST /api/businesses
Content-Type: application/json

{
  "name": "Joe's Pizza",
  "category": "<categoryId>",
  "description": "Best pizza in town",
  "location": {
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001"
  },
  "contact": {
    "phone": "(555) 123-4567",
    "email": "info@joespizza.com",
    "website": "https://joespizza.com"
  },
  "ownerName": "Joe Smith",
  "ownerEmail": "joe@joespizza.com"
}
```

### **Reviews**

#### Get Business Reviews
```http
GET /api/reviews/business/:businessId
```

#### Create Review
```http
POST /api/reviews
Content-Type: application/json

{
  "business": "<businessId>",
  "rating": 5,
  "title": "Great service!",
  "comment": "Excellent service and friendly staff!"
}
```

### **Search**

#### Advanced Search
```http
GET /api/search?q=pizza&city=NewYork&category=<categoryId>&minRating=4
```

#### Search Suggestions
```http
GET /api/search/suggestions?q=pizza
```

### **Contact**

#### Submit Support Form
```http
POST /api/contact
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Technical Support",
  "message": "I need help with..."
}
```

---

## 📁 Project Structure

```
citylocal101/
├── admin/                      # Admin panel files
│   ├── index.html             # Admin panel UI
│   ├── admin.js               # Admin panel JavaScript
│   ├── admin-style.css        # Admin panel styles
│   └── icon-picker.js         # Icon picker functionality
├── middleware/                 # Express middleware
│   └── auth.js                # JWT authentication middleware
├── models/                     # Mongoose models
│   ├── User.js                # User schema
│   ├── Category.js            # Category schema
│   ├── Business.js            # Business schema
│   ├── Review.js              # Review schema
│   └── Contact.js             # Contact form schema
├── routes/                     # API routes
│   ├── auth.js                # Authentication routes
│   ├── businesses.js          # Business routes
│   ├── categories.js          # Category routes
│   ├── reviews.js             # Review routes
│   ├── admin.js               # Admin-only routes
│   ├── search.js              # Search routes
│   └── contact.js             # Contact form routes
├── scripts/                    # Utility scripts
│   └── seed.js                # Database seeding script
├── utils/                      # Utility functions
│   ├── generateToken.js       # JWT token generation
│   └── sendEmail.js           # Email sending utility
├── index.html                  # Main website homepage
├── add-business.html           # Add business page
├── businesses.html             # Businesses listing page
├── category-results.html       # Category results page
├── search-results.html         # Search results page
├── write-review.html           # Write review page
├── support.html                # Support/contact page
├── login.html                  # Login page
├── blog.html                   # Blog page
├── script.js                   # Frontend JavaScript
├── add-business.js             # Add business JavaScript
├── businesses.js                # Businesses page JavaScript
├── search-results.js           # Search results JavaScript
├── write-review.js             # Write review JavaScript
├── support.js                  # Support page JavaScript
├── login.js                    # Login page JavaScript
├── styles.css                  # Website styles
├── server.js                   # Express server
├── package.json                # Dependencies
├── .gitignore                  # Git ignore file
├── LAUNCH_WEBSITE.bat          # Quick launch script (Windows)
├── START_SERVER.bat            # Quick server start (Windows)
└── README.md                   # This file
```

---

## 🛠️ Tech Stack

### **Frontend**
- HTML5
- CSS3 (Custom styles, no frameworks)
- Vanilla JavaScript (ES6+)
- Font Awesome Icons

### **Backend**
- Node.js
- Express.js
- MongoDB
- Mongoose ODM

### **Security**
- JWT (JSON Web Tokens)
- bcrypt (Password hashing)
- Helmet (HTTP headers)
- express-rate-limit
- CORS

### **Development Tools**
- Nodemon (Hot reload)
- Morgan (Logging)
- dotenv (Environment variables)
- Nodemailer (Email sending)

---

## 📧 Email Setup

To enable real email notifications (instead of simulated):

### **Gmail Setup**

1. **Enable 2-Step Verification**
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable 2-Step Verification

2. **Generate App Password**
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and "Other (Custom name)"
   - Enter "CityLocal 101" and click "Generate"
   - Copy the 16-character password

3. **Configure .env**
   ```env
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-character-app-password
   EMAIL_FROM=CityLocal 101 <your-email@gmail.com>
   ADMIN_EMAIL=admin@citylocal101.com
   ```

4. **Restart Server**
   ```bash
   npm run dev
   ```

---

## 🐛 Troubleshooting

### **Issue: MongoDB Connection Error**

**Solution:**
```bash
# Check if MongoDB is running (Windows)
net start MongoDB

# If not installed as service, start manually
mongod --dbpath="C:\data\db"
```

### **Issue: Port 5000 Already in Use**

**Solution:**
```bash
# Change port in .env file or server.js
PORT=3000

# Or kill process using port 5000 (Windows)
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### **Issue: npm install fails**

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### **Issue: Admin panel buttons not working**

**Solution:**
- Clear browser cache (Ctrl + Shift + Delete)
- Hard refresh (Ctrl + F5)
- Check browser console for errors (F12)

### **Issue: Cannot login to admin**

**Solution:**
```bash
# Re-run the seeder to recreate admin user
npm run seed

# Default credentials:
# Email: admin@citylocal101.com
# Password: Admin@123456
```

### **Issue: Forms not submitting**

**Solution:**
- Check browser console for errors (F12)
- Verify all required fields are filled
- Check network tab for API errors
- Ensure server is running

---

## 🎯 Quick Start Commands

```bash
# Install dependencies
npm install

# Seed database with sample data (5 businesses, 26 categories, admin user)
npm run seed

# Start development server (with hot reload)
npm run dev

# Start production server
npm start

# Re-seed database (if needed)
npm run seed
```

---

## 📝 Default Admin Credentials

**Email:** `admin@citylocal101.com`  
**Password:** `Admin@123456`

⚠️ **Important:** Change admin password after first login in production!

---

## 🎨 Features Checklist

### **Website Features**
- [x] Homepage with hero section
- [x] 26 business categories with icons
- [x] Business listings grid
- [x] Advanced search with autocomplete
- [x] Location suggestions (cities and states)
- [x] Business detail modals
- [x] User registration and login
- [x] Write review page with star rating
- [x] Add business form with validation
- [x] Support/contact form
- [x] Blog section
- [x] Responsive design
- [x] Smooth animations
- [x] SEO-friendly structure
- [x] Form autocomplete attributes
- [x] Professional notifications (center-bottom)

### **Admin Panel Features**
- [x] Secure admin login
- [x] Dashboard with statistics
- [x] Full category CRUD with icon picker
- [x] Full business CRUD
- [x] View business/review details in modals
- [x] User management
- [x] Review moderation
- [x] Search and filter
- [x] Approve/reject workflow
- [x] Feature businesses
- [x] Verify businesses
- [x] Professional UI
- [x] Real-time updates
- [x] Email notifications

---

## 🔒 Security Features

- ✅ Password hashing with bcrypt (10 salt rounds)
- ✅ JWT authentication
- ✅ HTTP security headers (Helmet)
- ✅ Rate limiting (100 requests per 15 minutes)
- ✅ CORS protection
- ✅ Input validation
- ✅ XSS protection
- ✅ SQL injection protection (MongoDB)
- ✅ Role-based access control
- ✅ Content Security Policy (CSP)

---

## 📧 Support

For issues, questions, or feature requests:

1. Check [Troubleshooting](#-troubleshooting) section
2. Review browser console for error messages (F12)
3. Check MongoDB is running
4. Verify all dependencies are installed
5. Check server logs for errors

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- Font Awesome for icons
- MongoDB for database
- Express.js for backend framework
- All open-source contributors

---

## 🎉 You're All Set!

Your CityLocal 101 platform is ready to use!

1. **Start the server:** `npm run dev`
2. **Access website:** http://localhost:5000
3. **Access admin:** http://localhost:5000/admin
4. **Start building your local business directory!**

---

**Made with ❤️ for local businesses and communities**
