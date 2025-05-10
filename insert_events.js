const mysql = require('mysql2');
const { faker } = require('@faker-js/faker'); // Use the updated faker library
const express = require('express'); // Add express for API endpoints
const app = express();

// Connect to MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root', // Replace with your MySQL username
  password: '', // Replace with your MySQL password
  database: 'event_management', // Ensure this database exists
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL');
});

// Generate and insert n events
async function insertEvents(n) {
  const events = [];
  for (let i = 1; i <= n; i++) {
    const title = faker.commerce.productName(); // Random event title
    const description = faker.lorem.paragraph(); // Random description
    const organizer = faker.person.fullName(); // Random organizer name
    const start = faker.date.future(); // Random future start date
    const end = faker.date.future({ refDate: start }); // Random future end date after start
    const location = faker.address.city(); // Random city
    const venue = faker.company.name(); // Random venue name
    const capacity = faker.number.int({ min: 50, max: 500 }); // Random capacity between 50 and 500
    const price_standard = faker.number.float({ min: 10, max: 50, precision: 0.01 }); // Random standard price
    const price_vip = faker.number.float({ min: 50, max: 100, precision: 0.01 }); // Random VIP price
    const price_premium = faker.number.float({ min: 100, max: 200, precision: 0.01 }); // Random premium price
    const status = i % 2 === 0 ? 'Published' : 'Draft'; // Alternate between Published and Draft
    const image = faker.image.imageUrl(); // Random image URL

    events.push([
      title,
      description,
      organizer,
      start,
      end,
      location,
      venue,
      capacity,
      price_standard,
      price_vip,
      price_premium,
      status,
      image,
    ]);
  }

  const query = `
    INSERT INTO events (title, description, organizer, start, end, location, venue, capacity, price_standard, price_vip, price_premium, status, image)
    VALUES ?
  `;
  db.query(query, [events], (err, result) => {
    if (err) {
      console.error('Error inserting events:', err.message); // Log the error message
      return;
    }
    console.log(`Inserted ${result.affectedRows} events`);
    db.end();
  });
}

// Insert a single event
async function insertSingleEvent() {
  const title = 'Sample Event';
  const description = 'This is a sample event description.';
  const organizer = 'Sample Organizer';
  const start = new Date().toISOString().slice(0, 19).replace('T', ' '); // Current date and time
  const end = new Date(Date.now() + 3600000).toISOString().slice(0, 19).replace('T', ' '); // 1 hour later
  const location = 'Sample City';
  const venue = 'Sample Venue';
  const capacity = 100;
  const price_standard = 20.00;
  const price_vip = 50.00;
  const price_premium = 100.00;
  const status = 'Published';
  const image = 'https://via.placeholder.com/150';

  const query = `
    INSERT INTO events (title, description, organizer, start, end, location, venue, capacity, price_standard, price_vip, price_premium, status, image)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  db.query(query, [title, description, organizer, start, end, location, venue, capacity, price_standard, price_vip, price_premium, status, image], (err, result) => {
    if (err) {
      console.error('Error inserting event:', err.message);
      return;
    }
    console.log('Inserted event:', result.affectedRows);
    db.end();
  });
}

// Fetch all events
app.get('/events', (req, res) => {
  const query = 'SELECT * FROM events';

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching events:', err.message);
      return res.status(500).json({ error: 'Failed to fetch events' });
    }

    res.json(results); // Send the events as a JSON response
  });
});

// Uncomment one of the following lines to seed the database:
// insertEvents(100); // Insert 100 random events
// insertSingleEvent(); // Insert a single sample event

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});