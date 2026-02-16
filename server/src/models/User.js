import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }  // timestamps → auto adds createdAt, updatedAt
);

export default mongoose.model("User", userSchema);
