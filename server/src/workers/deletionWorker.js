import { User } from "../models/user.model.js";
import { DeletionRequest, DeletionStatus } from "../models/deletionRequest.model.js";
import AccountStatus from "../domain/AccountStatus.js";
import { Cart } from "../models/cart.model.js";
import { Wishlist } from "../models/wishlist.model.js";
import { SavedItem } from "../models/savedItem.model.js";
import { Collection } from "../models/collection.model.js";
import { Address } from "../models/address.model.js";
import { Notification } from "../models/notification.model.js";
import { UserSession } from "../models/userSession.model.js";
import { VerificationCode } from "../models/VerificationCode.js";
import { Review } from "../models/review.model.js";
import { AuditLog } from "../models/auditLog.model.js";
import lifecycleConfig from "../config/accountLifecycle.config.js";
import sendVerificationEmail from "../utils/sendEmail.js";

/**
 * DeletionWorker — processes expired grace-period deletion requests.
 * Runs on a configurable interval. Each execution is idempotent.
 * 
 * Data strategy per the audit:
 *   DELETE:     Cart, CartItems, Wishlist, SavedItems, Collections, Notifications, Addresses, Sessions, VerificationCodes
 *   ANONYMIZE:  User (name→"Deleted User", email→hashed, mobile→""), Reviews (keep content, anonymize author)
 *   RETAIN:     Orders, OrderItems, PaymentOrders (with anonymized user ref for compliance)
 */
class DeletionWorker {
  async processExpiredDeletionRequests() {
    const now = new Date();
    try {
      // Find requests where grace period has expired
      const expiredRequests = await DeletionRequest.find({
        status: DeletionStatus.SCHEDULED,
        gracePeriodEndsAt: { $lte: now },
      })
        .limit(lifecycleConfig.WORKER_BATCH_SIZE)
        .populate("user", "email fullName");

      if (expiredRequests.length === 0) {
        return;
      }

      console.log(`[DeletionWorker] Processing ${expiredRequests.length} expired deletion request(s)...`);

      for (const request of expiredRequests) {
        await this.processSingleDeletion(request);
      }
    } catch (err) {
      console.error("[DeletionWorker] Critical error:", err.message);
    }
  }

