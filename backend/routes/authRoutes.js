const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 10,
	standardHeaders: true,
	legacyHeaders: false,
	message: { success: false, message: "Too many login attempts. Please try again later." }
});

const registerLimiter = rateLimit({
	windowMs: 60 * 60 * 1000,
	limit: 5,
	standardHeaders: true,
	legacyHeaders: false,
	message: { success: false, message: "Too many registration attempts. Please try again later." }
});

router.post("/login", loginLimiter, authController.login);
router.post("/register", registerLimiter, authController.register);

module.exports = router;
