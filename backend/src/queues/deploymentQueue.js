const { Queue } = require('bullmq');
const { getRedis, isRedisMocked } = require('../config/redis');

let deploymentQueue;

function getDeploymentQueue() {
  if (isRedisMocked()) {
    return null;
  }
  if (!deploymentQueue) {
    const connection = getRedis();
    if (connection) {
      deploymentQueue = new Queue('deployment-jobs', { connection });
    }
  }
  return deploymentQueue;
}

async function enqueueDeploymentJob(payload) {
  if (isRedisMocked()) {
    // Process job in-process asynchronously to prevent circular dependency
    const { executePipeline } = require('../jobs/deploymentWorker');
    
    // We defer the execution slightly so the controller returns 201 immediately
    setTimeout(() => {
      executePipeline(payload.deploymentId).catch((err) => {
        const { logger } = require('../utils/logger');
        logger.error('In-process deployment job failed', { error: err.message });
      });
    }, 100);

    return { id: `inprocess-job-${Date.now()}` };
  }

  const queue = getDeploymentQueue();
  if (!queue) {
    throw new Error('Deployment queue is unavailable (Redis is not running)');
  }

  return queue.add('run-deployment', payload, {
    removeOnComplete: 200,
    removeOnFail: 500,
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 }
  });
}

module.exports = { getDeploymentQueue, enqueueDeploymentJob };
