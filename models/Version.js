const mongoose = require('mongoose');

const versionSchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true },
  value: { type: String, required: true }
});

module.exports = mongoose.model('Version', versionSchema);
