require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');

const statusRoute = require('./routes/status');
const versionRoute = require('./routes/version');
const verifyRoute = require('./routes/verify');
const generateRoute = require('./routes/generate');

const app = express();
app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
app.use('/', statusRoute);
app.use('/version', versionRoute);
app.use('/verify', verifyRoute);
app.use('/generate', generateRoute);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
