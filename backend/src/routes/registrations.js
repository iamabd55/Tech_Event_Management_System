// src/routes/registrations.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middlewares/auth');

// ----------------------------------------------------
// REGISTER FOR EVENT (INDIVIDUAL)
// ----------------------------------------------------
router.post('/', auth(), async (req, res) => {
  const { event_id } = req.body;
  const user_id = req.user.id;

  if (!event_id) {
    return res.status(400).json({ message: 'event_id required' });
  }

  try {
    // Check if event exists
    const [eventRows] = await pool.query(
      'SELECT capacity FROM events WHERE id = ?',
      [event_id]
    );

    if (!eventRows.length) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const event = eventRows[0];

    // Check if user is already registered individually
    const [exists] = await pool.query(
      `SELECT id FROM registrations
       WHERE user_id = ? AND event_id = ? AND team_id IS NULL`,
      [user_id, event_id]
    );

    if (exists.length) {
      return res.status(409).json({ message: 'Already registered' });
    }

    // Capacity validation
    if (event.capacity && event.capacity > 0) {
      const [countRows] = await pool.query(
        `SELECT COUNT(*) AS count
         FROM registrations
         WHERE event_id = ? AND status = ?`,
        [event_id, 'registered']
      );

      if (countRows[0].count >= event.capacity) {
        return res.status(400).json({ message: 'Event is full' });
      }
    }

    // Insert registration
    const [result] = await pool.query(
      `INSERT INTO registrations (user_id, event_id)
       VALUES (?, ?)`,
      [user_id, event_id]
    );

    res.status(201).json({
      id: result.insertId,
      message: 'Registered successfully'
    });

  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ----------------------------------------------------
// CANCEL REGISTRATION
// ----------------------------------------------------
router.delete('/:id', auth(), async (req, res) => {
  const regId = req.params.id;

  try {
    const [rows] = await pool.query(
      'SELECT user_id FROM registrations WHERE id = ?',
      [regId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    const owner = rows[0].user_id;

    // Only the owner or admin can delete
    if (owner !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not allowed' });
    }

    await pool.query('DELETE FROM registrations WHERE id = ?', [regId]);

    res.json({ message: 'Registration cancelled' });

  } catch (err) {
    console.error('Delete Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ----------------------------------------------------
// LIST USER'S REGISTRATIONS
// ----------------------------------------------------
router.get('/my', auth(), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
          r.*,
          e.id AS event_id,
          e.title AS event_name,
          e.start_datetime,
          e.venue
       FROM registrations r
       JOIN events e ON e.id = r.event_id
       WHERE r.user_id = ?`,
      [req.user.id]
    );

    res.json(rows);

  } catch (err) {
    console.error('Fetch User Registrations Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
