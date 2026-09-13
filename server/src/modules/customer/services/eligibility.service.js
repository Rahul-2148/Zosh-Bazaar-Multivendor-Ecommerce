import { Order } from "../../../models/order.model.js";
import OrderStatus from "../../../domain/OrderStatus.js";
import PaymentStatus from "../../../domain/PaymentStatus.js";

/**
 * EligibilityService — server-side checks for account deletion eligibility.
 * Never rely on frontend state for eligibility.
 */
class EligibilityService {
  /**
   * Check if a user is eligible for account deletion.
   * Returns { eligible: boolean, blockers: [...] }
   */
  async checkDeletionEligibility(userId) {
    const blockers = [];

    // Run all checks in parallel for performance
    const [
      activeOrders,
      pendingReturns,
      pendingRefunds,
      pendingPaymentOrders,
    ] = await Promise.all([
      // 1. Active orders (not yet delivered/completed/cancelled)
      Order.find({
        user: userId,
        orderStatus: {
          $in: [
            OrderStatus.PENDING,
            OrderStatus.CONFIRMED,
            OrderStatus.PROCESSING,
            OrderStatus.PACKED,
            OrderStatus.SHIPPED,
            OrderStatus.OUT_FOR_DELIVERY,
          ],
        },
      })
        .select("_id orderStatus totalSellingPrice")
        .lean(),

      // 2. Pending returns
      Order.find({
        user: userId,
        orderStatus: OrderStatus.RETURN_REQUESTED,
      })
        .select("_id orderStatus")
        .lean(),

      // 3. Pending refunds (returned but not yet refunded)
      Order.find({
        user: userId,
        orderStatus: OrderStatus.RETURNED,
      })
        .select("_id orderStatus")
        .lean(),

      // 4. Pending payment orders
      Order.find({
        user: userId,
        paymentStatus: PaymentStatus.PENDING,
        orderStatus: { $nin: [OrderStatus.CANCELLED, OrderStatus.FAILED] },
      })
        .select("_id paymentStatus")
        .lean(),
    ]);

    // Build blockers list
    if (activeOrders.length > 0) {
      blockers.push({
        type: "ACTIVE_ORDER",
        message: `You have ${activeOrders.length} active order(s) that must be delivered or cancelled before your account can be deleted.`,
        referenceId: activeOrders[0]._id,
      });
    }

    if (pendingReturns.length > 0) {
      blockers.push({
        type: "PENDING_RETURN",
        message: `You have ${pendingReturns.length} pending return request(s). Please wait until they are processed.`,
        referenceId: pendingReturns[0]._id,
      });
    }

    if (pendingRefunds.length > 0) {
      blockers.push({
        type: "PENDING_REFUND",
        message: `You have ${pendingRefunds.length} returned order(s) awaiting refund. Please wait until refunds are completed.`,
        referenceId: pendingRefunds[0]._id,
      });
    }

    if (pendingPaymentOrders.length > 0) {
      blockers.push({
        type: "PENDING_PAYMENT",
        message: `You have ${pendingPaymentOrders.length} order(s) with pending payments that must be resolved.`,
        referenceId: pendingPaymentOrders[0]._id,
      });
    }

    return {
      eligible: blockers.length === 0,
      blockers,
      checkedAt: new Date(),
    };
  }
}

export default new EligibilityService();
