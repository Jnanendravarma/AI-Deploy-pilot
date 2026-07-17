const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const { requestLogger } = require('../middleware/requestLogger');
const { apiLimiter } = require('../middleware/rateLimiter');
const { mountSwagger } = require('./swagger');
const { passport, configurePassport } = require('./passport');
const { router } = require('../routes');
const { notFound, errorHandler } = require('../middleware/errorHandler');

dotenv.config();

function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(requestLogger);
  app.use(apiLimiter);

  configurePassport();
  app.use(passport.initialize());

  app.get('/health', (_req, res) => {
    res.status(200).json({ success: true, message: 'Healthy' });
  });

  mountSwagger(app);

  app.use('/api', router);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
