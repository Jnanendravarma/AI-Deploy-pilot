const mongoose = require('mongoose');

const deploymentErrorSchema = new mongoose.Schema({
  deploymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Deployment', required: true, index: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  rootCause: { type: String, required: true },
  possibleCauses: [{ type: String }],
  confidenceScore: { type: Number, min: 0, max: 100 },
  suggestedFix: { type: String },
  documentationLink: { type: String },
  resolved: { type: Boolean, default: false },
  resolvedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('DeploymentError', deploymentErrorSchema);
