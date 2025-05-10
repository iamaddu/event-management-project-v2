const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const faker = require('faker');

// Connect to MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root', // Replace with your MySQL username
  password: '', // Replace with your MySQL password
  database: 'event_management',
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL');
});

// Generate and insert 1000 users
async function insertUsers() {
  const users = [];
  for (let i = 1; i <= 1000; i++) {
    const firstName = faker.name.firstName();
    const lastName = faker.name.lastName();
    const username = `user${i}`;
    const email = faker.internet.email();
    const phone = faker.phone.phoneNumber(); // Generate a dummy phone number
    const password = await bcrypt.hash(`password${i}`, 10); // Hash the password
    const userType = i % 2 === 0 ? 'attendee' : 'organizer'; // Alternate user types
    users.push([firstName, lastName, username, email, phone, password, userType]);
  }

  const query = `
    INSERT INTO users (first_name, last_name, username, email, phone, password, user_type)
    VALUES ?
  `;
  db.query(query, [users], (err, result) => {
    if (err) {
      console.error('Error inserting users:', err);
      return;
    }
    console.log(`Inserted ${result.affectedRows} users`);
    db.end();
  });
}

insertUsers();