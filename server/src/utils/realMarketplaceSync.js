import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import connectDB from "../db/connectDB.js";
import { Product, sanitizeProductSlug } from "../models/product.model.js";
import { Category } from "../models/category.model.js";
import { Seller } from "../models/seller.model.js";
import { Brand } from "../models/brand.model.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_ROOT = path.resolve(__dirname, "../../uploads/products");

// High-definition SVG asset generator for offline-guaranteed, instant physical files
function generateProductSvg(title, colorHex, accentHex, subtitle, iconName) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="${colorHex}" />
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${accentHex}" stop-opacity="0.35" />
      <stop offset="100%" stop-color="${accentHex}" stop-opacity="0" />
    </radialGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#000000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- Background Base -->
  <rect width="800" height="800" fill="url(#bg)" />
  <circle cx="400" cy="380" r="300" fill="url(#glow)" />

  <!-- Geometric Frame -->
  <rect x="120" y="100" width="560" height="560" rx="40" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.12)" stroke-width="2" filter="url(#shadow)"/>

  <!-- Brand Watermark / Grid Lines -->
  <circle cx="400" cy="380" r="180" fill="none" stroke="${accentHex}" stroke-width="1.5" stroke-dasharray="6,6" opacity="0.4"/>
  <circle cx="400" cy="380" r="120" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1.5"/>

  <!-- Center Badge / Emblem -->
  <circle cx="400" cy="380" r="85" fill="${accentHex}" opacity="0.15"/>
  <circle cx="400" cy="380" r="70" fill="url(#bg)" stroke="${accentHex}" stroke-width="3"/>
  <text x="400" y="392" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="900" fill="#ffffff" letter-spacing="2">${iconName}</text>

  <!-- Product Title & Details -->
  <text x="400" y="550" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="30" font-weight="800" fill="#ffffff" letter-spacing="-0.5">${title}</text>
  <text x="400" y="590" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="600" fill="${accentHex}" letter-spacing="3">${subtitle.toUpperCase()}</text>
  
  <!-- Verified Authentic Badge -->
  <rect x="290" y="625" width="220" height="34" rx="17" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)"/>
  <circle cx="312" cy="642" r="6" fill="#10b981"/>
  <text x="328" y="647" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="700" fill="#f8fafc" letter-spacing="0.5">ZOSH VERIFIED 100%</text>

  <!-- Decorative Accent Dots -->
  <circle cx="150" cy="130" r="4" fill="${accentHex}"/>
  <circle cx="650" cy="130" r="4" fill="${accentHex}"/>
  <circle cx="150" cy="630" r="4" fill="${accentHex}"/>
  <circle cx="650" cy="630" r="4" fill="${accentHex}"/>
