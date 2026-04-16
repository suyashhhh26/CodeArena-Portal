/* ──────────────────────────────────────────────────────────────
   User Model — updated for hackathon platform
   ────────────────────────────────────────────────────────────── */
const { pool } = require("../config/db");

const User = {
  async create({ username, email, password_hash, role, college }) {
    const sql = `INSERT INTO users (username, email, password_hash, role, college) VALUES (?, ?, ?, ?, ?)`;
    const [result] = await pool.execute(sql, [username, email, password_hash, role || 'student', college || null]);
    return result;
  },

  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT id, username, email, role, college, bio, skills, avatar_url, github_url, linkedin_url, created_at FROM users WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  async findByIdWithHash(id) {
    const [rows] = await pool.execute(`SELECT * FROM users WHERE id = ?`, [id]);
    return rows[0] || null;
  },

  async findByEmail(email) {
    const [rows] = await pool.execute(`SELECT * FROM users WHERE email = ?`, [email]);
    return rows[0] || null;
  },

  async findByUsername(username) {
    const [rows] = await pool.execute(`SELECT * FROM users WHERE username = ?`, [username]);
    return rows[0] || null;
  },

  async findAll() {
    const [rows] = await pool.execute(
      `SELECT id, username, email, role, skills, created_at FROM users ORDER BY created_at DESC`
    );
    return rows;
  },

  async updateProfile(id, { bio, skills, college, interests, avatar_url, github_url, linkedin_url, resume_url }) {
    const sql = `
      UPDATE users SET bio = ?, skills = ?, college = ?, interests = ?, avatar_url = ?, github_url = ?, linkedin_url = ?, resume_url = ?
      WHERE id = ?
    `;
    const [result] = await pool.execute(sql, [bio, skills, college, interests, avatar_url, github_url, linkedin_url, resume_url, id]);
    return result;
  },

  async count() {
    const [rows] = await pool.execute(`SELECT COUNT(*) AS total FROM users`);
    return rows[0].total;
  },
};

module.exports = User;
