/* ──────────────────────────────────────────────────────────────
   Organizer Routes /api/organizer
   ────────────────────────────────────────────────────────────── */
const express = require("express");
const router  = express.Router();
const { protect, authorise } = require("../middleware/auth");
const ctrl = require("../controllers/organizerController");

router.use(protect, authorise("organizer", "admin"));

router.get("/stats",                     ctrl.getStats);
router.get("/registrations/:hackathonId", ctrl.getRegistrations);
router.patch("/registrations/:regId",     ctrl.updateRegistrationStatus);
router.get("/submissions/:hackathonId",   ctrl.getSubmissions);

module.exports = router;
