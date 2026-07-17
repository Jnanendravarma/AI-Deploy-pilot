const express = require('express');
const { passport } = require('../config/passport');
const { validateRequest } = require('../middleware/validateRequest');
const { requireAuth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { registerSchema, loginSchema, refreshSchema, forgotSchema, resetSchema } = require('../validators/authValidators');
const controller = require('../controllers/authController');

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register new user
 */
router.post('/register', authLimiter, validateRequest(registerSchema), controller.register);
router.post('/login', authLimiter, validateRequest(loginSchema), controller.login);
router.post('/refresh', authLimiter, validateRequest(refreshSchema), controller.refresh);
router.post('/forgot-password', authLimiter, validateRequest(forgotSchema), controller.forgotPassword);
router.post('/reset-password', authLimiter, validateRequest(resetSchema), controller.resetPassword);
router.post('/logout', requireAuth, controller.logout);
router.get('/me', requireAuth, controller.me);

router.get('/oauth/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get('/google/callback', passport.authenticate('google', { session: false }), controller.oauthSuccess);

router.get('/oauth/github', passport.authenticate('github', { session: false }));
router.get('/github/callback', passport.authenticate('github', { session: false }), controller.oauthSuccess);

module.exports = { authRoutes: router };
