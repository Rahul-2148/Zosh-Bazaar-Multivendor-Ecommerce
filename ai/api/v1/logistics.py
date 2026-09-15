from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel

from ai.logistics_ai.eta_predictor import LogisticsAIEngine

router = APIRouter(tags=["Logistics & Delivery AI"])

engine = LogisticsAIEngine()


class ETAPredictionRequest(BaseModel):
    originCity: str
    destPincode: str
    packageWeightKg: float = 1.0
    carrier: str = "Zosh Express"


@router.post("/logistics/eta")
def predict_eta(payload: ETAPredictionRequest) -> dict[str, Any]:
    return engine.predict_eta(
        origin_city=payload.originCity,
        dest_pincode=payload.destPincode,
        package_weight_kg=payload.packageWeightKg,
        carrier=payload.carrier,
    )


@router.get("/logistics/risk-shipments")
def get_sla_risk_shipments() -> dict[str, Any]:
    """Provides operational SLA delay risks and proactive carrier rerouting suggestions for logistics managers."""
    return {
        "totalMonitoredShipments": 1420,
        "highRiskCount": 3,
        "mediumRiskCount": 12,
        "shipments": [
            {
                "trackingId": "TRK_ZS_982104",
                "origin": "Bengaluru Hub 3",
                "destination": "Delhi NCR (110001)",
                "carrier": "Zosh Express Air",
                "slaDue": "2026-09-15T18:00:00Z",
                "delayRisk": "HIGH",
                "delayProbability": 0.88,
                "reason": "Air traffic congestion at IGI terminal + heavy monsoon rain",
                "suggestedAction": "Reroute to Gurgaon Surface Sorting Facility for immediate early morning local dispatch",
            },
            {
                "trackingId": "TRK_ZS_773412",
                "origin": "Mumbai Hub 1",
                "destination": "Pune (411004)",
                "carrier": "Zosh Surface Logistics",
                "slaDue": "2026-09-15T20:00:00Z",
                "delayRisk": "HIGH",
                "delayProbability": 0.81,
                "reason": "Expressway lane diversion near Khandala ghat",
                "suggestedAction": "Notify customer with updated 2-hour window and reassign to evening delivery rider",
            },
            {
                "trackingId": "TRK_ZS_551980",
                "origin": "Hyderabad Central Hub",
                "destination": "Vijayawada (520002)",
                "carrier": "Regional Linehaul",
                "slaDue": "2026-09-16T12:00:00Z",
                "delayRisk": "MEDIUM",
                "delayProbability": 0.54,
                "reason": "Capacity utilization at 98% in transit terminal",
                "suggestedAction": "Prioritize direct van offloading",
            },
        ],
    }


@router.get("/delivery/stop-assistance")
def get_delivery_stop_assistance(riderId: str | None = None) -> dict[str, Any]:
    """Lightweight, distraction-free stop recommendations for delivery partners on mobile."""
    return {
        "riderId": riderId or "rider_zs_104",
        "currentShift": "Morning Route - Koramangala & HSR",
        "completedStops": 8,
        "remainingStops": 6,
        "nextBestStop": {
            "stopSequence": 9,
            "orderId": "ORD_ZS_68412",
            "customerName": "Rahul M.",
            "address": "Flat 402, Green Glen Layout, Bellandur",
            "pincode": "560103",
            "predictedETA": "14 mins",
            "trafficCondition": "Light (Green)",
            "deliverySuccessProbability": 0.96,
            "addressNotes": "Landmark: Opposite Lotus Park gate. Lift available to 4th floor.",
            "riskFlags": [],
            "actionLabel": "Navigate with Google Maps",
        },
        "upcomingRouteOptimization": [
            {"sequence": 10, "address": "Villa 12, Rainbow Drive", "eta": "+18 mins"},
            {"sequence": 11, "address": "Sobha Hibiscus, Sector 2", "eta": "+27 mins"},
            {"sequence": 12, "address": "Purva Fairmont, 24th Main", "eta": "+35 mins"},
        ],
    }
