const mongoose = require('mongoose');

const licenseSchema = new mongoose.Schema({
  key: { type: String, unique: true, required: true },
  type: { type: String, enum: ['PAID', 'DEMO'], required: true },
  activeServerId: { type: String, default: null },
  demoUsages: [{
    serverId: String,
    firstUsed: Date
  }],
  isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model('License', licenseSchema);
