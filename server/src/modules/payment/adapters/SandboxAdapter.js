import PaymentRailAdapter from "./PaymentRailAdapter.js";
import PaymentAttemptStatus from "../domain/PaymentAttemptStatus.js";

/**
 * Deterministic Sandbox Rail Adapter
 * Simulates real-world payment gateway behaviors for testing and development:
 * SUCCESS, FAILURE, PENDING, TIMEOUT, RETRY, REVERSAL, REFUND, PARTIAL REFUND.
 */
export class SandboxAdapter extends PaymentRailAdapter {
  constructor() {
    super("SANDBOX", {
      supportsAuthorization: true,
      supportsCapture: true,
      supportsRefund: true,
      supportsPartialRefund: true,
      supportsWebhook: false,
      supportsSettlement: false,
      supportsReconciliation: true,
      supportsUPI: true,
      supportsCards: true,
      supportsNetBanking: true,
      supportsCOD: false,
      environment: "sandbox",
      productionReady: false,
    });
  }

  _determineOutcome(params) {
    const meta = params.metadata || {};
    const payload = params.payload || {};
    const amount = Number(params.amount || params.attempt?.amount || 0);

    // Explicit override in metadata or payload takes highest precedence
    if (params.scenario) return params.scenario.toUpperCase();
    if (meta.scenario) return meta.scenario.toUpperCase();
    if (payload.scenario) return payload.scenario.toUpperCase();
    if (meta.simulationMode) return meta.simulationMode.toUpperCase();
    if (meta.simMode) return meta.simMode.toUpperCase();
    if (payload.simulationMode) return payload.simulationMode.toUpperCase();
    if (payload.simMode) return payload.simMode.toUpperCase();

    // Deterministic simulation by fractional amounts or digits:
    // *.99 -> TIMEOUT
    // *.98 -> FAILURE
    // *.97 -> PENDING
    const decimal = Math.round((amount - Math.floor(amount)) * 100);
    if (decimal === 99) return "TIMEOUT";
    if (decimal === 98) return "FAILURE";
    if (decimal === 97) return "PENDING";

    return "SUCCESS";
  }

  async createIntent({ intent: _intent, attempt, user: _user, metadata, scenario }) {
    const simOutcome = this._determineOutcome({ attempt, metadata, amount: attempt?.amount, scenario });
    const providerReference = `sbx_pay_${attempt?.attemptId || Date.now()}_${Date.now()}`;

    if (simOutcome === "TIMEOUT") {
      return {
        providerReference,
        status: PaymentAttemptStatus.TIMED_OUT,
        success: false,
        failureCode: "GATEWAY_TIMEOUT",
        failureReason: "Sandbox simulated bank network timeout",
        actionPayload: { simOutcome: "TIMEOUT" },
      };
    }

    if (simOutcome === "FAILURE") {
      return {
        providerReference,
        status: PaymentAttemptStatus.FAILED,
        success: false,
        failureCode: "SANDBOX_SIMULATED_DECLINE",
        failureReason: "Sandbox simulated card/VPA decline",
        actionPayload: { simOutcome: "FAILURE" },
      };
    }

    if (simOutcome === "PENDING") {
      return {
        providerReference,
        status: PaymentAttemptStatus.PENDING,
        success: false,
        actionPayload: {
          simOutcome: "PENDING",
          verificationUrl: `http://localhost:5000/api/v1/payment/sandbox-verify/${providerReference}`,
          qrString: `upi://pay?pa=zoshbazaar@sandbox&pn=Zosh%20Bazaar&am=${attempt?.amount || 0}&tr=${providerReference}`,
        },
      };
    }

    // Default SUCCESS
    return {
      providerReference,
      status: PaymentAttemptStatus.CAPTURED,
      success: true,
      actionPayload: {
        simOutcome: "SUCCESS",
        authCode: `AUTH_${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        qrString: `upi://pay?pa=zoshbazaar@sandbox&pn=Zosh%20Bazaar&am=${attempt?.amount || 0}&tr=${providerReference}`,
      },
    };
  }

  async authorize(arg1, arg2) {
    const attempt = arg1?.attempt || arg1 || {};
    const payload = arg1?.payload || arg2 || {};
    const providerReference = attempt.providerReference || `sbx_auth_${Date.now()}`;
    const simOutcome = this._determineOutcome({
      attempt,
      payload,
      amount: attempt.amount,
      metadata: attempt.metadata,
    });

    if (simOutcome === "FAILURE") {
      return {
        status: PaymentAttemptStatus.FAILED,
        authorized: false,
        failureCode: "SANDBOX_SIMULATED_DECLINE",
        failureReason: "Sandbox authorization rejected by issuer bank",
        providerReference,
      };
    }

    if (simOutcome === "PENDING") {
      return {
        status: PaymentAttemptStatus.PENDING,
        authorized: false,
        providerReference,
      };
    }

    if (simOutcome === "TIMEOUT") {
      return {
        status: PaymentAttemptStatus.TIMED_OUT,
        authorized: false,
        failureCode: "GATEWAY_TIMEOUT",
        failureReason: "Sandbox simulated bank network timeout",
        providerReference,
      };
    }

    return {
      status: PaymentAttemptStatus.AUTHORIZED,
      authorized: true,
      providerReference,
    };
  }

