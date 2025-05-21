const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mysql = require('mysql');
const path = require('path');
const cors = require('cors');
const axios = require('axios');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const PORT = 3000;
const SECRET_KEY = 'your_secret_key'; // Replace with a secure key

// Socket.io setup
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // For development, allow all. Restrict in production.
    methods: ["GET", "POST"]
  }
});

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

// Category Endpoints
// ========================

// Helper to generate slug
function generateSlug(text) {
  return text
    ? text.toString().toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '')
    : '';
}

// Get all categories with event count
app.get('/categories', (req, res) => {
  const query = `
    SELECT c.*, 
      (SELECT COUNT(*) FROM events e WHERE e.category_id = c.id) AS event_count
    FROM categories c
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching categories:', err);
      return res.status(500).json({ error: 'Failed to fetch categories' });
    }
    res.json(results);
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

// Create a new category (only admin)
app.post('/categories', authenticateToken, authorizeRoles('admin'), (req, res) => {
  const { name, slug, description, icon, color, status, metaTitle, metaDescription } = req.body;
  const query = `
    INSERT INTO categories (name, slug, description, icon, color, status, metaTitle, metaDescription)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [name, slug, description, icon, color, status, metaTitle, metaDescription];
  db.query(query, params, (err, result) => {
    if (err) {
      console.error('Error creating category:', err);
      return res.status(500).json({ error: 'Failed to create category' });
    }
    res.json({ message: 'Category created successfully', id: result.insertId });
  });
});

// Update a category (only admin)
app.put('/categories/:id', authenticateToken, authorizeRoles('admin'), (req, res) => {
  const categoryId = req.params.id;
  const {
    name, slug, description, icon, color, status, metaTitle, metaDescription
  } = req.body;

  const query = `
    UPDATE categories
    SET name = ?, slug = ?, description = ?, icon = ?, color = ?, status = ?, metaTitle = ?, metaDescription = ?
    WHERE id = ?
  `;
  const params = [name, slug, description, icon, color, status, metaTitle, metaDescription, categoryId];

  db.query(query, params, (err, result) => {
    if (err) {
      console.error('Error updating category:', err);
      return res.status(500).json({ error: 'Failed to update category' });
    }
    res.json({ message: 'Category updated successfully' });
  });
});

// Delete a category
app.delete('/categories/:id', authenticateToken, (req, res) => {
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

// Login Endpoint with Remember Me
app.post('/login', (req, res) => {
  const { username, password, remember } = req.body;
  const query = 'SELECT * FROM users WHERE username = ? OR email = ?';
  db.query(query, [username, username], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (results.length === 0) return res.status(400).json({ error: 'User not found' });
    const user = results[0];
    bcrypt.compare(password, user.password, (bcryptErr, isMatch) => {
      if (bcryptErr) return res.status(500).json({ error: 'Error comparing passwords' });
      if (!isMatch) return res.status(400).json({ error: 'Invalid password' });
      const tokenPayload = { 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        user_type: user.user_type // <-- add this!
      };
      const tokenOptions = {};
      tokenOptions.expiresIn = remember ? '7d' : '1d';
      const token = jwt.sign(tokenPayload, SECRET_KEY, tokenOptions);
      res.json({ token, redirect: '/home.html', user_type: user.user_type });
    });
  });
});

// Forgot Password endpoint
app.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  const userQuery = 'SELECT * FROM users WHERE email = ?';
  db.query(userQuery, [email], (err, results) => {
    if (err) {
      console.error('Error fetching user for forgot password:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = results[0];
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // token valid for 1 hour

    const insertQuery = 'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)';
    db.query(insertQuery, [user.id, resetToken, expires], (err, result) => {
      if (err) {
        console.error('Error inserting password reset token:', err.message);
        return res.status(500).json({ error: 'Database error' });
      }
      
      // Mock email sending for development/testing without real SMTP credentials
      let transporter = nodemailer.createTransport({
        service: 'gmail', // or your provider
        auth: {
          user: 'your-email@gmail.com',
          pass: 'your-app-password'
        }
      });

      // Compose the reset URL (for example, a link to your front-end reset password page)
      const resetLink = `http://localhost:3000/reset-password.html?token=${resetToken}`;

      // Email content
      let mailOptions = {
        from: '"Event Management" <no-reply@yourdomain.com>',
        to: email,
        subject: 'Password Reset Request',
        text: `Hello,\n\nYou requested a password reset. Please click on the following link (or copy-paste it into your browser) to reset your password:\n\n${resetLink}\n\nIf you did not request this, please ignore this email.`,
        html: `<p>Hello,</p>
               <p>You requested a password reset. Please click on the following link (or copy-paste it into your browser) to reset your password:</p>
               <p><a href="${resetLink}">${resetLink}</a></p>
               <p>If you did not request this, please ignore this email.</p>`
      };

      // Send email
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending password reset email:', error);
          return res.status(500).json({ error: 'Failed to send password reset email', details: error.message });
        }
        console.log('Password reset email sent:', info.response);
      // Also return the reset token in the response for dev/testing convenience
      res.json({ message: 'Password reset email sent successfully. Please check your email.', resetToken });
      });
    });
  });
});

