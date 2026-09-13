import mongoose from "mongoose";

const routeStopSchema = new mongoose.Schema(
  {
    stopIndex: {
      type: Number,
      required: true,
    },
    shipmentId: {
      type: String,
      required: true,
    },
    trackingNumber: {
      type: String,
      default: "",
    },
    customerName: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      required: true,
    },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    eta: {
      type: Date,
    },
    timeWindow: {
      from: { type: String, default: "09:00" },
      to: { type: String, default: "13:00" },
    },
    status: {
      type: String,
      enum: ["PENDING", "EN_ROUTE", "ARRIVED", "DELIVERED", "FAILED"],
      default: "PENDING",
    },
    failureReason: {
      type: String,
      default: "",
    },
    completedAt: {
      type: Date,
    },
    shipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shipment",
    },
    customerPhone: {
      type: String,
      default: "",
    },
    customerInstructions: {
      type: String,
      default: "",
    },
    preferredDropLocation: {
      type: String,
      default: "",
    },
    packagesCount: {
      type: Number,
      default: 1,
    },
    isPackageScanned: {
      type: Boolean,
      default: false,
    },
    scannedBarcode: {
      type: String,
      default: "",
    },
    scannedAt: {
      type: Date,
    },
    paymentType: {
      type: String,
      enum: ["COD", "PREPAID"],
      default: "PREPAID",
    },
    codAmount: {
      type: Number,
      default: 0,
    },
    codCollected: {
      type: Boolean,
      default: false,
    },
    codCollectedAmount: {
      type: Number,
      default: 0,
    },
    otpRequired: {
      type: Boolean,
      default: true,
    },
    otp: {
      type: String,
      default: "4826",
    },
    otpVerified: {
      type: Boolean,
      default: false,
    },
    otpAttemptCount: {
      type: Number,
      default: 0,
    },
    idempotencyKey: {
      type: String,
      default: "",
    },
  },
  { _id: true }
);

const deliveryRouteSchema = new mongoose.Schema(
  {
    routeCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryAgent",
      required: true,
      index: true,
    },
    hub: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryHub",
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["PLANNED", "ACTIVE", "COMPLETED", "CANCELLED"],
      default: "PLANNED",
      index: true,
    },
    stops: {
      type: [routeStopSchema],
      default: [],
    },
    totalStops: {
      type: Number,
      default: 0,
    },
    completedStops: {
      type: Number,
      default: 0,
    },
    totalDistanceKm: {
      type: Number,
      default: 0,
    },
    estimatedDurationMinutes: {
      type: Number,
      default: 0,
    },
    startedAt: {
      type: Date,
    },
    endedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const DeliveryRoute = mongoose.model("DeliveryRoute", deliveryRouteSchema);
