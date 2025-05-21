-- Drop the database if it exists and create a new one
DROP DATABASE IF EXISTS event_management;
CREATE DATABASE event_management;
USE event_management;

-- =================================
-- 1. Users Table
-- =================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(15),
  password VARCHAR(255) NOT NULL,
  user_type ENUM('admin', 'organizer', 'attendee') DEFAULT 'attendee',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Create the password_resets table
CREATE TABLE IF NOT EXISTS password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Sample insertion for users
INSERT INTO users (first_name, last_name, username, email, phone, password, user_type)
VALUES
  ('John', 'Doe', 'johndoe', 'john@example.com', '1234567890', 'password123', 'admin'),
  ('Jane', 'Smith', 'janesmith', 'jane@example.com', '0987654321', 'password123', 'organizer'),
  ('Alice', 'Johnson', 'alicej', 'alice@example.com', '1122334455', 'password123', 'attendee'),
  ('Bob', 'Brown', 'bobb', 'bob@example.com', '6677889900', 'password123', 'attendee'),
  ('Charlie', 'Davis', 'charlied', 'charlie@example.com', '5566778899', 'password123', 'organizer');

-- =================================
-- 2. Categories Table
-- =================================
-- Using column names that match your code (metaTitle, metaDescription)
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(255),
  color VARCHAR(7),
  status ENUM('active', 'inactive') DEFAULT 'active',
  metaTitle VARCHAR(255),
  metaDescription TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Sample insertions for categories
INSERT INTO categories (name, slug, description, icon, color, status, metaTitle, metaDescription)
VALUES
  ('Technology', 'technology', 'Events related to technology.', 'fa-microchip', '#3b82f6', 'active', 'Technology Events', 'Best technology events here.'),
  ('Business', 'business', 'Events related to business and entrepreneurship.', 'fa-briefcase', '#10b981', 'active', 'Business Events', 'Explore business events and summits.'),
  ('Music', 'music', 'Events related to music and entertainment.', 'fa-music', '#f59e0b', 'active', 'Music Events', 'Discover music festivals and concerts.');

-- =================================
-- 3. Events Table
-- =================================
CREATE TABLE IF NOT EXISTS events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  organizer INT NOT NULL,
  start DATETIME NOT NULL,
  end DATETIME NOT NULL,
  location VARCHAR(255) NOT NULL,
  venue VARCHAR(255) NOT NULL,
  capacity INT NOT NULL,
  price_standard DECIMAL(10,2) DEFAULT 0.00,
  price_vip DECIMAL(10,2) DEFAULT 0.00,
  price_premium DECIMAL(10,2) DEFAULT 0.00,
  status ENUM('Published', 'Draft', 'Cancelled') DEFAULT 'Published',
  category_id INT,
  image VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organizer) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Sample insertions for events
