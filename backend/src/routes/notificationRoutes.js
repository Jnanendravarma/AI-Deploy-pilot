const express = require('express');
const controller = require('../controllers/notificationController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, controller.listNotifications);
router.patch('/:notificationId/read', requireAuth, controller.markRead);

module.exports = { notificationRoutes: router };
