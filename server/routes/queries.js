const express = require('express');
const router = express.Router();
const Runner = require('../models/Runner');

// Example query: Full Marathon finishers
router.get('/full-marathon-finishers', async (req, res) => {
  try {
    const finishers = await Runner.find({
      categories: 'Full Marathon',
      didFinish: true
    });
    res.send(finishers);
  } catch (err) {
    res.status(500).send({ error: 'Query failed', details: err });
  }
});

module.exports = router;