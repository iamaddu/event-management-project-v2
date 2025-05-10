
const ticketRoutes = require('../routes/ticketRoutes');
app.use('/tickets', ticketRoutes);
// Add new ticket purchase
router.post('/', (req, res) => {
  const { event_id, user_id, quantity, total_price, payment_method } = req.body;
  const query = `
    INSERT INTO tickets (event_id, user_id, quantity, total_price, payment_method)
    VALUES (?, ?, ?, ?, ?)
  `;
  db.query(query, [event_id, user_id, quantity, total_price, payment_method], (err, result) => {
    if (err) return res.status(500).json({ error: 'Failed to add ticket' });
    res.json({ message: 'Ticket added', ticketId: result.insertId });
  });
});

// Update ticket
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { event_id, user_id, quantity, total_price, payment_method } = req.body;
  const query = `
    UPDATE tickets SET event_id = ?, user_id = ?, quantity = ?, total_price = ?, payment_method = ?
    WHERE id = ?
  `;
  db.query(query, [event_id, user_id, quantity, total_price, payment_method, id], (err) => {
    if (err) return res.status(500).json({ error: 'Failed to update ticket' });
    res.json({ message: 'Ticket updated' });
  });
});

// Delete ticket
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM tickets WHERE id = ?';
  db.query(query, [id], (err) => {
    if (err) return res.status(500).json({ error: 'Failed to delete ticket' });
    res.json({ message: 'Ticket deleted' });
  });
});
