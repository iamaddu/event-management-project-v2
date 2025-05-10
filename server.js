const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mysql = require('mysql');
const path = require('path');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = 3000;
const SECRET_KEY = 'your_secret_key'; // Replace with a secure key

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname))); // Serve static files

// Connect to MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', // Ensure this matches your MySQL password
  database: 'event_management'
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err.message);
    return;
  }
  console.log('Connected to the database');
});

// ========================
// Category CRUD routes
// ========================

// Get all categories
app.get('/categories', (req, res) => {
  const query = 'SELECT * FROM categories';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching categories:', err);
      return res.status(500).json({ error: 'Failed to fetch categories' });
    }
    res.json(results);
  });
});

// Create a new category
app.post('/categories', (req, res) => {
  const { name, slug, description, icon, color, status, metaTitle, metaDescription } = req.body;
  const query = `
    INSERT INTO categories (name, slug, description, icon, color, status, metaTitle, metaDescription)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  db.query(query, [name, slug, description, icon, color, status, metaTitle, metaDescription], (err, result) => {
    if (err) {
      console.error('Error creating category:', err);
      return res.status(500).json({ error: 'Failed to create category' });
    }
    res.json({ message: 'Category created', categoryId: result.insertId });
  });
});

// Update a category
app.put('/categories/:id', (req, res) => {
  const { id } = req.params;
  const { name, slug, description, icon, color, status, metaTitle, metaDescription } = req.body;
  const query = `
    UPDATE categories
    SET name = ?, slug = ?, description = ?, icon = ?, color = ?, status = ?, metaTitle = ?, metaDescription = ?
    WHERE id = ?
  `;
  db.query(query, [name, slug, description, icon, color, status, metaTitle, metaDescription, id], (err) => {
    if (err) {
      console.error('Error updating category:', err);
      return res.status(500).json({ error: 'Failed to update category' });
    }
    res.json({ message: 'Category updated' });
  });
});

// Delete a category
app.delete('/categories/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM categories WHERE id = ?';
  db.query(query, [id], (err) => {
    if (err) {
      console.error('Error deleting category:', err);
      return res.status(500).json({ error: 'Failed to delete category' });
    }
    res.json({ message: 'Category deleted' });
  });
});

// Update category by ID
app.put('/category/:categoryId', (req, res) => {
  const { categoryId } = req.params;
  const { name, slug, description, icon, color, status, metaTitle, metaDescription } = req.body;
  const updateQuery = `
    UPDATE categories 
    SET name = ?, slug = ?, description = ?, icon = ?, color = ?, status = ?, metaTitle = ?, metaDescription = ?
    WHERE id = ?
  `;
  db.query(updateQuery, [name, slug, description, icon, color, status, metaTitle, metaDescription, categoryId], (err, results) => {
    if (err) {
      console.error('Error updating category:', err.message);
      return res.status(500).json({ error: 'Failed to update category details' });
    }
    res.json({ message: 'Category updated successfully' });
  });
});

// Get category by ID
app.get('/categories/:id', (req, res) => {
  const { id } = req.params;
  const query = 'SELECT * FROM categories WHERE id = ?';
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Error fetching category:', err.message);
      return res.status(500).json({ error: 'Failed to fetch category details' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(results[0]);
  });
});

// Register sessionRoutes (if any)
const sessionRoutes = require('./backend/routes/sessionRoutes');
app.use('/sessions', sessionRoutes);

// ========================
// Signup & Login Endpoints
// ========================

// Signup Endpoint
app.post('/signup', async (req, res) => {
  const { first_name, last_name, username, email, phone, password, user_type } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = `
      INSERT INTO users (first_name, last_name, username, email, phone, password, user_type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(
      query,
      [first_name, last_name, username, email, phone, hashedPassword, user_type || 'attendee'],
      (err, result) => {
        if (err) {
          console.error('Error inserting user:', err.message);
          return res.status(500).json({ error: 'Failed to register user' });
        }
        res.json({ message: 'User registered successfully', userId: result.insertId });
      }
    );
  } catch (error) {
    console.error('Error during signup:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login Endpoint
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const query = 'SELECT * FROM users WHERE username = ?';
  db.query(query, [username], async (err, results) => {
    if (err) {
      console.error('Error fetching user:', err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    const user = results[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ message: 'Login successful', token, redirect: 'home.html' });
  });
});

// Middleware to verify JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token.' });
    }
    req.user = user;
    next();
  });
}

