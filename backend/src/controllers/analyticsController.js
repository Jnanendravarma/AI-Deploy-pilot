const { asyncHandler } = require('../middleware/asyncHandler');
const { getDashboardAnalytics } = require('../services/analyticsService');
const { sendSuccess } = require('../utils/response');

const getAnalytics = asyncHandler(async (req, res) => {
  const analytics = await getDashboardAnalytics(req.user.userId);
  return sendSuccess(res, analytics, 'Analytics fetched');
});

module.exports = { getAnalytics };
