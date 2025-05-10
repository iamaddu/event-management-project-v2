const express = require('express');
const router = express.Router();
const db = require('../db'); // Your database connection

// Fetch user profile details
router.get('/profile/:userId', (req, res) => {
  const { userId } = req.params;
  const query = 'SELECT * FROM users WHERE id = ?';
  db.query(query, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch user profile' });
    }
    res.json(results[0]);
  });
});

// Fetch events created by the user
router.get('/profile/:userId/events', (req, res) => {
  const { userId } = req.params;
  const query = 'SELECT * FROM events WHERE user_id = ?';
  db.query(query, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch user events' });
    }
    res.json(results);
  });
});

// Fetch reviews for the user
router.get('/profile/:userId/reviews', (req, res) => {
  const { userId } = req.params;
  const query = 'SELECT * FROM reviews WHERE user_id = ? ORDER BY review_date DESC';
  db.query(query, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch user reviews' });
    }
    res.json(results);
  });
});

// Update user profile
router.put('/profile/:userId', (req, res) => {
  const { userId } = req.params;
  const { name, email, phone, bio } = req.body;
  const query = 'UPDATE users SET name = ?, email = ?, phone = ?, bio = ? WHERE id = ?';
  db.query(query, [name, email, phone, bio, userId], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to update user profile' });
    }
    res.json({ message: 'Profile updated successfully' });
  });
});

module.exports = router;