// Reset Password endpoint
app.post('/reset-password', (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required.' });
  }

  const selectQuery = 'SELECT * FROM password_resets WHERE token = ? AND expires_at > NOW()';
  db.query(selectQuery, [token], (err, results) => {
    if (err) {
      console.error('Error fetching password reset token:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }
    if (results.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired token.' });
    }

    const resetRecord = results[0];
    const updateQuery = 'UPDATE users SET password = ? WHERE id = ?';
    // Hash the new password before saving
    bcrypt.hash(newPassword, 10, (hashErr, hashedPassword) => {
      if (hashErr) {
        console.error('Error hashing new password:', hashErr.message);
        return res.status(500).json({ error: 'Failed to hash password' });
      }
      db.query(updateQuery, [hashedPassword, resetRecord.user_id], (err, result) => {
        if (err) {
          console.error('Error updating password:', err.message);
          return res.status(500).json({ error: 'Database error' });
        }
        const deleteQuery = 'DELETE FROM password_resets WHERE token = ?';
        db.query(deleteQuery, [token], (err, result) => {
          if (err) {
            console.error('Error deleting password reset token:', err.message);
          }
        });
        res.json({ message: 'Password has been reset successfully.' });
      });
    });
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

// Before saving to DB:
const safeDate = (date) => {
  if (!date || date === '0000-00-00 00:00:00' || date === '') return null;
  return date;
};

// Create Event Endpoint
app.post('/create-event', authenticateToken, authorizeRoles('admin', 'organizer'), (req, res) => {
  const {
    title, description, start, end, location, venue, capacity,
    price_standard, price_vip, price_premium, category_id, image
  } = req.body;

  const query = `
    INSERT INTO events
    (title, description, start, end, location, venue, capacity, price_standard, price_vip, price_premium, category_id, image, organizer)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [
    title, description, start, end, location, venue, capacity,
    price_standard, price_vip, price_premium, category_id, image, req.user.id
  ];

  db.query(query, params, (err, result) => {
    if (err) {
      console.error('Error creating event:', err);
      return res.status(500).json({ error: 'Failed to create event' });
    }
    res.json({ message: 'Event created successfully', id: result.insertId });
  });
});

// Update Event Endpoint
app.put('/events/:id', authenticateToken, authorizeRoles('admin', 'organizer'), (req, res) => {
  const { id } = req.params;
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
  const query = `
    UPDATE events
    SET title = ?, description = ?, start = ?, end = ?, location = ?, venue = ?, capacity = ?, price_standard = ?, price_vip = ?, price_premium = ?, category_id = ?, image = ?
    WHERE id = ?
  `;
  db.query(
    query,
    [
      title,
      description,
      safeDate(start),
      safeDate(end),
      location,
      venue,
      capacity,
      price_standard,
      price_vip,
      price_premium,
      category_id,
      image || null,
      id
    ],
    (err, result) => {
      if (err) {
        console.error('Error updating event:', err.message);
        return res.status(500).json({ error: 'Failed to update event', details: err.message });
      }
      res.json({ message: 'Event updated successfully' });
    }
  );
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
slug = slug && slug.trim() ? generateSlug(slug) : generateSlug(name);
if (!slug) return res.status(400).json({ error: 'Category name or slug required.' });
  const generateSlug = (text) => {
    return text
      ? text.toString().toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '')
      : '';
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

app.get('/analytics', authenticateToken, authorizeRoles('admin', 'organizer'), (req, res) => {
  // This query gets all events and aggregates attendee count and revenue from tickets
  const query = `
    SELECT 
      e.id,
      e.title AS event_name,
      e.start AS event_date,
      e.capacity,
      e.status,
      COALESCE(SUM(t.quantity), 0) AS attendee_count,
      COALESCE(SUM(t.total_price), 0) AS revenue,
      ROUND(
        CASE WHEN e.capacity > 0 THEN (COALESCE(SUM(t.quantity), 0) / e.capacity) * 100 ELSE 0 END, 2
      ) AS conversion_rate
    FROM events e
    LEFT JOIN tickets t ON t.event_id = e.id
    GROUP BY e.id
    ORDER BY e.start ASC
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching analytics:', err);
      return res.status(500).json({ error: 'Failed to fetch analytics' });
    }
    res.json(results);
  });
});

// Ticket Types Distribution
app.get('/analytics/ticket-types', authenticateToken, authorizeRoles('admin', 'organizer'), (req, res) => {
  const query = `
    SELECT 
      CASE 
        WHEN t.quantity > 0 AND e.price_vip > 0 AND t.total_price / t.quantity = e.price_vip THEN 'VIP'
        WHEN t.quantity > 0 AND e.price_premium > 0 AND t.total_price / t.quantity = e.price_premium THEN 'Premium'
        ELSE 'General'
      END AS type,
      SUM(t.quantity) AS count
    FROM tickets t
    JOIN events e ON t.event_id = e.id
    GROUP BY type
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching ticket types:', err);
      return res.status(500).json({ error: 'Failed to fetch ticket types' });
    }
    res.json(results);
  });
});

// Monthly Performance
app.get('/analytics/monthly-performance', authenticateToken, authorizeRoles('admin', 'organizer'), (req, res) => {
  const query = `
    SELECT 
      DATE_FORMAT(e.start, '%b %Y') AS month,
      COALESCE(SUM(t.total_price), 0) AS revenue,
      COALESCE(SUM(t.quantity), 0) AS attendees
    FROM events e
    LEFT JOIN tickets t ON t.event_id = e.id
    GROUP BY YEAR(e.start), MONTH(e.start)
    ORDER BY e.start ASC
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching monthly performance:', err);
      return res.status(500).json({ error: 'Failed to fetch monthly performance' });
    }
    res.json(results);
  });
});

