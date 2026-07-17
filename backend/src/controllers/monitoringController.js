const { asyncHandler } = require('../middleware/asyncHandler');
const { getSystemMetrics } = require('../services/monitoringService');
const { sendSuccess } = require('../utils/response');

const getMonitoring = asyncHandler(async (_req, res) => {
  return sendSuccess(res, getSystemMetrics(), 'Monitoring metrics fetched');
});

module.exports = { getMonitoring };
