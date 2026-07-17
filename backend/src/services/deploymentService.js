const { v4: uuidv4 } = require('uuid');
const { ApiError } = require('../errors/ApiError');
const { projectRepository } = require('../repositories/projectRepository');
const { deploymentRepository } = require('../repositories/deploymentRepository');
const { deploymentLogRepository } = require('../repositories/deploymentLogRepository');
const { deploymentErrorRepository } = require('../repositories/deploymentErrorRepository');
const { enqueueDeploymentJob } = require('../queues/deploymentQueue');
const { analyzeDeploymentError } = require('../doctor/doctor');
const { emitDeploymentLog, emitDeploymentStatus } = require('../socket');

const pipelineSteps = [
  'Validation',
  'Dependency Check',
  'Docker Build',
  'Container Start',
  'Health Check',
  'Deployment Complete'
];

async function createDeployment(userId, { projectId, branch = 'main', commitSha }) {
  const project = await projectRepository.findByIdAndOwner(projectId, userId);
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  const deployment = await deploymentRepository.create({
    projectId,
    triggeredBy: userId,
    status: 'Pending',
    branch,
    commitSha,
    imageTag: `deploypilot/${project.name}:${uuidv4().slice(0, 8)}`,
    steps: pipelineSteps.map((name) => ({ name, status: 'Pending' }))
  });

  await enqueueDeploymentJob({ deploymentId: deployment._id.toString() });

  await appendLog(deployment, 'info', 'Deployment queued and waiting for worker.');

  return deployment;
}

async function appendLog(deployment, level, message) {
  const log = await deploymentLogRepository.create({
    deploymentId: deployment._id,
    projectId: deployment.projectId,
    level,
    message
  });
  emitDeploymentLog(deployment._id.toString(), log);
  return log;
}

async function updateDeploymentStatus(deploymentId, status, detail) {
  const deployment = await deploymentRepository.findById(deploymentId);
  if (!deployment) {
    throw new ApiError(404, 'Deployment not found');
  }

  deployment.status = status;
  if (detail) {
    await appendLog(deployment, status === 'Failed' ? 'error' : 'info', detail);
  }
  await deployment.save();

  emitDeploymentStatus(deploymentId, { status: deployment.status, updatedAt: deployment.updatedAt });
  return deployment;
}

async function failDeployment(deploymentId, errorMessage) {
  const deployment = await updateDeploymentStatus(deploymentId, 'Failed', errorMessage);
  const diagnosis = analyzeDeploymentError(errorMessage);

  const recorded = await deploymentErrorRepository.create({
    deploymentId: deployment._id,
    projectId: deployment.projectId,
    ...diagnosis
  });

  await appendLog(deployment, 'error', `Doctor diagnosis: ${diagnosis.rootCause}`);

  return { deployment, diagnosis: recorded };
}

async function listDeployments(userId, projectId, query) {
  const project = await projectRepository.findByIdAndOwner(projectId, userId);
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }
  return deploymentRepository.listByProject(projectId, query);
}

async function getDeploymentLogs(userId, deploymentId, query) {
  const deployment = await deploymentRepository.findById(deploymentId);
  if (!deployment) {
    throw new ApiError(404, 'Deployment not found');
  }

  const project = await projectRepository.findByIdAndOwner(deployment.projectId, userId);
  if (!project) {
    throw new ApiError(403, 'Forbidden');
  }

  return deploymentLogRepository.listByDeployment(deploymentId, query);
}

async function retryDeployment(userId, deploymentId) {
  const deployment = await deploymentRepository.findById(deploymentId);
  if (!deployment) {
    throw new ApiError(404, 'Deployment not found');
  }

  const project = await projectRepository.findByIdAndOwner(deployment.projectId, userId);
  if (!project) {
    throw new ApiError(403, 'Forbidden');
  }

  return createDeployment(userId, {
    projectId: deployment.projectId,
    branch: deployment.branch,
    commitSha: deployment.commitSha,
    retryOfDeploymentId: deployment._id
  });
}

async function getDeploymentError(userId, deploymentId) {
  const deployment = await deploymentRepository.findById(deploymentId);
  if (!deployment) {
    throw new ApiError(404, 'Deployment not found');
  }

  const project = await projectRepository.findByIdAndOwner(deployment.projectId, userId);
  if (!project) {
    throw new ApiError(403, 'Forbidden');
  }

  const errorDetails = await deploymentErrorRepository.findByDeploymentId(deploymentId);
  if (!errorDetails) {
    throw new ApiError(404, 'No error diagnostics found for this deployment');
  }
  return errorDetails;
}

module.exports = {
  createDeployment,
  listDeployments,
  getDeploymentLogs,
  updateDeploymentStatus,
  failDeployment,
  retryDeployment,
  appendLog,
  getDeploymentError
};