// ========================
// Attendee Routes
// ========================

// Fetch all attendees
app.get('/attendees', authenticateToken, authorizeRoles('admin', 'organizer'), (req, res) => {
  let query = 'SELECT a.*, e.title as event_name FROM attendees a JOIN events e ON a.event_id = e.id';
  let params = [];
  if (req.user.user_type === 'organizer') {
    query += ' WHERE e.organizer = ?';
    params.push(req.user.id);
  }
  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch attendees' });
    res.json(results);
  });
});

// Get attendee by ID
app.get('/attendees/:id', authenticateToken, authorizeRoles('admin', 'organizer'), (req, res) => {
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
      INSERT INTO cancelled_tickets (ticket_id, event_id, user_id, ticket_type, quantity, total_price, payment_method)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(insertQuery, [ticket.id, ticket.event_id, ticket.user_id, ticket.ticket_type, ticket.quantity, ticket.total_price, ticket.payment_method], (err, result) => {
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
      INSERT INTO cancelled_tickets (ticket_id, event_id, user_id, ticket_type, quantity, total_price, payment_method)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(insertQuery, [purchase.id, purchase.event_id, purchase.user_id, purchase.ticket_type, purchase.quantity, purchase.total_price, purchase.payment_method], (err, insertResult) => {
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
  const {
    eventId,
    firstName,
    lastName,
    email,
    phone,
    ticketType,
    quantity,
    specialRequests
  } = req.body;

  const query = `
    INSERT INTO registrations
      (user_id, event_id, firstName, lastName, email, phone, ticketType, quantity, specialRequests)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  db.query(
    query,
    [userId, eventId, firstName, lastName, email, phone, ticketType, quantity, specialRequests || ""],
    (err, result) => {
      if (err) {
        console.error('Error registering:', err.message);
        return res.status(500).json({ error: 'Registration failed' });
      }
      res.json({ message: 'Registration successful' });
    }
  );
});

// Updated GET /my-registrations endpoint to join event details
app.get('/my-registrations', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const query = `
    SELECT * FROM (
      SELECT 
        p.id,
        p.event_id,
        e.title AS event_name,
        e.start AS event_date,
        e.venue,
        p.ticket_type,
        p.quantity,
        p.total_price,
        p.payment_method,
        p.created_at,
        CASE 
          WHEN e.start > NOW() THEN 'upcoming'
          ELSE 'past'
        END AS status
      FROM purchases p
      JOIN events e ON p.event_id = e.id
      WHERE p.user_id = ?

      UNION ALL

      SELECT 
        c.id,
        c.event_id,
        e.title AS event_name,
        e.start AS event_date,
        e.venue,
        c.ticket_type,
        c.quantity,
        c.total_price,
        c.payment_method,
        c.cancelled_at AS created_at,
        'cancelled' AS status
      FROM cancelled_tickets c
      JOIN events e ON c.event_id = e.id
      WHERE c.user_id = ?
    ) AS all_regs
    INNER JOIN (
      SELECT event_id, MAX(created_at) AS max_created
      FROM (
        SELECT event_id, created_at FROM purchases WHERE user_id = ?
        UNION ALL
        SELECT event_id, cancelled_at AS created_at FROM cancelled_tickets WHERE user_id = ?
      ) t
      GROUP BY event_id
    ) latest ON all_regs.event_id = latest.event_id AND all_regs.created_at = latest.max_created
    ORDER BY all_regs.created_at DESC
  `;
  db.query(query, [userId, userId, userId, userId], (err, results) => {
    if (err) {
      console.error('Error fetching purchases:', err);
      return res.status(500).json({ error: 'Failed to fetch purchases' });
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
      return res.status(500).json({ error: 'Failed to fetch category' });
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
  const { title, description, capacity, start_time, end_time, event_id } = req.body;
  const query = 'INSERT INTO sessions (title, description, capacity, start_time, end_time, event_id) VALUES (?, ?, ?, ?, ?, ?)';
  db.query(
    query,
    [title, description, capacity, safeDate(start_time), safeDate(end_time), event_id],
    (err, result) => {
      if (err) {
        console.error('Error inserting session:', err.message);
        return res.status(500).json({ error: 'Failed to create session' });
      }
      res.json({ id: result.insertId, title, description, capacity, start_time, end_time, event_id });
    }
  );
});

// PUT (update) a session
app.put('/sessions/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, capacity, start_time, end_time, event_id } = req.body;
  const query = 'UPDATE sessions SET title=?, description=?, capacity=?, start_time=?, end_time=?, event_id=? WHERE id=?';
  db.query(
    query,
    [title, description, capacity, safeDate(start_time), safeDate(end_time), event_id, id],
    (err, result) => {
      if (err) {
        console.error('Error updating session:', err.message);
        return res.status(500).json({ error: 'Failed to update session' });
      }
      res.json({ message: 'Session updated successfully' });
    }
  );
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

// Get ticket prices for a specific event
app.get('/events/:id/ticket-prices', (req, res) => {
  const { id } = req.params;
  const query = `
    SELECT price_standard, price_vip, price_premium
    FROM events
    WHERE id = ?
  `;
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Error fetching ticket prices:', err);
      return res.status(500).json({ error: 'Failed to fetch ticket prices' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(results[0]);
  });
});

app.get('/events/:id/tickets', (req, res) => {
  const { id } = req.params;
  const query = `
    SELECT * FROM tickets WHERE event_id = ?
  `;
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Error fetching tickets:', err);
      return res.status(500).json({ error: 'Failed to fetch tickets' });
    }
    res.json(results);
  });
});

// Listen for client connections
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// --- Example: Emit notification when a new category is added ---
app.post('/categories', authenticateToken, (req, res) => {
  let { name, slug, description, icon, color, status, metaTitle, metaDescription } = req.body;
  slug = slug && slug.trim() ? generateSlug(slug) : generateSlug(name);
  if (!slug) return res.status(400).json({ error: 'Category name or slug required.' });

  const checkSlugQuery = 'SELECT id FROM categories WHERE slug = ?';
  db.query(checkSlugQuery, [slug], (err, results) => {
    if (err) {
      console.error('Error checking slug uniqueness:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (results.length > 0) {
      return res.status(400).json({ error: 'Slug already exists for another category.' });
    }
    const insertQuery = `
      INSERT INTO categories (name, slug, description, icon, color, status, metaTitle, metaDescription)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(insertQuery, [name, slug, description, icon, color, status, metaTitle, metaDescription], (err, result) => {
      if (err) {
        console.error('Error creating category:', err);
        return res.status(500).json({ error: 'Failed to create category' });
      }
      // Emit notification to all users
      io.emit('notification', {
        type: 'category',
        message: `New category "${name}" added!`
      });
      res.json({ message: 'Category created', categoryId: result.insertId });
    });
  });
});

// --- Example: Emit notification when a new event is added ---
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
    [
      title,
      description,
      organizer,
      safeDate(start),
      safeDate(end),
      location,
      venue,
      capacity,
      price_standard,
      price_vip,
      price_premium,
      category_id,
      image || null
    ],
    (err, result) => {
      if (err) {
        console.error('Error inserting event:', err);
        return res.status(500).json({ error: 'Failed to create event', details: err.message });
      }
      // Emit notification to all users
      io.emit('notification', {
        type: 'event',
        message: `New event "${title}" added! Register now!`
      });
      res.json({ message: 'Event created successfully', eventId: result.insertId });
    }
  );
});

