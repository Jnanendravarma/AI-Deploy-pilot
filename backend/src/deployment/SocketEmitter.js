/**
 * SocketEmitter.js
 * Wrapper for emitting deployment logs, status updates, and timeline step events over Socket.IO.
 */

const { emitDeploymentLog, emitDeploymentStatus } = require('../socket');

function sendLog(deploymentId, logPayload) {
  emitDeploymentLog(deploymentId, logPayload);
}

function sendStatus(deploymentId, statusPayload) {
  emitDeploymentStatus(deploymentId, statusPayload);
}

function sendTimelineStep(deploymentId, stepPayload) {
  emitDeploymentStatus(deploymentId, {
    type: 'step_update',
    ...stepPayload
  });
}

module.exports = {
  sendLog,
  sendStatus,
  sendTimelineStep,
  emitDeploymentLog,
  emitDeploymentStatus
};
