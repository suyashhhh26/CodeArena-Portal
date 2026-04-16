/* ──────────────────────────────────────────────────────────────
   Team Routes  /api/teams
   ────────────────────────────────────────────────────────────── */
const express = require("express");
const router  = express.Router();
const { protect } = require("../middleware/auth");
const ctrl = require("../controllers/teamController");

// Public
router.get("/",         ctrl.getAllPosts);
router.get("/:id",      ctrl.getPost);

// Protected
router.post("/",                        protect, ctrl.createPost);
router.delete("/:id",                   protect, ctrl.deletePost);
router.post("/:id/request",             protect, ctrl.requestToJoin);
router.patch("/requests/:requestId",    protect, ctrl.respondToRequest);
router.get("/user/my-posts",            protect, ctrl.getMyPosts);
router.get("/user/my-requests",         protect, ctrl.getMyRequests);

module.exports = router;
