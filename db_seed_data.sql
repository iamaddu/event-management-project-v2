-- Insert sample data into users table
INSERT INTO users (first_name, last_name, username, email, phone, password, user_type)
VALUES
('John', 'Doe', 'johndoe', 'john@example.com', '1234567890', 'password123', 'admin'),
('Jane', 'Smith', 'janesmith', 'jane@example.com', '0987654321', 'password123', 'organizer'),
('Alice', 'Johnson', 'alicej', 'alice@example.com', '1122334455', 'password123', 'attendee'),
('Bob', 'Brown', 'bobb', 'bob@example.com', '6677889900', 'password123', 'attendee'),
('Charlie', 'Davis', 'charlied', 'charlie@example.com', '5566778899', 'password123', 'organizer');

-- Insert sample data into categories table
INSERT INTO categories (name, slug, description, icon, color, status, meta_title, meta_description)
VALUES
('Technology', 'technology', 'Events related to technology.', 'fa-microchip', '#3b82f6', 'active', 'Technology Events', 'Find the best technology events here.'),
('Business', 'business', 'Events related to business and entrepreneurship.', 'fa-briefcase', '#10b981', 'active', 'Business Events', 'Explore business events and summits.'),
('Music', 'music', 'Events related to music and entertainment.', 'fa-music', '#f59e0b', 'active', 'Music Events', 'Discover music festivals and concerts.');

-- Insert sample data into events table with images
INSERT INTO events (title, description, organizer, start, end, location, venue, capacity, price_standard, price_vip, price_premium, status, category_id, image)
VALUES
('Tech Conference 2025', 'A conference for tech enthusiasts.', 2, '2025-05-01 10:00:00', '2025-05-01 18:00:00', 'New York', 'Tech Hall', 200, 50.00, 100.00, 150.00, 'Published', 1, 'tech.jpg'),
('Business Summit', 'A summit for business professionals.', 5, '2025-06-10 09:00:00', '2025-06-10 17:00:00', 'Los Angeles', 'Business Center', 300, 60.00, 120.00, 180.00, 'Published', 2, 'business.jpg'),
('Music Festival', 'A festival for music lovers.', 2, '2025-07-15 15:00:00', '2025-07-15 23:00:00', 'San Francisco', 'Music Arena', 500, 40.00, 80.00, 120.00, 'Published', 3, 'music.jpg');

-- Insert sample data into speakers table with photos
INSERT INTO speakers (name, bio, photo, contact_email)
VALUES
('Dr. Alan Turing', 'Expert in computer science and AI.', 'alan_turing.jpg', 'alan.turing@example.com'),
('Ms. Ada Lovelace', 'Pioneer in programming.', 'ada_lovelace.jpg', 'ada.lovelace@example.com');

-- Link speakers to sessions
INSERT INTO session_speakers (session_id, speaker_id)
VALUES
(1, 1),
(1, 2);

-- Insert sample data into sessions table
INSERT INTO sessions (title, description, capacity, registered, start_time, end_time, event_id)
VALUES
('AI Workshop', 'Learn about AI and machine learning.', 50, 10, '2025-05-01 10:00:00', '2025-05-01 12:00:00', 1),
('Blockchain Seminar', 'Understand blockchain technology.', 100, 20, '2025-06-10 14:00:00', '2025-06-10 16:00:00', 2);

-- Insert sample comments and ratings for sessions
INSERT INTO session_comments (session_id, user_id, comment, rating)
VALUES
(1, 3, 'Great workshop on AI!', 5),
(2, 4, 'Very informative seminar.', 4);

