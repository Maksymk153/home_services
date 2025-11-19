const { Sequelize } = require('sequelize');
require('dotenv').config();

// Database configuration
const sequelize = new Sequelize(
  process.env.DB_NAME || 'citylocal101',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: true
    }
  }
);

// Test connection
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL Connected Successfully');
    console.log(`📊 Database: ${process.env.DB_NAME || 'citylocal101'}`);
    
    // Sync models in development
    if (process.env.NODE_ENV === 'development' && process.env.SYNC_DB === 'true') {
      await sequelize.sync({ alter: true });
      console.log('🔄 Database models synchronized');
    }
  } catch (error) {
    console.error('❌ MySQL Connection Error:', error.message);
    console.error('\n⚠️  Troubleshooting Tips:');
    console.error('   1. Make sure MySQL server is running');
    console.error('   2. Check your database credentials in .env file');
    console.error('   3. Create the database if it doesn\'t exist:');
    console.error('      CREATE DATABASE citylocal101;');
    console.error('   4. Verify MySQL is accessible on the specified host/port\n');
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };

