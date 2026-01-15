const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middlewares/auth');

// Get all events with sorting support
router.get('/', async (req, res) => {
  try {
    const { sortBy } = req.query;
    
    // Determine ORDER BY clause based on sortBy parameter
    let orderClause = 'ORDER BY created_at DESC'; // default: latest first
    
    switch(sortBy) {
      case 'latest':
        orderClause = 'ORDER BY start_datetime DESC';
        break;
      case 'oldest':
        orderClause = 'ORDER BY start_datetime ASC';
        break;
      case 'alphabetical':
        orderClause = 'ORDER BY title ASC';
        break;
      case 'open-first':
        orderClause = 'ORDER BY CASE WHEN registration_status = "open" THEN 0 ELSE 1 END, start_datetime DESC';
        break;
      case 'closed-first':
        orderClause = 'ORDER BY CASE WHEN registration_status = "closed" THEN 0 ELSE 1 END, start_datetime DESC';
        break;
      default:
        orderClause = 'ORDER BY created_at DESC';
    }
    
    const [rows] = await pool.query(
      `SELECT id, title, description, venue, start_datetime, end_datetime, capacity, registration_status, rules, created_at 
       FROM events 
       ${orderClause}`
    );
    
    // Ensure rules is never null for any event
    const events = rows.map(row => ({
      ...row,
      rules: row.rules || ''
    }));
    
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Count all events
router.get('/count', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM events');
    res.json({ count: rows[0].count });
  } catch (error) {
    console.error('Error counting events:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single event by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM events WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Ensure rules is never null
    const event = {
      ...rows[0],
      rules: rows[0].rules || ''
    };
    
    res.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new event (admin only)
router.post('/', auth(['admin']), async (req, res) => {
  try {
    const { title, description, venue, start_datetime, end_datetime, capacity, registration_status, rules } = req.body;
    
    const [result] = await pool.query(
      'INSERT INTO events (title, description, venue, start_datetime, end_datetime, capacity, registration_status, rules) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [title, description, venue, start_datetime, end_datetime, capacity, registration_status, rules]
    );
    
    res.status(201).json({ 
      id: result.insertId, 
      message: 'Event created successfully' 
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update event (admin only)
router.put('/:id', auth(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, venue, start_datetime, end_datetime, capacity, registration_status, rules } = req.body;
    
    // Validate required fields
    if (!title || !start_datetime) {
      return res.status(400).json({ message: 'Title and start date are required' });
    }
    
    await pool.query(
      'UPDATE events SET title = ?, description = ?, venue = ?, start_datetime = ?, end_datetime = ?, capacity = ?, registration_status = ?, rules = ? WHERE id = ?',
      [title, description, venue, start_datetime, end_datetime, capacity, registration_status, rules, id]
    );
    
    // Fetch and return the updated event
    const [rows] = await pool.query('SELECT * FROM events WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete event (admin only)
router.delete('/:id', auth(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if event exists
    const [eventRows] = await pool.query('SELECT id FROM events WHERE id = ?', [id]);
    if (eventRows.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Delete event
    await pool.query('DELETE FROM events WHERE id = ?', [id]);
    
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;