/* ──────────────────────────────────────────────────────────────
   Hackathon Controller
   ────────────────────────────────────────────────────────────── */
const Hackathon = require("../models/Hackathon");
const { pool } = require("../config/db");

/** GET /api/hackathons */
exports.getAllHackathons = async (req, res, next) => {
  try {
    const { mode, difficulty, theme, status, featured, search, minPrize, creator } = req.query;
    const filters = {};
    if (mode)       filters.mode       = mode;
    if (difficulty) filters.difficulty = difficulty;
    if (theme)      filters.theme      = theme;
    if (status)     filters.status     = status;
    if (featured !== undefined) filters.featured = featured === "true" ? 1 : 0;
    if (search)     filters.search     = search;
    if (minPrize)   filters.minPrize   = parseInt(minPrize);
    if (creator)    filters.created_by = creator;

    const hackathons = await Hackathon.findAll(filters);
    res.json({ success: true, count: hackathons.length, data: hackathons });
  } catch (err) { next(err); }
};

/** GET /api/hackathons/:id */
exports.getHackathon = async (req, res, next) => {
  try {
    const hack = await Hackathon.findById(req.params.id);
    if (!hack) return res.status(404).json({ success: false, message: "Hackathon not found" });
    res.json({ success: true, data: hack });
  } catch (err) { next(err); }
};

/** POST /api/hackathons  — admin only */
exports.createHackathon = async (req, res, next) => {
  try {
    const result = await Hackathon.create({ ...req.body, created_by: req.user.id });
    const created = await Hackathon.findById(result.insertId);
    res.status(201).json({ success: true, data: created });
  } catch (err) { next(err); }
};

/** PUT /api/hackathons/:id  — admin only */
exports.updateHackathon = async (req, res, next) => {
  try {
    const hack = await Hackathon.findById(req.params.id);
    if (!hack) return res.status(404).json({ success: false, message: "Hackathon not found" });

    // Authorization: Must be admin OR the creator
    if (req.user.role !== 'admin' && hack.created_by !== req.user.id) {
       return res.status(403).json({ success: false, message: "Not authorized to update this event" });
    }

    const allowed = [
      "title","organizer","description","theme","mode","difficulty",
      "prize_pool","prize_amount","registration_link","banner_url",
      "eligibility","rules","max_team_size","min_team_size","location",
      "registration_start","registration_end","hackathon_start","hackathon_end",
      "tags","status","featured"
    ];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    await Hackathon.update(req.params.id, updates);
    const updated = await Hackathon.findById(req.params.id);
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
};

/** DELETE /api/hackathons/:id  — admin only */
exports.deleteHackathon = async (req, res, next) => {
  try {
    const hack = await Hackathon.findById(req.params.id);
    if (!hack) return res.status(404).json({ success: false, message: "Hackathon not found" });

    // Authorization: Must be admin OR the creator
    if (req.user.role !== 'admin' && hack.created_by !== req.user.id) {
       return res.status(403).json({ success: false, message: "Not authorized to delete this event" });
    }

    await Hackathon.delete(req.params.id);
    res.json({ success: true, message: "Hackathon deleted" });
  } catch (err) { next(err); }
};

/** POST /api/hackathons/:id/register */
exports.registerForHackathon = async (req, res, next) => {
  try {
    const hackathonId = req.params.id;
    const userId = req.user.id;

    const [existing] = await pool.query(
      "SELECT id FROM hackathon_registrations WHERE hackathon_id = ? AND user_id = ?",
      [hackathonId, userId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: "Already registered for this hackathon" });
    }

    await pool.query(
      "INSERT INTO hackathon_registrations (hackathon_id, user_id, status) VALUES (?, ?, 'registered')",
      [hackathonId, userId]
    );

    res.status(201).json({ success: true, message: "Successfully registered" });
  } catch (err) { next(err); }
};

/** POST /api/hackathons/:id/submit */
exports.submitProject = async (req, res, next) => {
  try {
    const hackathonId = req.params.id;
    const userId = req.user.id;
    const { project_title, repo_url, demo_url, description } = req.body;

    const [reg] = await pool.query(
      "SELECT id FROM hackathon_registrations WHERE hackathon_id = ? AND user_id = ?",
      [hackathonId, userId]
    );

    if (reg.length === 0) {
      return res.status(403).json({ success: false, message: "You must register for the hackathon before submitting" });
    }

    const [sub] = await pool.query(
      "SELECT id FROM submissions WHERE hackathon_id = ? AND user_id = ?",
      [hackathonId, userId]
    );

    if (sub.length > 0) {
      await pool.query(
        "UPDATE submissions SET project_title=?, repo_url=?, demo_url=?, description=?, submitted_at=CURRENT_TIMESTAMP WHERE id=?",
        [project_title || null, repo_url || null, demo_url || null, description || null, sub[0].id]
      );
      return res.json({ success: true, message: "Submission updated successfully" });
    } else {
      await pool.query(
        "INSERT INTO submissions (hackathon_id, user_id, project_title, repo_url, demo_url, description) VALUES (?, ?, ?, ?, ?, ?)",
        [hackathonId, userId, project_title || null, repo_url || null, demo_url || null, description || null]
      );
      return res.status(201).json({ success: true, message: "Project submitted successfully" });
    }
  } catch (err) { next(err); }
};

/** GET /api/hackathons/:id/submissions */
exports.getHackathonSubmissions = async (req, res, next) => {
  try {
    const hackathonId = req.params.id;
    const [submissions] = await pool.query(
      `SELECT s.*, u.username, u.avatar_url 
       FROM submissions s
       JOIN users u ON s.user_id = u.id
       WHERE s.hackathon_id = ?
       ORDER BY s.submitted_at DESC`,
      [hackathonId]
    );
    res.json({ success: true, data: submissions });
  } catch (err) { next(err); }
};

/** PUT /api/hackathons/:id/submissions/:subId/score  — admin only */
exports.scoreSubmission = async (req, res, next) => {
  try {
    const { subId } = req.params;
    const { score, feedback } = req.body;

    const [result] = await pool.query(
      "UPDATE submissions SET score = ?, feedback = ? WHERE id = ?",
      [score || 0, feedback || null, subId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Submission not found" });
    }

    res.json({ success: true, message: "Score updated successfully" });
  } catch (err) { next(err); }
};
