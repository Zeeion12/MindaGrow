const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/users', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM siswa');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;