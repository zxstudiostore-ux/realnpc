const express = require('express');
const Version = require('../models/Version');
const adminAuth = require('../middleware/auth');
const router = express.Router();

const DEFAULT_VERSION = '2.0-SNAPSHOT';

// GET /version - Returns current plugin version
router.get('/', async (req, res) => {
  try {
    const versionDoc = await Version.findOne({ name: 'plugin' });
    const version = versionDoc ? versionDoc.value : DEFAULT_VERSION;

    res.set('Content-Type', 'text/plain');
    res.send(version);
  } catch (error) {
    console.error('Version GET error:', error);
    res.set('Content-Type', 'text/plain');
    res.status(500).send(DEFAULT_VERSION);
  }
});

// POST /version - Admin: update plugin version
router.post('/', adminAuth, async (req, res) => {
  try {
    const { version } = req.body;

    if (!version || typeof version !== 'string') {
      return res.status(400).json({ status: 'INVALID', message: 'version string is required' });
    }

    const updated = await Version.findOneAndUpdate(
      { name: 'plugin' },
      { name: 'plugin', value: version },
      { upsert: true, new: true }
    );

    res.status(200).json({ status: 'SUCCESS', version: updated.value });
  } catch (error) {
    console.error('Version POST error:', error);
    res.status(500).json({ status: 'ERROR', message: 'Internal server error' });
  }
});

module.exports = router;
