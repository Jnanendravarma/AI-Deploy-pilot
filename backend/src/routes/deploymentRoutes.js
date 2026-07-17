const express = require('express');
const controller = require('../controllers/deploymentController');
const { requireAuth } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validateRequest');
const { createDeploymentSchema, deploymentIdSchema } = require('../validators/deploymentValidators');

const router = express.Router();

router.get('/', requireAuth, controller.listDeployments);
router.post('/', requireAuth, validateRequest(createDeploymentSchema), controller.createDeployment);
router.get('/:deploymentId/logs', requireAuth, validateRequest(deploymentIdSchema), controller.getLogs);
router.post('/:deploymentId/retry', requireAuth, validateRequest(deploymentIdSchema), controller.retryDeployment);
router.get('/:deploymentId/error', requireAuth, validateRequest(deploymentIdSchema), controller.getError);

module.exports = { deploymentRoutes: router };