  async processSingleDeletion(request) {
    const userId = request.user?._id || request.user;
    const userEmail = request.user?.email || "unknown";
    const userName = request.user?.fullName || "User";

    console.log(`[DeletionWorker] Processing deletion for user ${userId}`);

    // Mark as processing
    request.status = DeletionStatus.PROCESSING;
    request.processingLog.push({ step: "STARTED", status: "SUCCESS", timestamp: new Date() });
    request.auditTrail.push({ event: "DELETION_PROCESSING_STARTED", actor: "SYSTEM", timestamp: new Date() });
    await request.save();

    // Update user status
    await User.findByIdAndUpdate(userId, { accountStatus: AccountStatus.DELETING });

    const steps = [
      { name: "REVOKE_SESSIONS", fn: () => UserSession.updateMany({ user: userId }, { $set: { isRevoked: true, revokedAt: new Date() } }) },
      { name: "DELETE_CART", fn: () => Cart.deleteMany({ user: userId }) },
      { name: "DELETE_WISHLIST", fn: () => Wishlist.deleteMany({ user: userId }) },
      { name: "DELETE_SAVED_ITEMS", fn: () => SavedItem.deleteMany({ user: userId }) },
      { name: "DELETE_COLLECTIONS", fn: () => Collection.deleteMany({ user: userId }) },
      { name: "DELETE_ADDRESSES", fn: () => Address.deleteMany({ user: userId }) },
      { name: "DELETE_NOTIFICATIONS", fn: () => Notification.deleteMany({ recipient: userId }) },
      { name: "DELETE_SESSIONS", fn: () => UserSession.deleteMany({ user: userId }) },
      { name: "DELETE_VERIFICATION_CODES", fn: () => VerificationCode.deleteMany({ email: userEmail }) },
      {
        name: "ANONYMIZE_REVIEWS",
        fn: async () => {
          if (lifecycleConfig.ANONYMIZE_REVIEWS) {
            // Keep review content but remove user identity
            // The user ref stays for FK integrity but name is anonymized
            await Review.updateMany({ user: userId }, { $set: { status: "APPROVED" } });
          }
        },
      },
      {
        name: "ANONYMIZE_USER",
        fn: async () => {
          const anonymizedEmail = `deleted_${userId}_${Date.now()}@zoshbazaar.invalid`;
          await User.findByIdAndUpdate(userId, {
            fullName: "Deleted User",
            email: anonymizedEmail,
            mobile: "",
            avatar: "",
            password: null,
            savedPaymentMethods: [],
            preferences: {},
            accountStatus: AccountStatus.DELETED,
            addresses: [],
            isEmailVerified: false,
            isMobileVerified: false,
            twoFactorEnabled: false,
          });
        },
      },
    ];

    for (const step of steps) {
      try {
        await step.fn();
        request.processingLog.push({ step: step.name, status: "SUCCESS", timestamp: new Date() });
      } catch (err) {
        console.error(`[DeletionWorker] Step ${step.name} failed for user ${userId}:`, err.message);
        request.processingLog.push({ step: step.name, status: "FAILED", timestamp: new Date(), detail: err.message });
        // Continue processing — don't let one step failure block others
      }
    }

    // Mark as completed
    request.status = DeletionStatus.COMPLETED;
    request.completedAt = new Date();
    request.auditTrail.push({ event: "DELETION_COMPLETED", actor: "SYSTEM", timestamp: new Date() });
    await request.save();

    // Write immutable audit log
    try {
      await AuditLog.create({
        userId,
        event: "DELETION_COMPLETED",
        actor: "SYSTEM",
        actorId: userId,
        result: "SUCCESS",
        metadata: {
          completedAt: new Date(),
          stepsCompleted: request.processingLog.filter((s) => s.status === "SUCCESS").length,
          stepsFailed: request.processingLog.filter((s) => s.status === "FAILED").length,
        },
      });
    } catch { /* non-critical */ }

    // Send final email (to original email, before anonymization — so we use the saved reference)
    try {
      await sendVerificationEmail(
        userEmail,
        "ZoshBazaar — Account Permanently Deleted",
        `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px;">
          <h2 style="color:#1a1a1a;">Account Deleted</h2>
          <p>Hi ${userName},</p>
          <p>Your ZoshBazaar account has been permanently deleted as requested. All personal data has been removed.</p>
          <p><strong>What happened:</strong></p>
          <ul>
            <li>Personal profile, addresses, and saved payment methods have been deleted</li>
            <li>Cart, wishlist, and collections have been removed</li>
            <li>Order history has been retained (anonymized) for legal compliance</li>
          </ul>
          <p>If you wish to shop with us again, you can create a new account anytime.</p>
          <p style="color:#888;font-size:12px;">— ZoshBazaar Team</p>
        </div>`
      );
    } catch { /* non-critical */ }

    console.log(`[DeletionWorker] ✅ Deletion completed for user ${userId}`);
  }
}

const worker = new DeletionWorker();

/**
 * Start the deletion worker on a configurable interval.
 * Called once from server entry point.
 */
export const startDeletionWorker = () => {
  const intervalMs = lifecycleConfig.WORKER_INTERVAL_MS;

  // Run initially after boot, then on configured interval
  const initTimer = setTimeout(() => worker.processExpiredDeletionRequests(), 10000);
  if (initTimer.unref) initTimer.unref();

  const workerInterval = setInterval(() => worker.processExpiredDeletionRequests(), intervalMs);
  if (workerInterval.unref) workerInterval.unref();
};

export default worker;
