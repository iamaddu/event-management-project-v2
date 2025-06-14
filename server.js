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
  const { first_name, last_name, username, email, phone, password, user_type, admin_access_code } = req.body;
  try {
    if (user_type === 'admin') {
      // Require correct access code for admin signup
      if (admin_access_code !== 'iamadmin') {
        return res.status(403).json({ error: 'Invalid admin access code.' });
      }
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = `
      INSERT INTO users (first_name, last_name, username, email, phone, password, user_type, admin_access_code)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(
      query,
      [first_name, last_name, username, email, phone, hashedPassword, user_type || 'attendee', user_type === 'admin' ? admin_access_code : null],
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
  let organizerId;
  if (req.user.user_type === 'admin') {
    organizerId = req.body.organizer; // Admin assigns organizer
    if (!organizerId) {
      return res.status(400).json({ error: 'Organizer user ID is required.' });
    }
  } else {
    organizerId = req.user.id; // Organizer assigns self
  }
  const {
    title, description, start, end, location, venue, capacity,
    price_standard, price_vip, price_premium, category_id, image,
    event_type
  } = req.body;

  const query = `
    INSERT INTO events (
      title, description, organizer, start, end, location, venue, capacity, price_standard, price_vip, price_premium, status, category_id, image, event_type
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Published', ?, ?, ?)
  `;
  db.query(
    query,
    [
      title,
      description,
      organizerId,
      start,
      end,
      location,
      venue,
      capacity,
      price_standard,
      price_vip,
      price_premium,
      category_id,
      image || null,
      event_type
    ],
    (err, result) => {
      if (err) {
        console.error('Error inserting event:', err);
        return res.status(500).json({ error: 'Failed to create event' });
      }
      // EMIT notification to all users
      io.emit('notification', {
        type: 'event',
        message: `A new event "${req.body.title}" has been added!`,
        eventId: result.insertId
      });
      res.json({ success: true, eventId: result.insertId });
    }
  );
});

// Update Event Endpoint
app.put('/events/:id', authenticateToken, authorizeRoles('organizer', 'admin'), (req, res) => {
  db.query('SELECT * FROM events WHERE id = ?', [req.params.id], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ error: 'Event not found' });
    if (req.user.user_type !== 'admin' && results[0].organizer !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: not your event' });
    }
    // ...update logic here...
    // Example:
    const {
      title, description, start, end, location, venue, capacity,
      price_standard, price_vip, price_premium, category_id, image
    } = req.body;
    db.query(
      `UPDATE events SET title=?, description=?, start=?, end=?, location=?, venue=?, capacity=?, price_standard=?, price_vip=?, price_premium=?, category_id=?, image=? WHERE id=?`,
      [title, description, start, end, location, venue, capacity, price_standard, price_vip, price_premium, category_id, image, req.params.id],
      (err2) => {
        if (err2) return res.status(500).json({ error: 'Failed to update event' });
        res.json({ message: 'Event updated' });
      }
    );
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
app.get('/events', authenticateToken, authorizeRoles('attendee', 'organizer', 'admin', 'speaker', 'vendor'), (req, res) => {
  db.query('SELECT * FROM events WHERE status = "Published"', (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch events' });
    res.json(results);
  });
});

// Get only events that require tickets (paid events)
app.get('/ticketed-events', authenticateToken, (req, res) => {
  db.query(
    `SELECT * FROM events 
     WHERE status = "Published" 
       AND (
         (COALESCE(price_standard,0) > 0) 
         OR (COALESCE(price_vip,0) > 0)  
         OR (COALESCE(price_premium,0) > 0)
       )`,
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch ticketed events' });
      res.json(results);
    }
  );
});

// Get only FCFS events (no ticket price)
app.get('/fcfs-events', authenticateToken, (req, res) => {
  db.query(
    `SELECT * FROM events 
     WHERE status = "Published" 
       AND (COALESCE(price_standard,0) = 0 AND COALESCE(price_vip,0) = 0 AND COALESCE(price_premium,0) = 0)`,
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch FCFS events' });
      res.json(results);
    }
  );
});

// Get only events that require registration (not ticket purchase)
app.get('/registration-events', authenticateToken, (req, res) => {
  db.query(
    `SELECT * FROM events 
     WHERE status = "Published" 
       AND (event_type = 'free' OR event_type = 'fcfs')
       AND COALESCE(price_standard,0) = 0 
       AND COALESCE(price_vip,0) = 0 
       AND COALESCE(price_premium,0) = 0`,
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch registration events' });
      res.json(results);
    }
  );
});

// ========================
// Analytics Endpoint
// ========================

// Main analytics summary (current, previous, per-event)
app.get('/analytics', authenticateToken, authorizeRoles('admin', 'organizer'), (req, res) => {
  const range = parseInt(req.query.range) || 30;
  const now = new Date();
  const startCurrent = new Date(now.getTime() - range * 24 * 60 * 60 * 1000);
  const startPrev = new Date(startCurrent.getTime() - range * 24 * 60 * 60 * 1000);
  const toMySQL = d => d.toISOString().slice(0, 19).replace('T', ' ');

  // Organizer filter
  let organizerFilter = '';
  let paramsCurrent = [
    toMySQL(startCurrent), toMySQL(now),
    toMySQL(startCurrent), toMySQL(now)
  ];
  let paramsPrev = [
    toMySQL(startPrev), toMySQL(startCurrent),
    toMySQL(startPrev), toMySQL(startCurrent)
  ];
  if (req.user.user_type === 'organizer') {
    organizerFilter = ' AND e.organizer = ?';
    paramsCurrent.push(req.user.id, req.user.id);
    paramsPrev.push(req.user.id, req.user.id);
  }

  const currentQuery = `
    SELECT 
      COUNT(DISTINCT e.id) AS events,
      COALESCE(SUM(t.quantity), 0) AS attendees,
      COALESCE(SUM(t.total_price), 0) AS revenue,
      ROUND(
        CASE WHEN COALESCE(SUM(e.capacity), 0) > 0 THEN (COALESCE(SUM(t.quantity), 0) / COALESCE(SUM(e.capacity), 0)) * 100 ELSE 0 END, 2
      ) AS conversion
    FROM events e
    LEFT JOIN tickets t ON t.event_id = e.id AND t.purchase_date >= ? AND t.purchase_date <= ?
    WHERE e.start >= ? AND e.start <= ?${organizerFilter}
  `;
  const previousQuery = `
    SELECT 
      COUNT(DISTINCT e.id) AS events,
      COALESCE(SUM(t.quantity), 0) AS attendees,
      COALESCE(SUM(t.total_price), 0) AS revenue,
      ROUND(
        CASE WHEN COALESCE(SUM(e.capacity), 0) > 0 THEN (COALESCE(SUM(t.quantity), 0) / COALESCE(SUM(e.capacity), 0)) * 100 ELSE 0 END, 2
      ) AS conversion
    FROM events e
    LEFT JOIN tickets t ON t.event_id = e.id AND t.purchase_date >= ? AND t.purchase_date <= ?
    WHERE e.start >= ? AND e.start <= ?${organizerFilter}
  `;
  const eventsQuery = `
    SELECT 
      e.id,
      e.title AS event_name,
      e.start AS event_date,
      e.capacity,
      e.status,
      COALESCE(SUM(t.quantity), 0) AS attendee_count,
      COALESCE(SUM(t.total_price), 0) AS revenue,
      ROUND(
        CASE WHEN COALESCE(e.capacity, 0) > 0 THEN (COALESCE(SUM(t.quantity), 0) / COALESCE(e.capacity, 0)) * 100 ELSE 0 END, 2
      ) AS conversion_rate
    FROM events e
    LEFT JOIN tickets t ON t.event_id = e.id AND t.purchase_date >= ? AND t.purchase_date <= ?
    WHERE e.start >= ? AND e.start <= ?${organizerFilter}
    GROUP BY e.id
    ORDER BY e.start ASC
  `;

  db.query(currentQuery, paramsCurrent, (err, currentRows) => {
    if (err) {
      console.error('Analytics currentQuery error:', err);
      return res.status(500).json({ error: 'Failed to fetch analytics (current)' });
    }
    db.query(previousQuery, paramsPrev, (err2, prevRows) => {
      if (err2) {
        console.error('Analytics previousQuery error:', err2);
        return res.status(500).json({ error: 'Failed to fetch analytics (previous)' });
      }
      db.query(eventsQuery, paramsCurrent, (err3, eventsRows) => {
        if (err3) {
          console.error('Analytics eventsQuery error:', err3);
          return res.status(500).json({ error: 'Failed to fetch event analytics' });
        }
        res.json({
          current: currentRows[0] || { events: 0, attendees: 0, revenue: 0, conversion: 0 },
          previous: prevRows[0] || { events: 0, attendees: 0, revenue: 0, conversion: 0 },
          events: eventsRows || []
        });
      });
    });
  });
});

// Ticket Types Distribution
app.get('/analytics/ticket-types', authenticateToken, authorizeRoles('admin', 'organizer'), (req, res) => {
  let query = `
    SELECT 
      CASE 
        WHEN t.quantity > 0 AND e.price_vip > 0 AND t.total_price / t.quantity = e.price_vip THEN 'VIP'
        WHEN t.quantity > 0 AND e.price_premium > 0 AND t.total_price / t.quantity = e.price_premium THEN 'Premium'
        ELSE 'General'
      END AS type,
      SUM(t.quantity) AS count
    FROM tickets t
    JOIN events e ON t.event_id = e.id
  `;
  let params = [];
  if (req.user.user_type === 'organizer') {
    query += ' WHERE e.organizer = ?';
    params.push(req.user.id);
  }
  query += ' GROUP BY type';
  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch ticket types' });
    res.json(results);
  });
});

app.get('/analytics/monthly-performance', authenticateToken, authorizeRoles('admin', 'organizer'), (req, res) => {
  let query = `
    SELECT 
      DATE_FORMAT(e.start, '%b %Y') AS month,
      COALESCE(SUM(t.total_price), 0) AS revenue,
      COALESCE(SUM(t.quantity), 0) AS attendees
    FROM events e
    LEFT JOIN tickets t ON t.event_id = e.id
  `;
  let params = [];
  if (req.user.user_type === 'organizer') {
    query += ' WHERE e.organizer = ?';
    params.push(req.user.id);
  }
  query += ' GROUP BY YEAR(e.start), MONTH(e.start) ORDER BY e.start ASC';
  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch monthly performance' });
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
app.post('/purchase-ticket', authenticateToken, authorizeRoles('attendee', 'admin'), (req, res) => {
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
    SELECT 
      r.id,
      r.event_id,
      e.title AS event_name,
      e.start AS event_date,
      e.venue,
      r.ticketType AS ticket_type,
      r.quantity,
      r.status,
      r.created_at,
      CASE
        WHEN r.ticketType = 'VIP' THEN e.price_vip * r.quantity
        WHEN r.ticketType = 'Premium' THEN e.price_premium * r.quantity
        ELSE e.price_standard * r.quantity
      END AS total_price
    FROM registrations r
    JOIN events e ON r.event_id = e.id
    WHERE r.user_id = ?
    ORDER BY r.created_at DESC
  `;
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching registrations:', err);
      return res.status(500).json({ error: 'Failed to fetch registrations' });
    }
    res.json(results);
  });
});

