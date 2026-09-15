from datetime import UTC, datetime
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, Field


def utc_now() -> datetime:
    return datetime.now(UTC)


class EventType(StrEnum):
    # Product Discovery & Browsing
    PRODUCT_IMPRESSION = "product_impression"
    PRODUCT_VIEW = "product_view"
    PRODUCT_CLICK = "product_click"
    PRODUCT_DETAIL_OPEN = "product_detail_open"
    CATEGORY_VIEW = "category_view"
    BRAND_VIEW = "brand_view"
    SELLER_VIEW = "seller_view"

    # Search & Filter
    SEARCH_STARTED = "search_started"
    SEARCH_SUBMITTED = "search_submitted"
    SEARCH_RESULT_CLICKED = "search_result_clicked"
    FILTER_APPLIED = "filter_applied"
    SORT_CHANGED = "sort_changed"

    # Variant Selection
    VARIANT_SELECTED = "variant_selected"

    # Cart Interactions
    ADD_TO_CART = "add_to_cart"
    REMOVE_FROM_CART = "remove_from_cart"
    INCREASE_QUANTITY = "increase_quantity"
    DECREASE_QUANTITY = "decrease_quantity"

    # Wishlist Interactions
    WISHLIST_ADD = "wishlist_add"
    WISHLIST_REMOVE = "wishlist_remove"

    # Social & Engagement
    SHARE_PRODUCT = "share_product"
    COMPARE_PRODUCT = "compare_product"

    # Checkout & Conversion
    CHECKOUT_STARTED = "checkout_started"
    ADDRESS_SELECTED = "address_selected"
    PAYMENT_STARTED = "payment_started"
    PAYMENT_SUCCESS = "payment_success"
    PAYMENT_FAILED = "payment_failed"
    ORDER_PLACED = "order_placed"

    # Post-Purchase
    ORDER_CANCELLED = "order_cancelled"
    RETURN_REQUESTED = "return_requested"
    PRODUCT_REVIEWED = "product_reviewed"

    # Recommendation Feedback Loop
    RECOMMENDATION_IMPRESSION = "recommendation_impression"
    RECOMMENDATION_CLICKED = "recommendation_clicked"
    RECOMMENDATION_ADDED_TO_CART = "recommendation_added_to_cart"
    RECOMMENDATION_PURCHASED = "recommendation_purchased"
    RECOMMENDATION_DISMISSED = "recommendation_dismissed"


class DeviceContext(BaseModel):
    deviceType: str | None = Field(default="desktop", description="mobile | tablet | desktop")
    os: str | None = None
    browser: str | None = None
    screenResolution: str | None = None


class LocationContext(BaseModel):
    city: str | None = None
    state: str | None = None
    pincode: str | None = None
    country: str | None = "India"


class RecommendationContext(BaseModel):
    recommendationId: str | None = None
    requestId: str | None = None
    placement: str | None = None
    modelVersion: str | None = None
    strategy: str | None = None
    rankPosition: int | None = None


class AIInteractionEvent(BaseModel):
    """Standardized AI behavioral telemetry schema for Zosh Bazaar."""

    # 1. Event Identity & Type
    eventId: str = Field(description="Unique event ID for deduplication and idempotency")
    eventType: EventType
    timestamp: datetime = Field(default_factory=utc_now)

    # 2. User & Session Context
    userId: str | None = Field(default=None, description="Authenticated customer ID")
    anonymousId: str | None = Field(default=None, description="Persistent anonymous client cookie/UUID")
    sessionId: str = Field(description="Current active user session ID")

    # 3. Commercial Entity Context
    productId: str | None = None
    variantId: str | None = None
    categoryId: str | None = None
    sellerId: str | None = None
    brand: str | None = None
    price: float | None = None
    quantity: int | None = 1

    # 4. Search & Navigation Context
    searchQuery: str | None = None
    source: str | None = Field(default="client", description="client | seller | admin | email")
    pageUrl: str | None = None
    referrerUrl: str | None = None

    # 5. Device & Location Metadata
    device: DeviceContext | None = None
    platform: str | None = Field(default="web", description="web | mobile_web | app")
    location: LocationContext | None = None

    # 6. Recommendation Attribution
    recommendationContext: RecommendationContext | None = None

    # 7. Arbitrary Non-Sensitive Metadata
    metadata: dict[str, Any] = Field(default_factory=dict)


class EventBatch(BaseModel):
    """Batch payload emitted by client event tracker SDK."""

    events: list[AIInteractionEvent]
    sentAt: datetime = Field(default_factory=utc_now)
