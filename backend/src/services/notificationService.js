const { notificationRepository } = require('../repositories/notificationRepository');

async function createNotification(userId, title, message, type = 'info') {
  return notificationRepository.create({ userId, title, message, type });
}

async function listNotifications(userId) {
  return notificationRepository.listByUser(userId);
}

async function markNotificationRead(userId, notificationId) {
  return notificationRepository.markRead(notificationId, userId);
}

module.exports = { createNotification, listNotifications, markNotificationRead };
