const express = require('express');
const License = require('../models/License');
const router = express.Router();

router.post('/', async (req, res) => {
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

module.exports = router;
