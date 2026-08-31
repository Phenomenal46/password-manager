import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";


import authRoutes from "./routes/auth.routes.js";
import vaultRoutes from "./routes/vault.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";

const app = express();
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

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

app.use(errorHandler);

export default app;