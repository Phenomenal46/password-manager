import express from "express";
import { addVaultItem, getVaultItems, deleteVaultItem, updateVaultItem } from "../controllers/vault.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

// GET /api/vault - Fetch all encrypted vault items for logged-in user
router.get("/", authMiddleware, getVaultItems);

// POST /api/vault - Add a new encrypted item to vault
router.post("/", authMiddleware, addVaultItem);

// PUT /api/vault/:id - Update a vault item by id
router.put("/:id", authMiddleware, updateVaultItem);

// DELETE /api/vault/:id - Delete a vault item by id
router.delete("/:id", authMiddleware, deleteVaultItem);

export default router;
