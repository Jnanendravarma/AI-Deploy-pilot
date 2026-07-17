const crypto = require('crypto');
const { ApiError } = require('../errors/ApiError');
const { userRepository } = require('../repositories/userRepository');
const { hashPassword, comparePassword } = require('../utils/hash');
const { signAccessToken, signRefreshToken, verifyRefreshToken, createResetToken } = require('../utils/tokens');

function tokenPayload(user) {
  return {
    userId: user._id.toString(),
    role: user.role || 'Developer'
  };
}

async function register({ name, email, password }) {
  const existingUser = await userRepository.findByEmail(email);
  if (existingUser) {
    throw new ApiError(400, 'User with this email already exists');
  }

  const passwordHash = await hashPassword(password);
  const user = await userRepository.create({
    name,
    email,
    passwordHash,
    role: 'Developer'
  });

  const payload = tokenPayload(user);
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await userRepository.pushRefreshToken(user._id, refreshToken);

  return {
    user: {
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role
    },
    accessToken,
    refreshToken
  };
}

async function login({ email, password }) {
  const user = await userRepository.findByEmail(email);
  if (!user || !user.passwordHash) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const isMatch = await comparePassword(password, user.passwordHash);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const payload = tokenPayload(user);
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await userRepository.pushRefreshToken(user._id, refreshToken);

  return {
    user: {
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role
    },
    accessToken,
    refreshToken
  };
}

async function refreshToken(token) {
  try {
    const payload = verifyRefreshToken(token);
    const user = await userRepository.findById(payload.userId);
    if (!user) {
      throw new ApiError(401, 'Invalid refresh token');
    }

    const tokenExists = user.refreshTokens.some((t) => t.token === token);
    if (!tokenExists) {
      throw new ApiError(401, 'Invalid refresh token');
    }

    const newPayload = tokenPayload(user);
    const newAccessToken = signAccessToken(newPayload);
    const newRefreshToken = signRefreshToken(newPayload);

    // Swap old token for new one
    await userRepository.removeRefreshToken(user._id, token);
    await userRepository.pushRefreshToken(user._id, newRefreshToken);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, 'Invalid or expired refresh token');
  }
}

async function logout(userId, token) {
  await userRepository.removeRefreshToken(userId, token);
}

async function forgotPassword(email) {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    return { resetToken: null };
  }

  const { plain, hash } = createResetToken();
  const resetPasswordExpiresAt = Date.now() + 3600000; // 1 hour

  await userRepository.updateById(user._id, {
    resetPasswordTokenHash: hash,
    resetPasswordExpiresAt
  });

  return { resetToken: plain };
}

async function resetPassword(token, newPassword) {
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const user = await userRepository.updateById(
    {
      resetPasswordTokenHash: hash,
      resetPasswordExpiresAt: { $gt: new Date() }
    },
    {}
  );

  // We find user by hash and expiry manually to ensure it meets constraints
  const matchedUser = await userRepository.findByResetToken(hash);

  if (!matchedUser) {
    throw new ApiError(400, 'Password reset token is invalid or has expired');
  }

  const passwordHash = await hashPassword(newPassword);
  matchedUser.passwordHash = passwordHash;
  matchedUser.resetPasswordTokenHash = undefined;
  matchedUser.resetPasswordExpiresAt = undefined;
  matchedUser.refreshTokens = []; // Revoke active sessions on password change

  await matchedUser.save();
}

module.exports = {
  tokenPayload,
  register,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword
};