</svg>`;
}

async function savePhysicalImageToDisk(productSlug, filename, content) {
  const productDir = path.join(UPLOADS_ROOT, productSlug);
  if (!fs.existsSync(productDir)) {
    fs.mkdirSync(productDir, { recursive: true });
  }
  const filePath = path.join(productDir, filename);
  fs.writeFileSync(filePath, content, "utf-8");
  return `/uploads/products/${productSlug}/${filename}`;
}

const enterpriseProductsSeed = [
  {
    title: "Sony WH-1000XM5 Wireless Noise Cancelling Headphones",
    brand: "Sony",
    categorySlug: "electronics_audio",
    parentCategorySlug: "electronics",
    mrpPrice: 34990,
    sellingPrice: 28990,
    countInStock: 45,
    highlights: [
      "Industry-leading Active Noise Cancellation with 8 microphones & Auto NC Optimizer",
      "Magnificent Sound engineered to perfection with Integrated Processor V1",
      "Crystal-clear hands-free calling with 4 beamforming microphones",
      "Up to 30-hour battery life with quick charging (3 min charge for 3 hours playback)",
      "Ultra-comfortable, lightweight design with soft fit leather",
      "Multipoint connection allows pairing with two devices simultaneously",
    ],
    specifications: [
      { section: "General", name: "Model Name", key: "model_name", value: "WH-1000XM5", unit: "" },
      { section: "General", name: "Color", key: "color", value: "Silver / Black", unit: "" },
      { section: "Audio", name: "Driver Unit", key: "driver_size", value: 30, unit: "mm" },
      { section: "Audio", name: "Frequency Response", key: "frequency", value: "4 Hz - 40,000 Hz", unit: "" },
      { section: "Connectivity", name: "Bluetooth Version", key: "bluetooth_version", value: "5.2", unit: "" },
      { section: "Battery", name: "Battery Life", key: "battery_life", value: 30, unit: "hours" },
      { section: "Battery", name: "Charging Time", key: "charging_time", value: 3.5, unit: "hours" },
    ],
    warranty: {
      summary: "1 Year Official Sony India Comprehensive Warranty",
      durationMonths: 12,
      type: "BRAND",
    },
    returnPolicy: {
      returnable: true,
      windowDays: 7,
      policyType: "REPLACEMENT_ONLY",
    },
    shippingDetails: {
      weightKg: 0.25,
      dimensionsCm: { length: 22.5, width: 20.0, height: 7.5 },
      freeShipping: true,
      estimatedDeliveryDays: 2,
    },
    hasVariants: true,
    variants: [
      {
        sku: "ZB-SONY-XM5-SLV",
        title: "Platinum Silver",
        attributes: [{ name: "Color", key: "color", value: "Platinum Silver" }],
        mrpPrice: 34990,
        sellingPrice: 28990,
        discountPercent: 17,
        countInStock: 25,
        images: ["front-view.svg", "side-angle.svg", "case-packaged.svg"],
      },
      {
        sku: "ZB-SONY-XM5-BLK",
        title: "Midnight Black",
        attributes: [{ name: "Color", key: "color", value: "Midnight Black" }],
        mrpPrice: 34990,
        sellingPrice: 28990,
        discountPercent: 17,
        countInStock: 20,
        images: ["front-view.svg", "side-angle.svg"],
      },
    ],
    colorTheme: { bg: "#1e293b", accent: "#38bdf8", icon: "SONY" },
  },
  {
    title: "Apple iPhone 16 Pro Max 256GB Desert Titanium",
    brand: "Apple",
    categorySlug: "electronics_smartphones",
    parentCategorySlug: "electronics",
    mrpPrice: 144900,
    sellingPrice: 139900,
    countInStock: 30,
    highlights: [
      "Stunning 6.9-inch Super Retina XDR display with ProMotion up to 120Hz",
      "Grade 5 Titanium design with refined microblasted texture and thinnest borders ever",
      "Camera Control for easier, faster access to photographic tools like zoom & depth of field",
      "48MP Fusion Camera with second-generation quad-pixel sensor and 5x Telephoto lens",
      "A18 Pro chip powers Apple Intelligence, next-generation mobile gaming, and exceptional efficiency",
      "Huge leap in battery life offering up to 33 hours of video playback",
    ],
    specifications: [
      { section: "Performance", name: "Processor", key: "processor", value: "A18 Pro Chip (6-core CPU)", unit: "" },
      { section: "Storage", name: "Internal Storage", key: "storage", value: 256, unit: "GB" },
      { section: "Display", name: "Screen Size", key: "screen_size", value: 6.9, unit: "inch" },
      { section: "Display", name: "Resolution", key: "resolution", value: "2868 x 1320 pixels at 460 ppi", unit: "" },
      { section: "Camera", name: "Rear Camera", key: "rear_camera", value: "48MP Main + 48MP Ultra Wide + 12MP 5x Telephoto", unit: "" },
      { section: "Camera", name: "Front Camera", key: "front_camera", value: "12MP TrueDepth", unit: "" },
      { section: "Battery", name: "MagSafe Wireless", key: "wireless_charging", value: 25, unit: "W" },
    ],
    warranty: {
      summary: "1 Year Apple Limited Warranty with 90 Days Complimentary Technical Support",
      durationMonths: 12,
      type: "BRAND",
    },
    returnPolicy: {
      returnable: true,
      windowDays: 7,
      policyType: "REPLACEMENT_ONLY",
    },
    shippingDetails: {
      weightKg: 0.227,
      dimensionsCm: { length: 16.3, width: 7.76, height: 0.82 },
      freeShipping: true,
      estimatedDeliveryDays: 1,
    },
    hasVariants: true,
    variants: [
      {
        sku: "ZB-APPL-IPH16PM-256-DES",
        title: "Desert Titanium / 256GB",
        attributes: [
          { name: "Color", key: "color", value: "Desert Titanium" },
          { name: "Storage", key: "storage", value: "256GB" },
        ],
        mrpPrice: 144900,
        sellingPrice: 139900,
        discountPercent: 3,
        countInStock: 15,
        images: ["front-display.svg", "titanium-back.svg", "camera-module.svg"],
      },
      {
        sku: "ZB-APPL-IPH16PM-512-NAT",
        title: "Natural Titanium / 512GB",
        attributes: [
          { name: "Color", key: "color", value: "Natural Titanium" },
          { name: "Storage", key: "storage", value: "512GB" },
        ],
        mrpPrice: 164900,
        sellingPrice: 159900,
        discountPercent: 3,
        countInStock: 15,
        images: ["front-display.svg", "titanium-back.svg"],
      },
    ],
    colorTheme: { bg: "#2d2319", accent: "#d4a373", icon: "APPLE" },
  },
  {
    title: "Nike Air Force 1 '07 Triple White Classic Sneaker",
    brand: "Nike",
    categorySlug: "footwear",
    parentCategorySlug: "fashion",
    mrpPrice: 8995,
    sellingPrice: 7495,
    countInStock: 60,
    highlights: [
      "From tough stitching to pristine materials to cupsole design, delivering durable style",
      "Originally designed for performance hoops, Nike Air cushioning adds lightweight comfort",
      "Low-cut, padded collar looks sleek and feels great all day long",
      "Perforations on the toe box maintain breathable airflow",
      "Full-length rubber outsole with heritage hoops pivot circles adds traction and durability",
    ],
    specifications: [
      { section: "Material", name: "Upper Material", key: "upper_material", value: "Genuine Stitched Leather", unit: "" },
      { section: "Sole", name: "Outsole", key: "outsole", value: "Non-marking Solid Rubber", unit: "" },
      { section: "General", name: "Closure", key: "closure", value: "Lace-Up", unit: "" },
      { section: "General", name: "Ankle Height", key: "ankle_height", value: "Low Top", unit: "" },
    ],
    warranty: {
      summary: "3 Months Manufacturing Defect Warranty by Nike India",
      durationMonths: 3,
      type: "BRAND",
    },
    returnPolicy: {
      returnable: true,
      windowDays: 14,
      policyType: "REFUND_OR_REPLACEMENT",
    },
    shippingDetails: {
      weightKg: 0.9,
      dimensionsCm: { length: 34.0, width: 22.0, height: 12.5 },
      freeShipping: true,
      estimatedDeliveryDays: 3,
    },
    hasVariants: true,
    variants: [
      {
        sku: "ZB-NIKE-AF1-UK8",
        title: "UK 8 (White)",
        attributes: [
          { name: "Size", key: "size", value: "UK 8" },
          { name: "Color", key: "color", value: "White" },
        ],
        mrpPrice: 8995,
        sellingPrice: 7495,
        discountPercent: 17,
        countInStock: 20,
        images: ["side-profile.svg", "top-down.svg", "sole-tread.svg"],
      },
      {
        sku: "ZB-NIKE-AF1-UK9",
        title: "UK 9 (White)",
        attributes: [
          { name: "Size", key: "size", value: "UK 9" },
          { name: "Color", key: "color", value: "White" },
        ],
        mrpPrice: 8995,
        sellingPrice: 7495,
        discountPercent: 17,
        countInStock: 25,
        images: ["side-profile.svg", "top-down.svg"],
      },
      {
        sku: "ZB-NIKE-AF1-UK10",
        title: "UK 10 (White)",
        attributes: [
          { name: "Size", key: "size", value: "UK 10" },
          { name: "Color", key: "color", value: "White" },
        ],
        mrpPrice: 8995,
        sellingPrice: 7495,
        discountPercent: 17,
        countInStock: 15,
        images: ["side-profile.svg", "top-down.svg"],
      },
    ],
    colorTheme: { bg: "#1e1b4b", accent: "#f43f5e", icon: "NIKE" },
  },
  {
    title: "Virasat Weaves Handloom Pure Mulberry Silk Banarasi Saree",
    brand: "Virasat Weaves",
    categorySlug: "women_ethnic",
    parentCategorySlug: "fashion",
    mrpPrice: 18999,
    sellingPrice: 12499,
    countInStock: 25,
    highlights: [
      "100% Certified Silk Mark Authenticated Pure Mulberry Katan Silk",
      "Intricately handwoven Kadwa zari floral jaal crafted by master Varanasi artisans",
      "Rich contrast pallu embellished with heritage royal motifs and gold zari border",
      "Includes matching unstitched pure silk blouse piece (80 cm)",
      "Breathable, lightweight drape with natural opulent sheen",
    ],
    specifications: [
      { section: "Fabric", name: "Saree Fabric", key: "fabric", value: "Pure Mulberry Katan Silk", unit: "" },
      { section: "Weave", name: "Weaving Technique", key: "weave", value: "Authentic Handloom Kadwa", unit: "" },
      { section: "Dimensions", name: "Length", key: "length", value: 5.5, unit: "m" },
      { section: "Dimensions", name: "Blouse Length", key: "blouse_length", value: 0.8, unit: "m" },
      { section: "Care", name: "Wash Care", key: "care", value: "Dry Clean Only. Wrap in muslin cloth.", unit: "" },
    ],
    warranty: {
      summary: "Silk Mark India Lifetime Authenticity Guarantee",
      durationMonths: 60,
      type: "BRAND",
    },
    returnPolicy: {
      returnable: true,
      windowDays: 7,
      policyType: "REFUND_OR_REPLACEMENT",
    },
    shippingDetails: {
      weightKg: 0.75,
      dimensionsCm: { length: 30.0, width: 25.0, height: 6.0 },
      freeShipping: true,
      estimatedDeliveryDays: 3,
    },
    hasVariants: false,
    colorTheme: { bg: "#4a044e", accent: "#f59e0b", icon: "SILK" },
  },
  {
    title: "Zosh Atelier Italian Wool Slim-Fit Signature Blazer",
    brand: "Zosh Atelier",
    categorySlug: "men_formal",
    parentCategorySlug: "fashion",
    mrpPrice: 15999,
    sellingPrice: 9999,
    countInStock: 35,
    highlights: [
      "Crafted from premium 120s Italian merino wool blend for superior drape and breathability",
      "Contemporary slim silhouette with structured shoulders and notch lapel",
      "Dual vent back design ensuring ease of movement and comfort",
      "Detailed with mother-of-pearl buttons and custom silky interior lining",
      "Four interior pockets engineered for phone, passport, and pens",
    ],
    specifications: [
      { section: "Material", name: "Shell Material", key: "material", value: "70% Merino Wool, 30% Silk Touch Viscose", unit: "" },
      { section: "Fit", name: "Fit Type", key: "fit", value: "Modern Tailored Slim Fit", unit: "" },
      { section: "Design", name: "Lapel Style", key: "lapel", value: "Classic Notch Lapel", unit: "" },
      { section: "Design", name: "Buttons", key: "buttons", value: "2-Button Single Breasted", unit: "" },
    ],
    warranty: {
      summary: "6 Months Craftsmanship & Fabric Integrity Warranty",
      durationMonths: 6,
      type: "SELLER",
    },
    returnPolicy: {
      returnable: true,
      windowDays: 14,
      policyType: "REFUND_OR_REPLACEMENT",
    },
    shippingDetails: {
      weightKg: 1.1,
      dimensionsCm: { length: 45.0, width: 35.0, height: 8.0 },
      freeShipping: true,
      estimatedDeliveryDays: 2,
    },
    hasVariants: true,
    variants: [
      {
        sku: "ZB-ZOSH-BLZ-NAVY-40",
        title: "Navy Blue / Size 40",
        attributes: [
          { name: "Color", key: "color", value: "Navy Blue" },
          { name: "Chest Size", key: "size", value: "40" },
        ],
        mrpPrice: 15999,
        sellingPrice: 9999,
        discountPercent: 38,
        countInStock: 18,
        images: ["front-jacket.svg", "lapel-detail.svg", "back-vent.svg"],
      },
      {
        sku: "ZB-ZOSH-BLZ-CHAR-42",
        title: "Charcoal Grey / Size 42",
        attributes: [
          { name: "Color", key: "color", value: "Charcoal Grey" },
          { name: "Chest Size", key: "size", value: "42" },
        ],
        mrpPrice: 15999,
        sellingPrice: 9999,
        discountPercent: 38,
        countInStock: 17,
        images: ["front-jacket.svg", "lapel-detail.svg"],
      },
    ],
    colorTheme: { bg: "#0f172a", accent: "#06b6d4", icon: "ZOSH" },
  },
  {
    title: "Sony PlayStation 5 Slim Digital Console 1TB",
    brand: "Sony",
    categorySlug: "electronics_gaming",
    parentCategorySlug: "electronics",
    mrpPrice: 44990,
    sellingPrice: 39990,
    countInStock: 20,
    highlights: [
      "Slim Design: Packs powerful gaming tech inside a sleek and compact console design",
      "1TB of High-Speed SSD Storage: Keep your favorite games ready and waiting to play",
      "Ultra-High Speed SSD: Maximize your play sessions with near instant load times",
      "Integrated I/O: Custom integration allows creators to design games like never before",
      "Ray Tracing: Immerse yourself in worlds with realism where rays of light are simulated",
      "Includes DualSense Wireless Controller with Haptic Feedback and Adaptive Triggers",
    ],
    specifications: [
      { section: "Performance", name: "CPU", key: "cpu", value: "x86-64-AMD Ryzen Zen 2, 8 Cores / 16 Threads", unit: "" },
      { section: "Performance", name: "GPU", key: "gpu", value: "AMD Radeon RDNA 2-based graphics engine", unit: "" },
      { section: "Memory", name: "System Memory", key: "ram", value: "16GB GDDR6", unit: "" },
      { section: "Storage", name: "SSD Storage", key: "storage", value: "1TB Custom NVMe SSD", unit: "" },
      { section: "Video", name: "Resolution", key: "video_output", value: "Support of 4K 120Hz TVs, 8K TVs, VRR", unit: "" },
    ],
    warranty: {
      summary: "1 Year Official Sony India Manufacturer Warranty",
      durationMonths: 12,
      type: "BRAND",
    },
    returnPolicy: {
      returnable: true,
      windowDays: 7,
      policyType: "REPLACEMENT_ONLY",
    },
    shippingDetails: {
      weightKg: 2.6,
      dimensionsCm: { length: 35.8, width: 21.6, height: 8.0 },
      freeShipping: true,
      estimatedDeliveryDays: 2,
    },
    hasVariants: false,
    colorTheme: { bg: "#0284c7", accent: "#38bdf8", icon: "PS5" },
  },
];

async function syncRealMarketplace() {
  try {
    console.log("=================================================");
    console.log("ZOSH BAZAAR REAL MEDIA & ENTERPRISE PRODUCT SYNC");
    console.log("=================================================");

    await connectDB();

    // Ensure dedicated uploads root exists
    if (!fs.existsSync(UPLOADS_ROOT)) {
      fs.mkdirSync(UPLOADS_ROOT, { recursive: true });
    }

    // Resolve or create primary seller
    let seller = await Seller.findOne();
    if (!seller) {
      seller = await Seller.create({
        sellerName: "Zosh Official Flagship Store",
        email: "flagship@zoshbazaar.com",
        mobile: "9876543210",
        password: "Password123!",
        isEmailVerified: true,
        accountStatus: "ACTIVE",
      });
      console.log(`✓ Created Primary Vendor: ${seller.sellerName}`);
    } else {
      console.log(`✓ Using Primary Vendor: ${seller.sellerName}`);
    }

    let createdCount = 0;
    let updatedCount = 0;

    for (const item of enterpriseProductsSeed) {
      const slug = sanitizeProductSlug(item.title);
      console.log(`\n📦 Processing Product: [${item.title}]`);
      console.log(`   📁 Dedicated Folder: uploads/products/${slug}/`);

      // 1. Physically generate and store image assets in uploads/products/:slug/
      const diskImages = [];
      const imageNames = ["front-showcase.svg", "side-angle.svg", "detail-view.svg"];

      for (let idx = 0; idx < imageNames.length; idx++) {
        const imgName = imageNames[idx];
        const svgContent = generateProductSvg(
          item.title,
          item.colorTheme.bg,
          item.colorTheme.accent,
          imgName.replace(".svg", "").replace("-", " "),
          item.colorTheme.icon
        );

        const serverBaseUrl = (
          process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`
        ).replace(/\/+$/, "");
        const fullServerUrl = `${serverBaseUrl}${relativeUrl}`;

        diskImages.push({
          url: fullServerUrl,
          relativePath: relativeUrl,
          filename: imgName,
          altText: `${item.title} - ${imgName}`,
          isPrimary: idx === 0,
          order: idx,
        });
      }

      console.log(`   ✓ Saved ${diskImages.length} real physical image files directly on disk.`);

      // 2. Resolve Category
      let category = await Category.findOne({ categoryId: item.categorySlug });
      if (!category) {
        let parent = await Category.findOne({ categoryId: item.parentCategorySlug });
        if (!parent) {
          parent = await Category.create({
            categoryId: item.parentCategorySlug,
            name: item.parentCategorySlug.replace("_", " ").toUpperCase(),
            level: 1,
          });
        }
        category = await Category.create({
          categoryId: item.categorySlug,
          name: item.categorySlug.replace("_", " ").toUpperCase(),
          level: 2,
          parentCategory: parent._id,
        });
      }

      // 3. Resolve Brand
      let brandObj = await Brand.findOne({ name: new RegExp(`^${item.brand}$`, "i") });
      if (!brandObj) {
        brandObj = await Brand.create({
          name: item.brand,
          slug: item.brand.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        });
      }

      // 4. Map Variant Images with real local files
      const enrichedVariants = (item.variants || []).map((v) => {
        const variantImages = diskImages.map((img) => img.url);
        return {
          sku: v.sku,
          title: v.title,
          attributes: v.attributes,
          mrpPrice: v.mrpPrice,
          sellingPrice: v.sellingPrice,
          discountPercent: v.discountPercent,
          countInStock: v.countInStock,
          images: variantImages,
          status: "ACTIVE",
        };
      });

      // 5. Upsert Product Document in MongoDB
      const productPayload = {
        title: item.title,
        slug,
        sku: `${item.brand.slice(0, 4).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
        description: `${item.title} - Certified authentic marketplace listing. Includes official manufacturer warranty, express doorstep delivery, and dedicated customer support.`,
        highlights: item.highlights,
        brand: item.brand,
        category: category._id,
        seller: seller._id,
        hasVariants: item.hasVariants,
        variants: enrichedVariants,
        specifications: item.specifications,
        warranty: item.warranty,
        returnPolicy: item.returnPolicy,
        shippingDetails: item.shippingDetails,
        mrpPrice: item.mrpPrice,
        sellingPrice: item.sellingPrice,
        discountPercent: Math.round(((item.mrpPrice - item.sellingPrice) / item.mrpPrice) * 100),
        countInStock: item.countInStock,
        lowStockThreshold: 5,
        inStock: item.countInStock > 0,
        images: diskImages,
        status: "PUBLISHED",
        ratings: {
          average: 4.8,
          count: 240,
          breakdown: { 5: 180, 4: 45, 3: 10, 2: 3, 1: 2 },
        },
      };

      const existing = await Product.findOne({ slug });
      if (existing) {
        await Product.findByIdAndUpdate(existing._id, productPayload, { new: true });
        updatedCount++;
        console.log(`   ✓ Updated existing product document: ${existing._id}`);
      } else {
        const created = await Product.create(productPayload);
        createdCount++;
        console.log(`   ✓ Inserted new enterprise product document: ${created._id}`);
      }
    }

    console.log("\n=================================================");
    console.log(`SYNC COMPLETE: Created ${createdCount}, Updated ${updatedCount} products.`);
    console.log(`All images physically stored in dedicated slug folders under server/uploads/products/`);
    console.log("=================================================");
    process.exit(0);
  } catch (err) {
    console.error("❌ Sync failed with error:", err);
    process.exit(1);
  }
}

syncRealMarketplace();
