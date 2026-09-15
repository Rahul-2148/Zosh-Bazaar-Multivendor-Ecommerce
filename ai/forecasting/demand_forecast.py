import math

from ai.feature_store.store import FeatureStore, get_feature_store


class DemandForecastingEngine:
    """Predicts future item demand velocity, days-of-inventory, and stockout risk."""

    def __init__(self, feature_store: FeatureStore | None = None):
        self.feature_store = feature_store or get_feature_store()

    def forecast_item_demand(self, product_id: str, horizon_days: int = 30) -> dict:
        item = self.feature_store.get_item_features(product_id)
        if not item:
            daily_velocity = 2.5
            current_stock = 30
            title = f"Catalog Item ({product_id})"
            tags = []
        else:
            daily_velocity = max(item.salesVelocity30d / 30.0, 0.5)
            current_stock = item.countInStock
            title = item.title
            tags = item.tags

        # Seasonal multiplier (e.g. festivals, fashion sales)
        seasonal_multiplier = 1.15 if "saree" in tags or "blazer" in tags else 1.05

        predicted_daily_demand = daily_velocity * seasonal_multiplier
        predicted_total_demand = math.ceil(predicted_daily_demand * horizon_days)

        days_until_stockout = math.floor(current_stock / predicted_daily_demand) if predicted_daily_demand > 0 else 999

        stockout_risk = "HIGH" if days_until_stockout < 7 else ("MEDIUM" if days_until_stockout < 15 else "LOW")
        recommended_reorder_units = max(0, predicted_total_demand - current_stock)

        return {
            "productId": product_id,
            "title": title,
            "currentStock": current_stock,
            "horizonDays": horizon_days,
            "predictedDailyDemand": round(predicted_daily_demand, 2),
            "predictedTotalDemand": predicted_total_demand,
            "daysUntilStockout": days_until_stockout,
            "stockoutRisk": stockout_risk,
            "recommendedReorderUnits": recommended_reorder_units,
            "reorderRecommended": stockout_risk in ["HIGH", "MEDIUM"],
        }