  async capture(arg1, arg2) {
    let attempt, payload, providerReference;
    if (typeof arg1 === "string") {
      providerReference = arg1;
      attempt = { providerReference, amount: arg2 };
      payload = {};
    } else {
      attempt = arg1?.attempt || arg1 || {};
      payload = arg1?.payload || arg2 || {};
      providerReference = attempt.providerReference || `sbx_cap_${Date.now()}`;
    }

    const simOutcome = this._determineOutcome({ attempt, payload, amount: attempt.amount });
    if (simOutcome === "FAILURE") {
      return {
        status: PaymentAttemptStatus.FAILED,
        captured: false,
        failureCode: "CAPTURE_FAILED",
        failureReason: "Sandbox funds capture declined by card network",
        providerReference,
      };
    }

    return {
      status: PaymentAttemptStatus.CAPTURED,
      captured: true,
      providerReference,
    };
  }

  async getStatus({ attempt }) {
    const simOutcome = this._determineOutcome({ attempt, amount: attempt?.amount });
    if (simOutcome === "FAILURE") {
      return {
        status: PaymentAttemptStatus.FAILED,
        providerReference: attempt.providerReference,
        failureReason: "Sandbox verification confirmed failure",
      };
    }
    if (simOutcome === "PENDING") {
      return {
        status: PaymentAttemptStatus.PENDING,
        providerReference: attempt.providerReference,
      };
    }

    return {
      status: PaymentAttemptStatus.CAPTURED,
      providerReference: attempt.providerReference,
    };
  }

  async cancel({ attempt, reason }) {
    return {
      cancelled: true,
      status: PaymentAttemptStatus.VOIDED,
      providerReference: attempt.providerReference,
      reason: reason || "Sandbox attempt voided",
    };
  }

  async refund(arg1, arg2, arg3) {
    let refundObj, refundAmount, _providerReference;
    if (typeof arg1 === "string") {
      _providerReference = arg1;
      refundAmount = arg2;
      refundObj = {
        refundId: `sbx_ref_${Date.now()}`,
        amount: refundAmount,
        currency: "INR",
        metadata: { reason: arg3 },
      };
    } else {
      refundObj = arg1?.refund || arg1 || {};
      refundAmount = refundObj.amount;
      _providerReference = arg1?.attempt?.providerReference;
    }

    const outcome = this._determineOutcome({ payload: refundObj.metadata, amount: refundAmount });
    if (outcome === "FAILURE") {
      const err = new Error("Sandbox simulated refund decline by acquiring bank");
      err.code = "REFUND_DECLINED";
      throw err;
    }

    const gatewayRefundId = `sbx_ref_${refundObj.refundId || Date.now()}_${Date.now()}`;
    return {
      gatewayRefundId,
      status: "COMPLETED",
      amount: refundAmount,
      refundAmount,
      currency: refundObj.currency || "INR",
    };
  }

  async getRefundStatus({ refund }) {
    return {
      gatewayRefundId: refund.gatewayRefundId || `sbx_ref_${Date.now()}`,
      status: "COMPLETED",
    };
  }

  async verifyWebhook({ payload, signature, rawBody: _rawBody }) {
    // Sandbox webhooks require header "x-sandbox-signature" === "valid_sandbox_sig" or pass in test env
    const isValid = signature === "valid_sandbox_sig" || process.env.NODE_ENV !== "production";
    return {
      isValid,
      eventId: payload?.id || `sbx_evt_${Date.now()}`,
      eventType: payload?.event || "payment.captured",
      paymentReference: payload?.paymentId || payload?.payload?.payment?.entity?.id,
      normalizedStatus: payload?.status === "failed" ? PaymentAttemptStatus.FAILED : PaymentAttemptStatus.CAPTURED,
    };
  }

  async reconcile({ startDate: _startDate, endDate: _endDate }) {
    return [
      {
        referenceId: `sbx_feed_01`,
        amount: 2499,
        status: "SETTLED",
        fee: 49.98,
        tax: 9.00,
        settledAt: new Date(),
      },
    ];
  }
}

export default new SandboxAdapter();
