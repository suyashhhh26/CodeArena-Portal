const express = require("express");
const router = express.Router();
const { getRecommendation, syncExternalHackathons } = require("../controllers/aiController");
const { protect, authorise } = require("../middleware/auth");

// Path: POST /api/ai/chat
router.post("/chat", getRecommendation);

// Path: POST /api/ai/sync-external
router.post("/sync-external", protect, authorise("admin"), syncExternalHackathons);

module.exports = router;
