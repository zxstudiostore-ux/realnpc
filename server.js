const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/realnpcs-licensing')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// License Schema
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

const License = mongoose.model('License', licenseSchema);

// POST /verify
app.post('/verify', async (req, res) => {
  try {
    const { key, serverId } = req.body;

    if (!key || !serverId) {
      return res.status(400).json({ status: 'INVALID', message: 'Key and serverId are required' });
    }

    const license = await License.findOne({ key });

    if (!license || !license.isActive) {
      return res.status(403).json({ status: 'INVALID' });
    }

    if (license.type === 'PAID') {
      // If old server pings and doesn't match current activeServerId
      if (license.activeServerId && license.activeServerId !== serverId) {
        return res.status(403).json({ status: 'INVALID' });
      }

      // Update activeServerId to current server
      license.activeServerId = serverId;
      await license.save();

      return res.status(200).json({ status: 'VALID', type: 'PAID' });
    }

    if (license.type === 'DEMO') {
      const usage = license.demoUsages.find(u => u.serverId === serverId);

      if (!usage) {
        // First time usage - add to array
        license.demoUsages.push({
          serverId,
          firstUsed: new Date()
        });
        await license.save();
        return res.status(200).json({ status: 'VALID', type: 'DEMO' });
      }

      // Calculate days since first usage
      const daysSinceFirstUse = Math.floor((Date.now() - new Date(usage.firstUsed).getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceFirstUse >= 6) {
        return res.status(403).json({
          status: 'EXPIRED',
          type: 'DEMO',
          message: 'Demo expired.'
        });
      }

      if (daysSinceFirstUse === 5) {
        return res.status(200).json({
          status: 'VALID',
          type: 'DEMO',
          message: 'This demo access will get over in 1 day'
        });
      }

      return res.status(200).json({ status: 'VALID', type: 'DEMO' });
    }

  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ status: 'ERROR', message: 'Internal server error' });
  }
});

// POST /generate - Admin endpoint
app.post('/generate', async (req, res) => {
  try {
    const { type } = req.body;
    const adminSecret = req.headers['x-admin-secret'];

    if (adminSecret !== process.env.ADMIN_SECRET) {
      return res.status(401).json({ status: 'UNAUTHORIZED' });
    }

    if (!type || !['PAID', 'DEMO'].includes(type)) {
      return res.status(400).json({ status: 'INVALID', message: 'Type must be PAID or DEMO' });
    }

    const newKey = crypto.randomBytes(16).toString('hex').toUpperCase();

    const license = new License({
      key: newKey,
      type
    });

    await license.save();

    res.status(201).json({ status: 'SUCCESS', key: newKey, type });
  } catch (error) {
    console.error('Generate error:', error);
    res.status(500).json({ status: 'ERROR', message: 'Internal server error' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
