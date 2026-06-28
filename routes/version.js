const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send('2.0-SNAPSHOT');
});

module.exports = router;
