import mongoose from "mongoose";
import { ManifestType, ManifestStatus } from "../domain/LogisticsStatus.js";

const manifestSchema = new mongoose.Schema(
  {
    manifestNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(ManifestType),
      default: ManifestType.INBOUND,
      index: true,
    },
    originHub: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryHub",
      required: true,
    },
    destinationHub: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryHub",
      required: true,
    },
    vehiclePlate: {
      type: String,
      default: "",
      trim: true,
    },
    driverName: {
      type: String,
      default: "",
      trim: true,
    },
    driverPhone: {
      type: String,
      default: "",
    },
    shipments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Shipment",
      },
    ],
    scannedShipments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Shipment",
      },
    ],
    totalShipmentsCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: Object.values(ManifestStatus),
      default: ManifestStatus.OPEN,
      index: true,
    },
    sealNumber: {
      type: String,
      default: "",
    },
    sealedAt: {
      type: Date,
    },
    dispatchedAt: {
      type: Date,
    },
    receivedAt: {
      type: Date,
    },
    receivedBy: {
      type: String,
      default: "",
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

manifestSchema.index({ status: 1, originHub: 1, destinationHub: 1 });

export const Manifest = mongoose.model("Manifest", manifestSchema);