// Organizer: Get all registrations for their events
app.get('/organizer/registrations', authenticateToken, authorizeRoles('organizer'), (req, res) => {
  const organizerId = req.user.id;
  const query = `
    SELECT r.*, e.title AS event_title
    FROM registrations r
    JOIN events e ON r.event_id = e.id
    WHERE e.organizer = ?
    ORDER BY r.created_at DESC
  `;
  db.query(query, [organizerId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch registrations' });
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
    WHERE p.event_id = ?
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

// GET all sessions (with speakers, supporting both user-linked and guest speakers)
app.get('/sessions', (req, res) => {
  db.query('SELECT * FROM sessions', (err, sessions) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch sessions' });
    if (!sessions.length) return res.json([]);

    db.query(
      `SELECT ss.session_id, s.first_name, s.last_name
       FROM session_speakers ss
       JOIN speakers s ON ss.speaker_id = s.id`,
      (err2, speakerRows) => {
        if (err2) return res.status(500).json({ error: 'Failed to fetch speakers' });

        sessions.forEach(session => {
          session.speakers = speakerRows
            .filter(row => row.session_id === session.id)
            .map(row => ({ name: `${row.first_name || ''} ${row.last_name || ''}`.trim() }));
        });

        res.json(sessions);
      }
    );
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

app.get('/events/:id/ticket-types', (req, res) => {
  const eventId = req.params.id;
  db.query('SELECT price_standard, price_vip, price_premium FROM events WHERE id=?', [eventId], (err, rows) => {
    if (err || !rows.length) return res.status(404).json([]);
    const prices = rows[0];
    res.json([
      { key: 'general', label: 'General Admission', price: prices.price_standard },
      { key: 'vip', label: 'VIP Pass', price: prices.price_vip },
      { key: 'premium', label: 'Premium Experience', price: prices.price_premium }
    ].filter(t => t.price > 0));
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
// Get all speakers with their sessions (for speakers.html)
app.get('/speakers', authenticateToken, (req, res) => {
  // Get all speakers with names from speakers or users table
  db.query(
    `SELECT s.id AS speaker_id, 
            COALESCE(s.first_name, u.first_name) AS first_name, 
            COALESCE(s.last_name, u.last_name) AS last_name, 
            s.bio, s.photo
     FROM speakers s
     LEFT JOIN users u ON s.user_id = u.id`,
    (err, speakers) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch speakers' });
      // Get sessions for each speaker
      db.query(
        `SELECT ss.speaker_id, se.id AS session_id, se.title, se.description
         FROM session_speakers ss
         JOIN sessions se ON ss.session_id = se.id`,
        (err2, sessionRows) => {
          if (err2) return res.status(500).json({ error: 'Failed to fetch sessions' });
          // Attach sessions to each speaker
          speakers.forEach(sp => {
            sp.sessions = sessionRows
              .filter(sess => sess.speaker_id === sp.speaker_id)
              .map(sess => ({
                id: sess.session_id,
                title: sess.title,
                description: sess.description
              }));
          });
          res.json(speakers);
        }
      );
    }
  );
});

// --- Example: Emit notification when a new event is added ---
app.post('/create-event', authenticateToken, (req, res) => {
  let organizerId;
  if (req.user.user_type === 'admin') {
    organizerId = req.body.organizer; // Admin assigns organizer
    if (!organizerId) {
      return res.status(400).json({ error: 'Organizer user ID is required.' });
    }
  } else {
    organizerId = req.user.id; // Organizer assigns self
  }
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
    image,
    event_type // <-- add this
  } = req.body;

  const query = `
    INSERT INTO events (
      title, description, organizer, start, end, location, venue, capacity, price_standard, price_vip, price_premium, status, category_id, image, event_type
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Published', ?, ?, ?)
  `;
  db.query(
    query,
    [
      title,
      description,
      organizerId,
      start,
      end,
      location,
      venue,
      capacity,
      price_standard,
      price_vip,
      price_premium,
      category_id,
      image || null,
      event_type // <-- add this
    ],
    (err, result) => {
      if (err) {
        console.error('Error inserting event:', err);
        return res.status(500).json({ error: 'Failed to create event', details: err.message });
      }
      // EMIT notification to all users
      io.emit('notification', {
        type: 'event',
        message: `A new event "${req.body.title}" has been added!`,
        eventId: result.insertId
      });
      res.json({ success: true, eventId: result.insertId });
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
  if (req.query.notSpeaker) {
    db.query(
      `SELECT id, first_name, last_name, username FROM users WHERE id NOT IN (SELECT user_id FROM speakers)`,
      (err, users) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch users' });
        res.json(users);
      }
    );
  } else {
    db.query(`SELECT id, first_name, last_name, username FROM users`, (err, users) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch users' });
      res.json(users);
    });
  }
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

// Only admin can view all registrations
app.get('/admin/registrations', authenticateToken, authorizeRoles('admin'), (req, res) => {
  const query = `
    SELECT 
      r.id AS registration_id,
      r.firstName,
      r.lastName,
      r.email,
      r.phone,
      r.ticketType,
      r.quantity,
      r.status,
      r.created_at,
      e.title AS event_title,
      e.start,
      u.first_name,
      u.last_name
    FROM registrations r
    LEFT JOIN events e ON r.event_id = e.id
    LEFT JOIN users u ON r.user_id = u.id
    ORDER BY r.created_at DESC
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching registrations:', err);
      return res.status(500).json({ error: 'Failed to fetch registrations' });
    }
    res.json(results);
  });
});

// --- ORGANIZER ROUTES ---
app.post('/events', authenticateToken, authorizeRoles('organizer', 'admin'), (req, res) => {
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
    image,
    event_type // <-- add this
  } = req.body;

  const query = `
    INSERT INTO events (
      title, description, organizer, start, end, location, venue, capacity, price_standard, price_vip, price_premium, status, category_id, image, event_type
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Published', ?, ?, ?)
  `;
  db.query(
    query,
    [
      title,
      description,
      organizerId,
      start,
      end,
      location,
      venue,
      capacity,
      price_standard,
      price_vip,
      price_premium,
      category_id,
      image || null,
      event_type // <-- add this
    ],
    (err, result) => {
      if (err) {
        console.error('Error inserting event:', err);
        return res.status(500).json({ error: 'Failed to create event', details: err.message });
      }
      res.json({ message: 'Event created successfully', eventId: result.insertId });
    }
  );
});

app.get('/my-events', authenticateToken, authorizeRoles('organizer'), (req, res) => {
  db.query('SELECT * FROM events WHERE organizer = ?', [req.user.id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
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
    // ...update logic here...
    // Example:
    const {
      title, description, start, end, location, venue, capacity,
      price_standard, price_vip, price_premium, category_id, image
    } = req.body;
    db.query(
      `UPDATE events SET title=?, description=?, start=?, end=?, location=?, venue=?, capacity=?, price_standard=?, price_vip=?, price_premium=?, category_id=?, image=? WHERE id=?`,
      [title, description, start, end, location, venue, capacity, price_standard, price_vip, price_premium, category_id, image, req.params.id],
      (err2) => {
        if (err2) return res.status(500).json({ error: 'Failed to update event' });
        res.json({ message: 'Event updated' });
      }
    );
  });
});
app.delete('/events/:id', authenticateToken, authorizeRoles('organizer', 'admin'), (req, res) => {
  db.query('SELECT * FROM events WHERE id = ?', [req.params.id], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ error: 'Event not found' });
    if (req.user.user_type !== 'admin' && results[0].organizer !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: not your event' });
    }
    db.query('DELETE FROM events WHERE id = ?', [req.params.id], (err2) => {
      if (err2) return res.status(500).json({ error: 'Failed to delete event' });
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
app.post('/speakers', authenticateToken, authorizeRoles('admin', 'organizer'), (req, res) => {
  const { first_name, last_name, bio, photo } = req.body;
  if (!first_name || !last_name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  db.query(
    `INSERT INTO speakers (first_name, last_name, bio, photo, user_id) VALUES (?, ?, ?, ?, NULL)`,
    [first_name, last_name, bio || '', photo || null],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Failed to add speaker' });
      res.json({ success: true });
    }
  );
});

// PUT /speakers/:id
app.put('/speakers/:id', authenticateToken, (req, res) => {
  const { first_name, last_name } = req.body;
  const id = req.params.id;
  db.query(
    'UPDATE speakers SET first_name = ?, last_name = ? WHERE id = ?',
    [first_name, last_name, id],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Failed to update speaker' });
      res.json({ success: true });
    }
  );
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
app.get('/my-tickets', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const query = `
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
      p.created_at
    FROM purchases p
    JOIN events e ON p.event_id = e.id
    WHERE p.user_id = ?
    ORDER BY p.created_at DESC
  `;
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching tickets:', err);
      return res.status(500).json({ error: 'Failed to fetch tickets' });
    }
    res.json(results);
  });
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


app.post('/admin-verify', authenticateToken, (req, res) => {
  if (req.user.user_type !== 'admin') {
    return res.status(403).json({ error: 'Not an admin.' });
  }
  const { access_code } = req.body;
  db.query('SELECT admin_access_code FROM users WHERE id = ?', [req.user.id], (err, results) => {
    if (err || results.length === 0) return res.status(500).json({ error: 'DB error' });
    if (results[0].admin_access_code === access_code) {
      res.json({ success: true });
    } else {
      res.status(403).json({ error: 'Invalid admin access code.' });
    }
  });
});

app.post('/cancel-registration/:regId', authenticateToken, (req, res) => {
  const regId = req.params.regId;
  const userId = req.user.id;
  const userRole = req.user.role; // Make sure you set this in your JWT or session

  let query, params;
  if (userRole === 'admin') {
    query = 'UPDATE registrations SET status="cancelled" WHERE id=?';
    params = [regId];
  } else {
    query = 'UPDATE registrations SET status="cancelled" WHERE id=? AND user_id=?';
    params = [regId, userId];
  }

  db.query(query, params, (err, result) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Registration not found' });
    res.json({ success: true });
  });
});

// --- COMMENTS ENDPOINTS ---

// Add a comment to an event (attendee/user only)
app.post('/events/:eventId/comment', authenticateToken, authorizeRoles('attendee', 'user'), (req, res) => {
  const eventId = req.params.eventId;
  const userId = req.user.id;
  const { comment, rating } = req.body;
  if (!comment || !rating) {
    return res.status(400).json({ error: 'Comment and rating are required.' });
  }
  const insertQuery = `
    INSERT INTO event_comments (event_id, user_id, comment, rating, created_at)
    VALUES (?, ?, ?, ?, NOW())
  `;
  db.query(insertQuery, [eventId, userId, comment, rating], (err, result) => {
    if (err) {
      console.error('Error adding comment:', err);
      return res.status(500).json({ error: 'Failed to add comment' });
    }
    res.json({ success: true, commentId: result.insertId });
  });
});

// Get all comments for an event (anyone can
app.get('/events/:eventId/comments', authenticateToken, (req, res) => {
  const eventId = req.params.eventId;
  // This query should NOT filter by user_id!
  db.query(
    `
    SELECT ec.*, u.username 
    FROM event_comments ec 
    JOIN users u ON ec.user_id = u.id 
    WHERE ec.event_id = ?
    ORDER BY ec.created_at DESC
    `,
    [eventId],
    (err, results) => {
      if (err) {
        console.error('Error fetching comments:', err);
        return res.status(500).json({ error: 'Failed to fetch comments' });
      }
      res.json(results);
    }
  );
});

// Get all speakers (for dropdowns, etc.)
app.get('/all-speakers', authenticateToken, authorizeRoles('admin', 'organizer'), (req, res) => {
  db.query(
    `SELECT s.id as speaker_id, s.first_name, s.last_name, s.bio, s.photo
     FROM speakers s`,
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch speakers' });
      res.json(results);
    }
  );
});

// Assign speakers to a session (replace all assignments)
app.post('/sessions/:id/speakers', authenticateToken, authorizeRoles('admin', 'organizer'), (req, res) => {
  const sessionId = req.params.id;
  const { speakerIds } = req.body; // Array of speaker ID
  if (!Array.isArray(speakerIds)) return res.status(400).json({ error: 'speakerIds must be an array' });

  db.query('DELETE FROM session_speakers WHERE session_id = ?', [sessionId], (err) => {
    if (err) return res.status(500).json({ error: 'Failed to clear old speakers' });
    if (speakerIds.length === 0) return res.json({ success: true });

    const values = speakerIds.map(sid => [sessionId, sid]);
    db.query('INSERT INTO session_speakers (session_id, speaker_id) VALUES ?', [values], (err2) => {
      if (err2) return res.status(500).json({ error: 'Failed to assign speakers' });
      res.json({ success: true });
    });
  });
});

// Get speakers for a session (works for both user-linked and guest speakers)
app.get('/sessions/:id/speakers', authenticateToken, (req, res) => {
  db.query(
    `SELECT s.id as speaker_id, s.first_name, s.last_name, s.bio, s.photo
     FROM session_speakers ss
     JOIN speakers s ON ss.speaker_id = s.id
     WHERE ss.session_id = ?`,
    [req.params.id],
    (err, speakers) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch session speakers' });
      res.json(speakers);
    }
  );
});
