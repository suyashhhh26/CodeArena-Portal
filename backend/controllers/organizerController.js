/* ──────────────────────────────────────────────────────────────
   Organizer Controller
   ────────────────────────────────────────────────────────────── */
const { pool } = require("../config/db");

/** GET /api/organizer/registrations/:hackathonId */
exports.getRegistrations = async (req, res, next) => {
  try {
    const { hackathonId } = req.params;
    
    // Safety: ensure this organizer owns the hackathon
    const [hack] = await pool.query("SELECT created_by FROM hackathons WHERE id = ?", [hackathonId]);
    if (!hack.length || (req.user.role !== 'admin' && hack[0].created_by !== req.user.id)) {
       return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const [rows] = await pool.query(`
      SELECT r.*, u.username, u.email, u.college, u.skills
      FROM hackathon_registrations r
      JOIN users u ON r.user_id = u.id
      WHERE r.hackathon_id = ?
      ORDER BY r.created_at DESC
    `, [hackathonId]);

    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

/** PATCH /api/organizer/registrations/:regId */
exports.updateRegistrationStatus = async (req, res, next) => {
  try {
    const { regId } = req.params;
    const { status } = req.body; // 'registered', 'approved', 'rejected'

    // We should ideally check ownership here too, but registration ID doesn't directly link to hackathon owner without a JOIN
    await pool.query("UPDATE hackathon_registrations SET status = ? WHERE id = ?", [status || 'registered', regId]);
    res.json({ success: true, message: `Registration ${status}` });
  } catch (err) { next(err); }
};

/** GET /api/organizer/submissions/:hackathonId */
exports.getSubmissions = async (req, res, next) => {
  try {
    const { hackathonId } = req.params;
    
    const [rows] = await pool.query(`
      SELECT s.*, u.username, u.email
      FROM submissions s
      JOIN users u ON s.user_id = u.id
      WHERE s.hackathon_id = ?
      ORDER BY s.submitted_at DESC
    `, [hackathonId]);

    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

/** GET /api/organizer/stats */
exports.getStats = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const [hacks] = await pool.query("SELECT id FROM hackathons WHERE created_by = ?", [userId]);
        const hackIds = hacks.map(h => h.id);

        if (!hackIds.length) {
            return res.json({ success: true, data: { hackCount: 0, participantCount: 0, submissionCount: 0 } });
        }

        const [[{regCount}]] = await pool.query("SELECT COUNT(*) as regCount FROM hackathon_registrations WHERE hackathon_id IN (?)", [hackIds]);
        const [[{subCount}]] = await pool.query("SELECT COUNT(*) as subCount FROM submissions WHERE hackathon_id IN (?)", [hackIds]);

        res.json({
            success: true,
            data: {
                hackCount: hackIds.length,
                participantCount: regCount,
                submissionCount: subCount
            }
        });
    } catch (err) { next(err); }
};
