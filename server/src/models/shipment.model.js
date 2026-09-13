import mongoose from "mongoose";
import {
  ShipmentStatus,
  ServiceLevel,
  ShipmentPriority,
  SlaStatus,
} from "../domain/LogisticsStatus.js";

const shipmentItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    sku: {
      type: String,
      default: "",
    },
    title: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    sellingPrice: {
      type: Number,
      required: true,
    },
    image: {
      type: String,
      default: "",
    },
  },
  { _id: true }
);

const statusStepSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      default: "",
    },
    updatedBy: {
      type: String,
      default: "SYSTEM",
    },
    location: {
      type: String,
      default: "",
    },
    hubName: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const deliveryAttemptSchema = new mongoose.Schema(
  {
    attemptNumber: {
      type: Number,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryAgent",
    },
    agentName: {
      type: String,
      default: "",
    },
    reasonCode: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
      default: "",
    },
    nextAttemptScheduledAt: {
      type: Date,
    },
  },
  { _id: true }
);

const proofOfDeliverySchema = new mongoose.Schema(
  {
    deliveredAt: {
      type: Date,
    },
    recipientName: {
      type: String,
      default: "",
    },
    relationshipToCustomer: {
      type: String,
      default: "SELF",
    },
    signatureUrl: {
      type: String,
      default: "",
    },
    photoUrl: {
      type: String,
      default: "",
    },
    otpVerified: {
      type: Boolean,
      default: false,
    },
    location: {
      lat: { type: Number },
      lng: { type: Number },
      accuracyMeters: { type: Number, default: 5 },
    },
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryAgent",
    },
  },
  { _id: false }
);

const shipmentSchema = new mongoose.Schema(
  {
    shipmentId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    trackingNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    orderItemId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "OrderItem",
      },
    ],
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    items: {
      type: [shipmentItemSchema],
      default: [],
    },
    pickupAddress: {
      storeName: { type: String, default: "" },
      address: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      pincode: { type: Number, default: 560001 },
      contactPhone: { type: String, default: "" },
      lat: { type: Number, default: 12.9716 },
      lng: { type: Number, default: 77.5946 },
    },
    deliveryAddress: {
      name: { type: String, required: true },
      mobile: { type: String, required: true },
      address: { type: String, required: true },
      locality: { type: String, default: "" },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: Number, required: true, index: true },
      lat: { type: Number, default: 12.9716 },
      lng: { type: Number, default: 77.5946 },
      resolutionStatus: {
        type: String,
        enum: ["UNRESOLVED", "RESOLVED", "LOW_CONFIDENCE", "INVALID"],
        default: "RESOLVED",
      },
      confidenceScore: {
        type: Number,
        default: 0.95,
      },
      normalizedAddress: {
        type: String,
        default: "",
      },
    },
    originHub: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryHub",
    },
    destinationHub: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryHub",
    },
    currentHub: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryHub",
      index: true,
    },
    serviceLevel: {
      type: String,
      enum: Object.values(ServiceLevel),
      default: ServiceLevel.STANDARD,
      index: true,
    },
    priority: {
      type: String,
      enum: Object.values(ShipmentPriority),
      default: ShipmentPriority.NORMAL,
      index: true,
    },
    packageDetails: {
      packageType: {
        type: String,
        enum: ["BOX", "FLYER", "PALLET"],
        default: "BOX",
      },
      weightKg: {
        type: Number,
        default: 0.8,
      },
      dimensionsCm: {
        length: { type: Number, default: 25 },
        width: { type: Number, default: 18 },
        height: { type: Number, default: 10 },
      },
      volumetricWeightKg: {
        type: Number,
        default: 0.9,
      },
      itemsCount: {
        type: Number,
        default: 1,
      },
    },
    status: {
      type: String,
      enum: Object.values(ShipmentStatus),
      default: ShipmentStatus.CREATED,
      index: true,
    },
    statusHistory: {
      type: [statusStepSchema],
      default: () => [
        {
          status: ShipmentStatus.CREATED,
          timestamp: new Date(),
          note: "Shipment record created in logistics system",
          updatedBy: "SYSTEM",
        },
      ],
    },
    sla: {
      promisedFrom: {
        type: Date,
        default: () => new Date(),
      },
      promisedTo: {
        type: Date,
        default: () => new Date(Date.now() + 48 * 60 * 60 * 1000),
      },
      actualDeliveredAt: {
        type: Date,
      },
      slaStatus: {
        type: String,
        enum: Object.values(SlaStatus),
        default: SlaStatus.ON_TRACK,
        index: true,
      },
    },
    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryAgent",
      index: true,
    },
    assignedVehicle: {
      plateNumber: { type: String, default: "" },
      vehicleType: { type: String, default: "" },
    },
    currentRoute: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryRoute",
    },
    estimatedDelivery: {
      type: Date,
    },
    deliveryAttempts: {
      type: [deliveryAttemptSchema],
      default: [],
    },
    proofOfDelivery: {
      type: proofOfDeliverySchema,
      default: () => ({}),
    },
    exceptionsCount: {
      type: Number,
      default: 0,
    },
    shippingFee: {
      type: Number,
      default: 49,
    },
    carrier: {
      name: { type: String, default: "Zosh Express Logistics" },
      trackingUrl: { type: String, default: "" },
      serviceType: { type: String, default: "Internal Direct Linehaul" },
    },
  },
  {
    timestamps: true,
  }
);

// High-speed operational query indexes
shipmentSchema.index({ status: 1, currentHub: 1 });
shipmentSchema.index({ "sla.slaStatus": 1, status: 1 });
shipmentSchema.index({ seller: 1, createdAt: -1 });
shipmentSchema.index({ customer: 1, createdAt: -1 });
shipmentSchema.index({ createdAt: -1 });

export const Shipment = mongoose.model("Shipment", shipmentSchema);
