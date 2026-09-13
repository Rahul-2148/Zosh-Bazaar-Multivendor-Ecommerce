import mongoose from "mongoose";
import { AgentStatus } from "../domain/LogisticsStatus.js";

const deliveryAgentSchema = new mongoose.Schema(
  {
    agentId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    status: {
      type: String,
      enum: Object.values(AgentStatus),
      default: AgentStatus.AVAILABLE,
      index: true,
    },
    assignedHub: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryHub",
      required: false,
      index: true,
    },
    currentZone: {
      type: String,
      default: "Central",
    },
    vehicle: {
      vehicleType: {
        type: String,
        enum: ["BIKE", "ELECTRIC_SCOOTER", "VAN", "MINI_TRUCK"],
        default: "BIKE",
      },
      plateNumber: {
        type: String,
        default: "",
        trim: true,
      },
      capacityKg: {
        type: Number,
        default: 30,
      },
      batteryLevel: {
        type: Number,
        default: 100,
      },
    },
    currentLocation: {
      lat: { type: Number, default: 12.9716 },
      lng: { type: Number, default: 77.5946 },
      lastPingAt: { type: Date, default: Date.now },
    },
    activeShipmentsCount: {
      type: Number,
      default: 0,
    },
    todayStats: {
      assigned: { type: Number, default: 0 },
      completed: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
    },
    rating: {
      type: Number,
      default: 4.8,
    },
    password: {
      type: String,
      default: "",
    },
    loginOtp: {
      code: { type: String, default: "" },
      expiresAt: { type: Date },
    },
    accountStatus: {
      type: String,
      enum: ["ACTIVE", "ON_HOLD", "SUSPENDED", "PENDING_VERIFICATION"],
      default: "ACTIVE",
      index: true,
    },
    shift: {
      isShiftActive: { type: Boolean, default: false },
      shiftStartedAt: { type: Date },
      shiftEndedAt: { type: Date },
      onBreak: { type: Boolean, default: false },
    },
    earnings: {
      todayBasePay: { type: Number, default: 0 },
      todayIncentives: { type: Number, default: 0 },
      todayDistancePay: { type: Number, default: 0 },
      todayDeductions: { type: Number, default: 0 },
      totalSettled: { type: Number, default: 0 },
      pendingSettlement: { type: Number, default: 0 },
      history: [
        {
          date: { type: Date, default: Date.now },
          amount: { type: Number, required: true },
          type: {
            type: String,
            enum: ["BASE_PAY", "INCENTIVE", "BONUS", "DEDUCTION"],
            default: "BASE_PAY",
          },
          description: { type: String, default: "" },
          shipmentId: { type: String, default: "" },
          stopIndex: { type: Number },
        },
      ],
    },
    activeRoute: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryRoute",
    },
  },
  {
    timestamps: true,
  }
);

deliveryAgentSchema.index({ status: 1, assignedHub: 1 });

export const DeliveryAgent = mongoose.model("DeliveryAgent", deliveryAgentSchema);
