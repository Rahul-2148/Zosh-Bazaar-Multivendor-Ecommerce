import mongoose from "mongoose";

const userSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    deviceType: {
      type: String,
      enum: ["desktop", "mobile", "tablet", "unknown"],
      default: "desktop",
    },
    deviceName: {
      type: String,
      default: "Personal Computer",
    },
    browser: {
      type: String,
      default: "Chrome",
    },
    os: {
      type: String,
      default: "Windows",
    },
    ipAddress: {
      type: String,
      default: "127.0.0.1",
    },
    location: {
      type: String,
      default: "India",
    },
    userAgent: {
      type: String,
      default: "",
    },
    lastActive: {
      type: Date,
      default: Date.now,
      index: true,
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const UserSession = mongoose.model("UserSession", userSessionSchema);
export default UserSession;
