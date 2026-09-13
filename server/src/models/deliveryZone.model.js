import mongoose from "mongoose";

const deliveryZoneSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    zoneCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    pincodes: {
      type: [Number],
      default: [],
      index: true,
    },
    hub: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryHub",
      required: false,
    },
    serviceability: {
      type: Boolean,
      default: true,
    },
    standardSlaHours: {
      type: Number,
      default: 48,
    },
    expressSlaHours: {
      type: Number,
      default: 24,
    },
    sameDayAvailable: {
      type: Boolean,
      default: false,
    },
    deliveryFee: {
      type: Number,
      default: 49,
    },
    capacityLimit: {
      type: Number,
      default: 800,
    },
  },
  {
    timestamps: true,
  }
);

deliveryZoneSchema.index({ city: 1, serviceability: 1 });

export const DeliveryZone = mongoose.model("DeliveryZone", deliveryZoneSchema);
