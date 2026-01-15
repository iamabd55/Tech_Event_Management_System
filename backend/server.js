require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./src/routes/auth');
const eventsRoutes = require('./src/routes/events');
const regRoutes = require('./src/routes/registrations');
const usersRoutes = require('./src/routes/users');
const teamsRoutes = require('./src/routes/teams');
const sessionsRoutes = require('./src/routes/sessions'); 
const teamMembersRoutes = require('./src/routes/team-members');
const adminRoutes = require('./src/routes/admin');
// Debug: Check which route is undefined
console.log('authRoutes:', typeof authRoutes, authRoutes);
console.log('eventsRoutes:', typeof eventsRoutes, eventsRoutes);
console.log('regRoutes:', typeof regRoutes, regRoutes);
console.log('usersRoutes:', typeof usersRoutes, usersRoutes);
console.log('teamsRoutes:', typeof teamsRoutes, teamsRoutes);
console.log('adminRoutes:', typeof adminRoutes, adminRoutes);


const app = express();

// ✅ Now use it AFTER requiring
app.use(cors({
  origin: 'http://localhost:8080', // Change to your frontend port
  credentials: true
}));

app.use(express.json());
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/registrations', regRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/sessions', sessionsRoutes); // ← ADD THIS
app.use('/api/team-members', teamMembersRoutes);
app.use('/api/admin', adminRoutes);
app.get('/', (req, res) => res.json({ ok: true, service: 'Event Hub Pro API' }));


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));