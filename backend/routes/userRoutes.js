const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { protect } = require("../middleware/auth");

router.get("/me/registrations", protect, userController.getMyRegistrations);

module.exports = router;
