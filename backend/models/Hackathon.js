/* ──────────────────────────────────────────────────────────────
   Hackathon Model — data access layer
   ────────────────────────────────────────────────────────────── */
const { pool } = require("../config/db");

const Hackathon = {
  async create(data) {
    const sql = `
      INSERT INTO hackathons
        (title, organizer, description, theme, mode, difficulty,
         prize_pool, prize_amount, registration_link, banner_url,
         eligibility, rules, max_team_size, min_team_size, location,
         registration_start, registration_end, hackathon_start, hackathon_end,
         tags, status, featured, created_by)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `;
    const vals = [
      data.title || null,
      data.organizer || null,
      data.description || null,
      data.theme || null,
      data.mode || "online",
      data.difficulty || "open",
      data.prize_pool || null,
      data.prize_amount || 0,
      data.registration_link || null,
      data.banner_url || null,
      data.eligibility || null,
      data.rules || null,
      data.max_team_size || 4,
      data.min_team_size || 1,
      data.location || null,
      data.registration_start || null,
      data.registration_end || null,
      data.hackathon_start || null,
      data.hackathon_end || null,
      data.tags || null,
      data.status || "upcoming",
      data.featured || false,
      data.created_by || null,
    ];
    const [result] = await pool.execute(sql, vals);
    return result;
  },

  async findAll(filters = {}) {
    let sql = `SELECT * FROM hackathons WHERE 1=1`;
    const params = [];

    if (filters.mode)       { sql += ` AND mode = ?`;              params.push(filters.mode); }
    if (filters.difficulty) { sql += ` AND difficulty = ?`;        params.push(filters.difficulty); }
    if (filters.theme)      { sql += ` AND theme LIKE ?`;          params.push(`%${filters.theme}%`); }
    if (filters.status)     { sql += ` AND status = ?`;            params.push(filters.status); }
    if (filters.featured !== undefined) { sql += ` AND featured = ?`; params.push(filters.featured); }
    if (filters.search) {
      sql += ` AND (title LIKE ? OR organizer LIKE ? OR tags LIKE ?)`;
      const s = `%${filters.search}%`;
      params.push(s, s, s);
    }
    if (filters.minPrize)   { sql += ` AND prize_amount >= ?`;     params.push(filters.minPrize); }
    if (filters.created_by) { sql += ` AND created_by = ?`;        params.push(filters.created_by); }

    sql += ` ORDER BY featured DESC, registration_end ASC`;

    const [rows] = await pool.execute(sql, params);
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.execute(`SELECT * FROM hackathons WHERE id = ?`, [id]);
    return rows[0] || null;
  },

  async update(id, data) {
    const fields = Object.keys(data).map(k => `${k} = ?`).join(", ");
    const vals   = [...Object.values(data), id];
    const [result] = await pool.execute(
      `UPDATE hackathons SET ${fields} WHERE id = ?`, vals
    );
    return result;
  },

  async delete(id) {
    const [result] = await pool.execute(`DELETE FROM hackathons WHERE id = ?`, [id]);
    return result;
  },

  async count() {
    const [rows] = await pool.execute(`SELECT COUNT(*) AS total FROM hackathons`);
    return rows[0].total;
  },

  async countByStatus() {
    const [rows] = await pool.execute(
      `SELECT status, COUNT(*) AS cnt FROM hackathons GROUP BY status`
    );
    return rows;
  },
};

module.exports = Hackathon;
