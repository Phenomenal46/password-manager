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

// Skip rate limiting during tests
const testAwareAuthLimiter = (req, res, next) => {
    if (process.env.NODE_ENV === "test") {
        return next();
    }

    return authLimiter(req, res, next);
};

router.post("/signup", testAwareAuthLimiter, signup);
router.post("/login", testAwareAuthLimiter, login);
router.post("/logout", logout);

export default router;