// Protected route for home page
app.get('/home', authenticateToken, (req, res) => {
  res.json({ message: 'Welcome to the home page!' });
});

// Route for the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// ========================
// Event Endpoints
// ========================

// Create Event Endpoint
app.post('/create-event', authenticateToken, (req, res) => {
  const {
    title,
    description,
    start,
    end,
    location,
    venue,
    capacity,
    price_standard,
    price_vip,
    price_premium,
    category_id,
    image
  } = req.body;
  const organizer = req.user.id;
  const query = `
    INSERT INTO events (
      title, description, organizer, start, end, location, venue, capacity, price_standard, price_vip, price_premium, status, category_id, image
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Published', ?, ?)
  `;
  db.query(
    query,
    [title, description, organizer, start, end, location, venue, capacity, price_standard, price_vip, price_premium, category_id, image || null],
    (err, result) => {
      if (err) {
        console.error('Error inserting event:', err);
        return res.status(500).json({ error: 'Failed to create event', details: err.message });
      }
      res.json({ message: 'Event created successfully', eventId: result.insertId });
    }
  );
});

// Update Event Endpoint
app.put('/events/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { title, description, start, end, location, venue, capacity, price_standard, price_vip, price_premium, category_id, image } = req.body;
  const query = `
    UPDATE events
    SET title = ?, description = ?, start = ?, end = ?, location = ?, venue = ?, capacity = ?, price_standard = ?, price_vip = ?, price_premium = ?, category_id = ?, image = ?
    WHERE id = ?
  `;
  db.query(query, [title, description, start, end, location, venue, capacity, price_standard, price_vip, price_premium, category_id, image || null, id], (err, result) => {
    if (err) {
      console.error('Error updating event:', err.message);
      return res.status(500).json({ error: 'Failed to update event', details: err.message });
    }
    res.json({ message: 'Event updated successfully' });
  });
});

// GET event details using MySQL query
app.get('/events/:id', (req, res) => {
  const { id } = req.params;
  const query = 'SELECT * FROM events WHERE id = ?';
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Error fetching event:', err.message);
      return res.status(500).json({ error: 'Failed to fetch event details' });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    res.json(results[0]);
  });
});

// DELETE event
app.delete('/events/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM events WHERE id = ?';
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('Error deleting event:', err.message);
      return res.status(500).json({ error: 'Failed to delete event', details: err.message });
    }
    // Check if any row was deleted
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json({ message: 'Event deleted successfully' });
  });
});

// Create Category Endpoint (via custom slug logic)
app.post('/create-category', authenticateToken, (req, res) => {
  let { name, slug, description, icon, color, status, metaTitle, metaDescription } = req.body;
  const generateSlug = (text) => {
    return text.toString().toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  };
  if (!slug) {
    slug = generateSlug(name);
  }
  const checkSlugUnique = (baseSlug, count = 0, callback) => {
    const newSlug = count === 0 ? baseSlug : `${baseSlug}-${count}`;
    const query = 'SELECT id FROM categories WHERE slug = ?';
    db.query(query, [newSlug], (err, results) => {
      if (err) return callback(err);
      if (results.length > 0) {
        checkSlugUnique(baseSlug, count + 1, callback);
      } else {
        callback(null, newSlug);
      }
    });
  };
  checkSlugUnique(slug, 0, (err, uniqueSlug) => {
    if (err) {
      console.error('Error checking slug uniqueness:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    slug = uniqueSlug;
    const insertQuery = `
      INSERT INTO categories (name, slug, description, icon, color, status, metaTitle, metaDescription)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(insertQuery, [name, slug, description, icon, color, status, metaTitle, metaDescription], (err, result) => {
      if (err) {
        console.error('Error inserting category:', err.message);
        return res.status(500).json({ error: 'Failed to create category.' });
      }
      res.json({ message: 'Category created successfully.', categoryId: result.insertId, slug });
    });
  });
});

// Get All Events Endpoint
app.get('/events', (req, res) => {
  const query = `
    SELECT * FROM events
    ORDER BY start ASC
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching events:', err.message);
      return res.status(500).json({ error: 'Failed to fetch events' });
    }
    res.json(results);
  });
});

// ========================
// Analytics Endpoint
// ========================

app.get('/analytics', (req, res) => {
  const query = `
    SELECT 
      e.id AS event_id,
      e.title AS event_name,
      e.start AS event_date,
      CAST(e.capacity AS UNSIGNED) AS capacity,
      CASE 
        WHEN LOWER(e.status) = 'cancelled' THEN 'Cancelled'
        WHEN LOWER(e.status) = 'published' THEN 
          CASE 
            WHEN e.start < NOW() THEN 'Completed'
            ELSE 'Upcoming'
          END
        ELSE 'Upcoming'
      END AS status,
      IFNULL(SUM(p.quantity), 0) AS attendee_count,
      IFNULL(SUM(p.total_price), 0) AS revenue,
      CASE 
        WHEN e.capacity > 0 THEN ROUND((IFNULL(SUM(p.quantity), 0) / CAST(e.capacity AS UNSIGNED)) * 100, 2)
        ELSE 0
      END AS conversion_rate
    FROM events e
    LEFT JOIN purchases p ON e.id = p.event_id
    GROUP BY e.id, e.title, e.start, e.capacity, e.status
    ORDER BY e.start DESC
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching analytics data:', err.message);
      return res.status(500).json({ error: 'Failed to fetch analytics data' });
    }
    res.json(results);
  });
});

// ========================
// Attendee Routes
// ========================

// Fetch all attendees
app.get('/attendees', (req, res) => {
  const query = `
    SELECT 
      a.id AS attendee_id,
      a.first_name,
      a.last_name,
      a.email,
      a.phone,
      e.title AS event_name,
      a.ticket_type,
      a.status,
      a.created_at
    FROM attendees a
    LEFT JOIN events e ON a.event_id = e.id
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching attendees:', err);
      return res.status(500).json({ error: 'Failed to fetch attendees', details: err.message });
    }
    console.log('Attendee records fetched successfully:', results);
    res.json(results);
  });
});

