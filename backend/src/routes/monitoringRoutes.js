const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getMonitoring } = require('../controllers/monitoringController');

const router = express.Router();

router.get('/', requireAuth, getMonitoring);

module.exports = { monitoringRoutes: router };
