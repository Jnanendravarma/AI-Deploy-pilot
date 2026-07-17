const { getSupabaseClient } = require('./supabase');
const { logger } = require('../utils/logger');

async function connectDatabase() {
  getSupabaseClient();
  logger.info('Supabase client initialized successfully');
}

module.exports = { connectDatabase };
