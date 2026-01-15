// src/routes/users.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middlewares/auth');

// Get current user
router.get('/me', auth(), async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, phone, created_at FROM users WHERE id = ?', 
      [req.user.id]
    );
    if (!rows.length) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching current user:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get users count (public endpoint for stats)
router.get('/count', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE role != "admin"'
    );
    console.log('Users count:', rows[0].count);
    res.json({ count: rows[0].count });
  } catch (error) {
    console.error('Error counting users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Get all participants using the view
router.get('/', auth(['admin']), async (req, res) => {
  try {
    console.log('Fetching participants from view...');
    const [rows] = await pool.query('SELECT * FROM participants_overview');
    console.log('Participants fetched:', rows.length);
    
    if (rows.length === 0) {
      console.log('No participants found in view, checking users table directly...');
      const [userCheck] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role != "admin"');
      console.log('Direct users count (non-admin):', userCheck[0].count);
    }
    
    res.json(rows);
  } catch (err) {
    console.error('Error fetching participants from view:', err);
    console.error('Error details:', err.message);
    res.status(500).json({ 
      message: 'Server error', 
      details: err.message 
    });
  }
});

// Admin: Delete user with all related data
router.delete('/:id', auth(['admin']), async (req, res) => {
  const { id } = req.params;
  
  try {
    // Check if user exists and get their role
    const [user] = await pool.query(
      'SELECT id, name, role FROM users WHERE id = ?', 
      [id]
    );
    
    if (user.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prevent deletion of admin users
    if (user[0].role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete admin users' });
    }
    
    console.log(`Starting deletion process for user ${id} (${user[0].name})...`);
    
    // Get all teams where user is a member (before deletion)
    const [userTeams] = await pool.query(
      'SELECT team_id FROM team_members WHERE user_id = ?',
      [id]
    );
    
    let deletedStats = {
      invitations: 0,
      teamMemberships: 0,
      registrations: 0,
      emptyTeams: 0
    };
    
    // Step 1: Delete team invitations sent to this user
    try {
      const [deletedInvitations] = await pool.query(
        'DELETE FROM team_invitations WHERE invitee_id = ?',
        [id]
      );
      deletedStats.invitations = deletedInvitations.affectedRows;
      console.log(`Deleted ${deletedStats.invitations} team invitations`);
    } catch (err) {
      console.log('No invitations to delete or table does not exist');
    }
    
    // Step 2: Delete team member records
    const [deletedTeamMembers] = await pool.query(
      'DELETE FROM team_members WHERE user_id = ?',
      [id]
    );
    deletedStats.teamMemberships = deletedTeamMembers.affectedRows;
    console.log(`Deleted ${deletedStats.teamMemberships} team member records`);
    
    // Step 3: Check and delete empty teams
    for (const teamRow of userTeams) {
      const [remainingMembers] = await pool.query(
        'SELECT COUNT(*) as count FROM team_members WHERE team_id = ?',
        [teamRow.team_id]
      );
      
      if (remainingMembers[0].count === 0) {
        await pool.query('DELETE FROM teams WHERE id = ?', [teamRow.team_id]);
        deletedStats.emptyTeams++;
        console.log(`Deleted empty team ${teamRow.team_id}`);
      }
    }
    
    // Step 4: Delete registrations for events
    try {
      const [deletedRegistrations] = await pool.query(
        'DELETE FROM registrations WHERE user_id = ?',
        [id]
      );
      deletedStats.registrations = deletedRegistrations.affectedRows;
      console.log(`Deleted ${deletedStats.registrations} event registrations`);
    } catch (err) {
      console.log('No registrations to delete or table does not exist');
    }
    
    // Step 5: Finally, delete the user
    const [deletedUser] = await pool.query(
      'DELETE FROM users WHERE id = ?',
      [id]
    );
    
    if (deletedUser.affectedRows === 0) {
      return res.status(500).json({ message: 'Failed to delete user' });
    }
    
    console.log(`User ${id} (${user[0].name}) deleted successfully with all related data`);
    res.json({ 
      message: 'User deleted successfully',
      details: deletedStats
    });
    
  } catch (err) {
    console.error('Error deleting user:', err);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    res.status(500).json({ 
      message: 'Server error while deleting user',
      error: err.message 
    });
  }
});

module.exports = router;