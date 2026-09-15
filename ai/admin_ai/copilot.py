from typing import Any


class AdminAICopilot:
    """Operational insights, refund anomaly detection, and catalog health copilot for administrators."""

    def diagnose_category_trend(self, category_name: str, weekly_conversion_drop_pct: float) -> dict[str, Any]:
        potential_causes = []
        if weekly_conversion_drop_pct > 10:
            potential_causes.append("Increased out-of-stock rate among top 5 bestselling SKUs in this department.")
            potential_causes.append("Competitor price reduction on comparable items across third-party channels.")

        return {
            "category": category_name,
            "anomalyDetected": weekly_conversion_drop_pct > 8,
            "dropPercentage": f"{weekly_conversion_drop_pct}%",
            "rootCauseHypotheses": potential_causes,
            "recommendedActions": [
                "Notify top sellers to replenish low-stock inventory variants.",
                "Review category promotion banner placement on client homepage.",
                "Trigger temporary promotional coupon for price-sensitive shoppers.",
            ],
            "confidence": 0.85,
        }
