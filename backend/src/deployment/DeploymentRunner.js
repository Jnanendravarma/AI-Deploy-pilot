/**
 * DeploymentRunner.js
 * Controls deployment lifecycle actions including cancellation, redeployment,
 * and rollbacks to previous successful deployments.
 */

const { deploymentRepository } = require('../repositories/deploymentRepository');
const { projectRepository } = require('../repositories/projectRepository');
const { stopAndRemoveContainer } = require('./DockerService');

async function cancelDeployment(deploymentId) {
  const deployment = await deploymentRepository.findById(deploymentId);
  if (!deployment) {
    throw new Error('Deployment not found');
  }

  if (['Healthy', 'Failed', 'Cancelled'].includes(deployment.status)) {
    return deployment; // Already in terminal state
  }

  deployment.status = 'Cancelled';
  await deployment.save();

  if (deployment.containerId) {
    await stopAndRemoveContainer(deployment.containerId);
  }

  return deployment;
}

async function rollbackDeployment(userId, projectId, targetDeploymentId) {
  const target = await deploymentRepository.findById(targetDeploymentId);
  if (!target || target.projectId !== projectId) {
    throw new Error('Target deployment for rollback not found');
  }

  if (target.status !== 'Healthy') {
    throw new Error('Cannot rollback to a deployment that was not successful');
  }

  const project = await projectRepository.findByIdAndOwner(projectId, userId);
  if (!project) {
    throw new Error('Project not found or unauthorized');
  }

  // Create a new rollback deployment record using the target's image tag & metadata
  const rollbackRecord = await deploymentRepository.create({
    projectId,
    triggeredBy: userId,
    status: 'Pending',
    branch: target.branch || 'main',
    commitSha: target.commitSha || 'rollback',
    imageTag: target.imageTag,
    steps: [
      { name: 'Queued', status: 'Healthy' },
      { name: 'Initializing', status: 'Healthy' },
      { name: 'Downloading', status: 'Healthy' },
      { name: 'Installing', status: 'Healthy' },
      { name: 'Building', status: 'Healthy' },
      { name: 'Starting', status: 'Healthy' },
      { name: 'Health Check', status: 'Healthy' },
      { name: 'Completed', status: 'Healthy' }
    ],
    healthUrl: target.healthUrl,
    containerId: target.containerId,
    retryOfDeploymentId: targetDeploymentId
  });

  rollbackRecord.status = 'Healthy';
  await rollbackRecord.save();

  return rollbackRecord;
}

module.exports = { cancelDeployment, rollbackDeployment };