// --- Example: Emit notification for upcoming events (you can schedule this with setInterval or a cron job) ---
setInterval(() => {
  const now = new Date();
  const soon = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
  const query = 'SELECT * FROM events WHERE start BETWEEN ? AND ?';
  db.query(query, [now, soon], (err, results) => {
    if (!err && results.length > 0) {
      results.forEach(event => {
        io.emit('notification', {
          type: 'upcoming',
          message: `Upcoming event: "${event.title}" starts soon! Register now!`
        });
      });
    }
  });
}, 10 * 60 * 1000); // Check every 10 minutes

// --- Add this route for testing (anywhere after your other routes) ---
app.get('/test-notification', (req, res) => {
  io.emit('notification', {
    type: 'test',
    message: 'This is a test notification!'
  });
  res.json({ message: 'Notification sent!' });
});

// --- Use server.listen instead of app.listen ---
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// --- RBAC Middleware (already present) ---
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.user_type)) {
      return res.status(403).json({ error: 'Forbidden: insufficient permissions' });
    }
    next();
  };
}

// RBAC: Only allow admin users
function rbacAdmin(req, res, next) {
  if (req.user && req.user.user_type === 'admin') {
    next();
  } else {
    return res.status(403).json({ error: 'Forbidden: Admins only' });
  }
}

