const mongoose = require('mongoose');

const deploymentLogSchema = new mongoose.Schema({
  deploymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Deployment', required: true, index: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  level: { type: String, enum: ['info', 'warn', 'error', 'healed'], default: 'info' },
  message: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('DeploymentLog', deploymentLogSchema);
