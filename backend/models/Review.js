const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Business = require('./Business');

const Review = sequelize.define('Review', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  businessId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
  title: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please provide a review title' },
      len: [1, 100]
    }
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Please provide a review comment' },
      len: [1, 1000]
    }
  },
  images: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  helpfulCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  helpfulBy: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  responseComment: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  respondedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  respondedBy: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  isApproved: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isReported: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'reviews',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['businessId', 'userId']
    }
  ]
});

// Static method to calculate average rating
Review.calculateAverageRating = async function(businessId) {
  const reviews = await this.findAll({
    where: {
      businessId,
      isApproved: true
    },
    attributes: [
      [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    raw: true
  });

  const stats = await this.findAll({
    where: {
      businessId,
      isApproved: true
    },
    attributes: [
      [sequelize.fn('AVG', sequelize.col('rating')), 'avgRating'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'totalCount']
    ],
    raw: true
  });

  if (stats && stats.length > 0 && stats[0].avgRating) {
    const averageRating = parseFloat(stats[0].avgRating).toFixed(2);
    const count = parseInt(stats[0].totalCount) || 0;
    
    await Business.update(
      {
        ratingAverage: averageRating,
        ratingCount: count
      },
      {
        where: { id: businessId }
      }
    );
  } else {
    await Business.update(
      {
        ratingAverage: 0,
        ratingCount: 0
      },
      {
        where: { id: businessId }
      }
    );
  }
};

// Hooks to update business rating
Review.addHook('afterCreate', async (review) => {
  await Review.calculateAverageRating(review.businessId);
});

Review.addHook('afterUpdate', async (review) => {
  if (review.changed('rating') || review.changed('isApproved')) {
    await Review.calculateAverageRating(review.businessId);
  }
});

Review.addHook('afterDestroy', async (review) => {
  await Review.calculateAverageRating(review.businessId);
});

module.exports = Review;

