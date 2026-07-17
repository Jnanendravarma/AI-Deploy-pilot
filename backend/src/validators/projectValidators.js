const Joi = require('joi');

const createProjectSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(2).max(120).required(),
    repositoryUrl: Joi.string().uri().allow(null, ''),
    repositoryProvider: Joi.string().valid('github', 'zip', 'manual').default('manual'),
    packageJson: Joi.object().default({}),
    fileNames: Joi.array().items(Joi.string()).default([]),
    envVars: Joi.array().items(Joi.object({
      key: Joi.string().required(),
      value: Joi.string().required()
    })).default([])
  }).required(),
  params: Joi.object({}).default({}),
  query: Joi.object({}).default({})
});

const projectIdSchema = Joi.object({
  body: Joi.object({}).default({}),
  params: Joi.object({ projectId: Joi.string().required() }).required(),
  query: Joi.object({}).default({})
});

const importGithubSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(2).max(120).required(),
    repositoryUrl: Joi.string().uri().required(),
    envVars: Joi.array().items(Joi.object({
      key: Joi.string().required(),
      value: Joi.string().required()
    })).default([])
  }).required(),
  params: Joi.object({}).default({}),
  query: Joi.object({}).default({})
});

module.exports = { createProjectSchema, projectIdSchema, importGithubSchema };
