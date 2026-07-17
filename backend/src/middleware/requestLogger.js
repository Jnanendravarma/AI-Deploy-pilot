const morgan = require('morgan');
const { logger } = require('../utils/logger');

const requestLogger = morgan((tokens, req, res) => {
  const message = {
    method: tokens.method(req, res),
    path: tokens.url(req, res),
    status: Number(tokens.status(req, res)),
    responseMs: Number(tokens['response-time'](req, res)),
    contentLength: tokens.res(req, res, 'content-length')
  };
  logger.info('HTTP request', message);
  return null;
});

module.exports = { requestLogger };