// Get attendee by ID
app.get('/attendees/:id', (req, res) => {
  const { id } = req.params;
  const query = 'SELECT * FROM attendees WHERE id = ?';
  db.query(query, [id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch attendee' });
    if (results.length === 0) return res.status(404).json({ error: 'Attendee not found' });
    res.json(results[0]);
  });
});

// Fetch attendees for logged-in user by email
app.get('/attendees/my-attendees', authenticateToken, (req, res) => {
  const userEmail = req.user.email;
  const query = `
    SELECT 
      a.id AS attendee_id, 
      a.first_name, 
      a.last_name, 
      a.email, 
      a.phone,
      e.title AS event_name,
      a.ticket_type, 
      a.quantity,
      a.event_id,
      a.status,
      a.created_at
    FROM attendees a
    JOIN events e ON a.event_id = e.id
    WHERE a.email = ?
    ORDER BY a.created_at DESC
  `;
  db.query(query, [userEmail], (err, results) => {
    if (err) {
      console.error('Error fetching user attendees:', err);
      return res.status(500).json({ error: 'Failed to fetch registrations', details: err.message });
    }
    res.json(results);
  });
});

// Add new attendee
app.post('/attendees', (req, res) => {
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
app.put('/attendees/:id', (req, res) => {
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
app.delete('/attendees/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM attendees WHERE id = ?';
  db.query(query, [id], (err) => {
    if (err) return res.status(500).json({ error: 'Failed to delete attendee' });
    res.json({ message: 'Attendee deleted' });
  });
});

// ========================
// Ticket & Purchase Endpoints
// ========================

// Purchase Ticket Endpoint
app.post('/purchase-ticket', authenticateToken, (req, res) => {
  const { event_id, ticket_type, quantity, total_price, payment_method } = req.body;
  const user_id = req.user.id;
  const query = `
    INSERT INTO purchases (event_id, user_id, ticket_type, quantity, total_price, payment_method)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  db.query(query, [event_id, user_id, ticket_type, quantity, total_price, payment_method], (err, result) => {
    if (err) {
      console.error('Error inserting ticket purchase:', err.message);
      return res.status(500).json({ error: 'Failed to complete purchase' });
    }
    res.json({ message: 'Purchase successful', purchaseId: result.insertId });
  });
});

// Add new ticket purchase (alternate)
app.post('/tickets', authenticateToken, (req, res) => {
  const user_id = req.user.id;
  const { event_id, quantity, total_price, payment_method } = req.body;
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
app.put('/tickets/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;
  const { event_id, quantity, total_price, payment_method } = req.body;
  const query = `
    UPDATE tickets SET event_id = ?, user_id = ?, quantity = ?, total_price = ?, payment_method = ?
    WHERE id = ?
  `;
  db.query(query, [event_id, user_id, quantity, total_price, payment_method, id], (err) => {
    if (err) return res.status(500).json({ error: 'Failed to update ticket' });
    res.json({ message: 'Ticket updated' });
  });
});

// Cancel ticket Endpoint
app.put('/tickets/:id/cancel', authenticateToken, (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;
  const selectQuery = 'SELECT * FROM tickets WHERE id = ? AND user_id = ?';
  db.query(selectQuery, [id, user_id], (err, results) => {
    if (err) {
      console.error('Error fetching ticket:', err);
      return res.status(500).json({ error: 'Failed to fetch ticket' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Ticket not found or unauthorized' });
    }
    const ticket = results[0];
    const insertQuery = `
      INSERT INTO cancelled_tickets (ticket_id, event_id, user_id, quantity, total_price, payment_method)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    db.query(insertQuery, [ticket.id, ticket.event_id, ticket.user_id, ticket.quantity, ticket.total_price, ticket.payment_method], (err, result) => {
      if (err) {
        console.error('Error saving cancelled ticket:', err);
        return res.status(500).json({ error: 'Failed to save cancelled ticket', details: err.message });
      }
      const deleteQuery = 'DELETE FROM tickets WHERE id = ?';
      db.query(deleteQuery, [id], (err, result) => {
        if (err) {
          console.error('Error deleting ticket:', err);
          return res.status(500).json({ error: 'Failed to delete ticket', details: err.message });
        }
        res.json({ message: 'Ticket cancelled successfully' });
      });
    });
  });
});

// Delete ticket
app.delete('/tickets/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM tickets WHERE id = ?';
  db.query(query, [id], (err) => {
    if (err) return res.status(500).json({ error: 'Failed to delete ticket' });
    res.json({ message: 'Ticket deleted' });
  });
});

