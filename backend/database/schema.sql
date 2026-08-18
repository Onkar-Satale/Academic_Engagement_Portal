CREATE DATABASE IF NOT EXISTS college_db
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE college_db;

-- ============================================================================
-- 1. ROLES TABLE & INITIAL ROLE HIERARCHY
-- ============================================================================
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
(7, 'Principal');

-- ============================================================================
-- 2. USER TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS user (
  user_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  department VARCHAR(100),
  year INT,
  role_id INT,
  profile_photo VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES role(role_id) ON DELETE SET NULL
);

-- ============================================================================
-- 3. CLUB TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS club (
  club_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  club_head_id INT DEFAULT NULL,
  club_mentor_id INT DEFAULT NULL,
  tagline VARCHAR(255) DEFAULT NULL,
  category VARCHAR(100) DEFAULT NULL,
  activities TEXT DEFAULT NULL,
  is_registration_open BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (club_head_id) REFERENCES user(user_id) ON DELETE SET NULL,
  FOREIGN KEY (club_mentor_id) REFERENCES user(user_id) ON DELETE SET NULL
);

-- ============================================================================
-- 4. CLUB MEMBER / APPLICATION TABLE
-- ============================================================================
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

-- ============================================================================
-- 5. EVENT TABLE
-- ============================================================================
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

-- ============================================================================
-- 6. EVENT REGISTRATION TABLE
-- ============================================================================
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

-- ============================================================================
-- 7. PERMISSION REQUEST TABLE (3-Level Approval Workflow)
-- Level 1: Club Mentor | Level 2: Estate Manager | Level 3: Principal (Final)
-- ============================================================================
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

-- ============================================================================
-- 8. PERMISSION APPROVAL AUDIT TABLE
-- ============================================================================
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

-- ============================================================================
-- 9. NOTIFICATION TABLE
-- ============================================================================
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

-- ============================================================================
-- 10. FEEDBACK & TESTIMONIALS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS feedback (
  feedback_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
);
