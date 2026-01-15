const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middlewares/auth');

// Get team members count (no auth needed for count)
router.get('/team-members-count', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM team_members_overview');
    res.json({ count: rows[0].count });
  } catch (error) {
    console.error('Error counting team members:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get team members list using the view (admin only)
router.get('/team-members', auth(['admin']), async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM team_members_overview');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;