const Activity = require('../models/Activity');

/**
 * Log an activity to the database
 * @param {Object} activityData - Activity data
 * @param {String} activityData.type - Activity type
 * @param {String} activityData.description - Activity description
 * @param {String} activityData.user - User ID (optional)
 * @param {String} activityData.business - Business ID (optional)
 * @param {String} activityData.review - Review ID (optional)
 * @param {String} activityData.category - Category ID (optional)
 * @param {Object} activityData.metadata - Additional metadata (optional)
 */
const logActivity = async (activityData) => {
    try {
        await Activity.create(activityData);
    } catch (error) {
        // Don't throw error - activity logging shouldn't break the app
        console.error('Error logging activity:', error);
    }
};

module.exports = logActivity;

