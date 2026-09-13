import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

import { User } from "../models/user.model.js";
import { Seller } from "../models/seller.model.js";
import { Address } from "../models/address.model.js";
import { Category } from "../models/category.model.js";
import { HomeCategory } from "../models/homeCategory.model.js";
import { Product } from "../models/product.model.js";
import { Deal } from "../models/deal.model.js";
import { Coupon } from "../models/coupon.model.js";
import { Order } from "../models/order.model.js";
import { OrderItem } from "../models/orderItem.model.js";
import Transaction from "../models/transaction.model.js";
import { SellerReport } from "../models/sellerReport.model.js";
import { Brand } from "../models/brand.model.js";
import { Review } from "../models/review.model.js";
import { PlatformSettings as Settings } from "../models/settings.model.js";
import HomeCategorySection from "../domain/HomeCategorySection.js";
import UserRole from "../domain/UserRole.js";
import OrderStatus from "../domain/OrderStatus.js";
import PaymentStatus from "../domain/PaymentStatus.js";

const sampleBrands = [
  {
    name: "Apple",
    slug: "apple",
    logo: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
    description: "Premium personal technology, mobile devices, and wearable electronics.",
    website: "https://apple.com",
    isActive: true,
  },
  {
    name: "Sony",
    slug: "sony",
    logo: "https://upload.wikimedia.org/wikipedia/commons/c/ca/Sony_logo.svg",
    description: "World-class high-resolution audio, cameras, and consumer electronics.",
    website: "https://sony.com",
    isActive: true,
  },
  {
    name: "Nike",
    slug: "nike",
    logo: "https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg",
    description: "Athletic footwear, apparel, equipment, and accessories.",
    website: "https://nike.com",
    isActive: true,
  },
  {
    name: "Virasat Weaves",
    slug: "virasat-weaves",
    logo: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=100",
    description: "Authentic Indian handloom sarees and royal traditional apparel.",
    isActive: true,
  },
  {
    name: "Zosh Atelier",
    slug: "zosh-atelier",
    logo: "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=100",
    description: "Modern bespoke linen tailoring and everyday casual blazers.",
    isActive: true,
  },
];

const sampleHomeCategories = [
  {
    categoryId: "electronics_smartwatches",
    section: HomeCategorySection.GRID,
    name: "Smart Watches",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600",
  },
  {
    categoryId: "electronics_audio",
    section: HomeCategorySection.GRID,
    name: "Audio & Headphones",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600",
  },
  {
    categoryId: "footwear_sneakers",
    section: HomeCategorySection.GRID,
    name: "Sneakers & Kicks",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600",
  },
  {
    categoryId: "women_sarees",
    section: HomeCategorySection.GRID,
    name: "Royal Sarees",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600",
  },
  {
    categoryId: "men_clothing",
    section: HomeCategorySection.GRID,
    name: "Men's Blazers",
    image: "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=600",
  },
  {
    categoryId: "electronics_audio",
    section: HomeCategorySection.DEALS,
    name: "Audio Super Deals",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600",
  },
  {
    categoryId: "electronics_smartwatches",
    section: HomeCategorySection.DEALS,
    name: "Smartwatch Flash Sale",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600",
  },
];

const sampleCoupons = [
  {
    code: "WELCOME10",
    discountPercentage: 10,
    validityStartDate: new Date(),
    validityEndDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    minimumOrderValue: 499,
    isActive: true,
  },
  {
    code: "ZOSH20",
    discountPercentage: 20,
    validityStartDate: new Date(),
    validityEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    minimumOrderValue: 999,
    isActive: true,
  },
];

