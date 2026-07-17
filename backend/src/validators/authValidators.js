const Joi = require('joi');

const registerSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(128).required()
  }).required(),
  params: Joi.object({}).default({}),
  query: Joi.object({}).default({})
});

const loginSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }).required(),
  params: Joi.object({}).default({}),
  query: Joi.object({}).default({})
});

const refreshSchema = Joi.object({
  body: Joi.object({
    refreshToken: Joi.string().required()
  }).required(),
  params: Joi.object({}).default({}),
  query: Joi.object({}).default({})
});

const forgotSchema = Joi.object({
  body: Joi.object({ email: Joi.string().email().required() }).required(),
  params: Joi.object({}).default({}),
  query: Joi.object({}).default({})
});

const resetSchema = Joi.object({
  body: Joi.object({
    token: Joi.string().required(),
    newPassword: Joi.string().min(8).max(128).required()
  }).required(),
  params: Joi.object({}).default({}),
  query: Joi.object({}).default({})
});

module.exports = { registerSchema, loginSchema, refreshSchema, forgotSchema, resetSchema };
