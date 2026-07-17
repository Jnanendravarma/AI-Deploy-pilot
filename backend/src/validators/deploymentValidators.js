const Joi = require('joi');

const createDeploymentSchema = Joi.object({
  body: Joi.object({
    projectId: Joi.string().required(),
    branch: Joi.string().default('main'),
    commitSha: Joi.string().allow('', null)
  }).required(),
  params: Joi.object({}).default({}),
  query: Joi.object({}).default({})
});

const deploymentIdSchema = Joi.object({
  body: Joi.object({}).default({}),
  params: Joi.object({ deploymentId: Joi.string().required() }).required(),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(200).default(100),
    search: Joi.string().allow(''),
    level: Joi.string().valid('info', 'warn', 'error', 'healed')
  }).default({})
});

module.exports = { createDeploymentSchema, deploymentIdSchema };
