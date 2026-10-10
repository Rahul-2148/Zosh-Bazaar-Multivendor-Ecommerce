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

const mediaItemSchema = new mongoose.Schema(
  {
    mediaId: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    url: { type: String, required: true },
    secureUrl: { type: String, default: "" },
    publicId: { type: String, default: "" },
    resourceType: { type: String, enum: ["image", "video", "raw"], default: "image" },
    format: { type: String, default: "" },
    width: { type: Number },
    height: { type: Number },
    bytes: { type: Number },
    altText: { type: String, default: "" },
    sortOrder: { type: Number, default: 0 },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: true }
);

const mediaGroupSchema = new mongoose.Schema(
  {
    groupId: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
    optionKey: { type: String, required: true, lowercase: true, trim: true }, // e.g. "color"
    optionValue: { type: String, required: true, trim: true }, // e.g. "Blue"
    name: { type: String, default: "" }, // e.g. "Blue Collection"
    images: { type: [mongoose.Schema.Types.Mixed], default: [] },
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
    mediaGroups: {
      type: [mediaGroupSchema],
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
    hsnCode: {
      type: String,
      trim: true,
      default: "",
    },
    gstRate: {
      type: Number,
      default: null,
    },
    // Authoritative Derived Projection Fields (Section 14)
    minSellingPrice: { type: Number },
    maxSellingPrice: { type: Number },
    minMrp: { type: Number },
    maxMrp: { type: Number },
    totalAvailableStock: { type: Number, default: 0 },
    availableVariantCount: { type: Number, default: 0 },

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

// Auto-generate slug, SKU and derive synchronized price/stock projections before save (Section 14)
productSchema.pre("save", function (next) {
  if (!this.slug && this.title) {
    this.slug = sanitizeProductSlug(this.title);
  }
  if (!this.sku) {
    const prefix = (this.brand || "ZB").toUpperCase().slice(0, 4).replace(/[^A-Z]/g, "Z");
    this.sku = `${prefix}-${Date.now().toString(36).toUpperCase()}`;
  }

  if (this.hasVariants && Array.isArray(this.variants) && this.variants.length > 0) {
    const activeVariants = this.variants.filter((v) => v.status === "ACTIVE");
    const pool = activeVariants.length > 0 ? activeVariants : this.variants;

    const sellingPrices = pool.map((v) => Number(v.sellingPrice) || 0);
    const mrpPrices = pool.map((v) => Number(v.mrpPrice) || 0);

    this.minSellingPrice = Math.min(...sellingPrices);
    this.maxSellingPrice = Math.max(...sellingPrices);
    this.minMrp = Math.min(...mrpPrices);
    this.maxMrp = Math.max(...mrpPrices);

    this.totalAvailableStock = pool.reduce((sum, v) => sum + (Number(v.countInStock) || 0), 0);
    this.availableVariantCount = activeVariants.filter((v) => (Number(v.countInStock) || 0) > 0).length;

    // Maintain catalog display baselines
    this.sellingPrice = this.minSellingPrice;
    this.mrpPrice = this.minMrp;
    this.countInStock = this.totalAvailableStock;
  } else {
    this.minSellingPrice = this.sellingPrice;
    this.maxSellingPrice = this.sellingPrice;
    this.minMrp = this.mrpPrice;
    this.maxMrp = this.mrpPrice;
    this.totalAvailableStock = this.countInStock;
    this.availableVariantCount = 0;
  }

  this.inStock = this.countInStock > 0;
  next();
});

// Authoritative Media Hierarchy Resolution:
// 1. Exact variant media override
// 2. Option-level media group (e.g. matching color)
// 3. Product-level default media
export const resolveMediaHierarchy = (product, selectedVariant = null, selectedAttributes = {}) => {
  if (!product) return [];

  // Helper to extract clean URL from string or structured object
  const extractUrl = (item) => {
    if (!item) return "";
    if (typeof item === "string") return item;
    return item.secureUrl || item.url || item.relativePath || "";
  };

  // 1. Exact variant media override
  if (selectedVariant && Array.isArray(selectedVariant.images) && selectedVariant.images.length > 0) {
    const variantUrls = selectedVariant.images.map(extractUrl).filter(Boolean);
    if (variantUrls.length > 0) {
      return Array.from(new Set(variantUrls));
    }
  }

  // 2. Option-level media group (e.g., Color = Blue)
  if (Array.isArray(product.mediaGroups) && product.mediaGroups.length > 0) {
    // Resolve effective attributes from selectedVariant or selectedAttributes map
    const attrMap = {};
    if (selectedVariant && Array.isArray(selectedVariant.attributes)) {
      selectedVariant.attributes.forEach((a) => {
        if (a && a.key && a.value) {
          attrMap[a.key.toLowerCase()] = String(a.value).trim().toLowerCase();
        }
      });
    }
    if (selectedAttributes && typeof selectedAttributes === "object") {
      Object.entries(selectedAttributes).forEach(([k, v]) => {
        if (k && v) {
          attrMap[k.toLowerCase()] = String(v).trim().toLowerCase();
        }
      });
    }

    // Match media groups against resolved attributes
    for (const mg of product.mediaGroups) {
      const gKey = (mg.optionKey || "").toLowerCase();
      const gVal = (mg.optionValue || "").trim().toLowerCase();
      if (attrMap[gKey] && attrMap[gKey] === gVal) {
        if (Array.isArray(mg.images) && mg.images.length > 0) {
          const groupUrls = mg.images.map(extractUrl).filter(Boolean);
          if (groupUrls.length > 0) {
            return Array.from(new Set(groupUrls));
          }
        }
      }
    }
  }

  // 3. Product-level default media
  const defaultImages = Array.isArray(product.images)
    ? product.images.map(extractUrl).filter(Boolean)
    : [];
  return Array.from(new Set(defaultImages));
};

// High-performance query indexes
productSchema.index({ category: 1, sellingPrice: 1 });
productSchema.index({ seller: 1, createdAt: -1 });
productSchema.index({ status: 1, createdAt: -1 });
productSchema.index({ slug: 1 }, { unique: false });
productSchema.index({ sku: 1 });
productSchema.index({ title: "text", description: "text", brand: "text", tags: "text" });
productSchema.index({ "variants.sku": 1 });
productSchema.index({ "variants.attributes.key": 1, "variants.attributes.value": 1 });
productSchema.index({ "mediaGroups.optionKey": 1, "mediaGroups.optionValue": 1 });

export const Product = mongoose.model("Product", productSchema);
export { mediaItemSchema, mediaGroupSchema };

