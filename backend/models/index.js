const { sequelize } = require('../config/database');
const User = require('./User');
const Category = require('./Category');
const SubCategory = require('./SubCategory');
const Business = require('./Business');
const Review = require('./Review');
const Blog = require('./Blog');
const Contact = require('./Contact');
const Activity = require('./Activity');
const ReviewRequest = require('./ReviewRequest');

// Define associations
User.hasMany(Business, { foreignKey: 'ownerId', as: 'businesses' });
Business.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

Category.hasMany(Business, { foreignKey: 'categoryId', as: 'businesses' });
Business.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

// SubCategory associations
Category.hasMany(SubCategory, { foreignKey: 'categoryId', as: 'subcategories' });
SubCategory.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

Business.belongsTo(SubCategory, { foreignKey: 'subCategoryId', as: 'subcategory' });
SubCategory.hasMany(Business, { foreignKey: 'subCategoryId', as: 'businesses' });

Business.hasMany(Review, { foreignKey: 'businessId', as: 'reviews' });
Review.belongsTo(Business, { foreignKey: 'businessId', as: 'business' });

User.hasMany(Review, { foreignKey: 'userId', as: 'reviews' });
Review.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Activity, { foreignKey: 'userId', as: 'activities' });
Activity.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// ReviewRequest associations
Business.hasMany(ReviewRequest, { foreignKey: 'businessId', as: 'reviewRequests' });
ReviewRequest.belongsTo(Business, { foreignKey: 'businessId', as: 'business' });

User.hasMany(ReviewRequest, { foreignKey: 'requestedBy', as: 'sentReviewRequests' });
ReviewRequest.belongsTo(User, { foreignKey: 'requestedBy', as: 'requester' });

module.exports = {
  sequelize,
  User,
  Category,
  SubCategory,
  Business,
  Review,
  Blog,
  Contact,
  Activity,
  ReviewRequest
};
