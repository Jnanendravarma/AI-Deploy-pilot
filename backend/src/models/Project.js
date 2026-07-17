const mongoose = require('mongoose');

const envVarSchema = new mongoose.Schema({
  key: { type: String, required: true },
  value: { type: String, required: true, select: false }
}, { _id: false });

const projectSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  repositoryUrl: { type: String },
  repositoryProvider: { type: String, enum: ['github', 'zip', 'manual'], default: 'manual' },
  framework: { type: String },
  language: { type: String },
  defaultBranch: { type: String, default: 'main' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  envVars: { type: [envVarSchema], default: [] },
  archived: { type: Boolean, default: false }
}, { timestamps: true });

projectSchema.index({ ownerId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Project', projectSchema);
