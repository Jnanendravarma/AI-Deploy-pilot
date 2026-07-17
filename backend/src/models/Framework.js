const mongoose = require('mongoose');

const frameworkSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  detectorRules: { type: mongoose.Schema.Types.Mixed, default: {} },
  dockerTemplate: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Framework', frameworkSchema);
