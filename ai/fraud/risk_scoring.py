from typing import Any


class FraudRiskScorer:
    """Evaluates checkout, return, and payment velocity anomalies for human-in-the-loop review."""

    def evaluate_order_risk(
        self,
        order_amount: float,
        items_count: int,
        account_age_days: int = 30,
        recent_order_frequency_24h: int = 1,
        coupon_applied: str | None = None,
        payment_method: str = "CARD",
    ) -> dict[str, Any]:
        risk_score = 0.05  # Base low risk
        flags: list[str] = []

        if account_age_days < 1 and order_amount > 25000:
            risk_score += 0.35
            flags.append("HIGH_VALUE_NEW_ACCOUNT")

        if recent_order_frequency_24h > 5:
            risk_score += 0.30
            flags.append("RAPID_ORDER_BURST")

        if items_count > 15:
            risk_score += 0.15
            flags.append("BULK_QUANTITY_ANOMALY")

        decision = "AUTO_APPROVE"
        if risk_score > 0.60:
            decision = "FLAG_FOR_MANUAL_AUDIT"
        elif risk_score > 0.35:
            decision = "REQUIRE_2FA_OR_OTP"

        return {
            "riskScore": round(min(risk_score, 0.99), 2),
            "riskLevel": "HIGH" if risk_score > 0.60 else ("MEDIUM" if risk_score > 0.35 else "LOW"),
            "decision": decision,
            "flags": flags,
            "autoBanAllowed": False,
        }