// --- ADMIN ROUTES ---
// Only admin can view/manage all users
app.get('/users', authenticateToken, authorizeRoles('admin'), (req, res) => {
  db.query('SELECT * FROM users', (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch users' });
    res.json(results);
  });
});

// Only admin can delete any user
app.delete('/users/:id', authenticateToken, authorizeRoles('admin'), (req, res) => {
  db.query('DELETE FROM users WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: 'Failed to delete user' });
    res.json({ message: 'User deleted' });
  });
});

// Only admin can view all events (organizers can only see their own)
app.get('/admin/events', authenticateToken, authorizeRoles('admin'), (req, res) => {
  db.query('SELECT * FROM events', (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch events' });
    res.json(results);
  });
});

// --- ORGANIZER ROUTES ---
// Organizer can create events
app.post('/events', authenticateToken, authorizeRoles('organizer', 'admin'), (req, res) => {
  // ...your create event logic...
});

// Organizer can view only their events
app.get('/organizer/events', authenticateToken, authorizeRoles('organizer'), (req, res) => {
  db.query('SELECT * FROM events WHERE organizer = ?', [req.user.id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch events' });
    res.json(results);
  });
});

// Organizer can update/delete only their events
app.put('/events/:id', authenticateToken, authorizeRoles('organizer', 'admin'), (req, res) => {
  db.query('SELECT * FROM events WHERE id = ?', [req.params.id], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ error: 'Event not found' });
    if (req.user.user_type !== 'admin' && results[0].organizer !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: not your event' });
    }
    // ...update logic...
  });
});
app.delete('/events/:id', authenticateToken, authorizeRoles('organizer', 'admin'), (req, res) => {
  db.query('SELECT * FROM events WHERE id = ?', [req.params.id], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ error: 'Event not found' });
    if (req.user.user_type !== 'admin' && results[0].organizer !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: not your event' });
    }
    db.query('DELETE FROM events WHERE id = ?', [req.params.id], (err) => {
      if (err) return res.status(500).json({ error: 'Failed to delete event' });
      res.json({ message: 'Event deleted' });
    });
  });
});

