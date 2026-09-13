import mongoose from "mongoose";
import { DeliveryAgent } from "../models/deliveryAgent.model.js";
import jwtProvider from "../utils/jwtProvider.js";

const deliveryPartnerAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication token missing or invalid",
        error: true,
        success: false,
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        message: "Token missing, Authorization Failed!",
        error: true,
        success: false,
      });
    }

    let payload;
    try {
      payload = jwtProvider.verifyJwt(token);
    } catch {
      return res.status(401).json({
        message: "Invalid or expired session token",
        error: true,
        success: false,
      });
    }

    const agentIdentifier = payload.agentId || payload.id || payload.email;
    if (!agentIdentifier) {
      return res.status(401).json({
        message: "Invalid token claims",
        error: true,
        success: false,
      });
    }

    const conditions = [];
    if (payload.agentId) {
      conditions.push({ agentId: String(payload.agentId).toUpperCase() });
    }
    if (payload.email) {
      conditions.push({ email: String(payload.email).toLowerCase() });
    }
    if (payload.id) {
      if (mongoose.Types.ObjectId.isValid(payload.id) && String(new mongoose.Types.ObjectId(payload.id)) === String(payload.id)) {
        conditions.push({ _id: payload.id });
      } else {
        conditions.push({ agentId: String(payload.id).toUpperCase() });
      }
    }

    if (conditions.length === 0) {
      return res.status(401).json({
        message: "Invalid token claims",
        error: true,
        success: false,
      });
    }

    const agent = await DeliveryAgent.findOne({ $or: conditions }).populate("assignedHub", "hubCode name city");

    if (!agent) {
      return res.status(401).json({
        message: "Delivery partner account not found",
        error: true,
        success: false,
      });
    }

    if (agent.accountStatus === "SUSPENDED" || agent.accountStatus === "DEACTIVATED") {
      return res.status(403).json({
        message: `Account is ${agent.accountStatus}. Please contact operations support.`,
        error: true,
        success: false,
      });
    }

    req.agent = agent;
    next();
  } catch (error) {
    return res.status(401).json({
      message: error.message || "Delivery partner authentication failed",
      error: true,
      success: false,
    });
  }
};

export default deliveryPartnerAuthMiddleware;