const sampleSellers = [
  {
    sellerName: "TechGear Direct Bangalore",
    email: "seller.blr@zoshbazaar.com",
    mobile: 9876543210,
    GSTIN: "29AAAAA0000A1Z5",
    password: "sellerPassword@123",
    businessDetails: {
      businessName: "TechGear Direct Pvt Ltd",
      businessPan: "AAAAA0000A",
    },
    bankDetails: {
      accountNumber: "123456789012",
      accountHolderName: "TechGear Direct",
      bankName: "HDFC Bank",
      ifscCode: "HDFC0001234",
    },
    pickupAddress: {
      name: "TechGear Hub",
      locality: "Koramangala 4th Block",
      address: "Plot 42, 80 Feet Road",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: 560034,
      country: "India",
      mobile: 9876543210,
    },
  },
  {
    sellerName: "Virasat Weaves & Apparel",
    email: "virasat.seller@zoshbazaar.com",
    mobile: 9876543211,
    GSTIN: "09BBBBB1111B1Z6",
    password: "sellerPassword@123",
    businessDetails: {
      businessName: "Virasat Handloom Textiles",
      businessPan: "BBBBB1111B",
    },
    bankDetails: {
      accountNumber: "987654321098",
      accountHolderName: "Virasat Handloom",
      bankName: "State Bank of India",
      ifscCode: "SBIN0005678",
    },
    pickupAddress: {
      name: "Virasat Warehouse",
      locality: "Chowk Bazar",
      address: "Shop 15, Godowlia Road",
      city: "Varanasi",
      state: "Uttar Pradesh",
      pincode: 221001,
      country: "India",
      mobile: 9876543211,
    },
  },
];

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error("MONGODB_URI is not set in environment.");
      process.exit(1);
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("Connected successfully to MongoDB.");

    // 1. Seed Admin User
    const adminEmail = "rahulraj21480@gmail.com";
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      const hashedPassword = await bcrypt.hash("zoshilaRahul@1234", 10);
      admin = await User.create({
        fullName: "Rahul Raj (Admin)",
        email: adminEmail,
        mobile: "9973162148",
        role: UserRole.ROLE_ADMIN,
        password: hashedPassword,
      });
      console.log(`✓ Admin user created: ${adminEmail}`);
    } else {
      console.log(`✓ Admin user exists: ${adminEmail}`);
    }

    // 2. Seed Platform Settings Singleton
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        storeName: "Zosh Bazaar",
        supportEmail: "support@zoshbazaar.com",
        supportPhone: "+91 9973162148",
        currencySymbol: "₹",
        currencyCode: "INR",
        shippingFee: 79,
        freeShippingThreshold: 999,
        taxRatePercent: 18,
        announcementBanner: "Welcome to Zosh Bazaar! Free shipping on orders over ₹999.",
      });
      console.log("✓ Platform settings initialized.");
    }

    // 3. Seed Brands
    for (const b of sampleBrands) {
      const exists = await Brand.findOne({ slug: b.slug });
      if (!exists) {
        await Brand.create(b);
      }
    }
    console.log("✓ Brand registry initialized.");

    // 4. Seed Sellers
    const createdSellers = [];
    for (const sellerData of sampleSellers) {
      let seller = await Seller.findOne({ email: sellerData.email });
      if (!seller) {
        const hashedPassword = await bcrypt.hash(sellerData.password, 10);
        let pickupAddr = null;
        if (sellerData.pickupAddress) {
          pickupAddr = await Address.create(sellerData.pickupAddress);
        }
        seller = await Seller.create({
          ...sellerData,
          password: hashedPassword,
          pickupAddress: pickupAddr ? pickupAddr._id : null,
        });
        console.log(`✓ Seller created: ${seller.sellerName} (${seller.email})`);
      } else {
        console.log(`✓ Seller exists: ${seller.sellerName}`);
      }
      createdSellers.push(seller);
    }

    // 5. Seed Hierarchy Categories with Specification & Variant Attribute Definitions
    const categoriesMap = {};
    const baseCategories = [
      { name: "Fashion", categoryId: "fashion", level: 1 },
      { name: "Electronics", categoryId: "electronics", level: 1 },
      { name: "Home & Kitchen", categoryId: "home_furniture", level: 1 },
      { name: "Beauty & Personal Care", categoryId: "beauty", level: 1 },
      { name: "Grocery & Essentials", categoryId: "grocery", level: 1 },
      { name: "Sports & Fitness", categoryId: "sports", level: 1 },
    ];

    for (const cat of baseCategories) {
      let found = await Category.findOne({ categoryId: cat.categoryId });
      if (!found) {
        found = await Category.create(cat);
      } else {
        found.name = cat.name;
        found.level = 1;
        found.parentCategory = null;
        await found.save();
      }
      categoriesMap[cat.categoryId] = found;
    }

    // Subcategories (level 2)
    const subCategories = [
      {
        name: "Men's Clothing",
        categoryId: "men_clothing",
        parentCategory: categoriesMap["fashion"]?._id,
        level: 2,
      },
      {
        name: "Ethnic Wear & Sarees",
        categoryId: "women_sarees",
        parentCategory: categoriesMap["fashion"]?._id,
        level: 2,
      },
      {
        name: "Smart Audio & Sound",
        categoryId: "electronics_audio",
        parentCategory: categoriesMap["electronics"]?._id,
        level: 2,
      },
      {
        name: "Wearable Tech & Smartwatches",
        categoryId: "electronics_smartwatches",
        parentCategory: categoriesMap["electronics"]?._id,
        level: 2,
        attributes: [
          {
            name: "Band Color",
            key: "color",
            type: "SELECT",
            isVariant: true,
            options: ["Orange Ocean", "Midnight Black", "Starlight"],
            required: true,
          },
          {
            name: "Connectivity",
            key: "connectivity",
            type: "SELECT",
            isVariant: true,
            options: ["GPS + Cellular", "GPS Only"],
            required: true,
          },
          {
            name: "Case Material",
            key: "case_material",
            type: "TEXT",
            isVariant: false,
          },
          {
            name: "Water Resistance",
            key: "water_resistance",
            type: "TEXT",
            isVariant: false,
          },
        ],
      },
      {
        name: "Sneakers",
        categoryId: "footwear_sneakers",
        parentCategory: categoriesMap["footwear"]?._id,
        level: 2,
        attributes: [
          {
            name: "Shoe Size",
            key: "size",
            type: "SELECT",
            isVariant: true,
            options: ["UK 7", "UK 8", "UK 9", "UK 10", "UK 11"],
            required: true,
          },
          {
            name: "Colorway",
            key: "color",
            type: "SELECT",
            isVariant: true,
            options: ["Chicago Red / Black", "Triple White", "Shadow Grey"],
            required: true,
          },
        ],
      },
    ];

    for (const cat of subCategories) {
      let found = await Category.findOne({ categoryId: cat.categoryId });
      if (!found) {
        found = await Category.create(cat);
      } else if (cat.attributes && (!found.attributes || found.attributes.length === 0)) {
        found.attributes = cat.attributes;
        await found.save();
      }
      categoriesMap[cat.categoryId] = found;
    }
    console.log("✓ Categories and specification definitions initialized.");

    // 6. Seed Home Categories & Deals
    for (const hc of sampleHomeCategories) {
      const exists = await HomeCategory.findOne({
        categoryId: hc.categoryId,
        section: hc.section,
      });
      if (!exists) {
        await HomeCategory.create(hc);
      }
    }

    const dealCategories = await HomeCategory.find({
      section: HomeCategorySection.DEALS,
    });
    for (const dc of dealCategories) {
      const dealExists = await Deal.findOne({ category: dc._id });
      if (!dealExists) {
        await Deal.create({
          discount: Math.floor(Math.random() * 30) + 20,
          category: dc._id,
          isActive: true,
        });
      }
    }
    console.log("✓ Home categories and deals initialized.");

    // 7. Seed Coupons
    for (const c of sampleCoupons) {
      const couponExists = await Coupon.findOne({ code: c.code });
      if (!couponExists) {
        await Coupon.create(c);
      }
    }
    console.log("✓ Coupons initialized.");

    // 8. Seed Real Multi-Variant Products
    const seller1 = createdSellers[0];
    const seller2 = createdSellers[1];

    const sampleProducts = [
      {
        title: "Apple Watch Ultra 2 GPS + Cellular 49mm Titanium",
        description:
          "The most rugged and capable Apple Watch. Built for outdoor endurance, ocean explorations, and advanced athletes. Featuring precision dual-frequency GPS and up to 36 hours of battery life.",
        brand: "Apple",
        mrpPrice: 89900,
        sellingPrice: 79900,
        discountPercent: 11,
        countInStock: 25,
        color: "Natural Titanium",
        images: [
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800",
          "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800",
        ],
        category: categoriesMap["electronics_smartwatches"]?._id,
        seller: seller1._id,
        hasVariants: true,
        variants: [
          {
            sku: "APPL-WUT2-ORG-1",
            title: "Orange Ocean Band / GPS + Cellular",
            attributes: [
              { name: "Band Color", key: "color", value: "Orange Ocean" },
              { name: "Connectivity", key: "connectivity", value: "GPS + Cellular" },
            ],
            mrpPrice: 89900,
            sellingPrice: 79900,
            discountPercent: 11,
            countInStock: 15,
            images: [
              "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800",
            ],
            status: "ACTIVE",
          },
          {
            sku: "APPL-WUT2-MID-2",
            title: "Midnight Black / GPS + Cellular",
            attributes: [
              { name: "Band Color", key: "color", value: "Midnight Black" },
              { name: "Connectivity", key: "connectivity", value: "GPS + Cellular" },
            ],
            mrpPrice: 89900,
            sellingPrice: 79900,
            discountPercent: 11,
            countInStock: 10,
            images: [
              "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800",
            ],
            status: "ACTIVE",
          },
        ],
        specifications: [
          { name: "Case Material", key: "case_material", value: "Titanium" },
          { name: "Display", key: "display", value: "Always-On Retina OLED (3000 nits)" },
          { name: "Water Resistance", key: "water_resistance", value: "100m" },
          { name: "Battery Life", key: "battery_life", value: "36 hours normal use" },
        ],
      },
      {
        title: "Sony WH-1000XM5 Wireless Noise Cancelling Headphones",
        description:
          "Industry-leading noise canceling with two processors, eight microphones, and exceptional high-resolution sound quality. Ultra-comfortable lightweight design with soft fit leather.",
        brand: "Sony",
        mrpPrice: 34990,
        sellingPrice: 26990,
        discountPercent: 23,
        countInStock: 40,
        color: "Black",
        images: [
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
          "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800",
        ],
        category: categoriesMap["electronics_audio"]?._id,
        seller: seller1._id,
        hasVariants: true,
        variants: [
          {
            sku: "SONY-XM5-BLK-1",
            title: "Midnight Black",
            attributes: [{ name: "Color", key: "color", value: "Black" }],
            mrpPrice: 34990,
            sellingPrice: 26990,
            discountPercent: 23,
            countInStock: 25,
            images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800"],
            status: "ACTIVE",
          },
          {
            sku: "SONY-XM5-SLV-2",
            title: "Platinum Silver",
            attributes: [{ name: "Color", key: "color", value: "Platinum Silver" }],
            mrpPrice: 34990,
            sellingPrice: 27990,
            discountPercent: 20,
            countInStock: 15,
            images: ["https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800"],
            status: "ACTIVE",
          },
        ],
        specifications: [
          { name: "Driver Unit", key: "driver_unit", value: "30mm dome type" },
          { name: "Battery Life", key: "battery_life", value: "30 hours with ANC" },
          { name: "Bluetooth Version", key: "bluetooth", value: "5.2" },
        ],
      },
      {
        title: "Nike Air Jordan 1 Retro High OG Chicago",
        description:
          "Iconic basketball sneakers featuring premium leather, encapsulated Air cushioning, and the legendary high-top silhouette designed by Peter Moore in 1985.",
        brand: "Nike",
        mrpPrice: 18995,
        sellingPrice: 14995,
        discountPercent: 21,
        countInStock: 25,
        color: "Varsity Red / Black",
        images: [
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
          "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800",
        ],
        category: categoriesMap["footwear_sneakers"]?._id,
        seller: seller2._id,
        hasVariants: true,
        variants: [
          {
            sku: "NIKE-AJ1-UK8",
            title: "Chicago Red / UK 8",
            attributes: [
              { name: "Shoe Size", key: "size", value: "UK 8" },
              { name: "Colorway", key: "color", value: "Chicago Red / Black" },
            ],
            mrpPrice: 18995,
            sellingPrice: 14995,
            discountPercent: 21,
            countInStock: 10,
            images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800"],
            status: "ACTIVE",
          },
          {
            sku: "NIKE-AJ1-UK9",
            title: "Chicago Red / UK 9",
            attributes: [
              { name: "Shoe Size", key: "size", value: "UK 9" },
              { name: "Colorway", key: "color", value: "Chicago Red / Black" },
            ],
            mrpPrice: 18995,
            sellingPrice: 14995,
            discountPercent: 21,
            countInStock: 15,
            images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800"],
            status: "ACTIVE",
          },
        ],
        specifications: [
          { name: "Upper Material", key: "upper", value: "Full-Grain Leather" },
          { name: "Sole Cushioning", key: "cushioning", value: "Encapsulated Air-Sole unit" },
        ],
      },
      {
        title: "Handcrafted Pure Banarasi Silk Zari Saree",
        description:
          "Exquisite royal Banarasi silk saree woven with intricate gold zari floral motifs and matching unstitched blouse piece.",
        brand: "Virasat Weaves",
        mrpPrice: 12999,
        sellingPrice: 6499,
        discountPercent: 50,
        countInStock: 30,
        color: "Crimson Red",
        images: [
          "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800",
        ],
        category: categoriesMap["women_sarees"]?._id,
        seller: seller2._id,
        specifications: [
          { name: "Fabric", key: "fabric", value: "Pure Katan Silk" },
          { name: "Zari Type", key: "zari", value: "Tested Gold Zari" },
          { name: "Length", key: "length", value: "6.3m (with blouse piece)" },
        ],
      },
      {
        title: "Men's Tailored Linen Casual Blazer",
        description:
          "Breathable pure linen single-breasted blazer with notch lapels, patch pockets, and modern slim fit silhouette.",
        brand: "Zosh Atelier",
        mrpPrice: 7999,
        sellingPrice: 4799,
        discountPercent: 40,
        countInStock: 50,
        color: "Navy Blue",
        images: [
          "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=800",
        ],
        category: categoriesMap["men_clothing"]?._id,
        seller: seller2._id,
        specifications: [
          { name: "Material", key: "material", value: "100% Belgian Flax Linen" },
          { name: "Fit", key: "fit", value: "Tailored Slim Fit" },
        ],
      },
    ];

    const createdProducts = [];
    for (const prod of sampleProducts) {
      let productDoc = await Product.findOne({ title: prod.title });
      if (!productDoc) {
        productDoc = await Product.create(prod);
        console.log(`✓ Product created: ${prod.title}`);
      } else {
        // Upgrade product with new variant/spec structure if missing
        if (prod.variants && (!productDoc.variants || productDoc.variants.length === 0)) {
          productDoc.hasVariants = prod.hasVariants;
          productDoc.variants = prod.variants;
          productDoc.specifications = prod.specifications;
          await productDoc.save();
          console.log(`✓ Product upgraded with variants: ${prod.title}`);
        } else {
          console.log(`✓ Product exists: ${prod.title}`);
        }
      }
      createdProducts.push(productDoc);
    }

    // 9. Seed Customer User & Delivery Address
    const customerEmail = "sumanshit@example.com";
    let customer = await User.findOne({ email: customerEmail });
    if (!customer) {
      const hashedPassword = await bcrypt.hash("customerPassword@123", 10);
      customer = await User.create({
        fullName: "Suman Shit",
        email: customerEmail,
        mobile: "9641411919",
        role: UserRole.ROLE_CUSTOMER,
        password: hashedPassword,
      });
      console.log(`✓ Customer user created: ${customer.fullName} (${customerEmail})`);
    }

    let customerAddress = await Address.findOne({ mobile: 9641411919 });
    if (!customerAddress) {
      customerAddress = await Address.create({
        name: "Suman Shit",
        locality: "Gokuldham Market",
        address: "123 Durgapur Barrage, New Barrage Colony",
        city: "Durgapur",
        state: "West Bengal",
        pincode: 713212,
        country: "India",
        mobile: 9641411919,
      });
      if (!customer.addresses.includes(customerAddress._id)) {
        customer.addresses.push(customerAddress._id);
        await customer.save();
      }
      console.log("✓ Customer delivery address initialized.");
    }

    // 10. Seed Sample Commercial Snapshot Order
    const existingOrders = await Order.countDocuments({ user: customer._id });
    if (existingOrders === 0 && createdProducts.length >= 2) {
      const p1 = createdProducts[0];
      const p2 = createdProducts[1];
      const v1 = p1.variants?.[0];
      const v2 = p2.variants?.[0];

      const item1 = await OrderItem.create({
        product: p1._id,
        quantity: 1,
        mrpPrice: v1 ? v1.mrpPrice : p1.mrpPrice,
        sellingPrice: v1 ? v1.sellingPrice : p1.sellingPrice,
        productTitle: p1.title,
        productImage: p1.images?.[0],
        brand: p1.brand,
        sku: v1?.sku || "SKU-P1-001",
        variantTitle: v1?.title || "Standard",
        selectedAttributes: v1?.attributes || [],
        seller: p1.seller,
      });

      const item2 = await OrderItem.create({
        product: p2._id,
        quantity: 1,
        mrpPrice: v2 ? v2.mrpPrice : p2.mrpPrice,
        sellingPrice: v2 ? v2.sellingPrice : p2.sellingPrice,
        productTitle: p2.title,
        productImage: p2.images?.[0],
        brand: p2.brand,
        sku: v2?.sku || "SKU-P2-001",
        variantTitle: v2?.title || "Standard",
        selectedAttributes: v2?.attributes || [],
        seller: p2.seller,
      });

      const totalSelling = item1.sellingPrice + item2.sellingPrice;
      const totalMrp = item1.mrpPrice + item2.mrpPrice;

      const order1 = await Order.create({
        user: customer._id,
        seller: seller1._id,
        orderItems: [item1._id, item2._id],
        shippingAddress: customerAddress._id,
        paymentDetails: {
          status: PaymentStatus.COMPLETED,
          paymentId: "PAY_DEMO_001",
        },
        totalMrpPrice: totalMrp,
        totalSellingPrice: totalSelling,
        discount: totalMrp - totalSelling,
        orderStatus: OrderStatus.CONFIRMED,
        totalItems: 2,
        statusHistory: [
          {
            status: OrderStatus.PENDING,
            timestamp: new Date(Date.now() - 3600000),
            note: "Order created by customer",
          },
          {
            status: OrderStatus.CONFIRMED,
            timestamp: new Date(),
            note: "Payment received, order confirmed",
          },
        ],
      });

      await Transaction.create({
        customer: customer._id,
        order: order1._id,
        seller: seller1._id,
      });

      await SellerReport.create({
        seller: seller1._id,
        totalEarnings: totalSelling,
        totalSales: 2,
        totalRefunds: 0,
        totalTax: Math.round(totalSelling * 0.18),
        netEarnings: Math.round(totalSelling * 0.82),
        totalOrders: 1,
        canceledOrders: 0,
        totalTransactions: 1,
      });

      console.log(`✓ Order initialized: ${order1._id}`);
    }

    // 11. Seed Customer Reviews
    if (createdProducts.length > 0) {
      const p1 = createdProducts[0];
      const revCount = await Review.countDocuments({ product: p1._id });
      if (revCount === 0) {
        await Review.create({
          user: customer._id,
          product: p1._id,
          rating: 5,
          title: "Incredible battery and build quality!",
          comment: "I took this hiking and swimming. The titanium case is practically indestructible and GPS is ultra-accurate.",
          verifiedPurchase: true,
          status: "APPROVED",
        });
        p1.numRatings = 1;
        await p1.save();
        console.log("✓ Customer review initialized.");
      }
    }

    console.log("\n=======================================================");
    console.log("✓ ALL ENTERPRISE DATABASE SEEDING COMPLETED CLEANLY!");
    console.log("=======================================================");
    process.exit(0);
  } catch (error) {
    console.error("Error during database seed:", error);
    process.exit(1);
  }
};

seedDatabase();
