from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from ai.feature_store.store import FeatureStore, get_feature_store
from ai.reviews.review_intelligence import (
    ProductReviewIntelligence,
    ReviewIntelligenceEngine,
    get_review_intelligence_engine,
)

router = APIRouter(prefix="/reviews", tags=["AI Review Intelligence"])


class ReviewAnalysisRequest(BaseModel):
    productId: str
    productTitle: str | None = None
    categoryName: str | None = "General"
    reviews: list[dict[str, Any]] = []


@router.post("/summary", response_model=ProductReviewIntelligence)
def analyze_product_reviews(
    req: ReviewAnalysisRequest,
    engine: ReviewIntelligenceEngine = Depends(get_review_intelligence_engine),
    feature_store: FeatureStore = Depends(get_feature_store),
):
    """Generates aspect-based sentiment, pros/cons, and summary verdict grounded in real customer reviews."""
    title = req.productTitle
    cat_name = req.categoryName
    if not title:
        item = feature_store.get_item_features(req.productId)
        if item:
            title = item.title
            cat_name = item.categoryName

    return engine.analyze_reviews(
        product_id=req.productId,
        product_title=title or "Marketplace Product",
        reviews=req.reviews,
        category_name=cat_name or "General",
    )


@router.get("/summary/{product_id}", response_model=ProductReviewIntelligence)
def get_product_review_summary(
    product_id: str,
    engine: ReviewIntelligenceEngine = Depends(get_review_intelligence_engine),
    feature_store: FeatureStore = Depends(get_feature_store),
):
    """Convenience endpoint retrieving or computing review intelligence for a product ID."""
    item = feature_store.get_item_features(product_id)
    title = item.title if item else "Marketplace Product"
    cat_name = item.categoryName if item else "General"
    return engine.analyze_reviews(
        product_id=product_id,
        product_title=title,
        reviews=[],
        category_name=cat_name,
    )
