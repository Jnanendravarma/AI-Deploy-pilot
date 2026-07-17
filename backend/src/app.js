const http = require('http');
const dotenv = require('dotenv');
const { createApp } = require('./config/express');
const { connectDatabase } = require('./config/database');
const { connectRedis } = require('./config/redis');
const { initSocket } = require('./socket');
const { startDeploymentWorkers } = require('./jobs/deploymentWorker');
const { logger } = require('./utils/logger');

dotenv.config();

const port = Number(process.env.PORT || 5000);

async function bootstrap() {
  await connectDatabase();
  await connectRedis();

  const app = createApp();
  const server = http.createServer(app);

  initSocket(server);
  startDeploymentWorkers();

  server.listen(port, () => {
    logger.info(`Backend listening on port ${port}`);
  });
}

bootstrap().catch((error) => {
  logger.error('Bootstrap failed', { error: error.message, stack: error.stack });
  process.exit(1);
});
