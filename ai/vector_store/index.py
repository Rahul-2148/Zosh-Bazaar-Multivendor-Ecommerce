import logging
import threading

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from ai.schemas.features import ItemFeatures

logger = logging.getLogger(__name__)


class VectorIndex:
    """High-performance vector index for product semantic and content similarity."""

    def __init__(self):
        self._lock = threading.Lock()
        self.vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            max_features=5000,
            stop_words="english",
        )
        self.product_ids: list[str] = []
        self.id_to_index: dict[str, int] = {}
        self.matrix: np.ndarray | None = None
        self._is_fitted = False

    def build_index(self, items: list[ItemFeatures]):
        """Generates item vectors from multi-attribute product text."""
        if not items:
            logger.warning("No items supplied to build vector index.")
            return

        with self._lock:
            corpus = []
            self.product_ids = []
            self.id_to_index = {}

            for idx, item in enumerate(items):
                # Composite textual representation
                text_repr = (
                    f"{item.title} {item.brand} {item.categoryName} {' '.join(item.highlights)} {' '.join(item.tags)}"
                )
                corpus.append(text_repr)
                self.product_ids.append(item.productId)
                self.id_to_index[item.productId] = idx

            try:
                tfidf_matrix = self.vectorizer.fit_transform(corpus)
                # Normalize matrix for instant cosine similarity dot-product
                from sklearn.preprocessing import normalize

                self.matrix = normalize(tfidf_matrix.toarray(), norm="l2")
                self._is_fitted = True
                logger.info(
                    f"VectorIndex built successfully: {len(self.product_ids)} items, "
                    f"{self.matrix.shape[1]} dimensional feature space."
                )
            except Exception as e:
                logger.error(f"Error building vector index: {e}")

    def find_similar(
        self,
        product_id: str,
        top_k: int = 10,
        exclude_self: bool = True,
    ) -> list[tuple[str, float]]:
        """Returns top_k (product_id, similarity_score) tuples."""
        if not self._is_fitted or self.matrix is None:
            return []

        idx = self.id_to_index.get(product_id)
        if idx is None:
            return []

        target_vector = self.matrix[idx : idx + 1]
        sims = cosine_similarity(target_vector, self.matrix)[0]

        ranked_indices = np.argsort(-sims)
        results = []

        for r_idx in ranked_indices:
            pid = self.product_ids[r_idx]
            if exclude_self and pid == product_id:
                continue
            score = float(sims[r_idx])
            results.append((pid, score))
            if len(results) >= top_k:
                break

        return results

    def search_by_query(self, query: str, top_k: int = 10) -> list[tuple[str, float]]:
        """Vector semantic search by raw text query."""
        if not self._is_fitted or self.matrix is None or not query:
            return []

        try:
            query_vec = self.vectorizer.transform([query])
            from sklearn.preprocessing import normalize

            query_vec_norm = normalize(query_vec.toarray(), norm="l2")
            sims = cosine_similarity(query_vec_norm, self.matrix)[0]

            ranked_indices = np.argsort(-sims)
            results = []

            for r_idx in ranked_indices:
                score = float(sims[r_idx])
                if score > 0.05:  # Non-trivial similarity
                    results.append((self.product_ids[r_idx], score))
                if len(results) >= top_k:
                    break

            return results
        except Exception as e:
            logger.error(f"Error during vector query search: {e}")
            return []


_vector_index_instance: VectorIndex | None = None


def get_vector_index() -> VectorIndex:
    global _vector_index_instance
    if _vector_index_instance is None:
        _vector_index_instance = VectorIndex()
    return _vector_index_instance
