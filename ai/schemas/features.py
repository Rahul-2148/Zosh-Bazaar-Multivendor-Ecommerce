from datetime import UTC, datetime

from pydantic import BaseModel, Field


def utc_now() -> datetime:
    return datetime.now(UTC)


class UserFeatures(BaseModel):
    """Derived behavioral features representing customer preferences."""

    userId: str
    categoryAffinities: dict[str, float] = Field(
        default_factory=dict, description="Category ID -> Affinity score [0.0 - 1.0]"
    )
    brandAffinities: dict[str, float] = Field(
        default_factory=dict, description="Brand name -> Affinity score [0.0 - 1.0]"
    )
    preferredPriceMin: float | None = None
    preferredPriceMax: float | None = None
    avgPurchasePrice: float | None = None
    discountSensitivity: float = Field(default=0.5, ge=0.0, le=1.0)
    totalViews: int = 0
    totalCartAdds: int = 0
    totalPurchases: int = 0
    recentlyViewedProductIds: list[str] = Field(default_factory=list)
    recentSearchQueries: list[str] = Field(default_factory=list)
    updatedAt: datetime = Field(default_factory=utc_now)


class SessionFeatures(BaseModel):
    """Real-time ephemeral in-session features."""

    sessionId: str
    userId: str | None = None
    anonymousId: str | None = None
    viewedProductIds: list[str] = Field(default_factory=list)
    cartProductIds: list[str] = Field(default_factory=list)
    activeCategory: str | None = None
    lastSearchQuery: str | None = None
    priceRangeFilter: dict[str, float] | None = None
    lastInteractionAt: datetime = Field(default_factory=utc_now)


class ItemFeatures(BaseModel):
    """Static and dynamic representation of a marketplace item."""

    productId: str
    title: str
    brand: str
    categoryId: str
    categoryName: str
    sellingPrice: float
    mrpPrice: float
    discountPercent: int
    ratingAverage: float
    ratingCount: int
    countInStock: int
    inStock: bool
    status: str
    sellerId: str
    highlights: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    images: list[str] = Field(default_factory=list)
    salesVelocity30d: int = 0
    viewCount30d: int = 0
    conversionRate: float = 0.05
    updatedAt: datetime = Field(default_factory=utc_now)
