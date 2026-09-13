import mongoose from "mongoose";
import { ExceptionType, ExceptionStatus } from "../domain/LogisticsStatus.js";

const exceptionHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    note: { type: String, default: "" },
    updatedBy: { type: String, default: "SYSTEM" },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const logisticsExceptionSchema = new mongoose.Schema(
  {
    exceptionCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    shipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shipment",
      required: false,
      index: true,
    },
    trackingNumber: {
      type: String,
      default: "",
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    type: {
      type: String,
      enum: Object.values(ExceptionType),
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "MEDIUM",
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(ExceptionStatus),
      default: ExceptionStatus.DETECTED,
      index: true,
    },
    assignedTo: {
      type: String,
      default: "Triage Team",
    },
    reason: {
      type: String,
      required: true,
    },
    actionTaken: {
      type: String,
      default: "",
    },
    resolutionNotes: {
      type: String,
      default: "",
    },
    detectedAt: {
      type: Date,
      default: Date.now,
    },
    resolvedAt: {
      type: Date,
    },
    history: {
      type: [exceptionHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

logisticsExceptionSchema.index({ status: 1, priority: 1, type: 1 });

export const LogisticsException = mongoose.model(
  "LogisticsException",
  logisticsExceptionSchema
);
