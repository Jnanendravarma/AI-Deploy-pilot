const Redis = require('ioredis');
const env = require('./env');
const { logger } = require('../utils/logger');

let redis;
let isMock = false;

async function connectRedis() {
  return new Promise((resolve) => {
    isMock = false;
    
    // We try to connect. If it fails, we fall back to mock mode.
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      connectTimeout: 2000,
      retryStrategy(times) {
        if (times > 1) {
          isMock = true;
          logger.warn('Redis connection failed. Running queue in mock mode.');
          return null; // Stops retrying
        }
        return 1000;
      }
    });

    redis.on('connect', () => {
      logger.info('Redis connected');
      resolve();
    });

    redis.on('error', (error) => {
      logger.error('Redis error', { error: error.message });
      isMock = true;
      resolve(); // Resolve to avoid stalling bootstrap
    });
  });
}

function getRedis() {
  if (isMock) {
    return null;
  }
  return redis;
}

function isRedisMocked() {
  return isMock;
}

module.exports = { connectRedis, getRedis, isRedisMocked };
