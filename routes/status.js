const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

router.get('/', (req, res) => {
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

module.exports = router;
