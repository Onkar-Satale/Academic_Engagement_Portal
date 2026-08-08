CREATE DATABASE IF NOT EXISTS college_db
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE college_db;
-- Roles
CREATE TABLE IF NOT EXISTS role (
  role_id INT PRIMARY KEY AUTO_INCREMENT,
  role_name VARCHAR(50) NOT NULL UNIQUE
);

-- Users
CREATE TABLE IF NOT EXISTS user (
  user_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  password_hash VARCHAR(255),
  department VARCHAR(100),
  year INT,
  role_id INT,
  FOREIGN KEY (role_id) REFERENCES role(role_id)
);

INSERT INTO role (role_name) VALUES
('Student'),
('Club Head'),
('Faculty'),
('Admin');

SHOW TABLES;   -- should show role, user, etc
SELECT * FROM role;  -- should show 4 roles
SELECT * FROM user;
CREATE TABLE event (
  event_id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date DATE,
  venue VARCHAR(255),
  status VARCHAR(50),
  club_id INT,
  organizer_id INT
);

INSERT INTO event
(title, description, date, venue, status, club_id, organizer_id)
VALUES
(
  'Cyber Security Bootcamp',
  'Learn ethical hacking and security fundamentals',
  '2026-02-12',
  'Lab 202',
  'APPROVED',
  1,
  2
),
(
  'Startup Pitch Day',
  'Students pitch startup ideas to investors',
  '2026-02-18',
  'Seminar Hall',
  'APPROVED',
  2,
  3
),
(
  'Cloud Computing Workshop',
  'AWS and Azure hands-on workshop',
  '2026-02-25',
  'Lab 305',
  'APPROVED',
  1,
  2
),
(
  'UI/UX Design Sprint',
  'Design thinking and prototyping session',
  '2026-03-02',
  'Design Studio',
  'APPROVED',
  3,
  4
),
(
  'Robotics Challenge',
  'Build and compete with autonomous robots',
  '2026-03-08',
  'Robotics Lab',
  'APPROVED',
  2,
  3
),
(
  'Open Mic Night',
  'Music, poetry, and stand-up comedy',
  '2026-03-12',
  'Open Amphitheatre',
  'APPROVED',
  4,
  5
),
(
  'Data Science Hackday',
  'Solve real-world problems using data',
  '2026-03-18',
  'Lab 110',
  'APPROVED',
  1,
  2
),
(
  'Photography Walk',
  'Outdoor photography and editing basics',
  '2026-03-22',
  'College Campus',
  'APPROVED',
  5,
  6
),
(
  'Blockchain Fundamentals',
  'Introduction to blockchain and smart contracts',
  '2026-03-28',
  'Seminar Room 2',
  'APPROVED',
  3,
  4
),
(
  'Sports Meet 2026',
  'Annual inter-department sports competition',
  '2026-04-02',
  'Sports Ground',
  'APPROVED',
  6,
  7
);









-- Drop old tables if they exist
DROP TABLE IF EXISTS club_member;
DROP TABLE IF EXISTS club;

-- Clubs table
CREATE TABLE club (
    club_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    club_head_id INT
);

-- Club members table
CREATE TABLE club_member (
    id INT AUTO_INCREMENT PRIMARY KEY,
    club_id INT,
    student_id INT,
    FOREIGN KEY (club_id) REFERENCES club(club_id),
    FOREIGN KEY (student_id) REFERENCES user(user_id)
);

-- Insert 10 clubs (example)
INSERT INTO club (name, description, club_head_id) VALUES
('Coding Club', 'Learn and practice programming.', 2),
('Robotics Club', 'Build robots and participate in competitions.', 3),
('Dance Club', 'Perform and learn various dance styles.', 4),
('Music Club', 'Sing, play instruments, and perform.', 5),
('Photography Club', 'Capture moments and improve photography skills.', 6),
('Drama Club', 'Acting, plays, and theater productions.', 7),
('Sports Club', 'Participate in various college sports.', 8),
('Art Club', 'Painting, sketching, and creative arts.', 9),
('Science Club', 'Explore experiments and scientific projects.', 10),
('Literature Club', 'Read, write, and discuss literature.', 1);

-- Check tables
SELECT * FROM club;
SELECT * FROM club_member;





-- Delete event with ID 5 (for example)
DELETE FROM event
WHERE event_id = 6;
-- Delete club with ID 3
DELETE FROM club
WHERE club_id = 4;

ALTER TABLE club 
ADD COLUMN secret_key VARCHAR(20) UNIQUE;

SET SQL_SAFE_UPDATES = 0;
UPDATE club SET secret_key = 'CLUB1001' WHERE name = 'Coding Club';
UPDATE club SET secret_key = 'CLUB1002' WHERE name = 'Robotics Club';
UPDATE club SET secret_key = 'CLUB1003' WHERE name = 'Photography Club';
UPDATE club SET secret_key = 'CLUB1004' WHERE name = 'Drama Club';
UPDATE club SET secret_key = 'CLUB1005' WHERE name = 'Sports Club';
UPDATE club SET secret_key = 'CLUB1006' WHERE name = 'Art Club';
UPDATE club SET secret_key = 'CLUB1007' WHERE name = 'Science Club';
UPDATE club SET secret_key = 'CLUB1008' WHERE name = 'Literature Club';

SET SQL_SAFE_UPDATES = 1;
SELECT * FROM user;
DELETE FROM user
WHERE user_id = 3;



