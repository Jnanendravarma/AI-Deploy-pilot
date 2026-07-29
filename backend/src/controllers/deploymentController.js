const { asyncHandler } = require('../middleware/asyncHandler');
const deploymentService = require('../services/deploymentService');
const { sendSuccess } = require('../utils/response');

const createDeployment = asyncHandler(async (req, res) => {
  const deployment = await deploymentService.createDeployment(req.user.userId, req.body);
  return sendSuccess(res, deployment, 'Deployment created', 201);
});

const listDeployments = asyncHandler(async (req, res) => {
  const { projectId } = req.query;
  const deployments = await deploymentService.listDeployments(req.user.userId, projectId, req.query);
  return sendSuccess(res, deployments, 'Deployments fetched');
});

const getDeploymentById = asyncHandler(async (req, res) => {
  const deployment = await deploymentService.getDeploymentById(req.user.userId, req.params.deploymentId);
  return sendSuccess(res, deployment, 'Deployment detail fetched');
});

const getLogs = asyncHandler(async (req, res) => {
  const logs = await deploymentService.getDeploymentLogs(req.user.userId, req.params.deploymentId, req.query);
  return sendSuccess(res, logs, 'Logs fetched');
});

const getStatus = asyncHandler(async (req, res) => {
  const deployment = await deploymentService.getDeploymentById(req.user.userId, req.params.deploymentId);
  return sendSuccess(res, { status: deployment.status, steps: deployment.steps }, 'Status fetched');
});

const retryDeployment = asyncHandler(async (req, res) => {
  const deployment = await deploymentService.retryDeployment(req.user.userId, req.params.deploymentId);
  return sendSuccess(res, deployment, 'Deployment retry queued', 201);
});

const cancelDeployment = asyncHandler(async (req, res) => {
  const deployment = await deploymentService.cancelDeploymentHandler(req.user.userId, req.params.deploymentId);
  return sendSuccess(res, deployment, 'Deployment cancelled');
});

const rollbackDeployment = asyncHandler(async (req, res) => {
  const deployment = await deploymentService.rollbackDeploymentHandler(req.user.userId, req.params.deploymentId);
  return sendSuccess(res, deployment, 'Rollback deployment initiated', 201);
});

const getAnalytics = asyncHandler(async (req, res) => {
  const { projectId } = req.query;
  const analytics = await deploymentService.getDeploymentAnalytics(req.user.userId, projectId);
  return sendSuccess(res, analytics, 'Deployment analytics fetched');
});

const getError = asyncHandler(async (req, res) => {
  const errorDetails = await deploymentService.getDeploymentError(req.user.userId, req.params.deploymentId);
  return sendSuccess(res, errorDetails, 'Deployment error diagnosis fetched');
});

module.exports = {
  createDeployment,
  listDeployments,
  getDeploymentById,
  getLogs,
  getStatus,
  retryDeployment,
  cancelDeployment,
  rollbackDeployment,
  getAnalytics,
  getError
};
