import VaultItem from "../models/VaultItem.js";

/**
 * GET a page of encrypted vault items for the logged-in user
 * - Supports cursor-based pagination via ?cursor and ?limit query params
 * - Queries the database for items belonging to this user, newest first
 * - Returns { items, nextCursor } — nextCursor is null when there are no more pages
 * - Returns only {encryptedData, iv} per item (no decryption happens on the server!)
 * - Client decrypts using the master password derived from login
 */
export const getVaultItems = async (req, res) => {
    try {
        const limit = req.query.limit;
        const cursor = req.query.cursor;

        const filter = { userId: req.userId };

        if (cursor) {
            filter._id = { $lt: cursor };
        }

        const items = await VaultItem.find(
            filter,
            "encryptedData iv"
        )
            .sort({ _id: -1 })
            .limit(limit + 1)
            .lean();

        const hasMore = items.length > limit;
        const page = hasMore ? items.slice(0, limit) : items;

        res.json({
            items: page,
            nextCursor: hasMore
                ? page[page.length - 1]._id
                : null
        });

    } catch (error) {
        next(error); // Pass error to centralized error handler
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

        // Store the encrypted blob tied to the authenticated user.
        const vaultItem = await VaultItem.create({
            userId: req.userId,
            encryptedData,
            iv,
        });

        // Return the new id so the client can update its list.
        res.status(201).json({ id: vaultItem._id });
    } catch (error) {
        next(error); // Pass error to centralized error handler
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
    } catch (error) {
        next(error); // Pass error to centralized error handler
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
    } catch (error) {
        next(error); // Pass error to centralized error handler
    }
};
