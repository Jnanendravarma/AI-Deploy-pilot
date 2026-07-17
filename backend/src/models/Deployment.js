const mongoose = require('mongoose');

const stepSchema = new mongoose.Schema({
  name: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Building', 'Running', 'Healthy', 'Warning', 'Failed', 'Stopped', 'Cancelled'], default: 'Pending' },
  startedAt: { type: Date },
  finishedAt: { type: Date },
  detail: { type: String }
}, { _id: false });

const deploymentSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  triggeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['Pending', 'Building', 'Running', 'Healthy', 'Warning', 'Failed', 'Stopped', 'Cancelled'], default: 'Pending', index: true },
  commitSha: { type: String },
  branch: { type: String },
  imageTag: { type: String },
  containerId: { type: String },
  healthUrl: { type: String },
  steps: { type: [stepSchema], default: [] },
  buildDurationMs: { type: Number, default: 0 },
  retryOfDeploymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Deployment' }
}, { timestamps: true });

module.exports = mongoose.model('Deployment', deploymentSchema);
