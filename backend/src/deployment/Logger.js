/**
 * Logger.js
 * Appends deployment logs to database and emits real-time updates over WebSocket.
 */

const { deploymentLogRepository } = require('../repositories/deploymentLogRepository');
const { emitDeploymentLog } = require('./SocketEmitter');

async function appendDeploymentLog(deployment, level, message) {
  try {
    const deploymentId = deployment._id ? deployment._id.toString() : deployment.id;
    const projectId = deployment.projectId ? deployment.projectId.toString() : deployment.project_id;

    const log = await deploymentLogRepository.create({
      deploymentId,
      projectId,
      level,
      message
    });

    emitDeploymentLog(deploymentId, log);
    return log;
  } catch (err) {
    console.error('Failed to append deployment log:', err.message);
    return null;
  }
}

module.exports = { appendDeploymentLog };