INSERT INTO events (title, description, organizer, start, end, location, venue, capacity, price_standard, price_vip, price_premium, status, category_id, image)
VALUES
  ('Tech Conference 2025', 'A conference for tech enthusiasts.', 2, '2025-05-01 10:00:00', '2025-05-01 18:00:00', 'New York', 'Tech Hall', 200, 50.00, 100.00, 150.00, 'Published', 1, 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf'),
  ('Business Summit', 'A summit for business professionals.', 5, '2025-06-10 09:00:00', '2025-06-10 17:00:00', 'Los Angeles', 'Business Center', 300, 60.00, 120.00, 180.00, 'Published', 2, 'https://images.unsplash.com/photo-1431540015161-0bf868a2d407'),
  ('Music Festival', 'A festival for music lovers.', 2, '2025-07-15 15:00:00', '2025-07-15 23:00:00', 'San Francisco', 'Music Arena', 500, 40.00, 80.00, 120.00, 'Published', 3, 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30');

-- =================================
-- 4. Attendees Table
-- =================================
-- Added a "quantity" column (default 1) since your queries reference it.
CREATE TABLE IF NOT EXISTS attendees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(15),
  event_id INT NOT NULL,
  user_id INT,
  ticket_type ENUM('General', 'VIP', 'Premium') DEFAULT 'General',
  status ENUM('Registered', 'Checked In', 'Cancelled') DEFAULT 'Registered',
  quantity INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Sample insertions for attendees
INSERT INTO attendees (first_name, last_name, email, phone, event_id, user_id, ticket_type, status, quantity)
VALUES
  ('Alice', 'Johnson', 'alice@example.com', '1122334455', 1, 3, 'VIP', 'Registered', 1),
  ('Bob', 'Brown', 'bob@example.com', '6677889900', 2, 4, 'General', 'Checked In', 1),
  ('Charlie', 'Davis', 'charlie@example.com', '5566778899', 3, 5, 'Premium', 'Registered', 1);

-- =================================
-- 5. Tickets Table
-- =================================
CREATE TABLE IF NOT EXISTS tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  user_id INT NOT NULL,
  quantity INT NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Sample insertions for tickets
INSERT INTO tickets (event_id, user_id, quantity, total_price, payment_method)
VALUES
  (1, 3, 2, 100.00, 'Credit Card'),
  (2, 4, 1, 60.00, 'PayPal'),
  (3, 5, 3, 120.00, 'Debit Card');

-- =================================
-- 6. Cancelled Tickets Table
-- =================================
CREATE TABLE IF NOT EXISTS cancelled_tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id INT NOT NULL,
  event_id INT NOT NULL,
  user_id INT NOT NULL,
  quantity INT NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  cancelled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =================================
-- 7. Sessions Table
-- =================================
CREATE TABLE IF NOT EXISTS sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  capacity INT NOT NULL,
  registered INT DEFAULT 0,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  event_id INT NOT NULL,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Sample insertions for sessions
INSERT INTO sessions (title, description, capacity, registered, start_time, end_time, event_id)
VALUES
  ('AI Workshop', 'Learn about AI and machine learning.', 50, 10, '2025-05-01 10:00:00', '2025-05-01 12:00:00', 1),
  ('Blockchain Seminar', 'Understand blockchain technology.', 100, 20, '2025-06-10 14:00:00', '2025-06-10 16:00:00', 2);

-- =================================
-- 8. Registrations Table
-- =================================
DROP TABLE IF EXISTS registrations;
CREATE TABLE IF NOT EXISTS registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  event_id INT NOT NULL,
  firstName VARCHAR(255) NOT NULL,
  lastName VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  ticketType VARCHAR(50) NOT NULL,
  quantity INT NOT NULL,
  specialRequests TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Sample insertions for registrations
INSERT INTO registrations (user_id, event_id, firstName, lastName, email, phone, ticketType, quantity, specialRequests)
VALUES
  (3, 1, 'Alice', 'Johnson', 'alice@example.com', '1122334455', 'Standard', 1, 'No preference'),
  (4, 2, 'Bob', 'Brown', 'bob@example.com', '6677889900', 'VIP', 1, 'Need wheelchair access');

-- =================================
-- 9. Purchases Table
-- =================================
CREATE TABLE IF NOT EXISTS purchases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  user_id INT NOT NULL,
  ticket_type ENUM('General', 'VIP', 'Premium') DEFAULT 'General',
  quantity INT NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Sample insertions for purchases
INSERT INTO purchases (event_id, user_id, ticket_type, quantity, total_price, payment_method)
VALUES
  (1, 3, 'VIP', 2, 100.00, 'Credit Card'),
  (2, 4, 'General', 1, 60.00, 'PayPal'),
  (3, 5, 'Premium', 3, 120.00, 'Debit Card');
  ALTER TABLE registrations ADD COLUMN status ENUM('confirmed', 'cancelled') DEFAULT 'confirmed';
  select * from categories;
  select * from purchases;
  select * from users;
  select * from cancelled_tickets;
  select * from categories;
  select * from events;
  SELECT * FROM registrations ;
  SELECT * FROM registrations WHERE user_id = 6;
  SELECT id, user_id, event_id, firstName, lastName, email, phone, ticketType, quantity, specialRequests, created_at, status
FROM registrations
WHERE user_id = 6
ORDER BY id DESC;
SELECT event_id FROM registrations;
-- Show all event IDs in registrations that do NOT exist in events
SELECT DISTINCT r.event_id
FROM registrations r
LEFT JOIN events e ON r.event_id = e.id
WHERE e.id IS NULL;
SELECT r.id, r.event_id
FROM registrations r
LEFT JOIN events e ON r.event_id = e.id
WHERE e.id IS NULL;
SELECT id, title FROM events;
DELETE FROM registrations WHERE event_id NOT IN (SELECT id FROM events);
SELECT * FROM registrations ORDER BY id DESC LIMIT 5;
ALTER TABLE registrations
ADD CONSTRAINT fk_event
FOREIGN KEY (event_id) REFERENCES events(id)
ON DELETE CASCADE;
UPDATE events SET start = NULL WHERE start = '0000-00-00 00:00:00';
UPDATE events SET end = NULL WHERE end = '0000-00-00 00:00:00';
UPDATE sessions SET start_time = NULL WHERE start_time = '0000-00-00 00:00:00';
UPDATE sessions SET end_time = NULL WHERE end_time = '0000-00-00 00:00:00';
SELECT * FROM tickets;
ALTER TABLE cancelled_tickets ADD COLUMN ticket_type VARCHAR(50) AFTER event_id;
DROP TABLE IF EXISTS cancelled_tickets;
CREATE TABLE cancelled_tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id INT NOT NULL,
  event_id INT NOT NULL,
  user_id INT NOT NULL,
  ticket_type VARCHAR(50) NOT NULL,
  quantity INT NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  cancelled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
SELECT * FROM sessions;
CREATE TABLE IF NOT EXISTS privacy_prefs (
  user_id INT PRIMARY KEY,
  public_profile BOOLEAN DEFAULT TRUE,
  show_events BOOLEAN DEFAULT TRUE,
  activity_status BOOLEAN DEFAULT TRUE,
  who_can_message VARCHAR(32) DEFAULT 'Anyone',
  who_can_see_events VARCHAR(32) DEFAULT 'Everyone',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS appearance_prefs (
  user_id INT PRIMARY KEY,
  theme VARCHAR(16) DEFAULT 'dark',
  accent VARCHAR(16) DEFAULT '#4361ee',
  font_size VARCHAR(16) DEFAULT 'Medium',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS user_integrations (
  user_id INT,
  provider VARCHAR(32),
  connected BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (user_id, provider),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
ALTER TABLE users MODIFY user_type ENUM('admin', 'organizer', 'speaker', 'vendor', 'attendee') DEFAULT 'attendee';
ALTER TABLE cancelled_tickets ADD COLUMN cancelled_at DATETIME DEFAULT CURRENT_TIMESTAMP;
-- Run this in your MySQL client
CREATE TABLE IF NOT EXISTS event_participation (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  event_id INT NOT NULL,
  type ENUM('registration','purchase') NOT NULL,
  ticket_type VARCHAR(50),
  quantity INT DEFAULT 1,
  total_price DECIMAL(10,2) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_event (user_id, event_id)
);
ALTER TABLE event_participation ADD CONSTRAINT unique_user_event UNIQUE (user_id, event_id);
DELETE FROM event_participation
WHERE id NOT IN (
  SELECT min_id FROM (
    SELECT MIN(id) as min_id
    FROM event_participation
    GROUP BY user_id, event_id
  ) as keepers
);
DELETE FROM event_participation
WHERE id NOT IN (
  SELECT max_id FROM (
    SELECT MAX(id) as max_id
    FROM event_participation
    GROUP BY user_id, event_id
  ) as keepers
);
ALTER TABLE cancelled_tickets ADD COLUMN ticket_type VARCHAR(50) AFTER user_id;

select * from users;