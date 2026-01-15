const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get event schedule/sessions by event ID
router.get('/event/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const [rows] = await pool.query(`
      SELECT * FROM event_sessions
      WHERE event_id = ?
      ORDER BY start_time ASC
    `, [eventId]);
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Count all sessions
router.get('/count', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM event_sessions');
    res.json({ count: rows[0].count });
  } catch (error) {
    console.error('Error counting sessions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;