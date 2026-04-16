-- ═══════════════════════════════════════════════════════════
--  CodeArena — Hackathon Discovery Platform
--  Database Schema
-- ═══════════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS codearena;
USE codearena;

-- Drop all potential existing tables (including old DSA ones)
DROP TABLE IF EXISTS team_requests;
DROP TABLE IF EXISTS team_posts;
DROP TABLE IF EXISTS saved_hackathons;
DROP TABLE IF EXISTS hackathons;
DROP TABLE IF EXISTS submissions;
DROP TABLE IF EXISTS problems;
DROP TABLE IF EXISTS users;

-- ─── Users ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            INT           AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50)   NOT NULL UNIQUE,
  email         VARCHAR(100)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  role          ENUM('student', 'organizer', 'admin') DEFAULT 'student',
  bio           TEXT,
  skills        VARCHAR(500),
  college       VARCHAR(200),
  avatar_url    VARCHAR(500),
  github_url    VARCHAR(300),
  linkedin_url  VARCHAR(300),
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ─── Organizers (Extended Info) ─────────────────────────
CREATE TABLE IF NOT EXISTS organizers (
  user_id       INT           PRIMARY KEY,
  org_name      VARCHAR(200)  NOT NULL,
  website       VARCHAR(300),
  description   TEXT,
  verified      BOOLEAN       DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── Hackathons ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hackathons (
  id                INT           AUTO_INCREMENT PRIMARY KEY,
  title             VARCHAR(200)  NOT NULL,
  organizer         VARCHAR(150)  NOT NULL,
  description       TEXT          NOT NULL,
  theme             VARCHAR(100),
  mode              ENUM('online', 'offline', 'hybrid') NOT NULL DEFAULT 'online',
  difficulty        ENUM('beginner', 'intermediate', 'advanced', 'open') DEFAULT 'open',
  prize_pool        VARCHAR(100),
  prize_amount      INT           DEFAULT 0,
  registration_link VARCHAR(500),
  banner_url        VARCHAR(500),
  eligibility       TEXT,
  rules             TEXT,
  max_team_size     INT           DEFAULT 4,
  min_team_size     INT           DEFAULT 1,
  location          VARCHAR(200),
  registration_start DATETIME,
  registration_end  DATETIME      NOT NULL,
  hackathon_start   DATETIME,
  hackathon_end     DATETIME,
  tags              VARCHAR(500),
  status            ENUM('upcoming', 'ongoing', 'ended') DEFAULT 'upcoming',
  featured          BOOLEAN       DEFAULT FALSE,
  created_by        INT,
  created_at        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ─── Saved Hackathons (Bookmarks) ────────────────────
CREATE TABLE IF NOT EXISTS saved_hackathons (
  id            INT           AUTO_INCREMENT PRIMARY KEY,
  user_id       INT           NOT NULL,
  hackathon_id  INT           NOT NULL,
  saved_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_hack (user_id, hackathon_id),
  FOREIGN KEY (user_id)      REFERENCES users(id)      ON DELETE CASCADE,
  FOREIGN KEY (hackathon_id) REFERENCES hackathons(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── Team Posts (Recruitment Listings) ───────────────
CREATE TABLE IF NOT EXISTS team_posts (
  id              INT           AUTO_INCREMENT PRIMARY KEY,
  hackathon_id    INT,
  owner_id        INT           NOT NULL,
  title           VARCHAR(200)  NOT NULL,
  description     TEXT          NOT NULL,
  skills_needed   VARCHAR(500),
  team_size_max   INT           DEFAULT 4,
  current_members INT           DEFAULT 1,
  status          ENUM('open', 'closed', 'full') DEFAULT 'open',
  contact_info    VARCHAR(300),
  created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hackathon_id) REFERENCES hackathons(id) ON DELETE SET NULL,
  FOREIGN KEY (owner_id)     REFERENCES users(id)      ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── Team Requests (Join Requests) ───────────────────
CREATE TABLE IF NOT EXISTS team_requests (
  id            INT           AUTO_INCREMENT PRIMARY KEY,
  post_id       INT           NOT NULL,
  requester_id  INT           NOT NULL,
  message       TEXT,
  status        ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_req (post_id, requester_id),
  FOREIGN KEY (post_id)      REFERENCES team_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (requester_id) REFERENCES users(id)      ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── Hackathon Registrations (Unstop Feature) ────────
CREATE TABLE IF NOT EXISTS hackathon_registrations (
  id            INT           AUTO_INCREMENT PRIMARY KEY,
  hackathon_id  INT           NOT NULL,
  user_id       INT           NOT NULL,
  status        ENUM('registered', 'shortlisted', 'rejected') DEFAULT 'registered',
  registered_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_reg (hackathon_id, user_id),
  FOREIGN KEY (hackathon_id) REFERENCES hackathons(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)      REFERENCES users(id)      ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── Submissions (Unstop Feature) ────────────────────
CREATE TABLE IF NOT EXISTS submissions (
  id            INT           AUTO_INCREMENT PRIMARY KEY,
  hackathon_id  INT           NOT NULL,
  user_id       INT           NOT NULL,
  project_title VARCHAR(200)  NOT NULL,
  repo_url      VARCHAR(500),
  demo_url      VARCHAR(500),
  description   TEXT,
  score         INT           DEFAULT NULL,
  feedback      TEXT,
  submitted_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hackathon_id) REFERENCES hackathons(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)      REFERENCES users(id)      ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── Judges ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS judges (
  id            INT           AUTO_INCREMENT PRIMARY KEY,
  hackathon_id  INT           NOT NULL,
  user_id       INT           NOT NULL,
  specialization VARCHAR(200),
  FOREIGN KEY (hackathon_id) REFERENCES hackathons(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)      REFERENCES users(id)      ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── Evaluation Criteria & Scores ───────────────────────
CREATE TABLE IF NOT EXISTS evaluations (
  id            INT           AUTO_INCREMENT PRIMARY KEY,
  submission_id INT           NOT NULL,
  judge_id      INT           NOT NULL,
  innovation    INT           DEFAULT 0,
  technical     INT           DEFAULT 0,
  presentation  INT           DEFAULT 0,
  feasibility   INT           DEFAULT 0,
  feedback      TEXT,
  total_score   DECIMAL(5,2),
  FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
  FOREIGN KEY (judge_id)      REFERENCES judges(id)      ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── Certificates ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS certificates (
  id            INT           AUTO_INCREMENT PRIMARY KEY,
  user_id       INT           NOT NULL,
  hackathon_id  INT           NOT NULL,
  cert_type     ENUM('participation', 'winner', 'runner-up') DEFAULT 'participation',
  cert_url      VARCHAR(500),
  issued_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)      REFERENCES users(id)      ON DELETE CASCADE,
  FOREIGN KEY (hackathon_id) REFERENCES hackathons(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── Attendance Logs (QR System) ────────────────────────
CREATE TABLE IF NOT EXISTS attendance_logs (
  id            INT           AUTO_INCREMENT PRIMARY KEY,
  hackathon_id  INT           NOT NULL,
  user_id       INT           NOT NULL,
  scan_time     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hackathon_id) REFERENCES hackathons(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)      REFERENCES users(id)      ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── Indexes ─────────────────────────────────────────
CREATE INDEX idx_hackathons_status   ON hackathons(status);
CREATE INDEX idx_hackathons_mode     ON hackathons(mode);
CREATE INDEX idx_hackathons_deadline ON hackathons(registration_end);
CREATE INDEX idx_hackathons_featured ON hackathons(featured);
CREATE INDEX idx_saved_user          ON saved_hackathons(user_id);
CREATE INDEX idx_team_posts_hack     ON team_posts(hackathon_id);
CREATE INDEX idx_team_posts_owner    ON team_posts(owner_id);
CREATE INDEX idx_team_requests_post  ON team_requests(post_id);
