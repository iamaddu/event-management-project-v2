const express = require('express');
const router = express.Router();
const db = require('../db'); // Your database connection

// Fetch session details
router.get('/session/:id', (req, res) => {
  const { id } = req.params;
  const query = 'SELECT * FROM sessions WHERE id = ?';
  db.query(query, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch session details' });
    }
    res.json(results[0]);
  });
});

// Register for a session
router.post('/register', (req, res) => {
  const { session_id, user_name, user_email, ticket_type } = req.body;

  // Check seat availability
  const checkSeatsQuery = 'SELECT capacity, registered FROM sessions WHERE id = ?';
  db.query(checkSeatsQuery, [session_id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to check seat availability' });
    }

    const session = results[0];
    if (session.registered >= session.capacity) {
      return res.status(400).json({ error: 'No seats available for this session' });
    }

    // Register the user
    const registerQuery = 'INSERT INTO registrations (session_id, user_name, user_email, ticket_type) VALUES (?, ?, ?, ?)';
    db.query(registerQuery, [session_id, user_name, user_email, ticket_type], (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to register for the session' });
      }

      // Update the registered count
      const updateSeatsQuery = 'UPDATE sessions SET registered = registered + 1 WHERE id = ?';
      db.query(updateSeatsQuery, [session_id], (err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to update seat count' });
        }
        res.json({ message: 'Registration successful' });
      });
    });
  });
});

module.exports = router;