SELECT u.user_id, u.name, u.role_id, r.role_name
FROM user u
LEFT JOIN role r ON u.role_id = r.role_id;

CREATE TABLE IF NOT EXISTS admin_key (
    id INT AUTO_INCREMENT PRIMARY KEY,
    key_value VARCHAR(50) NOT NULL UNIQUE,
    used TINYINT(1) DEFAULT 0
);
INSERT INTO admin_key (key_value) VALUES ('SUPERADMIN123');

SELECT club_id, name, secret_key FROM club;

UPDATE club
SET club_head_id = NULL
WHERE club_id = 5;

SELECT club_id, name, club_head_id FROM club;

ALTER TABLE club
ADD COLUMN tagline VARCHAR(255) DEFAULT '',
ADD COLUMN category VARCHAR(255) DEFAULT '',
ADD COLUMN activities TEXT;







CREATE TABLE club_member (
  id INT AUTO_INCREMENT PRIMARY KEY,
  club_id INT NOT NULL,
  user_id INT NULL,           -- if user exists
  student_name VARCHAR(100),
  email VARCHAR(100),
  branch VARCHAR(50),
  year INT,
  roll_no VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_club_member_club
    FOREIGN KEY (club_id) REFERENCES club(club_id)
    ON DELETE CASCADE,

  CONSTRAINT fk_club_member_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL
) ENGINE=InnoDB;





DESCRIBE club_member;




SELECT 
    c.club_id,
    c.name AS club_name,
    u.user_id AS head_id,
    u.name AS head_name,
    u.email AS head_email,
    u.department AS head_department,
    u.year AS head_year
FROM club c
LEFT JOIN user u ON c.club_head_id = u.user_id
WHERE c.club_head_id IS NOT NULL;


SET SQL_SAFE_UPDATES = 0;
UPDATE club
SET club_head_id = 15  -- your user_id
WHERE name = 'NSS';

SET SQL_SAFE_UPDATES = 1;
SELECT club_id, name, club_head_id FROM club;

SELECT club_id, name, club_head_id FROM club;

SET SQL_SAFE_UPDATES = 0;
DELETE FROM club
WHERE name = 'NSS';
SET SQL_SAFE_UPDATES = 1;
SELECT club_id, name, club_head_id FROM club;

DELETE FROM user
WHERE user_id IN (12, 15);
-- Verify deletion
SELECT * FROM user;

ALTER TABLE club_member
ADD COLUMN student_name VARCHAR(100);

DESCRIBE club_member;
ALTER TABLE club_member ADD COLUMN email VARCHAR(100);
ALTER TABLE club_member ADD COLUMN roll_no VARCHAR(50);
ALTER TABLE club_member ADD COLUMN year VARCHAR(10);
ALTER TABLE club_member ADD COLUMN branch VARCHAR(50);










CREATE TABLE IF NOT EXISTS teacher_key (
    id INT AUTO_INCREMENT PRIMARY KEY,
    key_value VARCHAR(50) NOT NULL UNIQUE
);


INSERT INTO teacher_key (key_value) VALUES ('MASTERTEACHER2026');




ALTER TABLE user
MODIFY year INT NULL;




CREATE TABLE IF NOT EXISTS event (
  event_id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  venue VARCHAR(255) NOT NULL,
  status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
  club_id INT,
  organizer_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS event_registration (
  registration_id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  student_id INT NOT NULL,
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (event_id, student_id)
);
ALTER TABLE event
ADD COLUMN additional_info TEXT,
ADD COLUMN conducted_by VARCHAR(255);

CREATE TABLE IF NOT EXISTS event_registration (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    student_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_registration (event_id, student_id)
);


SELECT event_id, title, organizer_id, club_id, date
FROM event
ORDER BY event_id;

SET SQL_SAFE_UPDATES = 0;
DELETE FROM event
WHERE club_id IS NOT NULL;


DROP TABLE IF EXISTS event_registrations;
CREATE TABLE event_registrations (
  registration_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  event_id INT NOT NULL,
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_event_user
    FOREIGN KEY (user_id)
    REFERENCES user(user_id)
    ON DELETE CASCADE,

  CONSTRAINT fk_event_event
    FOREIGN KEY (event_id)
    REFERENCES event(event_id)
    ON DELETE CASCADE,

  UNIQUE KEY unique_registration (user_id, event_id)
) ENGINE=InnoDB;

SELECT * FROM event;

SELECT * FROM event_registration;  -- or event_registrations, whichever you created
SELECT * FROM event_registration;  -- Check all registrations

DELETE FROM event_registration
WHERE student_id = 13;

CREATE TABLE event_registration (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    student_id INT NOT NULL,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_registration (event_id, student_id),
    CONSTRAINT fk_event_registration_event
        FOREIGN KEY (event_id) REFERENCES event(event_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_event_registration_user
        FOREIGN KEY (student_id) REFERENCES user(user_id)
        ON DELETE CASCADE
) ENGINE=InnoDB;


SELECT * FROM event_registration;


SET SQL_SAFE_UPDATES = 0;

DELETE FROM club_member;
DELETE FROM event_registration;
DELETE FROM user;

SET SQL_SAFE_UPDATES = 0;

SELECT * from user;
SELECT * FROM admin_keys;
RENAME TABLE admin_key TO admin_keys;
SELECT * FROM admin_keys;


UPDATE admin_keys
SET used = 0
WHERE key_value = 'SUPERADMIN123';













