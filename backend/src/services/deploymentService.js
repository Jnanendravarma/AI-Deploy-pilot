const { v4: uuidv4 } = require('uuid');
const { ApiError } = require('../errors/ApiError');
const { projectRepository } = require('../repositories/projectRepository');
const { deploymentRepository } = require('../repositories/deploymentRepository');
const { deploymentLogRepository } = require('../repositories/deploymentLogRepository');
const { deploymentErrorRepository } = require('../repositories/deploymentErrorRepository');
const { enqueueDeploymentJob } = require('../queues/deploymentQueue');
const { analyzeDeploymentError } = require('../doctor/doctor');
const { cancelDeployment, rollbackDeployment } = require('../deployment/DeploymentRunner');
const { appendDeploymentLog } = require('../deployment/Logger');
const { sendStatus } = require('../deployment/SocketEmitter');

const pipelineSteps = [
  'Queued',
  'Initializing',
  'Downloading',
  'Installing',
  'Building',
  'Starting',
  'Health Check',
  'Completed'
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
    imageTag: `deploypilot/${project.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}:${uuidv4().slice(0, 8)}`,
    steps: pipelineSteps.map((name, idx) => ({
      name,
      status: idx === 0 ? 'Building' : 'Pending',
      startedAt: idx === 0 ? new Date() : null,
      finishedAt: null,
      detail: ''
    }))
  });

  await enqueueDeploymentJob({ deploymentId: deployment._id ? deployment._id.toString() : deployment.id });

  await appendDeploymentLog(deployment, 'info', 'Deployment queued and waiting for worker processing.');

  return deployment;
}

async function listDeployments(userId, projectId, query) {
  const project = await projectRepository.findByIdAndOwner(projectId, userId);
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }
  return deploymentRepository.listByProject(projectId, query);
}

async function getDeploymentById(userId, deploymentId) {
  const deployment = await deploymentRepository.findById(deploymentId);
  if (!deployment) {
    throw new ApiError(404, 'Deployment not found');
  }

  const project = await projectRepository.findByIdAndOwner(deployment.projectId, userId);
  if (!project) {
    throw new ApiError(403, 'Forbidden');
  }

  return deployment;
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

async function updateDeploymentStatus(deploymentId, status, detail) {
  const deployment = await deploymentRepository.findById(deploymentId);
  if (!deployment) {
    throw new ApiError(404, 'Deployment not found');
  }

  deployment.status = status;
  if (detail) {
    await appendDeploymentLog(deployment, status === 'Failed' ? 'error' : 'info', detail);
  }
  await deployment.save();

  sendStatus(deploymentId, { status: deployment.status, updatedAt: deployment.updatedAt });
  return deployment;
}

async function failDeployment(deploymentId, errorMessage) {
  const deployment = await updateDeploymentStatus(deploymentId, 'Failed', errorMessage);
  const diagnosis = analyzeDeploymentError(errorMessage);

  const recorded = await deploymentErrorRepository.create({
    deploymentId: deployment._id ? deployment._id.toString() : deployment.id,
    projectId: deployment.projectId,
    ...diagnosis
  });

  await appendDeploymentLog(deployment, 'error', `Doctor diagnosis: ${diagnosis.rootCause}`);

  return { deployment, diagnosis: recorded };
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
    retryOfDeploymentId: deployment._id ? deployment._id.toString() : deployment.id
  });
}

async function cancelDeploymentHandler(userId, deploymentId) {
  const deployment = await deploymentRepository.findById(deploymentId);
  if (!deployment) {
    throw new ApiError(404, 'Deployment not found');
  }

  const project = await projectRepository.findByIdAndOwner(deployment.projectId, userId);
  if (!project) {
    throw new ApiError(403, 'Forbidden');
  }

  return cancelDeployment(deploymentId);
}

async function rollbackDeploymentHandler(userId, deploymentId) {
  const targetDeployment = await deploymentRepository.findById(deploymentId);
  if (!targetDeployment) {
    throw new ApiError(404, 'Deployment not found');
  }

  return rollbackDeployment(userId, targetDeployment.projectId, deploymentId);
}

async function getDeploymentAnalytics(userId, projectId) {
  let deployments = [];
  if (projectId) {
    const project = await projectRepository.findByIdAndOwner(projectId, userId);
    if (!project) throw new ApiError(404, 'Project not found');
    deployments = await deploymentRepository.listByProject(projectId, { limit: 100 });
  } else {
    const projects = await projectRepository.listByOwner(userId);
    const projectIds = projects.map((p) => p._id ? p._id.toString() : p.id);
    if (projectIds.length > 0) {
      deployments = await deploymentRepository.listByProjectIds(projectIds);
    }
  }

  const totalDeployments = deployments.length;
  const successfulDeployments = deployments.filter((d) => d.status === 'Healthy').length;
  const failedDeployments = deployments.filter((d) => d.status === 'Failed').length;
  const successRate = totalDeployments > 0 ? Math.round((successfulDeployments / totalDeployments) * 100) : 0;

  const buildsWithTime = deployments.filter((d) => d.buildDurationMs > 0);
  const avgBuildTimeMs = buildsWithTime.length > 0
    ? Math.round(buildsWithTime.reduce((acc, curr) => acc + curr.buildDurationMs, 0) / buildsWithTime.length)
    : 0;

  return {
    totalDeployments,
    successfulDeployments,
    failedDeployments,
    successRate,
    avgBuildTimeMs,
    avgDeployTimeMs: avgBuildTimeMs
  };
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
  getDeploymentById,
  getDeploymentLogs,
  updateDeploymentStatus,
  failDeployment,
  retryDeployment,
  cancelDeploymentHandler,
  rollbackDeploymentHandler,
  getDeploymentAnalytics,
  appendLog: appendDeploymentLog,
  getDeploymentError
};
