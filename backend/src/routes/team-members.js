// src/routes/team-members.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middlewares/auth');

// GET all members of a team
router.get('/team/:team_id', async (req, res) => {
  try {
    const [members] = await pool.query(
      `SELECT tm.*, u.name, u.email, u.phone,
              inviter.name as invited_by_name
       FROM team_members tm
       JOIN users u ON tm.user_id = u.id
       LEFT JOIN users inviter ON tm.invited_by = inviter.id
       WHERE tm.team_id = ?
       ORDER BY tm.role DESC, tm.joined_at ASC`,
      [req.params.team_id]
    );
    res.json(members);
  } catch (err) {
    console.error('Error fetching team members:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET pending invitations for current user
router.get('/my-invitations', auth(), async (req, res) => {
  try {
    console.log('=== FETCHING INVITATIONS ===');
    console.log('User ID:', req.user.id);
    
    const [invitations] = await pool.query(
      `SELECT tm.id, tm.team_id, tm.user_id, tm.status, tm.role, tm.joined_at,
              t.name as team_name, 
              e.title as event_name,
              inviter.name as invited_by_name
       FROM team_members tm
       JOIN teams t ON tm.team_id = t.id
       JOIN events e ON t.event_id = e.id
       LEFT JOIN users inviter ON tm.invited_by = inviter.id
       WHERE tm.user_id = ? AND tm.status = 'pending'
       ORDER BY tm.joined_at DESC`,
      [req.user.id]
    );
    
    console.log('Invitations found:', invitations.length);
    console.log('Data:', invitations);
    
    res.json(invitations);
  } catch (err) {
    console.error('=== ERROR FETCHING INVITATIONS ===');
    console.error('Error message:', err.message);
    console.error('Error code:', err.code);
    console.error('SQL Message:', err.sqlMessage);
    console.error('SQL:', err.sql);
    res.status(500).json({ 
      message: 'Server error',
      error: err.message,
      sqlMessage: err.sqlMessage 
    });
  }
});

// GET accepted teams for current user (for Dashboard)
router.get('/my-teams', auth(), async (req, res) => {
  try {
    const userId = req.user.id;
    
    const query = `
      SELECT 
        tm.id,
        tm.team_id,
        tm.status,
        t.name as team_name,
        t.event_id,
        e.title as event_name,
        e.start_datetime as event_date,
        e.venue as location,
        t.captain_id
      FROM team_members tm
      JOIN teams t ON tm.team_id = t.id
      JOIN events e ON t.event_id = e.id
      WHERE tm.user_id = ? AND tm.status = 'accepted'
      ORDER BY e.start_datetime DESC
    `;
    
    const [teams] = await pool.query(query, [userId]);
    res.json(teams);
  } catch (error) {
    console.error('Error fetching user teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// INVITE a user to team (captain only)
router.post('/invite', auth(), async (req, res) => {
  const { team_id, user_email } = req.body;

  if (!team_id || !user_email) {
    return res.status(400).json({ message: 'team_id and user_email are required' });
  }

  try {
    // Check if team exists and user is captain
    const [teamRows] = await pool.query(
      'SELECT captain_id FROM teams WHERE id = ?',
      [team_id]
    );

    if (!teamRows.length) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (teamRows[0].captain_id !== req.user.id) {
      return res.status(403).json({ message: 'Only team captain can invite members' });
    }

    // Find user by email
    const [userRows] = await pool.query(
      'SELECT id, email FROM users WHERE email = ?',
      [user_email.toLowerCase().trim()]
    );

    if (!userRows.length) {
      return res.status(404).json({ message: 'User not found with this email' });
    }

    const invitedUserId = userRows[0].id;

    // Prevent inviting yourself
    if (invitedUserId === req.user.id) {
      return res.status(400).json({ message: 'You cannot invite yourself' });
    }

    // Check if user is already a member or invited
    const [existingRows] = await pool.query(
      'SELECT id, status FROM team_members WHERE team_id = ? AND user_id = ?',
      [team_id, invitedUserId]
    );

    if (existingRows.length) {
      const status = existingRows[0].status;
      if (status === 'accepted') {
        return res.status(400).json({ message: 'User is already a team member' });
      } else if (status === 'pending') {
        return res.status(400).json({ message: 'Invitation already sent to this user' });
      } else if (status === 'rejected') {
        // Update the rejected invitation to pending again
        await pool.query(
          'UPDATE team_members SET status = ?, invited_by = ? WHERE id = ?',
          ['pending', req.user.id, existingRows[0].id]
        );
        return res.json({ 
          message: 'Invitation resent successfully',
          invitation_id: existingRows[0].id 
        });
      }
    }

    // Create invitation
    const [result] = await pool.query(
      'INSERT INTO team_members (team_id, user_id, role, status, invited_by) VALUES (?, ?, ?, ?, ?)',
      [team_id, invitedUserId, 'Member', 'pending', req.user.id]
    );

    res.status(201).json({ 
      message: 'Invitation sent successfully',
      invitation_id: result.insertId 
    });
  } catch (err) {
    console.error('Error inviting member:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ACCEPT invitation
router.put('/accept/:invitation_id', auth(), async (req, res) => {
  try {
    // Check if invitation exists and belongs to user
    const [rows] = await pool.query(
      'SELECT user_id, status FROM team_members WHERE id = ?',
      [req.params.invitation_id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    if (rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'This invitation is not for you' });
    }

    if (rows[0].status !== 'pending') {
      return res.status(400).json({ message: 'Invitation already processed' });
    }

    // Accept invitation
    await pool.query(
      'UPDATE team_members SET status = ? WHERE id = ?',
      ['accepted', req.params.invitation_id]
    );

    res.json({ message: 'Invitation accepted successfully' });
  } catch (err) {
    console.error('Error accepting invitation:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// REJECT invitation
router.put('/reject/:invitation_id', auth(), async (req, res) => {
  try {
    // Check if invitation exists and belongs to user
    const [rows] = await pool.query(
      'SELECT user_id, status FROM team_members WHERE id = ?',
      [req.params.invitation_id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    if (rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'This invitation is not for you' });
    }

    if (rows[0].status !== 'pending') {
      return res.status(400).json({ message: 'Invitation already processed' });
    }

    // Reject invitation
    await pool.query(
      'UPDATE team_members SET status = ? WHERE id = ?',
      ['rejected', req.params.invitation_id]
    );

    res.json({ message: 'Invitation rejected' });
  } catch (err) {
    console.error('Error rejecting invitation:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// REMOVE member from team (captain only)
router.delete('/:member_id', auth(), async (req, res) => {
  try {
    // Get member and team info
    const [memberRows] = await pool.query(
      `SELECT tm.team_id, tm.user_id, t.captain_id
       FROM team_members tm
       JOIN teams t ON tm.team_id = t.id
       WHERE tm.id = ?`,
      [req.params.member_id]
    );

    if (!memberRows.length) {
      return res.status(404).json({ message: 'Member not found' });
    }

    const { team_id, user_id, captain_id } = memberRows[0];

    // Check if user is captain or removing themselves
    if (req.user.id !== captain_id && req.user.id !== user_id) {
      return res.status(403).json({ message: 'Only team captain can remove members' });
    }

    // Cannot remove captain
    if (user_id === captain_id) {
      return res.status(400).json({ message: 'Cannot remove team captain' });
    }

    // Delete member
    await pool.query('DELETE FROM team_members WHERE id = ?', [req.params.member_id]);

    res.json({ message: 'Member removed successfully' });
  } catch (err) {
    console.error('Error removing member:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// LEAVE team (member removes themselves)
router.delete('/leave/:team_id', auth(), async (req, res) => {
  try {
    // Check if user is captain
    const [teamRows] = await pool.query(
      'SELECT captain_id FROM teams WHERE id = ?',
      [req.params.team_id]
    );

    if (!teamRows.length) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (teamRows[0].captain_id === req.user.id) {
      return res.status(400).json({ message: 'Team captain cannot leave. Delete the team instead.' });
    }

    const [memberRows] = await pool.query(
      'SELECT id FROM team_members WHERE team_id = ? AND user_id = ? AND status = ?',
      [req.params.team_id, req.user.id, 'accepted']
    );

    if (!memberRows.length) {
      return res.status(404).json({ message: 'You are not a member of this team' });
    }

    await pool.query(
      'DELETE FROM team_members WHERE team_id = ? AND user_id = ?',
      [req.params.team_id, req.user.id]
    );

    res.json({ message: 'You have left the team' });
  } catch (err) {
    console.error('Error leaving team:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;