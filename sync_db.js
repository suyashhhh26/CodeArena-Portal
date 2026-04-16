require('dotenv').config();
const { pool } = require('./backend/config/db');

async function sync() {
  try {
    await pool.query(`
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
    `);

    await pool.query(`
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
    `);

    console.log("Database schema updated with Unstop features (Registrations & Submissions)");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

sync();
