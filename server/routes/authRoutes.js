const express = require('express');
const router = express.Router();

router.post('/register', (req, res) => {
  // logika register
  res.send('Register endpoint hit');
});

module.exports = router;
