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

// Root - Status page
app.get('/', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? 'Connected' : dbState === 2 ? 'Connecting...' : 'Disconnected';
  const dbColor = dbState === 1 ? '#10b981' : dbState === 2 ? '#f59e0b' : '#ef4444';

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RealNpcs Licensing API</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #e2e8f0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      max-width: 560px;
      width: 100%;
    }
    .logo {
      text-align: center;
      margin-bottom: 32px;
    }
    .logo h1 {
      font-size: 2rem;
      font-weight: 700;
      background: linear-gradient(135deg, #60a5fa, #a78bfa);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .logo p {
      color: #94a3b8;
      margin-top: 4px;
      font-size: 0.95rem;
    }
    .card {
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(148, 163, 184, 0.1);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 20px;
      backdrop-filter: blur(10px);
    }
    .status-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
    }
    .status-row + .status-row {
      border-top: 1px solid rgba(148, 163, 184, 0.1);
    }
    .status-label {
      color: #94a3b8;
      font-size: 0.9rem;
    }
    .status-value {
      font-weight: 600;
      font-size: 0.9rem;
    }
    .dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-right: 8px;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 600;
    }
    .badge-green { background: rgba(16, 185, 129, 0.15); color: #10b981; }
    .badge-blue { background: rgba(96, 165, 250, 0.15); color: #60a5fa; }
    .endpoints h3 {
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      margin-bottom: 12px;
    }
    .endpoint {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 0;
    }
    .endpoint + .endpoint {
      border-top: 1px solid rgba(148, 163, 184, 0.1);
    }
    .method {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 4px;
      background: rgba(96, 165, 250, 0.15);
      color: #60a5fa;
      min-width: 50px;
      text-align: center;
    }
    .path {
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 0.9rem;
      color: #cbd5e1;
    }
    .footer {
      text-align: center;
      color: #475569;
      font-size: 0.8rem;
      margin-top: 24px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <h1>RealNpcs</h1>
      <p>Licensing API</p>
    </div>

    <div class="card">
      <div class="status-row">
        <span class="status-label">API Status</span>
        <span class="status-value"><span class="dot" style="background: #10b981;"></span>Online</span>
      </div>
      <div class="status-row">
        <span class="status-label">Database</span>
        <span class="status-value"><span class="dot" style="background: ${dbColor};"></span>${dbStatus}</span>
      </div>
      <div class="status-row">
        <span class="status-label">Environment</span>
        <span class="badge badge-green">Production</span>
      </div>
      <div class="status-row">
        <span class="status-label">License Types</span>
        <span class="badge badge-blue">PAID &amp; DEMO</span>
      </div>
    </div>

    <div class="footer">RealNpcs Licensing Server</div>
  </div>
</body>
</html>`);
});

// GET /version - Plugin update checker
app.get('/version', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send('2.0-SNAPSHOT');
});

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
