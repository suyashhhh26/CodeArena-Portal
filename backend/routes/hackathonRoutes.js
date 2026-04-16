/* ──────────────────────────────────────────────────────────────
   Hackathon Routes  /api/hackathons
   ────────────────────────────────────────────────────────────── */
const express = require("express");
const router  = express.Router();
const { protect, authorise } = require("../middleware/auth");
const ctrl = require("../controllers/hackathonController");

router.get("/",     ctrl.getAllHackathons);
router.get("/:id",  ctrl.getHackathon);
router.post("/",    protect, authorise("admin", "organizer"), ctrl.createHackathon);
router.put("/:id",  protect, authorise("admin", "organizer"), ctrl.updateHackathon);
router.delete("/:id", protect, authorise("admin", "organizer"), ctrl.deleteHackathon);

// Unstop-like Features
router.post("/:id/register", protect, ctrl.registerForHackathon);
router.post("/:id/submit",   protect, ctrl.submitProject);
router.get("/:id/submissions", protect, ctrl.getHackathonSubmissions);

// Admin Action: Score Submission
router.put("/:id/submissions/:subId/score", protect, authorise("admin"), ctrl.scoreSubmission);

module.exports = router;
