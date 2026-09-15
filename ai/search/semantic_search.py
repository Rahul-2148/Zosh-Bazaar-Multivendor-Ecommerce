import logging
import re

from ai.feature_store.store import FeatureStore, get_feature_store
from ai.vector_store.index import VectorIndex, get_vector_index

logger = logging.getLogger(__name__)

HINGLISH_SYNONYMS: dict[str, str] = {
    "joota": "shoes",
    "joote": "shoes",
    "ghadi": "smartwatch",
    "ghari": "smartwatch",
    "sadi": "saree",
    "saari": "saree",
    "kapde": "clothing",
    "chasma": "sunglasses",
    "kam daam": "cheap budget discount",
    "sasta": "budget discount",
    "achha": "top rated best",
    "best": "top rated",
}


class SemanticSearchEngine:
    """Hybrid lexical and semantic search with vernacular normalization and intent understanding."""

    def __init__(
        self,
        feature_store: FeatureStore | None = None,
        vector_index: VectorIndex | None = None,
    ):
        self.feature_store = feature_store or get_feature_store()
        self.vector_index = vector_index or get_vector_index()

    def normalize_query(self, query: str) -> str:
        tokens = query.lower().strip().split()
        normalized = []
        for t in tokens:
            if t in HINGLISH_SYNONYMS:
                normalized.append(HINGLISH_SYNONYMS[t])
            else:
                normalized.append(t)
        return " ".join(normalized)

    def extract_intent(self, query: str) -> dict:
        max_price = None
        min_price = None

        under_match = re.search(r"(?:under|below|less than)\s*(?:₹|rs\.?)?\s*(\d+)(?:k)?", query, re.IGNORECASE)
        if under_match:
            val = int(under_match.group(1))
            if "k" in under_match.group(0).lower() or val < 100:
                val *= 1000
            max_price = float(val)

        return {
            "maxPrice": max_price,
            "minPrice": min_price,
            "normalizedQuery": self.normalize_query(query),
        }

    def search(
        self,
        query: str,
        limit: int = 20,
        category_id: str | None = None,
    ) -> list[dict]:
        intent = self.extract_intent(query)
        norm_q = intent["normalizedQuery"]
        max_p = intent["maxPrice"]

        # 1. Vector Semantic Retrieval
        vector_results = self.vector_index.search_by_query(norm_q, top_k=limit * 2)
        vector_scores = {pid: score for pid, score in vector_results}

        # 2. Lexical & Popularity Re-ranking
        all_items = self.feature_store.get_all_items()
        scored_candidates = []

        q_tokens = set(norm_q.lower().split())

        for item in all_items:
            if category_id and item.categoryId != category_id:
                continue
            if max_p and item.sellingPrice > max_p:
                continue
            if not item.inStock or item.status != "PUBLISHED":
                continue

            # Semantic score from vector index
            s_vector = vector_scores.get(item.productId, 0.0)

            # Lexical score from token matches
            item_text = f"{item.title} {item.brand} {item.categoryName} {' '.join(item.tags)}".lower()
            matched_tokens = sum(1 for t in q_tokens if t in item_text)
            s_lexical = matched_tokens / max(len(q_tokens), 1)

            # Popularity / Rating prior
            s_pop = (item.ratingAverage / 5.0) * 0.5 + min(item.salesVelocity30d / 300.0, 0.5)

            # Combined hybrid score
            if s_vector > 0.05 or s_lexical > 0.3:
                composite_score = 0.50 * s_vector + 0.35 * s_lexical + 0.15 * s_pop
                scored_candidates.append((item, composite_score))

        scored_candidates.sort(key=lambda x: x[1], reverse=True)

        results = []
        for it, sc in scored_candidates[:limit]:
            results.append(
                {
                    "productId": it.productId,
                    "title": it.title,
                    "brand": it.brand,
                    "categoryName": it.categoryName,
                    "sellingPrice": it.sellingPrice,
                    "mrpPrice": it.mrpPrice,
                    "discountPercent": it.discountPercent,
                    "ratingAverage": it.ratingAverage,
                    "ratingCount": it.ratingCount,
                    "images": it.images,
                    "inStock": it.inStock,
                    "searchScore": round(float(sc), 3),
                }
            )
        return results


_search_instance: SemanticSearchEngine | None = None


def get_semantic_search() -> SemanticSearchEngine:
    global _search_instance
    if _search_instance is None:
        _search_instance = SemanticSearchEngine()
    return _search_instance
