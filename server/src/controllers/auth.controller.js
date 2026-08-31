import bcrypt from "bcrypt";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

const TOKEN_EXPIRES_IN = "1h";
const COOKIE_MAX_AGE_MS = 60 * 60 * 1000;

function getCookieOptions() {
    const isProduction = process.env.NODE_ENV === "production";
    return {
        httpOnly: true,
        sameSite: isProduction ? "none" : "lax",
        secure: isProduction,
        maxAge: COOKIE_MAX_AGE_MS,
    };
}

export const signup = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            return res.status(409).json({ message: "User already exists" });
        }

        // Hash password (master/login password)
        const passwordHash = await bcrypt.hash(password, 10);

        // Save user
        await User.create({
            email: email,
            passwordHash,
        });

        res.status(201).json({ message: "User created successfully" });
    } catch (error) {
        next(error); // Pass error to centralized error handler
    }
};

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Compare password with hash
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Generate JWT and store it in an httpOnly cookie.
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: TOKEN_EXPIRES_IN }
        );

        res.cookie("token", token, getCookieOptions());
        // Return token as fallback for environments blocking third-party cookies.
        res.json({ message: "Login successful", token });
    } catch (error) {
        next(error); // Pass error to centralized error handler
    }
};

export const logout = (req, res) => {
    // Clear cookie on logout so the browser forgets the session.
    res.clearCookie("token", { ...getCookieOptions(), maxAge: 0 });
    res.json({ message: "Logged out" });
};
