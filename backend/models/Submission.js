/* ──────────────────────────────────────────────────────────────
   Submission Model — tracks user code submissions
   ────────────────────────────────────────────────────────────── */
const { pool } = require("../config/db");

const Submission = {
  /** Record a new submission. */
  async create({ user_id, problem_id, language, code, status, runtime_ms }) {
    const sql = `
      INSERT INTO submissions (user_id, problem_id, language, code, status, runtime_ms)
      VALUES (?, ?, ?, ?, ?, ?)`;
    const [result] = await pool.execute(sql, [
      user_id, problem_id, language, code, status, runtime_ms,
    ]);
    return result;
  },

  /** Get all submissions for a specific problem by a user. */
  async findByUserAndProblem(userId, problemId) {
    const [rows] = await pool.execute(
      `SELECT * FROM submissions WHERE user_id = ? AND problem_id = ? ORDER BY submitted_at DESC`,
      [userId, problemId]
    );
    return rows;
  },

  /** Get all submissions by a user (profile history). */
  async findByUser(userId) {
    const sql = `
      SELECT s.*, p.title AS problem_title
      FROM submissions s
      JOIN problems p ON s.problem_id = p.id
      WHERE s.user_id = ?
      ORDER BY s.submitted_at DESC`;
    const [rows] = await pool.execute(sql, [userId]);
    return rows;
  },

  /** Find a single submission by ID. */
  async findById(id) {
    const [rows] = await pool.execute(`SELECT * FROM submissions WHERE id = ?`, [id]);
    return rows[0] || null;
  },
};

module.exports = Submission;
