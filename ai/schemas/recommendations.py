from datetime import UTC, datetime
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, Field


def utc_now() -> datetime:
    return datetime.now(UTC)


class PlacementType(StrEnum):
    # Homepage Placements
    HOME_FOR_YOU = "home_for_you"
    HOME_BECAUSE_YOU_VIEWED = "home_because_you_viewed"
    HOME_TRENDING = "home_trending"
    HOME_NEW_ARRIVALS = "home_new_arrivals"

    # Product Page Placements
    PDP_SIMILAR = "pdp_similar"
    PDP_ALSO_VIEWED = "pdp_also_viewed"
    PDP_FREQUENTLY_BOUGHT_TOGETHER = "pdp_frequently_bought_together"
    PDP_COMPLEMENTARY = "pdp_complementary"

    # Cart & Checkout Placements
    CART_ADDONS = "cart_addons"
    CART_COMPLETE_SET = "cart_complete_set"

    # Category & Search
    CATEGORY_PERSONALIZED = "category_personalized"
    SEARCH_PERSONALIZED = "search_personalized"

    # Wishlist
    WISHLIST_SIMILAR = "wishlist_similar"


class ExplanationReason(StrEnum):
    BECAUSE_YOU_VIEWED = "because_you_viewed"
    FREQUENTLY_BOUGHT_TOGETHER = "frequently_bought_together"
    POPULAR_IN_CATEGORY = "popular_in_category"
    TRENDING_NOW = "trending_now"
    TOP_RATED_CHOICE = "top_rated_choice"
    CATEGORY_AFFINITY = "category_affinity"
    BRAND_AFFINITY = "brand_affinity"
    FRESH_ARRIVAL = "fresh_arrival"
    SIMILAR_PRODUCT = "similar_product"


class RecommendationRequest(BaseModel):
    """Input contract for recommendation query."""

    placement: PlacementType = PlacementType.HOME_FOR_YOU
    userId: str | None = None
    anonymousId: str | None = None
    sessionId: str | None = None

    anchorProductId: str | None = None
    anchorCategoryId: str | None = None
    cartProductIds: list[str] = Field(default_factory=list)

    limit: int = Field(default=10, ge=1, le=50)
    excludeProductIds: list[str] = Field(default_factory=list)

    # Contextual signals
    deviceType: str | None = "desktop"
    pincode: str | None = None


class RecommendationItem(BaseModel):
    """Scored and enriched product recommended to the user."""

    productId: str
    title: str
    brand: str | None = "Zosh Certified"
    categoryId: str | None = None
    categoryName: str | None = None
    sellingPrice: float
    mrpPrice: float | None = None
    discountPercent: int | None = 0
    images: list[str] = Field(default_factory=list)
    ratingAverage: float | None = 4.5
    ratingCount: int | None = 0
    inStock: bool = True
    sellerName: str | None = None

    # ML Score & Attribution
    score: float = Field(description="Normalized hybrid recommendation score [0.0 - 1.0]")
    explanationReason: ExplanationReason = ExplanationReason.POPULAR_IN_CATEGORY
    explanationText: str = "Popular with shoppers like you"
    strategy: str = "hybrid_ranker"
    candidateSource: str | None = "popularity"


class RecommendationResponse(BaseModel):
    """Standardized response contract for all recommendation surfaces."""

    requestId: str
    placement: PlacementType
    modelVersion: str = "hybrid_recommender_v1"
    strategy: str = "multi_stage_hybrid"
    totalReturned: int
    recommendations: list[RecommendationItem]
    tookMs: float
    createdAt: datetime = Field(default_factory=utc_now)
    expiresAt: datetime
    metadata: dict[str, Any] = Field(default_factory=dict)
