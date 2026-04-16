/* ──────────────────────────────────────────────────────────────
   Saved Hackathons Controller
   ────────────────────────────────────────────────────────────── */
const SavedHackathon = require("../models/SavedHackathon");
const Hackathon      = require("../models/Hackathon");

/** GET /api/saved  — user's bookmarks */
exports.getSaved = async (req, res, next) => {
  try {
    const saved = await SavedHackathon.findByUser(req.user.id);
    res.json({ success: true, count: saved.length, data: saved });
  } catch (err) { next(err); }
};

/** POST /api/saved/:hackathonId  — toggle bookmark */
exports.toggleSave = async (req, res, next) => {
  try {
    const { hackathonId } = req.params;
    const hack = await Hackathon.findById(hackathonId);
    if (!hack) return res.status(404).json({ success: false, message: "Hackathon not found" });

    const already = await SavedHackathon.isSaved(req.user.id, hackathonId);
    if (already) {
      await SavedHackathon.remove(req.user.id, hackathonId);
      return res.json({ success: true, saved: false, message: "Removed from saved" });
    }

    await SavedHackathon.save(req.user.id, hackathonId);
    res.json({ success: true, saved: true, message: "Hackathon saved" });
  } catch (err) { next(err); }
};

/** GET /api/saved/:hackathonId/status */
exports.checkSaved = async (req, res, next) => {
  try {
    const saved = await SavedHackathon.isSaved(req.user.id, req.params.hackathonId);
    res.json({ success: true, saved });
  } catch (err) { next(err); }
};
