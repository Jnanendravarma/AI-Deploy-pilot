const env = require('../config/env');
const { ApiError } = require('../errors/ApiError');
const { asyncHandler } = require('../middleware/asyncHandler');
const authService = require('../services/authService');
const { sendSuccess } = require('../utils/response');

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  return sendSuccess(res, result, 'Registered successfully', 201);
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  return sendSuccess(res, result, 'Logged in successfully');
});

const refresh = asyncHandler(async (req, res) => {
  const result = await authService.refreshToken(req.body.refreshToken);
  return sendSuccess(res, result, 'Token refreshed');
});

const me = asyncHandler(async (req, res) => {
  const user = await require('../repositories/userRepository').userRepository.findById(req.user.userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return sendSuccess(res, {
    user: {
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar
    }
  }, 'Current user');
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user.userId, req.body.refreshToken);
  return sendSuccess(res, {}, 'Logged out');
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { resetToken } = await authService.forgotPassword(req.body.email);
  const resetUrl = resetToken ? `${env.RESET_URL_BASE}?token=${resetToken}` : null;
  return sendSuccess(res, { resetUrl }, 'If account exists, reset instructions were generated');
});

const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body.token, req.body.newPassword);
  return sendSuccess(res, {}, 'Password reset successful');
});

const oauthSuccess = asyncHandler(async (req, res) => {
  const user = req.user;
  const accessToken = require('../utils/tokens').signAccessToken(authService.tokenPayload(user));
  const refreshToken = require('../utils/tokens').signRefreshToken(authService.tokenPayload(user));
  await require('../repositories/userRepository').userRepository.pushRefreshToken(user._id, refreshToken);

  const redirect = `${env.FRONTEND_URL}/login?accessToken=${encodeURIComponent(accessToken)}&refreshToken=${encodeURIComponent(refreshToken)}`;
  return res.redirect(redirect);
});

module.exports = { register, login, refresh, me, logout, forgotPassword, resetPassword, oauthSuccess };
