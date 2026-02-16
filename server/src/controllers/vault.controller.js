import VaultItem from "../models/VaultItem.js";

/**
 * GET all encrypted vault items for the logged-in user
 * - Queries database for all items belonging to this user
 * - Returns array of {encryptedData, iv} (no decryption on server!)
 * - Client decrypts using the master password derived from login
 */
export const getVaultItems = async (req, res) => {
    try {
        // req.userId comes from authMiddleware (extracted from JWT token)
        // Return only what the client needs (encrypted payload + id for delete).
        const items = await VaultItem.find(
            { userId: req.userId },
            "encryptedData iv"
        );

        // Return the encrypted items (with their IVs needed for decryption)
        res.json(items);
    } catch (err) {
        // Generic error to avoid leaking internal details
        res.status(500).json({ message: "Failed to fetch vault items" });
    }
};

/**
 * POST a new encrypted password to the vault
 * - Client sends encrypted data and IV (server never sees plaintext)
 * - Server validates the payload and stores it for the authenticated user
 * - Tied to user via userId extracted from JWT token
 */
export const addVaultItem = async (req, res) => {
    try {
        // Expect client-side encrypted payload and IV only; server never sees plaintext.
        const { encryptedData, iv } = req.body;

        // Basic validation to avoid storing empty secrets.
        if (!encryptedData || !iv) {
            return res.status(400).json({ message: "Encrypted data required" });
        }

        // Store the encrypted blob tied to the authenticated user.
        const vaultItem = await VaultItem.create({
            userId: req.userId,
            encryptedData,
            iv,
        });

        // Return the new id so the client can update its list.
        res.status(201).json({ id: vaultItem._id });
    } catch (err) {
        // Generic error avoids leaking internal details.
        res.status(500).json({ message: "Failed to add vault item" });
    }
};

/**
 * DELETE a vault item by id
 * - Only deletes if the item belongs to the authenticated user
 */
export const deleteVaultItem = async (req, res) => {
    try {
        const { id } = req.params;

        const deleted = await VaultItem.findOneAndDelete({
            _id: id,
            userId: req.userId,
        });

        if (!deleted) {
            return res.status(404).json({ message: "Vault item not found" });
        }

        res.json({ message: "Vault item deleted" });
    } catch (err) {
        res.status(500).json({ message: "Failed to delete vault item" });
    }
};

/**
 * PUT update an existing vault item
 * - Client sends encrypted data and IV (server never sees plaintext)
 * - Only updates if the item belongs to the authenticated user
 */
export const updateVaultItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { encryptedData, iv } = req.body;

        // Basic validation
        if (!encryptedData || !iv) {
            return res.status(400).json({ message: "Encrypted data required" });
        }

        // Update only if user owns this item
        const updated = await VaultItem.findOneAndUpdate(
            { _id: id, userId: req.userId },
            { encryptedData, iv },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ message: "Vault item not found" });
        }

        res.json({ message: "Vault item updated" });
    } catch (err) {
        res.status(500).json({ message: "Failed to update vault item" });
    }
};
