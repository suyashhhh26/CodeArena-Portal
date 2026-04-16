/* ──────────────────────────────────────────────────────────────
   Problem Model — data-access layer for coding challenges
   ────────────────────────────────────────────────────────────── */
const { pool } = require("../config/db");

const Problem = {
  /** Create a new problem. */
  async create({ title, description, difficulty, input_format, output_format, constraints, sample_input, sample_output, author_id }) {
    const sql = `
      INSERT INTO problems
        (title, description, difficulty, input_format, output_format, constraints, sample_input, sample_output, author_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const [result] = await pool.execute(sql, [
      title, description, difficulty, input_format, output_format,
      constraints, sample_input, sample_output, author_id,
    ]);
    return result;
  },

  /** Fetch all problems (list view). */
  async findAll() {
    const [rows] = await pool.execute(
      `SELECT id, title, difficulty, created_at FROM problems ORDER BY created_at DESC`
    );
    return rows;
  },

  /** Fetch a single problem with full details. */
  async findById(id) {
    const [rows] = await pool.execute(`SELECT * FROM problems WHERE id = ?`, [id]);
    return rows[0] || null;
  },

  /** Update a problem. */
  async update(id, fields) {
    const keys = Object.keys(fields);
    const values = Object.values(fields);
    const setClause = keys.map((k) => `${k} = ?`).join(", ");
    const [result] = await pool.execute(
      `UPDATE problems SET ${setClause} WHERE id = ?`,
      [...values, id]
    );
    return result;
  },

  /** Delete a problem. */
  async delete(id) {
    const [result] = await pool.execute(`DELETE FROM problems WHERE id = ?`, [id]);
    return result;
  },
};

module.exports = Problem;
