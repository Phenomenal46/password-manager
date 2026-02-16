import bcrypt from "bcrypt";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const MIN_PASSWORD_LENGTH = 8;
const TOKEN_EXPIRES_IN = "1h";
const COOKIE_MAX_AGE_MS = 60 * 60 * 1000;

function isValidEmail(email) {
    return EMAIL_REGEX.test(email);
}

function isValidPassword(password) {
    return password.length >= MIN_PASSWORD_LENGTH;
}

function getCookieOptions() {
    const isProduction = process.env.NODE_ENV === "production";
    return {
        httpOnly: true,
        sameSite: isProduction ? "none" : "lax",
        secure: isProduction,
        maxAge: COOKIE_MAX_AGE_MS,
    };
}

export const signup = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Basic validation so bad data never reaches the database.
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password required" });
        }
        if (!isValidEmail(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }
        if (!isValidPassword(password)) {
            return res.status(400).json({ message: "Password must be at least 8 characters" });
        }

        // Normalize email to avoid case/space duplicates.
        const normalizedEmail = email.trim().toLowerCase();

        // Check if user already exists
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(409).json({ message: "User already exists" });
        }

        // Hash password (master/login password)
        const passwordHash = await bcrypt.hash(password, 10);

        // Save user
        await User.create({
            email: normalizedEmail,
            passwordHash,
        });

        res.status(201).json({ message: "User created successfully" });
    } catch (err) {
        res.status(500).json({ message: "Signup failed" });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check input
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password required" });
        }
        if (!isValidEmail(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }
        if (!isValidPassword(password)) {
            return res.status(400).json({ message: "Invalid password" });
        }

        // Normalize email so login matches signup consistently.
        const normalizedEmail = email.trim().toLowerCase();

        // Find user
        const user = await User.findOne({ email: normalizedEmail });
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
        res.json({ message: "Login successful" });
    } catch (err) {
        res.status(500).json({ message: "Login failed" });
    }
};

export const logout = (req, res) => {
    // Clear cookie on logout so the browser forgets the session.
    res.clearCookie("token", { ...getCookieOptions(), maxAge: 0 });
    res.json({ message: "Logged out" });
};