// Cancel Purchase Endpoint
app.delete('/purchases/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;
  const selectQuery = 'SELECT * FROM purchases WHERE id = ? AND user_id = ?';
  db.query(selectQuery, [id, user_id], (err, results) => {
    if (err) {
      console.error('Error fetching purchase:', err.message);
      return res.status(500).json({ error: 'Failed to fetch purchase' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Purchase not found or unauthorized' });
    }
    const deleteQuery = 'DELETE FROM purchases WHERE id = ?';
    db.query(deleteQuery, [id], (err) => {
      if (err) {
        console.error('Error cancelling purchase:', err.message);
        return res.status(500).json({ error: 'Failed to cancel purchase' });
      }
      res.json({ message: 'Purchase cancelled successfully' });
    });
  });
});

// Cancel Purchase Endpoint (Alternative: preserves cancellation history)
app.put('/purchases/:id/cancel', authenticateToken, (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;
  const selectQuery = 'SELECT * FROM purchases WHERE id = ? AND user_id = ?';
  db.query(selectQuery, [id, user_id], (err, results) => {
    if (err) {
      console.error('Error fetching purchase:', err.message);
      return res.status(500).json({ error: 'Failed to fetch purchase' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Purchase not found or unauthorized' });
    }
    const purchase = results[0];
    const insertQuery = `
      INSERT INTO cancelled_tickets (ticket_id, event_id, user_id, quantity, total_price, payment_method)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    db.query(insertQuery, [purchase.id, purchase.event_id, purchase.user_id, purchase.quantity, purchase.total_price, purchase.payment_method], (err, insertResult) => {
      if (err) {
        console.error('Error saving cancelled purchase:', err.message);
        return res.status(500).json({ error: 'Failed to save cancelled purchase', details: err.message });
      }
      const deleteQuery = 'DELETE FROM purchases WHERE id = ?';
      db.query(deleteQuery, [id], (err) => {
        if (err) {
          console.error('Error cancelling purchase:', err.message);
          return res.status(500).json({ error: 'Failed to cancel purchase' });
        }
        return res.json({ message: 'Purchase cancelled successfully' });
      });
    });
  });
});

// ========================
// Registration Endpoints
// ========================

app.post('/register', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { eventId, firstName, lastName, email, phone, ticketType, quantity, specialRequests } = req.body;
  const query = `INSERT INTO registrations (user_id, event_id, firstName, lastName, email, phone, ticketType, quantity, specialRequests, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
  db.query(query, [userId, eventId, firstName, lastName, email, phone, ticketType, quantity, specialRequests], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true });
  });
});

// Updated GET /my-registrations endpoint to join event details
app.get('/my-registrations', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const query = `
    SELECT 
      r.*, 
      e.title AS event_name, 
      e.start AS event_date, 
      e.venue,
      (CASE 
         WHEN LOWER(r.ticketType) = 'standard' THEN 25 * r.quantity 
         WHEN LOWER(r.ticketType) = 'vip' THEN 50 * r.quantity 
         WHEN LOWER(r.ticketType) = 'premium' THEN 75 * r.quantity 
         ELSE 0 
       END) AS total_price,
      e.status
    FROM registrations r
    JOIN events e ON r.event_id = e.id
    WHERE r.user_id = ?
  `;
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching registrations:', err.message);
      return res.status(500).json({ error: 'Failed to fetch registrations' });
    }
    res.json(results);
  });
});