// --- SPEAKER ROUTES ---
app.get('/speaker/sessions', authenticateToken, authorizeRoles('speaker'), (req, res) => {
  db.query('SELECT * FROM sessions WHERE speaker_id = ?', [req.user.id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch sessions' });
    res.json(results);
  });
});
app.post('/sessions/:id/materials', authenticateToken, authorizeRoles('speaker'), (req, res) => {
  db.query('SELECT * FROM sessions WHERE id = ? AND speaker_id = ?', [req.params.id, req.user.id], (err, results) => {
    if (err || results.length === 0) return res.status(403).json({ error: 'Forbidden: not your session' });
    // ...upload logic...
    res.json({ message: 'Material uploaded' });
  });
});

// --- VENDOR ROUTES ---
app.get('/vendor/booths', authenticateToken, authorizeRoles('vendor'), (req, res) => {
  db.query('SELECT * FROM booths WHERE vendor_id = ?', [req.user.id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch booths' });
    res.json(results);
  });
});
app.post('/vendor/booths', authenticateToken, authorizeRoles('vendor'), (req, res) => {
  // ...add booth logic...
});

// --- ATTENDEE ROUTES ---
app.get('/events', authenticateToken, authorizeRoles('attendee', 'organizer', 'admin', 'speaker', 'vendor'), (req, res) => {
  db.query('SELECT * FROM events WHERE status = "Published"', (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch events' });
    res.json(results);
  });
});
app.post('/register', authenticateToken, authorizeRoles('attendee'), (req, res) => {
  // ...registration logic...
});
app.get('/my-registrations', authenticateToken, authorizeRoles('attendee', 'user', 'speaker', 'vendor'), (req, res) => {
  // ...your existing logic...
});

// ========================
// Permissions Endpoint
// ========================

/**
 * Get allowed pages and actions for the logged-in user
 * Returns: { role, pages: [{ page, actions: [...] }] }
 */
