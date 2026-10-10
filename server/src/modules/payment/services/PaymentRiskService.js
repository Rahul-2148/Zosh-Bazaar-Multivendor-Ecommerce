import { redisClient } from "../../../config/redis.service.js";
import { PaymentAttempt } from "../models/paymentAttempt.model.js";
import PaymentAttemptStatus from "../domain/PaymentAttemptStatus.js";

/**
 * Payment Risk & Velocity Guard Service
 * Inspects transaction velocity, consecutive failures, and amount thresholds.
 */
class PaymentRiskService {
  /**
   * Evaluate transaction risk score for a customer.
   * @param {Object} params
   * @param {string} params.userId
   * @param {number} params.amount
   * @param {string} [params.ipAddress]
   * @param {string} [params.rail]
   */
  async evaluateRisk({ userId, amount, ipAddress = "127.0.0.1", rail: _rail = "UPI" }) {
    let riskScore = 0;
    const reasons = [];

    const userKey = `risk:velocity:user:${userId}`;
    const ipKey = `risk:velocity:ip:${ipAddress}`;

    // 1. Transaction Velocity Checks (Attempts in last 10 minutes)
    const [userCountRaw, ipCountRaw] = await Promise.all([
      redisClient.get(userKey),
      redisClient.get(ipKey),
    ]);

    const userAttempts = Number(userCountRaw || 0);
    const ipAttempts = Number(ipCountRaw || 0);

    if (userAttempts >= 6) {
      riskScore += 40;
      reasons.push("Excessive payment attempts by user in short window");
    } else if (userAttempts >= 3) {
      riskScore += 15;
    }

    if (ipAttempts >= 12) {
      riskScore += 50;
      reasons.push("High checkout volume detected from client IP address");
    }

    // 2. Consecutive Failed Attempts in MongoDB
    const recentFailures = await PaymentAttempt.countDocuments({
      status: { $in: [PaymentAttemptStatus.FAILED, PaymentAttemptStatus.TIMED_OUT] },
      createdAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) },
      "metadata.userId": String(userId),
    });

    if (recentFailures >= 4) {
      riskScore += 35;
      reasons.push(`User has ${recentFailures} recent failed payment attempts`);
    }

    // 3. High Order Value Threshold
    if (amount > 100000) {
      riskScore += 25;
      reasons.push("Transaction value exceeds high-value threshold (₹1,00,000)");
    }

    // Increment velocity counters in Redis (10 minutes TTL)
    await Promise.all([
      redisClient.set(userKey, userAttempts + 1, 600),
      redisClient.set(ipKey, ipAttempts + 1, 600),
    ]);

    let riskState = "APPROVED";
    let decision = "ALLOW";

    if (riskScore >= 75) {
      riskState = "REJECTED";
      decision = "BLOCK";
    } else if (riskScore >= 50) {
      riskState = "FLAGGED";
      decision = "REQUIRE_ADDITIONAL_AUTH";
    } else if (riskScore >= 40) {
      riskState = "FLAGGED";
      decision = "REVIEW";
    }

    return {
      decision,
      riskScore,
      riskState,
      reasons,
      evaluatedAt: new Date(),
    };
  }
}

export const RiskDecision = Object.freeze({
  ALLOW: "ALLOW",
  REVIEW: "REVIEW",
  BLOCK: "BLOCK",
  REQUIRE_ADDITIONAL_AUTH: "REQUIRE_ADDITIONAL_AUTH",
});


export const paymentRiskService = new PaymentRiskService();
export default paymentRiskService;
