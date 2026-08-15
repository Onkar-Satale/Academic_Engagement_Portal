CREATE DATABASE IF NOT EXISTS college_db
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE college_db;

-- 1. Roles Table & Initial Roles Data
CREATE TABLE IF NOT EXISTS role (
  role_id INT PRIMARY KEY AUTO_INCREMENT,
  role_name VARCHAR(50) NOT NULL UNIQUE
);

INSERT IGNORE INTO role (role_id, role_name) VALUES
(1, 'Student'),
(2, 'Teacher'),
(3, 'Admin'),
(4, 'Club Head'),
(5, 'Club Mentor'),
(6, 'Estate Manager'),
(7, 'Principal'),
(8, 'Director');

-- 2. User Table
CREATE TABLE IF NOT EXISTS user (
  user_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  password_hash VARCHAR(255),
  department VARCHAR(100),
  year INT,
  role_id INT,
  profile_photo VARCHAR(255) DEFAULT NULL,
  FOREIGN KEY (role_id) REFERENCES role(role_id) ON DELETE SET NULL
);

-- 3. Club Table
CREATE TABLE IF NOT EXISTS club (
  club_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  club_head_id INT,
  club_mentor_id INT,
  club_mentor_key VARCHAR(100) DEFAULT NULL,
  club_head_key VARCHAR(100) DEFAULT NULL,
  permission_emails TEXT DEFAULT NULL,
  tagline VARCHAR(255) DEFAULT NULL,
  category VARCHAR(100) DEFAULT NULL,
  activities TEXT DEFAULT NULL,
  is_registration_open BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (club_head_id) REFERENCES user(user_id) ON DELETE SET NULL,
  FOREIGN KEY (club_mentor_id) REFERENCES user(user_id) ON DELETE SET NULL
);

-- 4. Club Member / Member Applications Table
CREATE TABLE IF NOT EXISTS club_member (
  club_id INT NOT NULL,
  user_id INT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  reason TEXT DEFAULT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (club_id, user_id),
  FOREIGN KEY (club_id) REFERENCES club(club_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
);

-- 5. Event Table
CREATE TABLE IF NOT EXISTS event (
  event_id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  date DATE,
  venue VARCHAR(100),
  status VARCHAR(50) DEFAULT 'Upcoming',
  club_id INT,
  organizer_id INT,
  additional_info TEXT DEFAULT NULL,
  conducted_by VARCHAR(150) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (club_id) REFERENCES club(club_id) ON DELETE CASCADE,
  FOREIGN KEY (organizer_id) REFERENCES user(user_id) ON DELETE SET NULL
);

-- 6. Event Registration Table
CREATE TABLE IF NOT EXISTS event_registration (
  registration_id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  student_id INT NOT NULL,
  full_name VARCHAR(100),
  email VARCHAR(100),
  phone VARCHAR(20),
  department VARCHAR(100),
  year INT,
  roll_no VARCHAR(50),
  notes TEXT,
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES event(event_id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES user(user_id) ON DELETE CASCADE,
  UNIQUE KEY unique_registration (event_id, student_id)
);

-- 7. Permission Request Table
CREATE TABLE IF NOT EXISTS permission_request (
  request_id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  event_date DATE,
  venue VARCHAR(100),
  club_id INT NOT NULL,
  requester_id INT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  current_level INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (club_id) REFERENCES club(club_id) ON DELETE CASCADE,
  FOREIGN KEY (requester_id) REFERENCES user(user_id) ON DELETE CASCADE
);

-- 8. Permission Approval / Log Table
CREATE TABLE IF NOT EXISTS permission_approval (
  approval_id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL,
  authority_id INT NOT NULL,
  level INT NOT NULL,
  status VARCHAR(50) NOT NULL,
  remarks TEXT,
  action_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES permission_request(request_id) ON DELETE CASCADE,
  FOREIGN KEY (authority_id) REFERENCES user(user_id) ON DELETE CASCADE
);

-- 9. Notification Table
CREATE TABLE IF NOT EXISTS notification (
  notification_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',
  link VARCHAR(255) DEFAULT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
);

-- 10. Audit Log Table
CREATE TABLE IF NOT EXISTS audit_log (
  log_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  action VARCHAR(100),
  entity_type VARCHAR(50),
  entity_id INT,
  target VARCHAR(255) DEFAULT NULL,
  ip_address VARCHAR(45) DEFAULT NULL, 
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE SET NULL
);

-- 11. Volunteer Table
CREATE TABLE IF NOT EXISTS volunteer (
  volunteer_id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  student_id INT NOT NULL,
  task VARCHAR(100),
  attendance BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (event_id) REFERENCES event(event_id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES user(user_id) ON DELETE CASCADE,
  UNIQUE KEY unique_volunteer (event_id, student_id)
);

-- 12. Role Invite Key Table
CREATE TABLE IF NOT EXISTS role_invite_key (
  key_id INT PRIMARY KEY AUTO_INCREMENT,
  secret_key VARCHAR(100) NOT NULL UNIQUE,
  role_id INT NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES role(role_id) ON DELETE CASCADE
);

-- 13. User Feedback / Testimonials Table
CREATE TABLE IF NOT EXISTS feedback (
  feedback_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
);

-- ===================================================
-- SAMPLE SEED DATA (CLUBS, EVENTS & ROLE KEYS)
-- ===================================================

INSERT IGNORE INTO club (club_id, name, description, club_mentor_key, club_head_key) VALUES
(1, 'Coding & Open Source Club', 'Premier tech club focusing on full-stack development, open-source projects, and competitive programming.', 'MENTOR_KEY_CODING', 'HEAD_KEY_CODING'),
(2, 'Robotics & Automation Society', 'Building autonomous bots, AI hardware projects, and competing in national robotics competitions.', 'MENTOR_KEY_ROBOTICS', 'HEAD_KEY_ROBOTICS'),
(3, 'Cultural & Performing Arts Club', 'Fostering music, dance, drama, and creative arts across university campus events.', 'MENTOR_KEY_CULTURAL', 'HEAD_KEY_CULTURAL');

INSERT IGNORE INTO event (event_id, title, description, date, venue, status, club_id) VALUES
(1, 'Annual University Hackathon 2026', '24-hour coding challenge with exciting prize pools and mentor support.', '2026-09-15', 'Main Auditorium', 'Upcoming', 1),
(2, 'RoboWars Championship', 'Autonomous and remote-controlled robot battle tournament.', '2026-10-01', 'Indoor Sports Complex', 'Upcoming', 2),
(3, 'Campus Unplugged Night', 'An evening of acoustic music, poetry, and live band performances.', '2026-08-25', 'Open Air Theater', 'Upcoming', 3);
