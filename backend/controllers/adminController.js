/* ──────────────────────────────────────────────────────────────
   Admin Controller
   ────────────────────────────────────────────────────────────── */
const User      = require("../models/User");
const Hackathon = require("../models/Hackathon");
const TeamPost  = require("../models/TeamPost");

/** GET /api/admin/dashboard */
exports.getDashboard = async (req, res, next) => {
  try {
    const [userCount, hackCount, teamCount, byStatus] = await Promise.all([
      User.count(),
      Hackathon.count(),
      TeamPost.count(),
      Hackathon.countByStatus(),
    ]);
    res.json({
      success: true,
      data: { userCount, hackCount, teamCount, byStatus },
    });
  } catch (err) { next(err); }
};

/** GET /api/admin/users */
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role } = req.query;
    let users = await User.findAll();
    if (role) {
       users = users.filter(u => u.role === role);
    }
    res.json({ success: true, count: users.length, data: users });
  } catch (err) { next(err); }
};

/** GET /api/admin/organizers */
exports.getAllOrganizers = async (req, res, next) => {
  try {
    const { pool } = require("../config/db");
    const [rows] = await pool.execute(`
      SELECT o.*, u.username, u.email, u.created_at
      FROM organizers o
      JOIN users u ON o.user_id = u.id
      ORDER BY u.created_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

/** POST /api/admin/organizers/:id/verify */
exports.verifyOrganizer = async (req, res, next) => {
  try {
    const { pool } = require("../config/db");
    await pool.execute("UPDATE organizers SET verified = TRUE WHERE user_id = ?", [req.params.id]);
    res.json({ success: true, message: "Organizer verified" });
  } catch (err) { next(err); }
};

/** GET /api/admin/hackathons */
exports.getAllHackathons = async (req, res, next) => {
  try {
    const list = await Hackathon.findAll({});
    res.json({ success: true, count: list.length, data: list });
  } catch (err) { next(err); }
};
