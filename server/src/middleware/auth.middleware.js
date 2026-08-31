/**
 * Authentication Middleware
 * 
 * This file checks if incoming requests have a valid login token (JWT).
 * If the token is valid, it extracts the user ID and allows the request to proceed.
 * If the token is missing or invalid, it rejects the request with a 401 error.
 * Used to protect routes that require users to be logged in.
 */

import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const tokenFromCookie = req.cookies?.token;

    // Prefer httpOnly cookie, fall back to Authorization header.
    let token = tokenFromCookie;
    if (!token && authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
    }

    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (err) {
        res.status(401).json({ message: "Invalid token" });
    }
};
