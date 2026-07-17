const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  passwordHash: { type: String },
  role: { type: String, enum: ['Developer', 'Admin'], default: 'Developer' },
  avatar: { type: String },
  oauthProviders: {
    googleId: { type: String },
    githubId: { type: String }
  },
  refreshTokens: [{ token: { type: String }, createdAt: { type: Date, default: Date.now } }],
  resetPasswordTokenHash: { type: String },
  resetPasswordExpiresAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
