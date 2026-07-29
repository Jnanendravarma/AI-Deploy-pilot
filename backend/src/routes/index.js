const express = require('express');
const { authRoutes } = require('./authRoutes');
const { projectRoutes } = require('./projectRoutes');
const { deploymentRoutes } = require('./deploymentRoutes');
const { analyticsRoutes } = require('./analyticsRoutes');
const { monitoringRoutes } = require('./monitoringRoutes');
const { notificationRoutes } = require('./notificationRoutes');
const { aiRoutes } = require('./aiRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/deployments', deploymentRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/monitoring', monitoringRoutes);
router.use('/notifications', notificationRoutes);
router.use('/ai', aiRoutes);

module.exports = { router };
