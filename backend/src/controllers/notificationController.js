const { asyncHandler } = require('../middleware/asyncHandler');
const notificationService = require('../services/notificationService');
const { sendSuccess } = require('../utils/response');

const listNotifications = asyncHandler(async (req, res) => {
  const notifications = await notificationService.listNotifications(req.user.userId);
  return sendSuccess(res, notifications, 'Notifications fetched');
});

const markRead = asyncHandler(async (req, res) => {
  const updated = await notificationService.markNotificationRead(req.user.userId, req.params.notificationId);
  return sendSuccess(res, updated, 'Notification marked as read');
});

module.exports = { listNotifications, markRead };
