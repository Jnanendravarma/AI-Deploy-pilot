const { logger } = require('../utils/logger');
const { ApiError } = require('../errors/ApiError');

function notFound(_req, _res, next) {
  next(new ApiError(404, 'Route not found'));
}

function errorHandler(error, req, res, _next) {
  const status = error.statusCode || 500;
  const message = error.message || 'Internal server error';

  logger.error('Request failed', {
    method: req.method,
    path: req.originalUrl,
    status,
    message,
    stack: error.stack
  });

  return res.status(status).json({
    success: false,
    message,
    details: error.details
  });
}

module.exports = { notFound, errorHandler };
