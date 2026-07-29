const express = require('express');
const controller = require('../controllers/aiController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/analyze', requireAuth, controller.analyzeDeployment);
router.get('/diagnosis/:deploymentId', requireAuth, controller.getDiagnosis);
router.post('/chat', requireAuth, controller.handleChat);
router.post('/fix', requireAuth, controller.executeFix);
router.get('/knowledge-base', requireAuth, controller.getKnowledgeBase);
router.get('/recommendations', requireAuth, controller.getRecommendations);
router.get('/security-scan', requireAuth, controller.getSecurityScan);
router.get('/performance-scan', requireAuth, controller.getPerformanceScan);
router.get('/report', requireAuth, controller.getReport);
router.post('/feedback', requireAuth, controller.submitFeedback);
router.get('/history', requireAuth, controller.getHistory);

module.exports = { aiRoutes: router };
