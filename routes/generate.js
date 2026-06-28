const express = require('express');
const crypto = require('crypto');
const License = require('../models/License');
const adminAuth = require('../middleware/auth');
const router = express.Router();

router.post('/', adminAuth, async (req, res) => {
  try {
    const { type } = req.body;

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

module.exports = router;
