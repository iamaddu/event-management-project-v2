-- Drop and recreate the database
DROP DATABASE IF EXISTS event_management;
CREATE DATABASE event_management;
USE event_management;

-- 1. Users Table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(15),
  password VARCHAR(255) NOT NULL,
  user_type ENUM('admin', 'organizer', 'speaker', 'vendor', 'attendee') DEFAULT 'attendee',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (first_name, last_name, username, email, phone, password, user_type) VALUES
('John', 'Doe', 'johndoe', 'john@example.com', '1234567890', 'password123', 'admin'),
('Jane', 'Smith', 'janesmith', 'jane@example.com', '0987654321', 'password123', 'organizer'),
('Alice', 'Johnson', 'alicej', 'alice@example.com', '1122334455', 'password123', 'attendee'),
('Bob', 'Brown', 'bobb', 'bob@example.com', '6677889900', 'password123', 'attendee'),
('Charlie', 'Davis', 'charlied', 'charlie@example.com', '5566778899', 'password123', 'organizer'),
('Eve', 'Miller', 'evem', 'eve@example.com', '2233445566', 'password123', 'speaker'),
('Frank', 'Wilson', 'frankw', 'frank@example.com', '3344556677', 'password123', 'vendor'),
('Grace', 'Lee', 'gracel', 'grace@example.com', '4455667788', 'password123', 'attendee'),
('Hank', 'Moore', 'hankm', 'hank@example.com', '5566778890', 'password123', 'attendee'),
('Ivy', 'Clark', 'ivyc', 'ivy@example.com', '6677889901', 'password123', 'organizer');

-- 2. Categories Table
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(255),
  color VARCHAR(7),
  status ENUM('active', 'inactive') DEFAULT 'active',
  metaTitle VARCHAR(255),
  metaDescription TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO categories (name, slug, description, icon, color, status, metaTitle, metaDescription) VALUES
('Technology', 'technology', 'Tech events', 'fa-microchip', '#3b82f6', 'active', 'Tech Events', 'Best tech events'),
('Business', 'business', 'Business events', 'fa-briefcase', '#10b981', 'active', 'Business Events', 'Business summits'),
('Music', 'music', 'Music events', 'fa-music', '#f59e0b', 'active', 'Music Events', 'Music festivals'),
('Art', 'art', 'Art events', 'fa-paint-brush', '#e11d48', 'active', 'Art Events', 'Art exhibitions'),
('Sports', 'sports', 'Sports events', 'fa-football-ball', '#6366f1', 'active', 'Sports Events', 'Sports tournaments'),
('Education', 'education', 'Education events', 'fa-book', '#22d3ee', 'active', 'Education Events', 'Workshops and seminars'),
('Health', 'health', 'Health events', 'fa-heartbeat', '#16a34a', 'active', 'Health Events', 'Health and wellness'),
('Food', 'food', 'Food events', 'fa-utensils', '#f43f5e', 'active', 'Food Events', 'Food festivals'),
('Travel', 'travel', 'Travel events', 'fa-plane', '#fbbf24', 'active', 'Travel Events', 'Travel expos'),
('Gaming', 'gaming', 'Gaming events', 'fa-gamepad', '#a21caf', 'active', 'Gaming Events', 'Gaming tournaments');

