
const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const jwt = require('jsonwebtoken');

// Database connection (reuse from server.js or create new connection)
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'event_management'
});

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  jwt.verify(token, 'your_secret_key', (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token.' });
    req.user = user;
    next();
  });
}

// CRUD for sessions

// Get all sessions (with optional search query)
router.get('/', (req, res) => {
  const search = req.query.search || '';
  const query = `
    SELECT s.*, 
      JSON_ARRAYAGG(JSON_OBJECT('id', sp.id, 'name', sp.name)) AS speakers
    FROM sessions s
    LEFT JOIN session_speakers ss ON s.id = ss.session_id
    LEFT JOIN speakers sp ON ss.speaker_id = sp.id
    WHERE s.title LIKE ? OR s.description LIKE ?
    GROUP BY s.id
    ORDER BY s.start_time ASC
  `;
  const searchParam = `%${search}%`;
  db.query(query, [searchParam, searchParam], (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch sessions' });
    res.json(results);
  });
});

// Get session by ID with comments and average rating
router.get('/:id', (req, res) => {
  const sessionId = req.params.id;
  const sessionQuery = `
    SELECT s.*, 
      GROUP_CONCAT(sp.name SEPARATOR ', ') AS speakers
    FROM sessions s
    LEFT JOIN session_speakers ss ON s.id = ss.session_id
    LEFT JOIN speakers sp ON ss.speaker_id = sp.id
    WHERE s.id = ?
    GROUP BY s.id
  `;
  const commentsQuery = 'SELECT * FROM session_comments WHERE session_id = ? ORDER BY created_at DESC';
  const ratingQuery = 'SELECT AVG(rating) as avgRating FROM session_comments WHERE session_id = ?';

  db.query(sessionQuery, [sessionId], (err, sessionResults) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch session' });
    if (sessionResults.length === 0) return res.status(404).json({ error: 'Session not found' });

    db.query(commentsQuery, [sessionId], (err, commentsResults) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch comments' });

      db.query(ratingQuery, [sessionId], (err, ratingResults) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch rating' });

        res.json({
          session: sessionResults[0],
          comments: commentsResults,
          averageRating: ratingResults[0].avgRating || 0
        });
      });
    });
  });
});

// Create a new session
router.post('/', authenticateToken, (req, res) => {
  const { title, description, start_time, end_time, location, speaker } = req.body;
  const query = `
    INSERT INTO sessions (title, description, start_time, end_time, location, speaker)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  db.query(query, [title, description, start_time, end_time, location, speaker], (err, result) => {
    if (err) return res.status(500).json({ error: 'Failed to create session' });
    res.json({ message: 'Session created', sessionId: result.insertId });
  });
});

// Update a session
router.put('/:id', authenticateToken, (req, res) => {
  const sessionId = req.params.id;
  const { title, description, start_time, end_time, location, speaker } = req.body;
  const query = `
    UPDATE sessions
    SET title = ?, description = ?, start_time = ?, end_time = ?, location = ?, speaker = ?
    WHERE id = ?
  `;
  db.query(query, [title, description, start_time, end_time, location, speaker, sessionId], (err) => {
    if (err) return res.status(500).json({ error: 'Failed to update session' });
    res.json({ message: 'Session updated' });
  });
});

// Delete a session
router.delete('/:id', authenticateToken, (req, res) => {
  const sessionId = req.params.id;
  const query = 'DELETE FROM sessions WHERE id = ?';
  db.query(query, [sessionId], (err) => {
    if (err) return res.status(500).json({ error: 'Failed to delete session' });
    res.json({ message: 'Session deleted' });
  });
});

// Comments CRUD

// Add a comment/review to a session
router.post('/:id/comments', authenticateToken, (req, res) => {
  const sessionId = req.params.id;
  const userId = req.user.id;
  const { comment, rating } = req.body;
  const query = `
    INSERT INTO session_comments (session_id, user_id, comment, rating, created_at)
    VALUES (?, ?, ?, ?, NOW())
  `;
  db.query(query, [sessionId, userId, comment, rating], (err, result) => {
    if (err) return res.status(500).json({ error: 'Failed to add comment' });
    res.json({ message: 'Comment added', commentId: result.insertId });
  });
});

// Update a comment
router.put('/comments/:commentId', authenticateToken, (req, res) => {
  const commentId = req.params.commentId;
  const userId = req.user.id;
  const { comment, rating } = req.body;
  // Ensure user owns the comment
  const checkQuery = 'SELECT user_id FROM session_comments WHERE id = ?';
  db.query(checkQuery, [commentId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to update comment' });
    if (results.length === 0) return res.status(404).json({ error: 'Comment not found' });
    if (results[0].user_id !== userId) return res.status(403).json({ error: 'Unauthorized' });

    const updateQuery = 'UPDATE session_comments SET comment = ?, rating = ? WHERE id = ?';
    db.query(updateQuery, [comment, rating, commentId], (err) => {
      if (err) return res.status(500).json({ error: 'Failed to update comment' });
      res.json({ message: 'Comment updated' });
    });
  });
});

// Delete a comment
router.delete('/comments/:commentId', authenticateToken, (req, res) => {
  const commentId = req.params.commentId;
  const userId = req.user.id;
  // Ensure user owns the comment
  const checkQuery = 'SELECT user_id FROM session_comments WHERE id = ?';
  db.query(checkQuery, [commentId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to delete comment' });
    if (results.length === 0) return res.status(404).json({ error: 'Comment not found' });
    if (results[0].user_id !== userId) return res.status(403).json({ error: 'Unauthorized' });

    const deleteQuery = 'DELETE FROM session_comments WHERE id = ?';
    db.query(deleteQuery, [commentId], (err) => {
      if (err) return res.status(500).json({ error: 'Failed to delete comment' });
      res.json({ message: 'Comment deleted' });
    });
  });
});

// User session registrations

// Register user for a session
router.post('/:id/register', authenticateToken, (req, res) => {
  const sessionId = req.params.id;
  const userId = req.user.id;
  const query = `
    INSERT INTO session_registrations (session_id, user_id, registered_at)
    VALUES (?, ?, NOW())
  `;
  db.query(query, [sessionId, userId], (err, result) => {
    if (err) return res.status(500).json({ error: 'Failed to register for session' });
    res.json({ message: 'Registered for session', registrationId: result.insertId });
  });
});

// Cancel user registration for a session
router.delete('/:id/register', authenticateToken, (req, res) => {
  const sessionId = req.params.id;
  const userId = req.user.id;
  const query = `
    DELETE FROM session_registrations WHERE session_id = ? AND user_id = ?
  `;
  db.query(query, [sessionId, userId], (err, result) => {
    if (err) return res.status(500).json({ error: 'Failed to cancel registration' });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Registration not found' });
    res.json({ message: 'Registration cancelled' });
  });
});

// Get sessions registered by user
router.get('/my-sessions', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const query = `
    SELECT s.*
    FROM sessions s
    JOIN session_registrations sr ON s.id = sr.session_id
    WHERE sr.user_id = ?
    ORDER BY s.start_time ASC
  `;
  db.query(query, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch user sessions' });
    res.json(results);
  });
});

module.exports = router;
