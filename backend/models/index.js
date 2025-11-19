const { sequelize } = require('../config/database');
const User = require('./User');
const Category = require('./Category');
const Business = require('./Business');
const Review = require('./Review');
const Blog = require('./Blog');
const Contact = require('./Contact');
const Activity = require('./Activity');

// Define associations
User.hasMany(Business, { foreignKey: 'ownerId', as: 'businesses' });
Business.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

Category.hasMany(Business, { foreignKey: 'categoryId', as: 'businesses' });
Business.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

Business.hasMany(Review, { foreignKey: 'businessId', as: 'reviews' });
Review.belongsTo(Business, { foreignKey: 'businessId', as: 'business' });

User.hasMany(Review, { foreignKey: 'userId', as: 'reviews' });
Review.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Activity, { foreignKey: 'userId', as: 'activities' });
Activity.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  sequelize,
  User,
  Category,
  Business,
  Review,
  Blog,
  Contact,
  Activity
};

