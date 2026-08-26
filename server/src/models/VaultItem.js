import mongoose from "mongoose";

const vaultItemSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        encryptedData: {
            type: String,
            required: true,
        },

        iv: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

vaultItemSchema.index({ userId: 1, _id: -1 });

export default mongoose.model("VaultItem", vaultItemSchema);
