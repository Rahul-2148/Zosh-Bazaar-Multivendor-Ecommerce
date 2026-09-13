import mongoose from "mongoose";
import { HubType, HubStatus } from "../domain/LogisticsStatus.js";

const deliveryHubSchema = new mongoose.Schema(
  {
    hubCode: {
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
    type: {
      type: String,
      enum: Object.values(HubType),
      default: HubType.LAST_MILE_HUB,
    },
    city: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    pincodesCovered: {
      type: [Number],
      default: [],
    },
    address: {
      type: String,
      default: "",
    },
    location: {
      lat: { type: Number, default: 12.9716 },
      lng: { type: Number, default: 77.5946 },
    },
    capacityDaily: {
      type: Number,
      default: 5000,
    },
    currentBacklog: {
      type: Number,
      default: 0,
    },
    activeStaff: {
      type: Number,
      default: 12,
    },
    status: {
      type: String,
      enum: Object.values(HubStatus),
      default: HubStatus.ACTIVE,
      index: true,
    },
    contactPhone: {
      type: String,
      default: "",
    },
    manager: {
      name: { type: String, default: "" },
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
    },
  },
  {
    timestamps: true,
  }
);

deliveryHubSchema.index({ city: 1, status: 1 });

export const DeliveryHub = mongoose.model("DeliveryHub", deliveryHubSchema);
