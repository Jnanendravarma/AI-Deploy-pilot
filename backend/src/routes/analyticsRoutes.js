const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getAnalytics } = require('../controllers/analyticsController');

const router = express.Router();

router.get('/', requireAuth, getAnalytics);

module.exports = { analyticsRoutes: router };
