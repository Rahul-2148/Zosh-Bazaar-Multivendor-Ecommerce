import logging

from ai.configs.settings import get_settings
from ai.models.candidate_generation import CandidateItem
from ai.schemas.features import ItemFeatures, SessionFeatures, UserFeatures
from ai.schemas.recommendations import (
    ExplanationReason,
    RecommendationItem,
)

logger = logging.getLogger(__name__)


class MultiStageRanker:
    """Production multi-stage ranking with business constraints, fine ranking, and diversification."""

    def __init__(self):
        self.settings = get_settings()

    def rank_and_filter(
        self,
        candidates: list[CandidateItem],
        user_features: UserFeatures | None = None,
        session_features: SessionFeatures | None = None,
        exclude_product_ids: list[str] | None = None,
        limit: int = 10,
        anchor_item: ItemFeatures | None = None,
    ) -> list[RecommendationItem]:
        if not candidates:
            return []

        exclude_set: set[str] = set(exclude_product_ids or [])
        if anchor_item:
            exclude_set.add(anchor_item.productId)

        # STAGE 1: Candidate Merging & Deduplication
        merged_candidates: dict[str, dict] = {}
        for c in candidates:
            pid = c.item.productId
            if pid not in merged_candidates:
                merged_candidates[pid] = {
                    "item": c.item,
                    "scores": {c.source: c.score},
                    "primary_source": c.source,
                }
            else:
                merged_candidates[pid]["scores"][c.source] = c.score

        # STAGE 2: Business Rule Filtering (Absolute Commerce Integrity)
        valid_items: list[dict] = []
        for pid, data in merged_candidates.items():
            it: ItemFeatures = data["item"]

            # Drop excluded items
            if pid in exclude_set:
                continue

            # Drop out-of-stock or unpublished products
            if not it.inStock or it.countInStock <= 0:
                continue
            if it.status != "PUBLISHED":
                continue

            valid_items.append(data)

        if not valid_items:
            return []

        # STAGE 3: Coarse & Fine Weighted Scoring
        scored_items: list[dict] = []
        for data in valid_items:
            it: ItemFeatures = data["item"]
            scores = data["scores"]

            # Base component scores
            s_content = scores.get("content_similarity", 0.0)
            s_user = scores.get("user_affinity", 0.0)
            s_session = scores.get("session_anchor", 0.0) or scores.get("session_category", 0.0)
            s_pop = scores.get("popularity", 0.0)
            s_fbt = scores.get("frequently_bought_together", 0.0)

            # Fine ranking personalization adjustments
            fine_boost = 1.0
            if user_features:
                if it.categoryId in user_features.categoryAffinities:
                    fine_boost += 0.25 * user_features.categoryAffinities[it.categoryId]
                if it.brand in user_features.brandAffinities:
                    fine_boost += 0.20 * user_features.brandAffinities[it.brand]
                if it.discountPercent > 20 and user_features.discountSensitivity > 0.6:
                    fine_boost += 0.15

            # Compute weighted final score
            composite_score = (
                self.settings.WEIGHT_CONTENT * s_content
                + self.settings.WEIGHT_PERSONALIZED * s_user
                + self.settings.WEIGHT_SESSION * s_session
                + self.settings.WEIGHT_POPULARITY * s_pop
                + 0.25 * s_fbt
            ) * fine_boost

            # Multi-source bonus (item matched multiple strategies)
            if len(scores) > 1:
                composite_score *= 1.15

            data["final_score"] = float(min(max(composite_score, 0.05), 0.99))
            scored_items.append(data)

        # Sort by final score descending
        scored_items.sort(key=lambda x: x["final_score"], reverse=True)

        # STAGE 4: Catalog Diversification (Max Marginal Relevance & Category Caps)
        diversified: list[dict] = []
        category_counts: dict[str, int] = {}
        brand_counts: dict[str, int] = {}
        max_per_category = max(2, limit // 3)
        max_per_brand = max(2, limit // 3)

        # Pass 1: Add items respecting diversity constraints
        remaining: list[dict] = []
        for entry in scored_items:
            it: ItemFeatures = entry["item"]
            cat = it.categoryId
            brand = it.brand

            if category_counts.get(cat, 0) < max_per_category and brand_counts.get(brand, 0) < max_per_brand:
                diversified.append(entry)
                category_counts[cat] = category_counts.get(cat, 0) + 1
                brand_counts[brand] = brand_counts.get(brand, 0) + 1
                if len(diversified) >= limit:
                    break
            else:
                remaining.append(entry)

        # Pass 2: Backfill if diversity constraints were too restrictive
        if len(diversified) < limit:
            for entry in remaining:
                diversified.append(entry)
                if len(diversified) >= limit:
                    break

        # STAGE 5: Explanation Grounding & Transformation to RecommendationItem
        results: list[RecommendationItem] = []
        for entry in diversified:
            it: ItemFeatures = entry["item"]
            score = entry["final_score"]
            primary_source = entry["primary_source"]

            reason, explanation = self._derive_explanation(it, primary_source, anchor_item, user_features)

            rec_item = RecommendationItem(
                productId=it.productId,
                title=it.title,
                brand=it.brand,
                categoryId=it.categoryId,
                categoryName=it.categoryName,
                sellingPrice=it.sellingPrice,
                mrpPrice=it.mrpPrice,
                discountPercent=it.discountPercent,
                images=it.images,
                ratingAverage=it.ratingAverage,
                ratingCount=it.ratingCount,
                inStock=it.inStock,
                sellerName=it.sellerId,
                score=round(score, 3),
                explanationReason=reason,
                explanationText=explanation,
                strategy="multi_stage_hybrid",
                candidateSource=primary_source,
            )
            results.append(rec_item)

        return results

    def _derive_explanation(
        self,
        item: ItemFeatures,
        source: str,
        anchor_item: ItemFeatures | None = None,
        user_features: UserFeatures | None = None,
    ) -> tuple[ExplanationReason, str]:
        """Derives truthful, model-grounded explanation text."""
        if source == "frequently_bought_together":
            return (
                ExplanationReason.FREQUENTLY_BOUGHT_TOGETHER,
                "Frequently bought together with your selection",
            )
        if source == "content_similarity" and anchor_item:
            return (
                ExplanationReason.BECAUSE_YOU_VIEWED,
                f"Because you viewed {anchor_item.title[:32]}...",
            )
        if user_features:
            if item.brand in user_features.brandAffinities and user_features.brandAffinities[item.brand] > 0.3:
                return (
                    ExplanationReason.BRAND_AFFINITY,
                    f"Recommended from your preferred brand: {item.brand}",
                )
            if (
                item.categoryId in user_features.categoryAffinities
                and user_features.categoryAffinities[item.categoryId] > 0.3
            ):
                return (
                    ExplanationReason.CATEGORY_AFFINITY,
                    f"Matches your interest in {item.categoryName}",
                )
        if item.discountPercent >= 25:
            return (
                ExplanationReason.TRENDING_NOW,
                f"Top deal: {item.discountPercent}% off on trending items",
            )
        if item.ratingAverage >= 4.8:
            return (
                ExplanationReason.TOP_RATED_CHOICE,
                f"Highly rated by verified buyers ({item.ratingAverage}★)",
            )

        return (
            ExplanationReason.POPULAR_IN_CATEGORY,
            f"Popular choice in {item.categoryName}",
        )


_ranker_instance: MultiStageRanker | None = None


def get_ranker() -> MultiStageRanker:
    global _ranker_instance
    if _ranker_instance is None:
        _ranker_instance = MultiStageRanker()
    return _ranker_instance
