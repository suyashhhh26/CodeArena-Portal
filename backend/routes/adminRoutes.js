/* ──────────────────────────────────────────────────────────────
   Admin Routes  /api/admin
   ────────────────────────────────────────────────────────────── */
const express = require("express");
const router  = express.Router();
const { protect, authorise } = require("../middleware/auth");
const ctrl = require("../controllers/adminController");

router.use(protect, authorise("admin")); // all admin routes protected

router.get("/dashboard",   ctrl.getDashboard);
router.get("/users",       ctrl.getAllUsers);
router.get("/hackathons",  ctrl.getAllHackathons);
router.get("/organizers",  ctrl.getAllOrganizers);
router.post("/organizers/:id/verify", ctrl.verifyOrganizer);

module.exports = router;
