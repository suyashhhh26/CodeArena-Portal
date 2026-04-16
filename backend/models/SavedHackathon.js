/* ──────────────────────────────────────────────────────────────
   SavedHackathon Model — bookmark management
   ────────────────────────────────────────────────────────────── */
const { pool } = require("../config/db");

const SavedHackathon = {
  async save(userId, hackathonId) {
    const sql = `
      INSERT IGNORE INTO saved_hackathons (user_id, hackathon_id) VALUES (?, ?)
    `;
    const [result] = await pool.execute(sql, [userId, hackathonId]);
    return result;
  },

  async remove(userId, hackathonId) {
    const [result] = await pool.execute(
      `DELETE FROM saved_hackathons WHERE user_id = ? AND hackathon_id = ?`,
      [userId, hackathonId]
    );
    return result;
  },

  async findByUser(userId) {
    const sql = `
      SELECT h.*, sh.saved_at
      FROM saved_hackathons sh
      JOIN hackathons h ON h.id = sh.hackathon_id
      WHERE sh.user_id = ?
      ORDER BY sh.saved_at DESC
    `;
    const [rows] = await pool.execute(sql, [userId]);
    return rows;
  },

  async isSaved(userId, hackathonId) {
    const [rows] = await pool.execute(
      `SELECT id FROM saved_hackathons WHERE user_id = ? AND hackathon_id = ?`,
      [userId, hackathonId]
    );
    return rows.length > 0;
  },
};

module.exports = SavedHackathon;