app.get('/my-permissions', authenticateToken, (req, res) => {
  const role = req.user.user_type;
  // Define permissions for each role
  const permissions = {
    admin: [
      { page: 'admin-dashboard.html', actions: ['view', 'manage'] },
      { page: 'create_event.html', actions: ['create'] },
      { page: 'create_category.html', actions: ['create'] },
      { page: 'category-edit.html', actions: ['edit', 'delete'] },
      { page: 'event.html', actions: ['view'] },
      { page: 'eventcategory.html', actions: ['manage'] },
      { page: 'analytics.html', actions: ['view'] },
      { page: 'mytickets.html', actions: ['view', 'test'] },
      { page: 'myregistration.html', actions: ['view', 'test'] },
      { page: 'notifications.html', actions: ['send'] },
      { page: 'ticket.html', actions: ['view', 'manage'] },
      { page: 'registration.html', actions: ['view', 'manage'] },
      { page: 'profile.html', actions: ['edit'] },
      { page: 'setting.html', actions: ['manage'] },
      { page: 'session.html', actions: ['view'] },
      { page: 'features.html', actions: ['view', 'manage'] },
      { page: 'login.html', actions: ['login'] },
      { page: 'signup.html', actions: ['signup'] },
      { page: 'forgot-password.html', actions: ['recover'] }
    ],
    attendee: [
      { page: 'attendee-dashboard.html', actions: ['view'] },
      { page: 'event.html', actions: ['view', 'explore'] },
      { page: 'registration.html', actions: ['register'] },
      { page: 'ticket.html', actions: ['purchase', 'view'] },
      { page: 'mytickets.html', actions: ['view'] },
      { page: 'myregistration.html', actions: ['view'] },
      { page: 'notifications.html', actions: ['receive'] },
      { page: 'profile.html', actions: ['edit'] },
      { page: 'login.html', actions: ['login'] },
      { page: 'signup.html', actions: ['signup'] },
      { page: 'forgot-password.html', actions: ['recover'] }
    ],
    organizer: [
      { page: 'organizer-dashboard.html', actions: ['overview'] },
      { page: 'create_event.html', actions: ['create'] },
      { page: 'event.html', actions: ['view', 'manage'] },
      { page: 'eventcategory.html', actions: ['choose'] },
      { page: 'category-edit.html', actions: ['edit'] },
      { page: 'notifications.html', actions: ['send'] },
      { page: 'session.html', actions: ['manage'] },
      { page: 'profile.html', actions: ['edit'] }
    ],
    speaker: [
      { page: 'session.html', actions: ['view', 'manage'] },
      { page: 'notifications.html', actions: ['receive'] },
      { page: 'profile.html', actions: ['edit'] }
    ],
    vendor: [
      { page: 'vendor-dashboard.html', actions: ['view', 'manage'] },
      { page: 'notifications.html', actions: ['receive'] },
      { page: 'profile.html', actions: ['edit'] }
    ]
  };

  // Map "user" to "attendee" if needed
  const effectiveRole = role === 'user' ? 'attendee' : role;
  res.json({
    role: effectiveRole,
    pages: permissions[effectiveRole] || []
  });
});

// --- FRONTEND ---
// After login, redirect user to their dashboard based on user_type
// Example (pseudo-code for frontend):
/*
if (user_type === 'admin') window.location.href = '/admin-dashboard.html';
if (user_type === 'organizer') window.location.href = '/organizer-dashboard.html';
if (user_type === 'speaker') window.location.href = '/speaker-dashboard.html';
if (user_type === 'vendor') window.location.href = '/vendor-dashboard.html';
if (user_type === 'attendee') window.location.href = '/attendee-dashboard.html';
*/

// Middleware to check for admin role
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can perform this action.' });
  }
  next();
}

// Edit session (PUT)
app.put('/sessions/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { title, description, capacity, start_time, end_time, event_id } = req.body;
  const query = 'UPDATE sessions SET title=?, description=?, capacity=?, start_time=?, end_time=?, event_id=? WHERE id=?';
  db.query(
    query,
    [title, description, capacity, safeDate(start_time), safeDate(end_time), event_id, id],
    (err, result) => {
      if (err) {
        console.error('Error updating session:', err.message);
        return res.status(500).json({ error: 'Failed to update session' });
      }
      res.json({ message: 'Session updated successfully' });
    }
  );
});

// Delete session (DELETE)
app.delete('/sessions/:id', authenticateToken, requireAdmin, (req, res) => {
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