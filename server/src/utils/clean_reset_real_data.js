import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

import { Order } from "../models/order.model.js";
import { OrderItem } from "../models/orderItem.model.js";
import Transaction from "../models/transaction.model.js";
import PaymentOrder from "../models/paymentOrder.model.js";
import { Shipment } from "../models/shipment.model.js";
import { ShipmentEvent } from "../models/shipmentEvent.model.js";
import { DeliveryRoute } from "../models/deliveryRoute.model.js";
import { LogisticsException } from "../models/logisticsException.model.js";
import { Manifest } from "../models/manifest.model.js";
import { Cart } from "../models/cart.model.js";
import { CartItem } from "../models/cartItem.model.js";
import { Review } from "../models/review.model.js";
import { SellerReport } from "../models/sellerReport.model.js";
import { DeliveryAgent } from "../models/deliveryAgent.model.js";
import { DeliveryHub } from "../models/deliveryHub.model.js";
import { Category } from "../models/category.model.js";
import { Product } from "../models/product.model.js";
import { Seller } from "../models/seller.model.js";
import { User } from "../models/user.model.js";
import { AgentStatus } from "../domain/LogisticsStatus.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/Zosh-Bazaar-Ecommerce_Multivendor";

async function cleanResetRealData() {
  console.log("==================================================");
  console.log("🧹 STARTING ZERO-FAKE OPERATIONAL DATA RESET");
  console.log("==================================================");

  await mongoose.connect(MONGO_URI);
  console.log("✓ Connected to MongoDB:", MONGO_URI);

  // 1. Purge all synthetic operational transactions
  const deletedOrders = await Order.deleteMany({});
  console.log(`✓ Deleted Orders: ${deletedOrders.deletedCount}`);

  const deletedOrderItems = await OrderItem.deleteMany({});
  console.log(`✓ Deleted OrderItems: ${deletedOrderItems.deletedCount}`);

  const deletedTransactions = await Transaction.deleteMany({});
  console.log(`✓ Deleted Transactions: ${deletedTransactions.deletedCount}`);

  const deletedPaymentOrders = await PaymentOrder.deleteMany({});
  console.log(`✓ Deleted PaymentOrders: ${deletedPaymentOrders.deletedCount}`);

  const deletedShipments = await Shipment.deleteMany({});
  console.log(`✓ Deleted Shipments: ${deletedShipments.deletedCount}`);

  const deletedShipmentEvents = await ShipmentEvent.deleteMany({});
  console.log(`✓ Deleted ShipmentEvents: ${deletedShipmentEvents.deletedCount}`);

  const deletedDeliveryRoutes = await DeliveryRoute.deleteMany({});
  console.log(`✓ Deleted DeliveryRoutes: ${deletedDeliveryRoutes.deletedCount}`);

  const deletedExceptions = await LogisticsException.deleteMany({});
  console.log(`✓ Deleted LogisticsExceptions (Incidents): ${deletedExceptions.deletedCount}`);

  const deletedManifests = await Manifest.deleteMany({});
  console.log(`✓ Deleted Manifests: ${deletedManifests.deletedCount}`);

  const deletedCarts = await Cart.deleteMany({});
  console.log(`✓ Cleared Carts: ${deletedCarts.deletedCount}`);

  const deletedCartItems = await CartItem.deleteMany({});
  console.log(`✓ Cleared CartItems: ${deletedCartItems.deletedCount}`);

  const deletedReviews = await Review.deleteMany({});
  console.log(`✓ Cleared Reviews: ${deletedReviews.deletedCount}`);

  const deletedSellerReports = await SellerReport.deleteMany({});
  console.log(`✓ Cleared Synthetic SellerReports: ${deletedSellerReports.deletedCount}`);

  // 2. Reset Delivery Agents: Clean live shift and 0 routes, ready for real dispatch
  const agentUpdateResult = await DeliveryAgent.updateMany(
    {},
    {
      $set: {
        activeRoute: null,
        status: AgentStatus.AVAILABLE,
        shift: {
          isShiftActive: false,
          shiftStartedAt: null,
          shiftEndedAt: null,
          onBreak: false,
        },
        earnings: {
          todayBasePay: 0,
          todayIncentives: 0,
          todayDistancePay: 0,
          todayDeductions: 0,
          totalSettled: 0,
          pendingSettlement: 0,
          history: [],
        },
      },
    }
  );
  console.log(`✓ Reset Delivery Agents to Clean Available State: ${agentUpdateResult.modifiedCount}`);

  // 3. Clean synthetic test customers
  const deletedTestCustomers = await User.deleteMany({
    email: { $in: ["customer.blr@zoshbazaar.com", "test@test.com"] },
  });
  console.log(`✓ Cleared Synthetic Test Users: ${deletedTestCustomers.deletedCount}`);

  // 4. Verify Master Data Integrity
  const hubCount = await DeliveryHub.countDocuments();
  const catCount = await Category.countDocuments();
  const prodCount = await Product.countDocuments();
  const sellerCount = await Seller.countDocuments();
  const adminCount = await User.countDocuments({ role: "ROLE_ADMIN" });
  const agentCount = await DeliveryAgent.countDocuments();

  console.log("\n--------------------------------------------------");
  console.log("📊 MASTER FOUNDATION DATA INTEGRITY CHECK:");
  console.log(`- Admin Users:       ${adminCount}`);
  console.log(`- Delivery Hubs:     ${hubCount}`);
  console.log(`- Verified Sellers:  ${sellerCount}`);
  console.log(`- Categories:        ${catCount}`);
  console.log(`- Published Products:${prodCount}`);
  console.log(`- Delivery Partners: ${agentCount}`);
  console.log("--------------------------------------------------");

  console.log("\n--------------------------------------------------");
  console.log("🎯 OPERATIONAL TRANSACTION DATA COUNTS (MUST BE ZERO):");
  console.log(`- Orders:              ${await Order.countDocuments()}`);
  console.log(`- Shipments:           ${await Shipment.countDocuments()}`);
  console.log(`- Routes:              ${await DeliveryRoute.countDocuments()}`);
  console.log(`- Incidents/Exceptions:${await LogisticsException.countDocuments()}`);
  console.log(`- Transactions:        ${await Transaction.countDocuments()}`);
  console.log("--------------------------------------------------");

  console.log("\n✨ DATABASE IS NOW 100% CLEAN AND READY FOR REAL ORGANIC DATA FLOW!");
  console.log("==================================================");

  await mongoose.disconnect();
  process.exit(0);
}

cleanResetRealData().catch((err) => {
  console.error("Clean reset error:", err);
  process.exit(1);
});