-- 3. Events Table
CREATE TABLE events (
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

INSERT INTO events (title, description, organizer, start, end, location, venue, capacity, price_standard, price_vip, price_premium, status, category_id, image) VALUES
('Tech Conference 2025', 'A conference for tech enthusiasts.', 2, '2025-05-01 10:00:00', '2025-05-01 18:00:00', 'New York', 'Tech Hall', 200, 50.00, 100.00, 150.00, 'Published', 1, NULL),
('Business Summit', 'A summit for business professionals.', 5, '2025-06-10 09:00:00', '2025-06-10 17:00:00', 'Los Angeles', 'Business Center', 300, 60.00, 120.00, 180.00, 'Published', 2, NULL),
('Music Festival', 'A festival for music lovers.', 2, '2025-07-15 15:00:00', '2025-07-15 23:00:00', 'San Francisco', 'Music Arena', 500, 40.00, 80.00, 120.00, 'Published', 3, NULL),
('Art Expo', 'An exhibition for art lovers.', 10, '2025-08-20 11:00:00', '2025-08-20 19:00:00', 'Paris', 'Art Gallery', 150, 30.00, 60.00, 90.00, 'Published', 4, NULL),
('Sports Meet', 'A sports tournament.', 9, '2025-09-05 08:00:00', '2025-09-05 20:00:00', 'London', 'Stadium', 400, 25.00, 50.00, 75.00, 'Published', 5, NULL),
('Education Workshop', 'A workshop for students.', 1, '2025-10-12 09:00:00', '2025-10-12 15:00:00', 'Berlin', 'Edu Center', 100, 20.00, 40.00, 60.00, 'Published', 6, NULL),
('Health Seminar', 'A seminar on health.', 6, '2025-11-18 10:00:00', '2025-11-18 16:00:00', 'Toronto', 'Health Hall', 120, 15.00, 30.00, 45.00, 'Published', 7, NULL),
('Food Carnival', 'A carnival for foodies.', 7, '2025-12-25 12:00:00', '2025-12-25 22:00:00', 'Rome', 'Food Plaza', 250, 35.00, 70.00, 105.00, 'Published', 8, NULL),
('Travel Expo', 'A travel exhibition.', 8, '2026-01-15 10:00:00', '2026-01-15 18:00:00', 'Dubai', 'Expo Center', 350, 45.00, 90.00, 135.00, 'Published', 9, NULL),
('Gaming Tournament', 'A tournament for gamers.', 4, '2026-02-20 14:00:00', '2026-02-20 22:00:00', 'Tokyo', 'Game Arena', 300, 55.00, 110.00, 165.00, 'Published', 10, NULL);

-- 4. Attendees Table
CREATE TABLE attendees (
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

INSERT INTO attendees (first_name, last_name, email, phone, event_id, user_id, ticket_type, status, quantity) VALUES
('Alice', 'Johnson', 'alice@example.com', '1122334455', 1, 3, 'VIP', 'Registered', 1),
('Bob', 'Brown', 'bob@example.com', '6677889900', 2, 4, 'General', 'Checked In', 1),
('Charlie', 'Davis', 'charlie@example.com', '5566778899', 3, 5, 'Premium', 'Registered', 1),
('Eve', 'Miller', 'eve@example.com', '2233445566', 4, 6, 'General', 'Registered', 2),
('Frank', 'Wilson', 'frank@example.com', '3344556677', 5, 7, 'VIP', 'Registered', 1),
('Grace', 'Lee', 'grace@example.com', '4455667788', 6, 8, 'Premium', 'Registered', 1),
('Hank', 'Moore', 'hank@example.com', '5566778890', 7, 9, 'General', 'Checked In', 1),
('Ivy', 'Clark', 'ivy@example.com', '6677889901', 8, 10, 'VIP', 'Registered', 1),
('John', 'Doe', 'john@example.com', '1234567890', 9, 1, 'Premium', 'Registered', 1),
('Jane', 'Smith', 'jane@example.com', '0987654321', 10, 2, 'General', 'Registered', 1);

-- 5. Tickets Table
CREATE TABLE tickets (
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

INSERT INTO tickets (event_id, user_id, quantity, total_price, payment_method) VALUES
(1, 3, 2, 100.00, 'Credit Card'),
(2, 4, 1, 60.00, 'PayPal'),
(3, 5, 3, 120.00, 'Debit Card'),
(4, 6, 2, 60.00, 'Credit Card'),
(5, 7, 1, 50.00, 'PayPal'),
(6, 8, 2, 80.00, 'Debit Card'),
(7, 9, 1, 30.00, 'Credit Card'),
(8, 10, 2, 140.00, 'PayPal'),
(9, 1, 1, 90.00, 'Debit Card'),
(10, 2, 2, 110.00, 'Credit Card');

-- 6. Cancelled Tickets Table
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

INSERT INTO cancelled_tickets (ticket_id, event_id, user_id, ticket_type, quantity, total_price, payment_method) VALUES
(1, 1, 3, 'VIP', 1, 50.00, 'Credit Card'),
(2, 2, 4, 'General', 1, 60.00, 'PayPal'),
(3, 3, 5, 'Premium', 1, 40.00, 'Debit Card'),
(4, 4, 6, 'General', 1, 30.00, 'Credit Card'),
(5, 5, 7, 'VIP', 1, 50.00, 'PayPal'),
(6, 6, 8, 'Premium', 1, 40.00, 'Debit Card'),
(7, 7, 9, 'General', 1, 30.00, 'Credit Card'),
(8, 8, 10, 'VIP', 1, 70.00, 'PayPal'),
(9, 9, 1, 'Premium', 1, 90.00, 'Debit Card'),
(10, 10, 2, 'General', 1, 55.00, 'Credit Card');

-- 7. Sessions Table
CREATE TABLE sessions (
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

INSERT INTO sessions (title, description, capacity, registered, start_time, end_time, event_id) VALUES
('AI Workshop', 'Learn about AI.', 50, 10, '2025-05-01 10:00:00', '2025-05-01 12:00:00', 1),
('Blockchain Seminar', 'Blockchain basics.', 100, 20, '2025-06-10 14:00:00', '2025-06-10 16:00:00', 2),
('Music Jam', 'Live music session.', 80, 30, '2025-07-15 16:00:00', '2025-07-15 18:00:00', 3),
('Art Talk', 'Discussion on art.', 40, 15, '2025-08-20 12:00:00', '2025-08-20 14:00:00', 4),
('Soccer Clinic', 'Soccer training.', 60, 25, '2025-09-05 09:00:00', '2025-09-05 11:00:00', 5),
('Study Skills', 'Workshop for students.', 30, 12, '2025-10-12 10:00:00', '2025-10-12 12:00:00', 6),
('Wellness Talk', 'Health and wellness.', 70, 18, '2025-11-18 11:00:00', '2025-11-18 13:00:00', 7),
('Cooking Demo', 'Live cooking.', 90, 35, '2025-12-25 13:00:00', '2025-12-25 15:00:00', 8),
('Travel Tips', 'Travel advice.', 55, 22, '2026-01-15 11:00:00', '2026-01-15 13:00:00', 9),
('Game Dev', 'Game development basics.', 65, 28, '2026-02-20 15:00:00', '2026-02-20 17:00:00', 10);

-- 8. Registrations Table
CREATE TABLE registrations (
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
  status ENUM('confirmed', 'cancelled') DEFAULT 'confirmed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

INSERT INTO registrations (user_id, event_id, firstName, lastName, email, phone, ticketType, quantity, specialRequests, status) VALUES
(3, 1, 'Alice', 'Johnson', 'alice@example.com', '1122334455', 'Standard', 1, 'No preference', 'confirmed'),
(4, 2, 'Bob', 'Brown', 'bob@example.com', '6677889900', 'VIP', 1, 'Need wheelchair access', 'confirmed'),
(5, 3, 'Charlie', 'Davis', 'charlie@example.com', '5566778899', 'Premium', 1, '', 'confirmed'),
(6, 4, 'Eve', 'Miller', 'eve@example.com', '2233445566', 'General', 2, '', 'confirmed'),
(7, 5, 'Frank', 'Wilson', 'frank@example.com', '3344556677', 'VIP', 1, '', 'confirmed'),
(8, 6, 'Grace', 'Lee', 'grace@example.com', '4455667788', 'Premium', 1, '', 'confirmed'),
(9, 7, 'Hank', 'Moore', 'hank@example.com', '5566778890', 'General', 1, '', 'confirmed'),
(10, 8, 'Ivy', 'Clark', 'ivy@example.com', '6677889901', 'VIP', 1, '', 'confirmed'),
(1, 9, 'John', 'Doe', 'john@example.com', '1234567890', 'Premium', 1, '', 'confirmed'),
(2, 10, 'Jane', 'Smith', 'jane@example.com', '0987654321', 'General', 1, '', 'confirmed');

-- 9. Purchases Table
CREATE TABLE purchases (
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

INSERT INTO purchases (event_id, user_id, ticket_type, quantity, total_price, payment_method) VALUES
(1, 3, 'VIP', 2, 100.00, 'Credit Card'),
(2, 4, 'General', 1, 60.00, 'PayPal'),
(3, 5, 'Premium', 3, 120.00, 'Debit Card'),
(4, 6, 'General', 2, 60.00, 'Credit Card'),
(5, 7, 'VIP', 1, 50.00, 'PayPal'),
(6, 8, 'Premium', 2, 80.00, 'Debit Card'),
(7, 9, 'General', 1, 30.00, 'Credit Card'),
(8, 10, 'VIP', 2, 140.00, 'PayPal'),
(9, 1, 'Premium', 1, 90.00, 'Debit Card'),
(10, 2, 'General', 2, 110.00, 'Credit Card');

-- 10. Event Participation Table
CREATE TABLE event_participation (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  event_id INT NOT NULL,
  type ENUM('registration','purchase') NOT NULL,
  ticket_type VARCHAR(50),
  quantity INT DEFAULT 1,
  total_price DECIMAL(10,2) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_event (user_id, event_id, type)
);

INSERT INTO event_participation (user_id, event_id, type, ticket_type, quantity, total_price) VALUES
(3, 1, 'registration', 'VIP', 1, 50.00),
(4, 2, 'registration', 'General', 1, 60.00),
(5, 3, 'registration', 'Premium', 1, 40.00),
(6, 4, 'registration', 'General', 2, 60.00),
(7, 5, 'registration', 'VIP', 1, 50.00),
(8, 6, 'registration', 'Premium', 1, 40.00),
(9, 7, 'registration', 'General', 1, 30.00),
(10, 8, 'registration', 'VIP', 1, 70.00),
(1, 9, 'registration', 'Premium', 1, 90.00),
(2, 10, 'registration', 'General', 1, 55.00);

-- 11. Privacy Preferences Table
CREATE TABLE privacy_prefs (
  user_id INT PRIMARY KEY,
  public_profile BOOLEAN DEFAULT TRUE,
  show_events BOOLEAN DEFAULT TRUE,
  activity_status BOOLEAN DEFAULT TRUE,
  who_can_message VARCHAR(32) DEFAULT 'Anyone',
  who_can_see_events VARCHAR(32) DEFAULT 'Everyone',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO privacy_prefs (user_id) VALUES (1),(2),(3),(4),(5),(6),(7),(8),(9),(10);

-- 12. Appearance Preferences Table
CREATE TABLE appearance_prefs (
  user_id INT PRIMARY KEY,
  theme VARCHAR(16) DEFAULT 'dark',
  accent VARCHAR(16) DEFAULT '#4361ee',
  font_size VARCHAR(16) DEFAULT 'Medium',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO appearance_prefs (user_id) VALUES (1),(2),(3),(4),(5),(6),(7),(8),(9),(10);

-- 13. User Integrations Table
CREATE TABLE user_integrations (
  user_id INT,
  provider VARCHAR(32),
  connected BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (user_id, provider),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO user_integrations (user_id, provider, connected) VALUES
(1, 'google', TRUE),
(2, 'facebook', TRUE),
(3, 'twitter', FALSE),
(4, 'linkedin', TRUE),
(5, 'github', FALSE),
(6, 'google', TRUE),
(7, 'facebook', FALSE),
(8, 'twitter', TRUE),
(9, 'linkedin', FALSE),
(10, 'github', TRUE);
ALTER TABLE events
  ADD COLUMN event_type ENUM('free', 'paid', 'fcfs') DEFAULT 'free',
  ADD COLUMN max_participants INT DEFAULT NULL;
-- All done!
SELECT * FROM events WHERE start BETWEEN 'startDate' AND 'now';
SELECT id, title, start, end FROM events WHERE id = 1;
-- Comments and Ratings for Events
CREATE TABLE event_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  user_id INT NOT NULL,
  comment TEXT,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Comments and Ratings for Sessions
CREATE TABLE session_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  user_id INT NOT NULL,
  comment TEXT,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Speakers Table
CREATE TABLE speakers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  bio TEXT,
  photo VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Session-Speaker Mapping Table (Many-to-Many)
CREATE TABLE session_speakers (
  session_id INT NOT NULL,
  speaker_id INT NOT NULL,
  PRIMARY KEY (session_id, speaker_id),
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (speaker_id) REFERENCES speakers(id) ON DELETE CASCADE
);

-- Favorites Table
CREATE TABLE favorites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  event_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_fav (user_id, event_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);
CREATE TABLE session_registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  user_id INT NOT NULL,
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_registration (session_id, user_id),
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS event_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  user_id INT NOT NULL,
  comment TEXT NOT NULL,
  rating INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
ALTER TABLE users ADD COLUMN admin_access_code VARCHAR(20) DEFAULT NULL;
UPDATE users SET admin_access_code = 'iamadmin' WHERE user_type = 'admin';
SELECT 
  COUNT(DISTINCT e.id) AS events,
  COALESCE(SUM(t.quantity), 0) AS attendees,
  COALESCE(SUM(t.total_price), 0) AS revenue,
  ROUND(
    CASE WHEN SUM(e.capacity) > 0 THEN (COALESCE(SUM(t.quantity), 0) / SUM(e.capacity)) * 100 ELSE 0 END, 2
  ) AS conversion
FROM events e
LEFT JOIN tickets t ON t.event_id = e.id AND t.purchase_date >= '2025-04-26 00:00:00' AND t.purchase_date <= '2025-05-26 23:59:59'
WHERE e.start >= '2025-04-26 00:00:00' AND e.start <= '2025-05-26 23:59:59'
SELECT id, status FROM registrations WHERE id = 1;
ALTER TABLE events ADD COLUMN requires_ticket TINYINT(1) DEFAULT 1;
ALTER TABLE events
  ADD COLUMN event_type ENUM('free', 'paid', 'fcfs') DEFAULT 'free',
  ADD COLUMN max_participants INT DEFAULT NULL;
  select* from users;
  SELECT * FROM tickets WHERE user_id = 12;
SELECT * FROM purchases WHERE user_id = 12;
SELECT * FROM registrations WHERE user_id = 12;
  SELECT * FROM events WHERE organizer = 13;
  SELECT id, username FROM users WHERE user_type = 'admin';
  UPDATE users SET admin_access_code = 'iamadmin' WHERE id = 11;
  ALTER TABLE users ADD COLUMN organizer_access_code VARCHAR(20) DEFAULT NULL;
  SELECT * FROM events;
  SELECT id, title, price_standard, price_vip, price_premium FROM events WHERE id = 11;
  select * from tickets;
  SELECT * FROM registrations ;
  INSERT INTO users (first_name, last_name, username, email, phone, password, user_type, admin_access_code)
VALUES ('Aditi', 'R', 'aditiadmin', 'aditi@example.com', '1234567890', '$2b$10$z..pQorfqEvCHyWp4ZR4BufaqahEokNFs3yx.2cbc.SXVk7W/t3Fm', 'admin', 'iamadmin');
DELETE FROM users WHERE username = 'aditiadmin';
-- Then run your INSERT again
select * from users;
-- Add a speaker (if not already present)
INSERT INTO speakers (user_id, bio, photo) VALUES (6, 'AI Expert', NULL);

-- Assign speaker to a session
INSERT INTO session_speakers (session_id, speaker_id) VALUES (1, 1);
SELECT * FROM sessions WHERE id = 2;
SELECT * FROM speakers;
INSERT INTO speakers (user_id, bio, photo) VALUES (USER_ID, 'Bio here', 'photo_url');
SELECT * FROM speakers WHERE user_id NOT IN (SELECT id FROM users);
ALTER TABLE speakers ADD COLUMN first_name VARCHAR(255);
ALTER TABLE speakers ADD COLUMN last_name VARCHAR(255);
ALTER TABLE speakers MODIFY user_id INT NULL;
-- Drop and recreate the database
DROP DATABASE IF EXISTS event_management;
CREATE DATABASE event_management;
USE event_management;

-- 1. Users Table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(15),
  password VARCHAR(255) NOT NULL,
  user_type ENUM('admin', 'organizer', 'speaker', 'vendor', 'attendee') DEFAULT 'attendee',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (first_name, last_name, username, email, phone, password, user_type) VALUES
('John', 'Doe', 'johndoe', 'john@example.com', '1234567890', 'password123', 'admin'),
('Jane', 'Smith', 'janesmith', 'jane@example.com', '0987654321', 'password123', 'organizer'),
('Alice', 'Johnson', 'alicej', 'alice@example.com', '1122334455', 'password123', 'attendee'),
('Bob', 'Brown', 'bobb', 'bob@example.com', '6677889900', 'password123', 'attendee'),
('Charlie', 'Davis', 'charlied', 'charlie@example.com', '5566778899', 'password123', 'organizer'),
('Eve', 'Miller', 'evem', 'eve@example.com', '2233445566', 'password123', 'speaker'),
('Frank', 'Wilson', 'frankw', 'frank@example.com', '3344556677', 'password123', 'vendor'),
('Grace', 'Lee', 'gracel', 'grace@example.com', '4455667788', 'password123', 'attendee'),
('Hank', 'Moore', 'hankm', 'hank@example.com', '5566778890', 'password123', 'attendee'),
('Ivy', 'Clark', 'ivyc', 'ivy@example.com', '6677889901', 'password123', 'organizer');

-- 2. Categories Table
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(255),
  color VARCHAR(7),
  status ENUM('active', 'inactive') DEFAULT 'active',
  metaTitle VARCHAR(255),
  metaDescription TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO categories (name, slug, description, icon, color, status, metaTitle, metaDescription) VALUES
('Technology', 'technology', 'Tech events', 'fa-microchip', '#3b82f6', 'active', 'Tech Events', 'Best tech events'),
('Business', 'business', 'Business events', 'fa-briefcase', '#10b981', 'active', 'Business Events', 'Business summits'),
('Music', 'music', 'Music events', 'fa-music', '#f59e0b', 'active', 'Music Events', 'Music festivals'),
('Art', 'art', 'Art events', 'fa-paint-brush', '#e11d48', 'active', 'Art Events', 'Art exhibitions'),
('Sports', 'sports', 'Sports events', 'fa-football-ball', '#6366f1', 'active', 'Sports Events', 'Sports tournaments'),
('Education', 'education', 'Education events', 'fa-book', '#22d3ee', 'active', 'Education Events', 'Workshops and seminars'),
('Health', 'health', 'Health events', 'fa-heartbeat', '#16a34a', 'active', 'Health Events', 'Health and wellness'),
('Food', 'food', 'Food events', 'fa-utensils', '#f43f5e', 'active', 'Food Events', 'Food festivals'),
('Travel', 'travel', 'Travel events', 'fa-plane', '#fbbf24', 'active', 'Travel Events', 'Travel expos'),
('Gaming', 'gaming', 'Gaming events', 'fa-gamepad', '#a21caf', 'active', 'Gaming Events', 'Gaming tournaments');

-- 3. Events Table
CREATE TABLE events (
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

INSERT INTO events (title, description, organizer, start, end, location, venue, capacity, price_standard, price_vip, price_premium, status, category_id, image) VALUES
('Tech Conference 2025', 'A conference for tech enthusiasts.', 2, '2025-05-01 10:00:00', '2025-05-01 18:00:00', 'New York', 'Tech Hall', 200, 50.00, 100.00, 150.00, 'Published', 1, NULL),
('Business Summit', 'A summit for business professionals.', 5, '2025-06-10 09:00:00', '2025-06-10 17:00:00', 'Los Angeles', 'Business Center', 300, 60.00, 120.00, 180.00, 'Published', 2, NULL),
('Music Festival', 'A festival for music lovers.', 2, '2025-07-15 15:00:00', '2025-07-15 23:00:00', 'San Francisco', 'Music Arena', 500, 40.00, 80.00, 120.00, 'Published', 3, NULL),
('Art Expo', 'An exhibition for art lovers.', 10, '2025-08-20 11:00:00', '2025-08-20 19:00:00', 'Paris', 'Art Gallery', 150, 30.00, 60.00, 90.00, 'Published', 4, NULL),
('Sports Meet', 'A sports tournament.', 9, '2025-09-05 08:00:00', '2025-09-05 20:00:00', 'London', 'Stadium', 400, 25.00, 50.00, 75.00, 'Published', 5, NULL),
('Education Workshop', 'A workshop for students.', 1, '2025-10-12 09:00:00', '2025-10-12 15:00:00', 'Berlin', 'Edu Center', 100, 20.00, 40.00, 60.00, 'Published', 6, NULL),
('Health Seminar', 'A seminar on health.', 6, '2025-11-18 10:00:00', '2025-11-18 16:00:00', 'Toronto', 'Health Hall', 120, 15.00, 30.00, 45.00, 'Published', 7, NULL),
('Food Carnival', 'A carnival for foodies.', 7, '2025-12-25 12:00:00', '2025-12-25 22:00:00', 'Rome', 'Food Plaza', 250, 35.00, 70.00, 105.00, 'Published', 8, NULL),
('Travel Expo', 'A travel exhibition.', 8, '2026-01-15 10:00:00', '2026-01-15 18:00:00', 'Dubai', 'Expo Center', 350, 45.00, 90.00, 135.00, 'Published', 9, NULL),
('Gaming Tournament', 'A tournament for gamers.', 4, '2026-02-20 14:00:00', '2026-02-20 22:00:00', 'Tokyo', 'Game Arena', 300, 55.00, 110.00, 165.00, 'Published', 10, NULL);

-- 4. Attendees Table
CREATE TABLE attendees (
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

INSERT INTO attendees (first_name, last_name, email, phone, event_id, user_id, ticket_type, status, quantity) VALUES
('Alice', 'Johnson', 'alice@example.com', '1122334455', 1, 3, 'VIP', 'Registered', 1),
('Bob', 'Brown', 'bob@example.com', '6677889900', 2, 4, 'General', 'Checked In', 1),
('Charlie', 'Davis', 'charlie@example.com', '5566778899', 3, 5, 'Premium', 'Registered', 1),
('Eve', 'Miller', 'eve@example.com', '2233445566', 4, 6, 'General', 'Registered', 2),
('Frank', 'Wilson', 'frank@example.com', '3344556677', 5, 7, 'VIP', 'Registered', 1),
('Grace', 'Lee', 'grace@example.com', '4455667788', 6, 8, 'Premium', 'Registered', 1),
('Hank', 'Moore', 'hank@example.com', '5566778890', 7, 9, 'General', 'Checked In', 1),
('Ivy', 'Clark', 'ivy@example.com', '6677889901', 8, 10, 'VIP', 'Registered', 1),
('John', 'Doe', 'john@example.com', '1234567890', 9, 1, 'Premium', 'Registered', 1),
('Jane', 'Smith', 'jane@example.com', '0987654321', 10, 2, 'General', 'Registered', 1);

-- 5. Tickets Table
CREATE TABLE tickets (
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

INSERT INTO tickets (event_id, user_id, quantity, total_price, payment_method) VALUES
(1, 3, 2, 100.00, 'Credit Card'),
(2, 4, 1, 60.00, 'PayPal'),
(3, 5, 3, 120.00, 'Debit Card'),
(4, 6, 2, 60.00, 'Credit Card'),
(5, 7, 1, 50.00, 'PayPal'),
(6, 8, 2, 80.00, 'Debit Card'),
(7, 9, 1, 30.00, 'Credit Card'),
(8, 10, 2, 140.00, 'PayPal'),
(9, 1, 1, 90.00, 'Debit Card'),
(10, 2, 2, 110.00, 'Credit Card');

-- 6. Cancelled Tickets Table
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

INSERT INTO cancelled_tickets (ticket_id, event_id, user_id, ticket_type, quantity, total_price, payment_method) VALUES
(1, 1, 3, 'VIP', 1, 50.00, 'Credit Card'),
(2, 2, 4, 'General', 1, 60.00, 'PayPal'),
(3, 3, 5, 'Premium', 1, 40.00, 'Debit Card'),
(4, 4, 6, 'General', 1, 30.00, 'Credit Card'),
(5, 5, 7, 'VIP', 1, 50.00, 'PayPal'),
(6, 6, 8, 'Premium', 1, 40.00, 'Debit Card'),
(7, 7, 9, 'General', 1, 30.00, 'Credit Card'),
(8, 8, 10, 'VIP', 1, 70.00, 'PayPal'),
(9, 9, 1, 'Premium', 1, 90.00, 'Debit Card'),
(10, 10, 2, 'General', 1, 55.00, 'Credit Card');

-- 7. Sessions Table
CREATE TABLE sessions (
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

INSERT INTO sessions (title, description, capacity, registered, start_time, end_time, event_id) VALUES
('AI Workshop', 'Learn about AI.', 50, 10, '2025-05-01 10:00:00', '2025-05-01 12:00:00', 1),
('Blockchain Seminar', 'Blockchain basics.', 100, 20, '2025-06-10 14:00:00', '2025-06-10 16:00:00', 2),
('Music Jam', 'Live music session.', 80, 30, '2025-07-15 16:00:00', '2025-07-15 18:00:00', 3),
('Art Talk', 'Discussion on art.', 40, 15, '2025-08-20 12:00:00', '2025-08-20 14:00:00', 4),
('Soccer Clinic', 'Soccer training.', 60, 25, '2025-09-05 09:00:00', '2025-09-05 11:00:00', 5),
('Study Skills', 'Workshop for students.', 30, 12, '2025-10-12 10:00:00', '2025-10-12 12:00:00', 6),
('Wellness Talk', 'Health and wellness.', 70, 18, '2025-11-18 11:00:00', '2025-11-18 13:00:00', 7),
('Cooking Demo', 'Live cooking.', 90, 35, '2025-12-25 13:00:00', '2025-12-25 15:00:00', 8),
('Travel Tips', 'Travel advice.', 55, 22, '2026-01-15 11:00:00', '2026-01-15 13:00:00', 9),
('Game Dev', 'Game development basics.', 65, 28, '2026-02-20 15:00:00', '2026-02-20 17:00:00', 10);

-- 8. Registrations Table
CREATE TABLE registrations (
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
  status ENUM('confirmed', 'cancelled') DEFAULT 'confirmed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

INSERT INTO registrations (user_id, event_id, firstName, lastName, email, phone, ticketType, quantity, specialRequests, status) VALUES
(3, 1, 'Alice', 'Johnson', 'alice@example.com', '1122334455', 'Standard', 1, 'No preference', 'confirmed'),
(4, 2, 'Bob', 'Brown', 'bob@example.com', '6677889900', 'VIP', 1, 'Need wheelchair access', 'confirmed'),
(5, 3, 'Charlie', 'Davis', 'charlie@example.com', '5566778899', 'Premium', 1, '', 'confirmed'),
(6, 4, 'Eve', 'Miller', 'eve@example.com', '2233445566', 'General', 2, '', 'confirmed'),
(7, 5, 'Frank', 'Wilson', 'frank@example.com', '3344556677', 'VIP', 1, '', 'confirmed'),
(8, 6, 'Grace', 'Lee', 'grace@example.com', '4455667788', 'Premium', 1, '', 'confirmed'),
(9, 7, 'Hank', 'Moore', 'hank@example.com', '5566778890', 'General', 1, '', 'confirmed'),
(10, 8, 'Ivy', 'Clark', 'ivy@example.com', '6677889901', 'VIP', 1, '', 'confirmed'),
(1, 9, 'John', 'Doe', 'john@example.com', '1234567890', 'Premium', 1, '', 'confirmed'),
(2, 10, 'Jane', 'Smith', 'jane@example.com', '0987654321', 'General', 1, '', 'confirmed');

-- 9. Purchases Table
CREATE TABLE purchases (
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

INSERT INTO purchases (event_id, user_id, ticket_type, quantity, total_price, payment_method) VALUES
(1, 3, 'VIP', 2, 100.00, 'Credit Card'),
(2, 4, 'General', 1, 60.00, 'PayPal'),
(3, 5, 'Premium', 3, 120.00, 'Debit Card'),
(4, 6, 'General', 2, 60.00, 'Credit Card'),
(5, 7, 'VIP', 1, 50.00, 'PayPal'),
(6, 8, 'Premium', 2, 80.00, 'Debit Card'),
(7, 9, 'General', 1, 30.00, 'Credit Card'),
(8, 10, 'VIP', 2, 140.00, 'PayPal'),
(9, 1, 'Premium', 1, 90.00, 'Debit Card'),
(10, 2, 'General', 2, 110.00, 'Credit Card');

-- 10. Event Participation Table
CREATE TABLE event_participation (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  event_id INT NOT NULL,
  type ENUM('registration','purchase') NOT NULL,
  ticket_type VARCHAR(50),
  quantity INT DEFAULT 1,
  total_price DECIMAL(10,2) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_event (user_id, event_id, type)
);

INSERT INTO event_participation (user_id, event_id, type, ticket_type, quantity, total_price) VALUES
(3, 1, 'registration', 'VIP', 1, 50.00),
(4, 2, 'registration', 'General', 1, 60.00),
(5, 3, 'registration', 'Premium', 1, 40.00),
(6, 4, 'registration', 'General', 2, 60.00),
(7, 5, 'registration', 'VIP', 1, 50.00),
(8, 6, 'registration', 'Premium', 1, 40.00),
(9, 7, 'registration', 'General', 1, 30.00),
(10, 8, 'registration', 'VIP', 1, 70.00),
(1, 9, 'registration', 'Premium', 1, 90.00),
(2, 10, 'registration', 'General', 1, 55.00);

-- 11. Privacy Preferences Table
CREATE TABLE privacy_prefs (
  user_id INT PRIMARY KEY,
  public_profile BOOLEAN DEFAULT TRUE,
  show_events BOOLEAN DEFAULT TRUE,
  activity_status BOOLEAN DEFAULT TRUE,
  who_can_message VARCHAR(32) DEFAULT 'Anyone',
  who_can_see_events VARCHAR(32) DEFAULT 'Everyone',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO privacy_prefs (user_id) VALUES (1),(2),(3),(4),(5),(6),(7),(8),(9),(10);

-- 12. Appearance Preferences Table
CREATE TABLE appearance_prefs (
  user_id INT PRIMARY KEY,
  theme VARCHAR(16) DEFAULT 'dark',
  accent VARCHAR(16) DEFAULT '#4361ee',
  font_size VARCHAR(16) DEFAULT 'Medium',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO appearance_prefs (user_id) VALUES (1),(2),(3),(4),(5),(6),(7),(8),(9),(10);

-- 13. User Integrations Table
CREATE TABLE user_integrations (
  user_id INT,
  provider VARCHAR(32),
  connected BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (user_id, provider),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO user_integrations (user_id, provider, connected) VALUES
(1, 'google', TRUE),
(2, 'facebook', TRUE),
(3, 'twitter', FALSE),
(4, 'linkedin', TRUE),
(5, 'github', FALSE),
(6, 'google', TRUE),
(7, 'facebook', FALSE),
(8, 'twitter', TRUE),
(9, 'linkedin', FALSE),
(10, 'github', TRUE);
ALTER TABLE events
  ADD COLUMN event_type ENUM('free', 'paid', 'fcfs') DEFAULT 'free',
  ADD COLUMN max_participants INT DEFAULT NULL;
-- All done!
SELECT * FROM events WHERE start BETWEEN 'startDate' AND 'now';
SELECT id, title, start, end FROM events WHERE id = 1;
-- Comments and Ratings for Events
CREATE TABLE event_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  user_id INT NOT NULL,
  comment TEXT,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Comments and Ratings for Sessions
CREATE TABLE session_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  user_id INT NOT NULL,
  comment TEXT,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Speakers Table
CREATE TABLE speakers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  bio TEXT,
  photo VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Session-Speaker Mapping Table (Many-to-Many)
CREATE TABLE session_speakers (
  session_id INT NOT NULL,
  speaker_id INT NOT NULL,
  PRIMARY KEY (session_id, speaker_id),
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (speaker_id) REFERENCES speakers(id) ON DELETE CASCADE
);

-- Favorites Table
CREATE TABLE favorites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  event_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_fav (user_id, event_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);
CREATE TABLE session_registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  user_id INT NOT NULL,
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_registration (session_id, user_id),
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS event_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  user_id INT NOT NULL,
  comment TEXT NOT NULL,
  rating INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
ALTER TABLE users ADD COLUMN admin_access_code VARCHAR(20) DEFAULT NULL;
UPDATE users SET admin_access_code = 'iamadmin' WHERE user_type = 'admin';
SELECT 
  COUNT(DISTINCT e.id) AS events,
  COALESCE(SUM(t.quantity), 0) AS attendees,
  COALESCE(SUM(t.total_price), 0) AS revenue,
  ROUND(
    CASE WHEN SUM(e.capacity) > 0 THEN (COALESCE(SUM(t.quantity), 0) / SUM(e.capacity)) * 100 ELSE 0 END, 2
  ) AS conversion
FROM events e
LEFT JOIN tickets t ON t.event_id = e.id AND t.purchase_date >= '2025-04-26 00:00:00' AND t.purchase_date <= '2025-05-26 23:59:59'
WHERE e.start >= '2025-04-26 00:00:00' AND e.start <= '2025-05-26 23:59:59'
SELECT id, status FROM registrations WHERE id = 1;
ALTER TABLE events ADD COLUMN requires_ticket TINYINT(1) DEFAULT 1;
ALTER TABLE events
  ADD COLUMN event_type ENUM('free', 'paid', 'fcfs') DEFAULT 'free',
  ADD COLUMN max_participants INT DEFAULT NULL;
  select* from users;
  SELECT * FROM tickets WHERE user_id = 12;
SELECT * FROM purchases WHERE user_id = 12;
SELECT * FROM registrations WHERE user_id = 12;
  SELECT * FROM events WHERE organizer = 13;
  SELECT id, username FROM users WHERE user_type = 'admin';
  UPDATE users SET admin_access_code = 'iamadmin' WHERE id = 11;
  ALTER TABLE users ADD COLUMN organizer_access_code VARCHAR(20) DEFAULT NULL;
  SELECT * FROM events;
  SELECT id, title, price_standard, price_vip, price_premium FROM events WHERE id = 11;
  select * from tickets;
  SELECT * FROM registrations ;
  INSERT INTO users (first_name, last_name, username, email, phone, password, user_type, admin_access_code)
VALUES ('Aditi', 'R', 'aditiadmin', 'aditi@example.com', '1234567890', '$2b$10$z..pQorfqEvCHyWp4ZR4BufaqahEokNFs3yx.2cbc.SXVk7W/t3Fm', 'admin', 'iamadmin');
DELETE FROM users WHERE username = 'aditiadmin';
-- Then run your INSERT again
select * from users;
-- Add a speaker (if not already present)
INSERT INTO speakers (user_id, bio, photo) VALUES (6, 'AI Expert', NULL);

-- Assign speaker to a session
INSERT INTO session_speakers (session_id, speaker_id) VALUES (1, 1);
SELECT * FROM sessions WHERE id = 2;
SELECT * FROM speakers;
INSERT INTO speakers (user_id, bio, photo) VALUES (USER_ID, 'Bio here', 'photo_url');
SELECT * FROM speakers WHERE user_id NOT IN (SELECT id FROM users);
ALTER TABLE speakers ADD COLUMN first_name VARCHAR(255);
ALTER TABLE speakers ADD COLUMN last_name VARCHAR(255);
ALTER TABLE speakers MODIFY user_id INT NULL;
ALTER TABLE speakers MODIFY user_id INT NULL;
ALTER TABLE speakers ADD COLUMN first_name VARCHAR(255);
ALTER TABLE speakers ADD COLUMN last_name VARCHAR(255);
INSERT INTO speakers (first_name, last_name, bio, photo, user_id)
VALUES ('Ada', 'Lovelace', 'Pioneer of computing', NULL, NULL);
