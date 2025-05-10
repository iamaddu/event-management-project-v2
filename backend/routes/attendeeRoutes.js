const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Adjust path to your db connection

// Get all attendees
router.get('/', (req, res) => {
  const query = 'SELECT * FROM attendees';
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch attendees' });
    res.json(results);
  });
});

// Get attendee by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const query = 'SELECT * FROM attendees WHERE id = ?';
  db.query(query, [id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch attendee' });
    if (results.length === 0) return res.status(404).json({ error: 'Attendee not found' });
    res.json(results[0]);
  });
});

// Add new attendee
router.post('/', (req, res) => {
  const { first_name, last_name, email, phone, event_id, ticket_type, status } = req.body;
  const query = `
    INSERT INTO attendees (first_name, last_name, email, phone, event_id, ticket_type, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  db.query(query, [first_name, last_name, email, phone, event_id, ticket_type, status], (err, result) => {
    if (err) return res.status(500).json({ error: 'Failed to add attendee' });
    res.json({ message: 'Attendee added', attendeeId: result.insertId });
  });
});

// Update attendee
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, email, phone, event_id, ticket_type, status } = req.body;
  const query = `
    UPDATE attendees SET first_name = ?, last_name = ?, email = ?, phone = ?, event_id = ?, ticket_type = ?, status = ?
    WHERE id = ?
  `;
  db.query(query, [first_name, last_name, email, phone, event_id, ticket_type, status, id], (err) => {
    if (err) return res.status(500).json({ error: 'Failed to update attendee' });
    res.json({ message: 'Attendee updated' });
  });
});

// Delete attendee
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM attendees WHERE id = ?';
  db.query(query, [id], (err) => {
    if (err) return res.status(500).json({ error: 'Failed to delete attendee' });
    res.json({ message: 'Attendee deleted' });
  });
});

module.exports = router;
