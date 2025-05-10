const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Ensure this points to your database connection

// Fetch all categories
router.get('/categories', (req, res) => {
  const query = 'SELECT * FROM categories';
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch categories' });
    }
    res.json(results);
  });
});

// Add a new category
router.post('/categories', (req, res) => {
  const { name, description, status } = req.body;
  const query = 'INSERT INTO categories (name, description, status) VALUES (?, ?, ?)';
  db.query(query, [name, description, status], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to add category' });
    }
    res.json({ message: 'Category added successfully', categoryId: result.insertId });
  });
});

// Update a category
router.put('/categories/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, status } = req.body;
  const query = 'UPDATE categories SET name = ?, description = ?, status = ? WHERE id = ?';
  db.query(query, [name, description, status, id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to update category' });
    }
    res.json({ message: 'Category updated successfully' });
  });
});

// Delete a category
router.delete('/categories/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM categories WHERE id = ?';
  db.query(query, [id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete category' });
    }
    res.json({ message: 'Category deleted successfully' });
  });
});

// Fetch analytics data
router.get('/analytics', (req, res) => {
  const query = 'SELECT category, COUNT(*) as count FROM events GROUP BY category';
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch analytics data' });
    }
    const labels = results.map((row) => row.category);
    const values = results.map((row) => row.count);
    res.json({ labels, values });
  });
});

// Fetch attendees
router.get('/attendees', (req, res) => {
  const query = 'SELECT * FROM attendees';
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch attendees' });
    }
    res.json(results);
  });
});

module.exports = router;