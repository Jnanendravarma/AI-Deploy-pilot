const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true },
  totalDeployments: { type: Number, default: 0 },
  successRate: { type: Number, default: 0 },
  failureRate: { type: Number, default: 0 },
  averageBuildTimeMs: { type: Number, default: 0 },
  topErrors: [{ name: String, count: Number }],
  frameworkDistribution: [{ framework: String, count: Number }],
  averageRecoveryTimeMs: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Analytics', analyticsSchema);
