const { Worker } = require('bullmq');
const { getRedis, isRedisMocked } = require('../config/redis');
const { executePipeline } = require('../deployment/DeploymentEngine');
const { logger } = require('../utils/logger');

function startDeploymentWorkers() {
  if (isRedisMocked()) {
    logger.info('Skipping BullMQ Worker initialization (Redis is in mock mode)');
    return;
  }

  const worker = new Worker(
    'deployment-jobs',
    async (job) => {
      logger.info('Processing deployment job', { jobId: job.id, deploymentId: job.data.deploymentId });
      await executePipeline(job.data.deploymentId);
    },
    {
      connection: getRedis(),
      concurrency: 2
    }
  );

  worker.on('completed', (job) => {
    logger.info('Deployment job completed', { jobId: job.id, deploymentId: job.data.deploymentId });
  });

  worker.on('failed', (job, error) => {
    logger.error('Deployment job failed', { jobId: job?.id, deploymentId: job?.data?.deploymentId, error: error.message });
  });
}

module.exports = { startDeploymentWorkers, executePipeline };
