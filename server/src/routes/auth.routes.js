import express from "express";
import rateLimit from "express-rate-limit";
import { signup, login, logout } from "../controllers/auth.controller.js";

const router = express.Router();

// Limit repeated auth attempts to slow down brute-force attacks.
const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 10,
	standardHeaders: true,
	legacyHeaders: false,
});

router.post("/signup", authLimiter, signup);
router.post("/login", authLimiter, login);
router.post("/logout", logout);

export default router;
