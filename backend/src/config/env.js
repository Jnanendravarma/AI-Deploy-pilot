const Joi = require('joi');

const schema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().default(5000),
  MONGODB_URI: Joi.string().allow(''),
  SUPABASE_URL: Joi.string().required(),
  SUPABASE_SERVICE_ROLE_KEY: Joi.string().required(),
  REDIS_URL: Joi.string().required(),
  JWT_ACCESS_SECRET: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('30d'),
  CORS_ORIGIN: Joi.string().required(),
  GOOGLE_CLIENT_ID: Joi.string().allow(''),
  GOOGLE_CLIENT_SECRET: Joi.string().allow(''),
  GITHUB_CLIENT_ID: Joi.string().allow(''),
  GITHUB_CLIENT_SECRET: Joi.string().allow(''),
  OAUTH_CALLBACK_URL: Joi.string().allow(''),
  FRONTEND_URL: Joi.string().required(),
  MAIL_FROM: Joi.string().allow(''),
  RESET_URL_BASE: Joi.string().required(),
  CLOUDINARY_CLOUD_NAME: Joi.string().allow(''),
  CLOUDINARY_API_KEY: Joi.string().allow(''),
  CLOUDINARY_API_SECRET: Joi.string().allow('')
}).unknown(true);

const { value, error } = schema.validate(process.env, { abortEarly: false });

if (error) {
  throw new Error(`Environment validation failed: ${error.message}`);
}

module.exports = value;
