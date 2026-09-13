import mongoose from "mongoose";
import dotenv from "dotenv";
import { DeliveryHub } from "../models/deliveryHub.model.js";
import { DeliveryAgent } from "../models/deliveryAgent.model.js";
import { DeliveryRoute } from "../models/deliveryRoute.model.js";
import { Shipment } from "../models/shipment.model.js";
import { User } from "../models/user.model.js";
import { Seller } from "../models/seller.model.js";
import { Category } from "../models/category.model.js";
import { Product } from "../models/product.model.js";
import { Address } from "../models/address.model.js";
import { OrderItem } from "../models/orderItem.model.js";
import { Order } from "../models/order.model.js";
import { AgentStatus, ShipmentStatus } from "../domain/LogisticsStatus.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/Zosh-Bazaar-Ecommerce_Multivendor";

async function seedPartnerData() {
  console.log("Connecting to MongoDB for partner fixture seeding...");
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB.");

  // 1. Seed or get Hub
  let hub = await DeliveryHub.findOne({ hubCode: "BLR-SOUTH-01" });
  if (!hub) {
    hub = await DeliveryHub.create({
      hubCode: "BLR-SOUTH-01",
      name: "Bengaluru South Last-Mile Delivery Hub",
      type: "LAST_MILE_HUB",
      city: "Bengaluru",
      state: "Karnataka",
      address: "14th Main, HSR Layout Sector 4, Bengaluru, Karnataka 560102",
      coordinates: { lat: 12.9116, lng: 77.6389 },
      dailyCapacity: 5000,
      currentBacklog: 12,
      serviceZones: ["Central", "South", "East"],
      operatingHours: { open: "06:00", close: "23:00" },
      manager: { name: "Ramesh Sharma", phone: "9887766554", email: "hub.blr@zoshbazaar.com" },
      status: "ACTIVE",
    });
    console.log("✓ Hub created: BLR-SOUTH-01");
  } else {
    console.log("✓ Hub exists: BLR-SOUTH-01");
  }

  // 2. Seed or update Agent
  let agent = await DeliveryAgent.findOne({ agentId: "AGT-001" });
  if (!agent) {
    agent = await DeliveryAgent.create({
      agentId: "AGT-001",
      name: "Rahul Verma",
      phone: "9876543210",
      email: "rahul.partner@zoshbazaar.com",
      status: AgentStatus.AVAILABLE,
      assignedHub: hub._id,
      currentZone: "South",
      vehicle: {
        vehicleType: "ELECTRIC_SCOOTER",
        plateNumber: "KA 01 EK 4920",
        capacityKg: 35,
        batteryLevel: 92,
      },
      currentLocation: { lat: 12.9125, lng: 77.6395, lastPingAt: new Date() },
      accountStatus: "ACTIVE",
      rating: 4.9,
      shift: {
        isShiftActive: true,
        shiftStartedAt: new Date(),
        onBreak: false,
      },
      earnings: {
        todayBasePay: 0,
        todayIncentives: 0,
        todayDistancePay: 0,
        todayDeductions: 0,
        totalSettled: 12450,
        pendingSettlement: 0,
        history: [],
      },
    });
    console.log("✓ Delivery Agent created: AGT-001 (Rahul Verma)");
  } else {
    console.log("✓ Delivery Agent exists: AGT-001");
  }

  // 3. Ensure prerequisites: Customer, Seller, Category, Product, Address, OrderItem, Order
  let customer = await User.findOne({ email: "customer.blr@zoshbazaar.com" });
  if (!customer) {
    customer = await User.create({
      fullName: "Ananya Sharma",
      email: "customer.blr@zoshbazaar.com",
      mobile: 9876543211,
      role: "ROLE_CUSTOMER",
    });
    console.log("✓ Customer created: Ananya Sharma");
  }

  let seller = await Seller.findOne({ email: "seller.blr@zoshbazaar.com" });
  if (!seller) {
    seller = await Seller.create({
      sellerName: "TechGear Direct Bangalore",
      mobile: 9876543219,
      GSTIN: "29AAAAA0000A1Z5",
      email: "seller.blr@zoshbazaar.com",
      password: "password123",
      businessDetails: { businessName: "TechGear Direct Pvt Ltd" },
      accountStatus: "ACTIVE",
      isEmailVerified: true,
    });
    console.log("✓ Seller created: TechGear Direct");
  }

  let category = await Category.findOne({ categoryId: "electronics-accessories" });
  if (!category) {
    category = await Category.create({
      name: "Electronics Accessories",
      categoryId: "electronics-accessories",
      level: 1,
      isActive: true,
    });
  }

  let product = await Product.findOne({ title: "Wireless Noise Cancelling Earbuds" });
  if (!product) {
    product = await Product.create({
      title: "Wireless Noise Cancelling Earbuds",
      description: "Premium Bluetooth 5.3 Active Noise Cancelling Earbuds",
      brand: "SoundBeats",
      category: category._id,
      seller: seller._id,
      mrpPrice: 2999,
      sellingPrice: 1849,
      countInStock: 50,
      images: ["https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500"],
      status: "PUBLISHED",
    });
    console.log("✓ Product created: Wireless Earbuds");
  }

  let shippingAddress = await Address.findOne({ mobile: 9876543211 });
  if (!shippingAddress) {
    shippingAddress = await Address.create({
      name: "Ananya Sharma",
      email: "customer.blr@zoshbazaar.com",
      mobile: 9876543211,
      address: "Flat 402, Green Glen Layout, Bellandur",
      locality: "Bellandur",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: 560102,
      country: "India",
    });
  }

  let orderItem = await OrderItem.findOne({ seller: seller._id });
  if (!orderItem) {
    orderItem = await OrderItem.create({
      product: product._id,
      productTitle: product.title,
      quantity: 1,
      mrpPrice: 2999,
      sellingPrice: 1849,
      seller: seller._id,
    });
  }

  let order = await Order.findOne({ user: customer._id });
  if (!order) {
    order = await Order.create({
      user: customer._id,
      seller: seller._id,
      orderItems: [orderItem._id],
      shippingAddress: shippingAddress._id,
      totalMrpPrice: 2999,
      totalSellingPrice: 1849,
      totalItems: 1,
      orderStatus: "SHIPPED",
    });
    console.log("✓ Order created for testing");
  }

  // 4. Create Sample Shipments
  const sampleStops = [
    {
      stopIndex: 1,
      shipmentId: "SHP-2026-001",
      trackingNumber: "ZB-TRK-98401",
      customerName: "Ananya Sharma",
      customerPhone: "+91 98765 43211",
      address: "Flat 402, Green Glen Layout, Bellandur, Bengaluru",
      customerInstructions: "Ring bell twice, leave with security guard if unavailable",
      preferredDropLocation: "Front Door / Security",
      packagesCount: 1,
      paymentType: "PREPAID",
      codAmount: 0,
      codCollected: false,
      otpRequired: true,
      otp: "4826",
      location: { lat: 12.9288, lng: 77.6748 },
      timeWindow: { from: "10:00", to: "13:00" },
      status: "PENDING",
    },
    {
      stopIndex: 2,
      shipmentId: "SHP-2026-002",
      trackingNumber: "ZB-TRK-98402",
      customerName: "Vikram Malhotra",
      customerPhone: "+91 98765 43212",
      address: "Villa 12, Sobha Iris, Outer Ring Road, Devarabisanahalli, Bengaluru",
      customerInstructions: "Call before arrival, gate entry code #492",
      preferredDropLocation: "Doorstep Porch",
      packagesCount: 2,
      paymentType: "COD",
      codAmount: 1849,
      codCollected: false,
      otpRequired: true,
      otp: "5931",
      location: { lat: 12.9324, lng: 77.6892 },
      timeWindow: { from: "11:00", to: "14:00" },
      status: "PENDING",
    },
    {
      stopIndex: 3,
      shipmentId: "SHP-2026-003",
      trackingNumber: "ZB-TRK-98403",
      customerName: "Pooja Reddy",
      customerPhone: "+91 98765 43213",
      address: "House 88, 7th Sector, HSR Layout, Bengaluru",
      customerInstructions: "Please do not blow horn, infant sleeping",
      preferredDropLocation: "Shoe Rack Cabinet",
      packagesCount: 1,
      paymentType: "PREPAID",
      codAmount: 0,
      codCollected: false,
      otpRequired: false,
      otp: "1234",
      location: { lat: 12.9116, lng: 77.6445 },
      timeWindow: { from: "12:00", to: "15:00" },
      status: "PENDING",
    },
  ];

  for (const s of sampleStops) {
    let existingShipment = await Shipment.findOne({ trackingNumber: s.trackingNumber });
    if (!existingShipment) {
      existingShipment = await Shipment.create({
        shipmentId: s.shipmentId,
        trackingNumber: s.trackingNumber,
        status: ShipmentStatus.OUT_FOR_DELIVERY,
        assignedAgent: agent._id,
        originHub: hub._id,
        destinationHub: hub._id,
        currentHub: hub._id,
        order: order._id,
        seller: seller._id,
        customer: customer._id,
        deliveryAddress: {
          name: s.customerName,
          mobile: s.customerPhone.replace(/\D/g, "").slice(-10) || "9876543210",
          address: s.address,
          locality: "South Bengaluru",
          city: "Bengaluru",
          state: "Karnataka",
          pincode: 560102,
          lat: s.location.lat,
          lng: s.location.lng,
          resolutionStatus: "RESOLVED",
          confidenceScore: 0.98,
          normalizedAddress: s.address,
        },
        packageDetails: {
          packageType: "BOX",
          weightKg: 1.2,
          dimensionsCm: { length: 20, width: 15, height: 10 },
          itemsCount: s.packagesCount || 1,
        },
        items: [
          {
            productId: product._id,
            title: product.title,
            quantity: s.packagesCount || 1,
            sellingPrice: s.codAmount || 999,
          },
        ],
      });
      console.log(`✓ Created Shipment: ${s.shipmentId} (${s.trackingNumber})`);
    }
    s.shipment = existingShipment._id;
  }

  // 5. Create or replace active Delivery Route
  await DeliveryRoute.deleteMany({ agent: agent._id, status: { $in: ["PLANNED", "ACTIVE"] } });

  const count = await DeliveryRoute.countDocuments();
  const routeCode = `RT-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;

  const route = await DeliveryRoute.create({
    routeCode,
    agent: agent._id,
    hub: hub._id,
    date: new Date(),
    status: "PLANNED",
    stops: sampleStops,
    totalStops: sampleStops.length,
    completedStops: 0,
    totalDistanceKm: 14.8,
    estimatedDurationMinutes: 110,
  });

  agent.activeRoute = route._id;
  await agent.save();

  console.log(`✓ Active Route created: ${routeCode} with ${sampleStops.length} stops.`);
  console.log("Seeding completed successfully!");
  process.exit(0);
}

seedPartnerData().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