-- Insert sample data into attendees table
INSERT INTO attendees (first_name, last_name, email, phone, event_id<create_file>
<path>db_seed_data.sql</path>
<content>
-- Insert sample data into users table
INSERT INTO users (first_name, last_name, username, email, phone, password, user_type)
VALUES
('John', 'Doe', 'johndoe', 'john@example.com', '1234567890', 'password123', 'admin'),
('Jane', 'Smith', 'janesmith', 'jane@example.com', '0987654321', 'password123', 'organizer'),
('Alice', 'Johnson', 'alicej', 'alice@example.com', '1122334455', 'password123', 'attendee'),
('Bob', 'Brown', 'bobb', 'bob@example.com', '6677889900', 'password123', 'attendee'),
('Charlie', 'Davis', 'charlied', 'charlie@example.com', '5566778899', 'password123', 'organizer');

-- Insert sample data into categories table
INSERT INTO categories (name, slug, description, icon, color, status, meta_title, meta_description)
VALUES
('Technology', 'technology', 'Events related to technology.', 'fa-microchip', '#3b82f6', 'active', 'Technology Events', 'Find the best technology events here.'),
('Business', 'business', 'Events related to business and entrepreneurship.', 'fa-briefcase', '#10b981', 'active', 'Business Events', 'Explore business events and summits.'),
('Music', 'music', 'Events related to music and entertainment.', 'fa-music', '#f59e0b', 'active', 'Music Events', 'Discover music festivals and concerts.');

-- Insert sample data into events table with images
INSERT INTO events (title, description, organizer, start, end, location, venue, capacity, price_standard, price_vip, price_premium, status, category_id, image)
VALUES
('Tech Conference 2025', 'A conference for tech enthusiasts.', 2, '2025-05-01 10:00:00', '2025-05-01 18:00:00', 'New York', 'Tech Hall', 200, 50.00, 100.00, 150.00, 'Published', 1, 'tech_conference.jpg'),
('Business Summit', 'A summit for business professionals.', 5, '2025-06-10 09:00:00', '2025-06-10 17:00:00', 'Los Angeles', 'Business Center', 300, 60.00, 120.00, 180.00, 'Published', 2, 'business_summit.jpg'),
('Music Festival', 'A festival for music lovers.', 2, '2025-07-15 15:00:00', '2025-07-15 23:00:00', 'San Francisco', 'Music Arena', 500, 40.00, 80.00, 120.00, 'Published', 3, 'music_festival.jpg');

-- Insert sample data into speakers table with photos
INSERT INTO speakers (name, bio, photo, contact_email)
VALUES
('Dr. Alan Turing', 'Expert in computer science and AI.', 'alan_turing.jpg', 'alan.turing@example.com'),
('Ms. Ada Lovelace', 'Pioneer in programming.', 'ada_lovelace.jpg', 'ada.lovelace@example.com'),
('Mr. John Doe', 'Business strategist and speaker.', 'john_doe.jpg', 'john.doe@example.com');

-- Link speakers to sessions
INSERT INTO session_speakers (session_id, speaker_id)
VALUES
(1, 1),
(1, 2),
(2, 3);

-- Insert sample data into sessions table
INSERT INTO sessions (title, description, capacity, registered, start_time, end_time, event_id)
VALUES
('AI Workshop', 'Learn about AI and machine learning.', 50, 10, '2025-05-01 10:00:00', '2025-05-01 12:00:00', 1),
('Blockchain Seminar', 'Understand blockchain technology.', 100, 20, '2025-06-10 14:00:00', '2025-06-10 16:00:00', 2);

-- Insert sample comments and ratings for sessions
INSERT INTO session_comments (session_id, user_id, comment, rating)
VALUES
(1, 3, 'Great workshop on AI!', 5),
(2, 4, 'Very informative seminar.', 4);

-- Insert sample data into attendees table
INSERT INTO attendees (first_name, last_name, email, phone, event_id, ticket_type, status)
VALUES
('Alice', 'Johnson', 'alice@example.com', '1122334455', 1, 'VIP', 'Registered'),
('Bob', 'Brown', 'bob@example.com', '6677889900', 2, 'General', 'Checked In'),
('Charlie', 'Davis', 'charlie@example.com', '5566778899', 3, 'Premium', 'Registered');

-- Insert sample data into tickets table
INSERT INTO tickets (event_id, user_id, quantity, total_price, payment_method)
VALUES
(1, 3, 2, 100.00, 'Credit Card'),
(2, 4, 1, 60.00, 'PayPal'),
(3, 5, 3, 120.00, 'Debit Card');

-- Insert sample data into registrations table
INSERT INTO registrations (session_id, user_name, user_email, ticket_type)
VALUES
(1, 'Alice Johnson', 'alice@example.com', 'Standard'),
(2, 'Bob Brown', 'bob@example.com', 'VIP');

-- Insert sample data into purchases table
INSERT INTO purchases (user_id, event_id, ticket_type, quantity, total_price, payment_method)
VALUES
(3, 1, 'VIP', 2, 200.00, 'Credit Card'),
(4, 2, 'General', 1, 60.00, 'PayPal'),
(5, 3, 'Premium', 3, 360.00, 'Debit Card');
