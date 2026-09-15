import logging
import time
import uuid
from datetime import UTC, datetime, timedelta

from ai.configs.settings import get_settings
from ai.feature_store.store import FeatureStore, get_feature_store
from ai.models.candidate_generation import CandidateGenerationPipeline, CandidateItem
from ai.ranking.ranker import MultiStageRanker, get_ranker
from ai.schemas.features import ItemFeatures
from ai.schemas.recommendations import (
    PlacementType,
    RecommendationRequest,
    RecommendationResponse,
)
from ai.vector_store.index import VectorIndex, get_vector_index

logger = logging.getLogger(__name__)


class RecommendationEngine:
    """Core recommendation engine orchestrating candidate generation, ranking, and placement strategies."""

    def __init__(
        self,
        feature_store: FeatureStore | None = None,
        vector_index: VectorIndex | None = None,
        ranker: MultiStageRanker | None = None,
    ):
        self.settings = get_settings()
        self.feature_store = feature_store or get_feature_store()
        self.vector_index = vector_index or get_vector_index()
        self.ranker = ranker or get_ranker()
        self.candidate_pipeline = CandidateGenerationPipeline(self.feature_store, self.vector_index)

        # Warm up vector index if not yet fitted
        if not self.vector_index._is_fitted:
            self.vector_index.build_index(self.feature_store.get_all_items())

    def recommend(self, req: RecommendationRequest) -> RecommendationResponse:
        start_time = time.time()
        request_id = f"rec_{uuid.uuid4().hex[:12]}"

        # 1. Fetch User and Session Features
        user_features = self.feature_store.get_user_features(req.userId) if req.userId else None
        session_features = self.feature_store.get_session_features(req.sessionId or "anon_session")

        # 2. Select Candidate Retrieval Strategy by Placement
        candidates: list[CandidateItem] = []
        anchor_item: ItemFeatures | None = None

        if req.placement == PlacementType.PDP_SIMILAR or req.placement == PlacementType.PDP_ALSO_VIEWED:
            # Anchored on specific product
            if req.anchorProductId:
                anchor_item = self.feature_store.get_item_features(req.anchorProductId)
                candidates = self.candidate_pipeline.get_content_similarity_candidates(
                    anchor_product_id=req.anchorProductId,
                    top_k=req.limit * 3,
                )
            # Fallback to category popularity if few candidates
            if len(candidates) < req.limit:
                cat_id = anchor_item.categoryId if anchor_item else req.anchorCategoryId
                candidates.extend(
                    self.candidate_pipeline.get_popularity_candidates(category_id=cat_id, top_k=req.limit)
                )
            # Global popularity fallback to ensure zero empty sections
            if len(candidates) < req.limit:
                candidates.extend(self.candidate_pipeline.get_popularity_candidates(top_k=req.limit))

        elif (
            req.placement == PlacementType.PDP_FREQUENTLY_BOUGHT_TOGETHER or req.placement == PlacementType.CART_ADDONS
        ):
            anchor_pids = list(set(([req.anchorProductId] if req.anchorProductId else []) + req.cartProductIds))
            if anchor_pids:
                candidates = self.candidate_pipeline.get_frequently_bought_together(anchor_pids, top_k=req.limit * 2)
            if len(candidates) < req.limit:
                candidates.extend(self.candidate_pipeline.get_popularity_candidates(top_k=req.limit))

        elif req.placement == PlacementType.HOME_BECAUSE_YOU_VIEWED:
            # Anchor on most recent item viewed in session or user history
            anchor_pid = None
            if session_features.viewedProductIds:
                anchor_pid = session_features.viewedProductIds[0]
            elif user_features and user_features.recentlyViewedProductIds:
                anchor_pid = user_features.recentlyViewedProductIds[0]

            if anchor_pid:
                anchor_item = self.feature_store.get_item_features(anchor_pid)
                candidates = self.candidate_pipeline.get_content_similarity_candidates(
                    anchor_product_id=anchor_pid,
                    top_k=req.limit * 3,
                )
            if not candidates:
                candidates = self.candidate_pipeline.get_popularity_candidates(top_k=req.limit * 2)

        elif req.placement == PlacementType.HOME_FOR_YOU:
            # Multi-source retrieval: Neural Two-Tower + User Affinity + Session Anchor + Popularity
            c_neural = self.candidate_pipeline.get_neural_two_tower_candidates(
                user_features=user_features,
                session_features=session_features,
                top_k=req.limit * 2,
            )
            c_user = self.candidate_pipeline.get_user_affinity_candidates(user_features, top_k=req.limit * 2)
            c_session = self.candidate_pipeline.get_session_candidates(session_features, top_k=req.limit * 2)
            c_pop = self.candidate_pipeline.get_popularity_candidates(top_k=req.limit * 2)

            candidates.extend(c_neural)
            candidates.extend(c_user)
            candidates.extend(c_session)
            candidates.extend(c_pop)

        elif req.placement == PlacementType.CATEGORY_PERSONALIZED:
            candidates = self.candidate_pipeline.get_popularity_candidates(
                category_id=req.anchorCategoryId,
                top_k=req.limit * 3,
            )

        else:
            # Default to popularity / trending
            candidates = self.candidate_pipeline.get_popularity_candidates(top_k=req.limit * 2)

        # 3. Multi-Stage Ranking, Business Rules, Personalization & Diversity
        ranked_items = self.ranker.rank_and_filter(
            candidates=candidates,
            user_features=user_features,
            session_features=session_features,
            exclude_product_ids=req.excludeProductIds,
            limit=req.limit,
            anchor_item=anchor_item,
        )

        took_ms = round((time.time() - start_time) * 1000, 2)
        ttl = self.settings.CACHE_TTL_RECOMMENDATIONS_SEC
        expires_at = datetime.now(UTC) + timedelta(seconds=ttl)

        return RecommendationResponse(
            requestId=request_id,
            placement=req.placement,
            modelVersion="hybrid_recommender_v1",
            strategy="multi_stage_hybrid",
            totalReturned=len(ranked_items),
            recommendations=ranked_items,
            tookMs=took_ms,
            expiresAt=expires_at,
            metadata={
                "candidateCount": len(candidates),
                "isPersonalized": bool(user_features or session_features.viewedProductIds),
                "hasAnchor": bool(anchor_item),
            },
        )


_engine_instance: RecommendationEngine | None = None


def get_recommendation_engine() -> RecommendationEngine:
    global _engine_instance
    if _engine_instance is None:
        _engine_instance = RecommendationEngine()
    return _engine_instance