// Get Category ID by Name
app.post('/get-category-id', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Category name is required' });
  const query = 'SELECT id FROM categories WHERE LOWER(name) = LOWER(?)';
  db.query(query, [name], (err, results) => {
    if (err) {
      console.error('Error fetching category:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    if (results.length === 0) {
      // If category doesn't exist, create it automatically
      const slug = name.trim().toLowerCase().replace(/\s+/g, '-');
      const description = 'Auto-created category';
      const status = 'active';
      const insertQuery = 'INSERT INTO categories (name, slug, description, status) VALUES (?, ?, ?, ?)';
      db.query(insertQuery, [name, slug, description, status], (err2, result2) => {
        if (err2) {
          console.error('Error creating category:', err2.message);
          return res.status(500).json({ error: 'Failed to create category' });
        }
        console.log(`Category '${name}' auto-created with id:`, result2.insertId);
        return res.json({ id: result2.insertId });
      });
    } else {
      return res.json({ id: results[0].id });
    }
  });
});

// Fetch attendees for an event (from purchases)
app.get('/event/:eventId/attendees', (req, res) => {
  const { eventId } = req.params;
  const query = `
    SELECT 
      p.id AS attendee_id, 
      u.first_name, 
      u.last_name, 
      u.email, 
      u.phone, 
      e.title AS event_name,
      p.ticket_type, 
      p.quantity
    FROM purchases p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN events e ON p.event_id = e.id
  `;
  db.query(query, [eventId], (err, results) => {
    if (err) {
      console.error('Error fetching attendees:', err.message);
      return res.status(500).json({ error: 'Failed to fetch attendees' });
    }
    res.json(results);
  });
});

// Fetch category by ID
app.get('/category/:categoryId', (req, res) => {
  const { categoryId } = req.params;
  const query = 'SELECT * FROM categories WHERE id = ?';
  db.query(query, [categoryId], (err, results) => {
    if (err) {
      console.error('Error fetching category:', err.message);
      return res.status(500).json({ error: 'Failed to fetch category details' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(results[0]);
  });
});

// ========================
// Session Endpoints
// ========================

// GET all sessions
app.get('/sessions', (req, res) => {
  const query = 'SELECT * FROM sessions';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching sessions:', err.message);
      return res.status(500).json({ error: 'Failed to fetch sessions' });
    }
    res.json(results);
  });
});

// POST a new session
app.post('/sessions', (req, res) => {
  console.log('POST /sessions body:', req.body);
  // Expect these fields from the client: title, description, capacity, start_time, end_time, event_id
  const { title, description, capacity, start_time, end_time, event_id } = req.body;
  const query = 'INSERT INTO sessions (title, description, capacity, start_time, end_time, event_id) VALUES (?, ?, ?, ?, ?, ?)';
  db.query(query, [title, description, capacity, start_time, end_time, event_id], (err, result) => {
    if (err) {
      console.error('Error inserting session:', err.message);
      return res.status(500).json({ error: 'Failed to create session' });
    }
    res.json({ id: result.insertId, title, description, capacity, start_time, end_time, event_id });
  });
});

// PUT (update) a session
app.put('/sessions/:id', (req, res) => {
  const { id } = req.params;
  // Expect these fields from the client: title, description, capacity, start_time, end_time, event_id
  const { title, description, capacity, start_time, end_time, event_id } = req.body;
  const query = 'UPDATE sessions SET title=?, description=?, capacity=?, start_time=?, end_time=?, event_id=? WHERE id=?';
  db.query(query, [title, description, capacity, start_time, end_time, event_id, id], (err, result) => {
    if (err) {
      console.error('Error updating session:', err.message);
      return res.status(500).json({ error: 'Failed to update session' });
    }
    res.json({ message: 'Session updated successfully' });
  });
});

// DELETE a session
app.delete('/sessions/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM sessions WHERE id=?';
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('Error deleting session:', err.message);
      return res.status(500).json({ error: 'Failed to delete session' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json({ message: 'Session deleted successfully' });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});