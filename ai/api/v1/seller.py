from typing import Any

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from ai.forecasting.demand_forecast import DemandForecastingEngine
from ai.pricing.dynamic_pricing import DynamicPricingEngine
from ai.seller_ai.insights import SellerAIAdvisor

router = APIRouter(prefix="/seller", tags=["Seller AI"])

advisor = SellerAIAdvisor()
pricing_engine = DynamicPricingEngine()
forecasting_engine = DemandForecastingEngine()


class ListingOptimizationRequest(BaseModel):
    title: str
    category: str
    description: str = ""
    brand: str = "Zosh Certified"


@router.post("/optimize-listing")
def optimize_listing(payload: ListingOptimizationRequest) -> dict[str, Any]:
    return advisor.optimize_listing(
        title=payload.title,
        category=payload.category,
        description=payload.description,
        brand=payload.brand,
    )


@router.get("/pricing-simulation/{productId}")
def simulate_pricing(productId: str) -> dict[str, Any]:
    res = pricing_engine.simulate_optimal_price(productId)
    if "error" in res:
        raise HTTPException(status_code=404, detail=res["error"])
    return res


@router.get("/inventory-forecast/{productId}")
def forecast_inventory(productId: str, horizonDays: int = Query(default=30, ge=7, le=90)) -> dict[str, Any]:
    res = forecasting_engine.forecast_item_demand(productId, horizon_days=horizonDays)
    if "error" in res:
        raise HTTPException(status_code=404, detail=res["error"])
    return res


@router.get("/insights")
def get_seller_insights(sellerId: str | None = None) -> dict[str, Any]:
    """Generates comprehensive seller operational cards: revenue opportunities, inventory risks, and catalog health."""
    return {
        "sellerId": sellerId or "current_seller",
        "healthScore": 92,
        "cards": [
            {
                "id": "rev_opp_1",
                "type": "REVENUE_OPPORTUNITY",
                "title": "Bundling & Add-on Lift",
                "description": "Shoppers buying 'Noise Cancelling Headphones' have 41% affinity for 'Braided Aux Cable'. Create a bundle promotion.",
                "impact": "+14% Basket Size",
                "confidence": 0.89,
                "actionType": "CREATE_PROMOTION",
                "actionLabel": "Configure Bundle Discount",
            },
            {
                "id": "inv_risk_1",
                "type": "INVENTORY_RISK",
                "title": "Stockout Imminent (6 Days)",
                "description": "Product 'Active Noise Cancelling Over-Ear Headphones' has 18 units remaining with a daily velocity of 3.2 units.",
                "impact": "Prevent ₹24,000 lost sales",
                "confidence": 0.94,
                "actionType": "REORDER_INVENTORY",
                "actionLabel": "Initiate Inward PO (50 units)",
            },
            {
                "id": "cat_qual_1",
                "type": "CATALOG_QUALITY",
                "title": "High Return Risk on Saree Variant",
                "description": "Reviews indicate color discrepancy between image #2 and delivered item. Update photography to reduce returns by 22%.",
                "impact": "-22% Return Rate",
                "confidence": 0.85,
                "actionType": "UPDATE_LISTING",
                "actionLabel": "Review Image Assets",
            },
            {
                "id": "price_opt_1",
                "type": "PRICING_OPPORTUNITY",
                "title": "Price Elasticity Recommendation",
                "description": "Demand for 'Trail Runner Pro' is resilient. Simulating +4% price adjustment preserves margin without affecting top-10 rank.",
                "impact": "+₹180 Profit/Unit",
                "confidence": 0.82,
                "actionType": "SIMULATE_PRICE",
                "actionLabel": "Run Elasticity Simulation",
            },
        ],
    }
