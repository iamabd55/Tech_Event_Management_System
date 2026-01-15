const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middlewares/auth');

// Count teams (MOVED TO TOP - before /:id route)
router.get('/count', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM teams');
    res.json({ count: rows[0].count });
  } catch (error) {
    console.error('Error counting teams:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all teams
router.get('/', auth(), async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        t.*,
        u.name as captain_name,
        e.title as event_name
      FROM teams t
      LEFT JOIN users u ON t.captain_id = u.id
      LEFT JOIN events e ON t.event_id = e.id
      ORDER BY t.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get teams by event
router.get('/event/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const [rows] = await pool.query(`
      SELECT 
        t.*,
        u.name as captain_name
      FROM teams t
      LEFT JOIN users u ON t.captain_id = u.id
      WHERE t.event_id = ?
      ORDER BY t.created_at DESC
    `, [eventId]);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get team by ID with members
router.get('/:id', auth(), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get team details
    const [teamRows] = await pool.query(`
      SELECT 
        t.*,
        u.name as captain_name,
        u.email as captain_email,
        e.title as event_name
      FROM teams t
      LEFT JOIN users u ON t.captain_id = u.id
      LEFT JOIN events e ON t.event_id = e.id
      WHERE t.id = ?
    `, [id]);
    
    if (teamRows.length === 0) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    const team = teamRows[0];
    
    // Get team members
    const [memberRows] = await pool.query(`
      SELECT 
        tm.id,
        tm.user_id,
        tm.role,
        tm.status,
        u.name,
        u.email
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = ?
      ORDER BY 
        CASE 
          WHEN tm.role = 'Leader' THEN 1
          WHEN tm.role = 'Member' THEN 2
          ELSE 3
        END,
        u.name
    `, [id]);
    
    // Attach members to team object
    team.members = memberRows;
    
    res.json(team);
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create team
router.post('/', auth(), async (req, res) => {
  try {
    const { name, event_id } = req.body;
    const captain_id = req.user.id;
    
    // Check if user is already in a team for this event
    const [existingTeam] = await pool.query(`
      SELECT t.id, t.name 
      FROM teams t
      JOIN team_members tm ON t.id = tm.team_id
      WHERE t.event_id = ? AND tm.user_id = ?
      LIMIT 1
    `, [event_id, captain_id]);
    
    if (existingTeam.length > 0) {
      return res.status(400).json({ 
        message: `You are already registered in team "${existingTeam[0].name}" for this competition. You cannot create another team for the same event.` 
      });
    }
    
    // Check if team name already exists for this event
    const [duplicateName] = await pool.query(
      'SELECT id FROM teams WHERE name = ? AND event_id = ?',
      [name, event_id]
    );
    
    if (duplicateName.length > 0) {
      return res.status(400).json({ 
        message: 'A team with this name already exists for this competition. Please choose a different name.' 
      });
    }
    
    // Insert team
    const [result] = await pool.query(
      'INSERT INTO teams (name, event_id, captain_id) VALUES (?, ?, ?)',
      [name, event_id, captain_id]
    );
    
    const teamId = result.insertId;
    
    // Add captain as team member with Leader role
    await pool.query(
      'INSERT INTO team_members (team_id, user_id, role, status) VALUES (?, ?, ?, ?)',
      [teamId, captain_id, 'Leader', 'accepted']
    );
    
    res.status(201).json({ 
      id: teamId,
      message: 'Team created successfully' 
    });
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update team
router.put('/:id', auth(), async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    // Check if user is the captain
    const [teamRows] = await pool.query(
      'SELECT captain_id FROM teams WHERE id = ?',
      [id]
    );
    
    if (teamRows.length === 0) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    if (teamRows[0].captain_id !== req.user.id) {
      return res.status(403).json({ message: 'Only team captain can update team' });
    }
    
    await pool.query(
      'UPDATE teams SET name = ? WHERE id = ?',
      [name, id]
    );
    
    res.json({ message: 'Team updated successfully' });
  } catch (error) {
    console.error('Error updating team:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete team
router.delete('/:id', auth(), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user is the captain
    const [teamRows] = await pool.query(
      'SELECT captain_id FROM teams WHERE id = ?',
      [id]
    );
    
    if (teamRows.length === 0) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    if (teamRows[0].captain_id !== req.user.id) {
      return res.status(403).json({ message: 'Only team captain can delete team' });
    }
    
    // Delete team members first (foreign key constraint)
    await pool.query('DELETE FROM team_members WHERE team_id = ?', [id]);
    
    // Delete team
    await pool.query('DELETE FROM teams WHERE id = ?', [id]);
    
    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Error deleting team:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;