import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import vaultRoutes from "./routes/vault.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

// Fail fast if required configuration is missing.
if (!process.env.MONGO_URI) {
    console.error("Missing MONGO_URI in environment");
    process.exit(1);
}
if (!process.env.JWT_SECRET) {
    console.error("Missing JWT_SECRET in environment");
    process.exit(1);
}

// Needed so secure cookies work behind proxies in production.
app.set("trust proxy", 1);

// Allow the frontend to send cookies with requests.
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(cookieParser());
app.use(express.json());

// Simple health endpoint for deploy checks.
app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/vault", vaultRoutes);

// Start the server only after MongoDB is ready.
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected");
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("MongoDB connection failed", err);
        process.exit(1);
    });
