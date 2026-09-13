import mongoose from "mongoose";

const shipmentEventSchema = new mongoose.Schema(
  {
    shipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shipment",
      required: true,
      index: true,
    },
    trackingNumber: {
      type: String,
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      required: true,
    },
    hub: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryHub",
      required: false,
    },
    hubName: {
      type: String,
      default: "",
    },
    location: {
      name: { type: String, default: "" },
      city: { type: String, default: "" },
      lat: { type: Number },
      lng: { type: Number },
    },
    operator: {
      id: { type: String, default: "SYS" },
      name: { type: String, default: "System" },
      role: { type: String, default: "SYSTEM" },
    },
    source: {
      type: String,
      enum: ["SYSTEM", "HUB_SCANNER", "AGENT_APP", "OPERATIONS_CONSOLE", "CARRIER_SYNC"],
      default: "SYSTEM",
    },
    note: {
      type: String,
      default: "",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

shipmentEventSchema.index({ shipment: 1, timestamp: -1 });

export const ShipmentEvent = mongoose.model("ShipmentEvent", shipmentEventSchema);
