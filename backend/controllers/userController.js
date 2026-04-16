const { pool } = require("../config/db");

/** GET /api/users/me/registrations */
exports.getMyRegistrations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(`
      SELECT h.*, r.status as reg_status, r.created_at as registered_at
      FROM hackathons h
      JOIN hackathon_registrations r ON h.id = r.hackathon_id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
    `, [userId]);

    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};
