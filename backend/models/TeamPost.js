/* ──────────────────────────────────────────────────────────────
   TeamPost Model — team recruitment listings
   ────────────────────────────────────────────────────────────── */
const { pool } = require("../config/db");

const TeamPost = {
  async create(data) {
    const sql = `
      INSERT INTO team_posts
        (hackathon_id, owner_id, title, description, skills_needed,
         team_size_max, contact_info)
      VALUES (?,?,?,?,?,?,?)
    `;
    const [result] = await pool.execute(sql, [
      data.hackathon_id || null,
      data.owner_id,
      data.title,
      data.description,
      data.skills_needed,
      data.team_size_max || 4,
      data.contact_info,
    ]);
    return result;
  },

  async findAll(filters = {}) {
    let sql = `
      SELECT tp.*, u.username AS owner_name, u.skills AS owner_skills,
             h.title AS hackathon_name
      FROM team_posts tp
      JOIN users u ON u.id = tp.owner_id
      LEFT JOIN hackathons h ON h.id = tp.hackathon_id
      WHERE 1=1
    `;
    const params = [];

    if (filters.status)      { sql += ` AND tp.status = ?`;              params.push(filters.status); }
    if (filters.hackathonId) { sql += ` AND tp.hackathon_id = ?`;        params.push(filters.hackathonId); }
    if (filters.skills) {
      sql += ` AND tp.skills_needed LIKE ?`;
      params.push(`%${filters.skills}%`);
    }
    if (filters.search) {
      sql += ` AND (tp.title LIKE ? OR tp.description LIKE ?)`;
      const s = `%${filters.search}%`;
      params.push(s, s);
    }

    sql += ` ORDER BY tp.created_at DESC`;
    const [rows] = await pool.execute(sql, params);
    return rows;
  },

  async findById(id) {
    const sql = `
      SELECT tp.*, u.username AS owner_name, u.skills AS owner_skills,
             u.github_url AS owner_github, h.title AS hackathon_name
      FROM team_posts tp
      JOIN users u ON u.id = tp.owner_id
      LEFT JOIN hackathons h ON h.id = tp.hackathon_id
      WHERE tp.id = ?
    `;
    const [rows] = await pool.execute(sql, [id]);
    return rows[0] || null;
  },

  async findByOwner(ownerId) {
    const [rows] = await pool.execute(
      `SELECT tp.*, h.title AS hackathon_name FROM team_posts tp
       LEFT JOIN hackathons h ON h.id = tp.hackathon_id
       WHERE tp.owner_id = ? ORDER BY tp.created_at DESC`,
      [ownerId]
    );
    return rows;
  },

  async update(id, data) {
    const fields = Object.keys(data).map(k => `${k} = ?`).join(", ");
    const [result] = await pool.execute(
      `UPDATE team_posts SET ${fields} WHERE id = ?`,
      [...Object.values(data), id]
    );
    return result;
  },

  async delete(id) {
    const [result] = await pool.execute(`DELETE FROM team_posts WHERE id = ?`, [id]);
    return result;
  },

  async count() {
    const [rows] = await pool.execute(`SELECT COUNT(*) AS total FROM team_posts WHERE status = 'open'`);
    return rows[0].total;
  },
};

module.exports = TeamPost;
