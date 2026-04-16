/* ──────────────────────────────────────────────────────────────
   TeamRequest Model — join requests for team posts
   ────────────────────────────────────────────────────────────── */
const { pool } = require("../config/db");

const TeamRequest = {
  async create({ post_id, requester_id, message }) {
    const sql = `
      INSERT IGNORE INTO team_requests (post_id, requester_id, message)
      VALUES (?, ?, ?)
    `;
    const [result] = await pool.execute(sql, [post_id, requester_id, message || null]);
    return result;
  },

  async findByPost(postId) {
    const sql = `
      SELECT tr.*, u.username, u.skills, u.github_url
      FROM team_requests tr
      JOIN users u ON u.id = tr.requester_id
      WHERE tr.post_id = ?
      ORDER BY tr.created_at DESC
    `;
    const [rows] = await pool.execute(sql, [postId]);
    return rows;
  },

  async findByRequester(requesterId) {
    const sql = `
      SELECT tr.*, tp.title AS post_title, u.username AS owner_name
      FROM team_requests tr
      JOIN team_posts tp ON tp.id = tr.post_id
      JOIN users u ON u.id = tp.owner_id
      WHERE tr.requester_id = ?
      ORDER BY tr.created_at DESC
    `;
    const [rows] = await pool.execute(sql, [requesterId]);
    return rows;
  },

  async updateStatus(requestId, status) {
    const [result] = await pool.execute(
      `UPDATE team_requests SET status = ? WHERE id = ?`,
      [status, requestId]
    );
    return result;
  },

  async hasRequested(postId, requesterId) {
    const [rows] = await pool.execute(
      `SELECT id FROM team_requests WHERE post_id = ? AND requester_id = ?`,
      [postId, requesterId]
    );
    return rows.length > 0;
  },
};

module.exports = TeamRequest;
