import mongoose from "mongoose";

export const sanitizeProductSlug = (str = "") => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const variantAttributeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    key: { type: String, required: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    unit: { type: String, default: "" },
  },
  { _id: false }
);

const variantSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      default: "",
    },
    attributes: {
      type: [variantAttributeSchema],
      default: [],
    },
    mrpPrice: {
      type: Number,
      required: true,
    },
    sellingPrice: {
      type: Number,
      required: true,
    },
    discountPercent: {
      type: Number,
      default: 0,
    },
    countInStock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    reservedStock: {
      type: Number,
      default: 0,
      min: 0,
    },
    images: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    weight: {
      value: { type: Number },
      unit: { type: String, default: "g" },
    },
    dimensions: {
      length: { type: Number },
      width: { type: Number },
      height: { type: Number },
      unit: { type: String, default: "cm" },
    },
    barcode: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
  },
  { _id: true }
);

const specificationSchema = new mongoose.Schema(
  {
    section: { type: String, default: "General" },
    name: { type: String, required: true },
    key: { type: String, required: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    unit: { type: String, default: "" },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
    },
    sku: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    highlights: {
      type: [String],
      default: [],
    },
    brand: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
    },
    hasVariants: {
      type: Boolean,
      default: false,
    },
    attributeDefinitions: [
      {
        name: { type: String },
        key: { type: String },
        type: { type: String, default: "SELECT" },
        isVariant: { type: Boolean, default: true },
        options: [{ type: String }],
        allowedUnits: [{ type: String }],
      },
    ],
    variants: {
      type: [variantSchema],
      default: [],
    },
    specifications: {
      type: [specificationSchema],
      default: [],
    },
    warranty: {
      summary: { type: String, default: "1 Year Manufacturer Warranty" },
      durationMonths: { type: Number, default: 12 },
      type: { type: String, default: "MANUFACTURER" },
    },
    returnPolicy: {
      returnable: { type: Boolean, default: true },
      windowDays: { type: Number, default: 7 },
      policyType: { type: String, default: "REPLACEMENT_ONLY" },
    },
    shippingDetails: {
      weightKg: { type: Number, default: 0.5 },
      dimensionsCm: {
        length: { type: Number, default: 15 },
        width: { type: Number, default: 10 },
        height: { type: Number, default: 5 },
      },
      freeShipping: { type: Boolean, default: true },
      estimatedDeliveryDays: { type: Number, default: 3 },
    },
    measurement: {
      value: { type: Number },
      unit: { type: String },
    },
    // Base/catalog display values (computed from variants or standalone product)
    mrpPrice: {
      type: Number,
      required: true,
    },
    sellingPrice: {
      type: Number,
      required: true,
    },
    discountPercent: {
      type: Number,
      default: 0,
    },
    countInStock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 5,
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    // Array of string URLs or structured image objects
    images: {
      type: [mongoose.Schema.Types.Mixed],
      required: true,
      default: [],
    },
    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "ARCHIVED"],
      default: "PUBLISHED",
    },
    ratings: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
      breakdown: {
        5: { type: Number, default: 0 },
        4: { type: Number, default: 0 },
        3: { type: Number, default: 0 },
        2: { type: Number, default: 0 },
        1: { type: Number, default: 0 },
      },
    },
    tags: {
      type: [String],
      default: [],
    },
    // Legacy support fields for backwards compatibility with existing fixtures/views
    color: { type: String, default: "" },
    size: { type: String, default: "" },
    ram: { type: String, default: "" },
    weight: { type: String, default: "" },
    capacity: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);

// Auto-generate slug and update inStock status before save
productSchema.pre("save", function (next) {
  if (!this.slug && this.title) {
    this.slug = sanitizeProductSlug(this.title);
  }
  if (!this.sku) {
    const prefix = (this.brand || "ZB").toUpperCase().slice(0, 4).replace(/[^A-Z]/g, "Z");
    this.sku = `${prefix}-${Date.now().toString(36).toUpperCase()}`;
  }
  this.inStock = this.countInStock > 0;
  next();
});

// High-performance query indexes
productSchema.index({ category: 1, sellingPrice: 1 });
productSchema.index({ seller: 1, createdAt: -1 });
productSchema.index({ status: 1, createdAt: -1 });
productSchema.index({ slug: 1 }, { unique: false });
productSchema.index({ title: "text", description: "text", brand: "text", tags: "text" });
productSchema.index({ "variants.sku": 1 });
productSchema.index({ "variants.attributes.key": 1, "variants.attributes.value": 1 });

export const Product = mongoose.model("Product", productSchema);
