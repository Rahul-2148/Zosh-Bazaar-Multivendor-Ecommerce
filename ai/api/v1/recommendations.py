import logging

from fastapi import APIRouter, Depends, Query

from ai.recommendations.engine import RecommendationEngine, get_recommendation_engine
from ai.schemas.recommendations import (
    PlacementType,
    RecommendationRequest,
    RecommendationResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.post("/query", response_model=RecommendationResponse)
def query_recommendations(
    req: RecommendationRequest,
    engine: RecommendationEngine = Depends(get_recommendation_engine),
):
    """General parameterized recommendation endpoint."""
    return engine.recommend(req)


@router.get("/home", response_model=RecommendationResponse)
def get_home_recommendations(
    userId: str | None = Query(None, description="Authenticated Customer ID"),
    sessionId: str | None = Query(None, description="Active Session ID"),
    limit: int = Query(10, ge=1, le=30),
    placement: PlacementType = Query(PlacementType.HOME_FOR_YOU),
    engine: RecommendationEngine = Depends(get_recommendation_engine),
):
    """Personalized discovery feed for marketplace homepage."""
    req = RecommendationRequest(
        placement=placement,
        userId=userId,
        sessionId=sessionId,
        limit=limit,
    )
    return engine.recommend(req)


@router.get("/product/{productId}", response_model=RecommendationResponse)
def get_product_recommendations(
    productId: str,
    placement: PlacementType = Query(PlacementType.PDP_SIMILAR),
    userId: str | None = Query(None),
    sessionId: str | None = Query(None),
    limit: int = Query(6, ge=1, le=20),
    engine: RecommendationEngine = Depends(get_recommendation_engine),
):
    """Similar products, customers also viewed, and frequently bought together for Product Details Page."""
    req = RecommendationRequest(
        placement=placement,
        anchorProductId=productId,
        userId=userId,
        sessionId=sessionId,
        limit=limit,
    )
    return engine.recommend(req)


@router.get("/cart", response_model=RecommendationResponse)
def get_cart_recommendations(
    productIds: str = Query("", description="Comma-separated product IDs currently in cart"),
    userId: str | None = Query(None),
    sessionId: str | None = Query(None),
    limit: int = Query(4, ge=1, le=10),
    engine: RecommendationEngine = Depends(get_recommendation_engine),
):
    """Relevant cross-sell add-ons and complete-the-set items for shopping cart and checkout."""
    cart_pids = [pid.strip() for pid in productIds.split(",") if pid.strip()]
    req = RecommendationRequest(
        placement=PlacementType.CART_ADDONS,
        cartProductIds=cart_pids,
        userId=userId,
        sessionId=sessionId,
        limit=limit,
    )
    return engine.recommend(req)


@router.get("/category/{categoryId}", response_model=RecommendationResponse)
def get_category_recommendations(
    categoryId: str,
    userId: str | None = Query(None),
    limit: int = Query(12, ge=1, le=30),
    engine: RecommendationEngine = Depends(get_recommendation_engine),
):
    """Personalized category browsing ranking."""
    req = RecommendationRequest(
        placement=PlacementType.CATEGORY_PERSONALIZED,
        anchorCategoryId=categoryId,
        userId=userId,
        limit=limit,
    )
    return engine.recommend(req)
