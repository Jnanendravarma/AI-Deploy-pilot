const express = require('express');
const controller = require('../controllers/deploymentController');
const { requireAuth } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validateRequest');
const { createDeploymentSchema, deploymentIdSchema } = require('../validators/deploymentValidators');

const router = express.Router();

router.get('/analytics', requireAuth, controller.getAnalytics);
router.get('/', requireAuth, controller.listDeployments);
router.post('/', requireAuth, validateRequest(createDeploymentSchema), controller.createDeployment);
router.get('/:deploymentId', requireAuth, validateRequest(deploymentIdSchema), controller.getDeploymentById);
router.get('/:deploymentId/logs', requireAuth, validateRequest(deploymentIdSchema), controller.getLogs);
router.get('/:deploymentId/status', requireAuth, validateRequest(deploymentIdSchema), controller.getStatus);
router.post('/:deploymentId/retry', requireAuth, validateRequest(deploymentIdSchema), controller.retryDeployment);
router.post('/:deploymentId/cancel', requireAuth, validateRequest(deploymentIdSchema), controller.cancelDeployment);
router.post('/:deploymentId/rollback', requireAuth, validateRequest(deploymentIdSchema), controller.rollbackDeployment);
router.get('/:deploymentId/error', requireAuth, validateRequest(deploymentIdSchema), controller.getError);

module.exports = { deploymentRoutes: router };
