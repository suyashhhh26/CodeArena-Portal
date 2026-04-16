/* ──────────────────────────────────────────────────────────────
   Saved Hackathon Routes  /api/saved
   ────────────────────────────────────────────────────────────── */
const express = require("express");
const router  = express.Router();
const { protect } = require("../middleware/auth");
const ctrl = require("../controllers/savedController");

router.use(protect); // all saved routes require auth

router.get("/",                           ctrl.getSaved);
router.post("/:hackathonId",              ctrl.toggleSave);
router.get("/:hackathonId/status",        ctrl.checkSaved);

module.exports = router;
