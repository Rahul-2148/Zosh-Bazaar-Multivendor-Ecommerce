import logging

from ai.feature_store.store import FeatureStore
from ai.schemas.features import ItemFeatures, SessionFeatures, UserFeatures
from ai.vector_store.index import VectorIndex

logger = logging.getLogger(__name__)


class CandidateItem:
    """Intermediate candidate with source attribution."""

    def __init__(self, item: ItemFeatures, score: float, source: str):
        self.item = item
        self.score = score
        self.source = source


class CandidateGenerationPipeline:
    """Retrieves diverse candidate subsets from multiple algorithmic sources."""

    def __init__(self, feature_store: FeatureStore, vector_index: VectorIndex):
        self.feature_store = feature_store
        self.vector_index = vector_index

    # 1. Popularity & Trending Candidates
    def get_popularity_candidates(
        self,
        category_id: str | None = None,
        top_k: int = 30,
    ) -> list[CandidateItem]:
        items = self.feature_store.get_all_items()
        if category_id:
            items = [it for it in items if it.categoryId == category_id]

        # Score by sales velocity, rating average, and review count
        def pop_score(it: ItemFeatures) -> float:
            vel_norm = min(it.salesVelocity30d / 500.0, 1.0)
            rat_norm = (it.ratingAverage / 5.0) * min(it.ratingCount / 200.0, 1.0)
            return 0.6 * vel_norm + 0.4 * rat_norm

        scored = [(it, pop_score(it)) for it in items]
        scored.sort(key=lambda x: x[1], reverse=True)
        return [CandidateItem(it, score, "popularity") for it, score in scored[:top_k]]

    # 2. Content & Semantic Similarity Candidates
    def get_content_similarity_candidates(
        self,
        anchor_product_id: str,
        top_k: int = 30,
    ) -> list[CandidateItem]:
        similar_ids = self.vector_index.find_similar(anchor_product_id, top_k=top_k)
        candidates = []
        for pid, sim_score in similar_ids:
            item = self.feature_store.get_item_features(pid)
            if item:
                candidates.append(CandidateItem(item, sim_score, "content_similarity"))
        return candidates

    # 3. User Long-Term Affinity Candidates
    def get_user_affinity_candidates(
        self,
        user_features: UserFeatures | None,
        top_k: int = 30,
    ) -> list[CandidateItem]:
        if not user_features:
            return []

        items = self.feature_store.get_all_items()
        candidates = []

        cat_affinities = user_features.categoryAffinities
        brand_affinities = user_features.brandAffinities

        for item in items:
            cat_score = cat_affinities.get(item.categoryId, 0.0)
            brand_score = brand_affinities.get(item.brand, 0.0)
            affinity = 0.6 * cat_score + 0.4 * brand_score

            # Price sensitivity penalty/boost
            if user_features.preferredPriceMax and item.sellingPrice > user_features.preferredPriceMax * 1.5:
                affinity *= 0.5

            if affinity > 0.1:
                candidates.append(CandidateItem(item, affinity, "user_affinity"))

        candidates.sort(key=lambda x: x.score, reverse=True)
        return candidates[:top_k]

    # 4. In-Session Real-Time Affinity Candidates
    def get_session_candidates(
        self,
        session_features: SessionFeatures,
        top_k: int = 25,
    ) -> list[CandidateItem]:
        candidates = []
        viewed_pids = session_features.viewedProductIds

        if viewed_pids:
            # Query vector index using most recently viewed item
            anchor_pid = viewed_pids[0]
            similar_items = self.vector_index.find_similar(anchor_pid, top_k=top_k // 2)
            for pid, sim_score in similar_items:
                it = self.feature_store.get_item_features(pid)
                if it and pid not in viewed_pids:
                    candidates.append(CandidateItem(it, sim_score, "session_anchor"))

        if session_features.activeCategory:
            cat_candidates = self.get_popularity_candidates(
                category_id=session_features.activeCategory,
                top_k=top_k // 2,
            )
            for c in cat_candidates:
                c.source = "session_category"
                candidates.append(c)

        return candidates[:top_k]

    # 5. Frequently Bought Together / Complementary Candidates
    def get_frequently_bought_together(
        self,
        anchor_product_ids: list[str],
        top_k: int = 15,
    ) -> list[CandidateItem]:
        if not anchor_product_ids:
            return []

        all_items = self.feature_store.get_all_items()
        anchor_items = [
            self.feature_store.get_item_features(pid)
            for pid in anchor_product_ids
            if self.feature_store.get_item_features(pid)
        ]

        anchor_categories = {it.categoryId for it in anchor_items}
        anchor_brands = {it.brand for it in anchor_items}

        candidates = []
        for it in all_items:
            if it.productId in anchor_product_ids:
                continue

            # Complementary logic: items from related categories or same ecosystem (e.g. Apple Watch -> AirPods)
            comp_score = 0.0
            if it.brand in anchor_brands:
                comp_score += 0.4
            # Cross-category affinity (audio + smartwatch, sneakers + socks/blazer)
            if it.categoryId not in anchor_categories:
                comp_score += 0.5

            if comp_score > 0.3:
                candidates.append(CandidateItem(it, comp_score, "frequently_bought_together"))

        candidates.sort(key=lambda x: x.score, reverse=True)
        return candidates[:top_k]

    # 6. Two-Tower Neural Candidate Retrieval
    def get_neural_two_tower_candidates(
        self,
        user_features: UserFeatures | None = None,
        session_features: SessionFeatures | None = None,
        top_k: int = 20,
    ) -> list[CandidateItem]:
        try:
            import numpy as np

            from ai.models.neural_two_tower import get_two_tower_recommender

            two_tower = get_two_tower_recommender()
            all_items = self.feature_store.get_all_items()
            if not all_items:
                return []

            cat_aff = user_features.categoryAffinity if user_features else {}
            brand_aff = user_features.brandAffinity if user_features else {}
            price_tier = user_features.priceSensitivityTier if user_features else "MID"
            session_count = len(session_features.viewedProductIds) if session_features else 0

            if session_features and session_features.activeCategory:
                cat_aff = {**cat_aff, session_features.activeCategory: 1.5}

            user_raw = two_tower.extract_user_raw_features(
                category_affinity=cat_aff,
                brand_affinity=brand_aff,
                price_tier=price_tier,
                session_product_count=session_count,
            )
            u_emb = two_tower.encode_user(user_raw)

            item_raw_list = [
                two_tower.extract_item_raw_features(
                    it.categoryId,
                    it.brand,
                    it.sellingPrice,
                    it.ratingAverage,
                    it.salesVelocity30d,
                    it.inStock,
                )
                for it in all_items
            ]
            item_matrix = np.array([two_tower.encode_item(raw) for raw in item_raw_list])
            pids = [it.productId for it in all_items]

            results = two_tower.retrieve_candidates(u_emb, item_matrix, pids, top_k=top_k)
            item_map = {it.productId: it for it in all_items}

            return [
                CandidateItem(item_map[pid], score, "neural_two_tower") for pid, score in results if pid in item_map
            ]
        except Exception as e:
            logger.warning(f"Two-Tower neural candidate generation fallback to popularity: {e}")
            return self.get_popularity_candidates(top_k=top_k)

    # 7. Cold-Start Safe Fallback Candidates
    def get_cold_start_candidates(self, top_k: int = 20) -> list[CandidateItem]:
        return self.get_popularity_candidates(top_k=top_k)
