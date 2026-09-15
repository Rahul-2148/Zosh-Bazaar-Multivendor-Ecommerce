import json
import logging
import math
import os

import numpy as np

logger = logging.getLogger(__name__)

# Check if PyTorch is importable
HAS_TORCH = False
try:
    import torch
    import torch.nn.functional as F
    from torch import nn

    HAS_TORCH = True
except Exception as e:
    logger.info(
        f"PyTorch native runtime not loaded ({e}); running Two-Tower model with optimized vectorized NumPy engine."
    )


if HAS_TORCH:

    class UserTowerNN(nn.Module):
        def __init__(self, input_dim: int = 32, embed_dim: int = 64):
            super().__init__()
            self.fc1 = nn.Linear(input_dim, 128)
            self.relu = nn.ReLU()
            self.fc2 = nn.Linear(128, embed_dim)

        def forward(self, x: torch.Tensor) -> torch.Tensor:
            h = self.relu(self.fc1(x))
            out = self.fc2(h)
            return F.normalize(out, p=2, dim=-1)

    class ItemTowerNN(nn.Module):
        def __init__(self, input_dim: int = 32, embed_dim: int = 64):
            super().__init__()
            self.fc1 = nn.Linear(input_dim, 128)
            self.relu = nn.ReLU()
            self.fc2 = nn.Linear(128, embed_dim)

        def forward(self, x: torch.Tensor) -> torch.Tensor:
            h = self.relu(self.fc1(x))
            out = self.fc2(h)
            return F.normalize(out, p=2, dim=-1)


class TwoTowerRecommender:
    """Production Two-Tower Neural Candidate Retrieval Model (PyTorch + Vectorized Engine)."""

    EMBED_DIM = 64
    INPUT_DIM = 32

    def __init__(self, weights_path: str | None = "ai/models/checkpoints/two_tower_v1.json"):
        self.weights_path = weights_path
        self.embed_dim = self.EMBED_DIM
        self.input_dim = self.INPUT_DIM
        self.device = "cpu"

        # Initialize deterministic projection weights
        rng = np.random.RandomState(42)
        self.user_w1 = rng.randn(self.input_dim, 128).astype(np.float32) / np.sqrt(self.input_dim)
        self.user_b1 = np.zeros(128, dtype=np.float32)
        self.user_w2 = rng.randn(128, self.embed_dim).astype(np.float32) / np.sqrt(128)
        self.user_b2 = np.zeros(self.embed_dim, dtype=np.float32)

        self.item_w1 = rng.randn(self.input_dim, 128).astype(np.float32) / np.sqrt(self.input_dim)
        self.item_b1 = np.zeros(128, dtype=np.float32)
        self.item_w2 = rng.randn(128, self.embed_dim).astype(np.float32) / np.sqrt(128)
        self.item_b2 = np.zeros(self.embed_dim, dtype=np.float32)

        if self.weights_path and os.path.exists(self.weights_path):
            self.load_weights(self.weights_path)

    def extract_user_raw_features(
        self,
        category_affinity: dict[str, float],
        brand_affinity: dict[str, float],
        price_tier: str = "MID",
        session_product_count: int = 0,
    ) -> np.ndarray:
        """Converts heterogeneous user & session signals into a normalized 32-dim feature vector."""
        vec = np.zeros(self.input_dim, dtype=np.float32)

        # 1. Category affinity hash buckets (dims 0..11)
        for cat, weight in category_affinity.items():
            bucket = abs(hash(cat)) % 12
            vec[bucket] += float(weight)

        # 2. Brand affinity hash buckets (dims 12..21)
        for br, weight in brand_affinity.items():
            bucket = 12 + (abs(hash(br)) % 10)
            vec[bucket] += float(weight)

        # 3. Price sensitivity tier (dims 22..24)
        if price_tier == "BUDGET":
            vec[22] = 1.0
        elif price_tier == "PREMIUM":
            vec[24] = 1.0
        else:
            vec[23] = 1.0

        # 4. Session engagement velocity (dims 25..31)
        vec[25] = min(session_product_count / 10.0, 1.0)
        vec[26] = math.log1p(session_product_count)

        norm = np.linalg.norm(vec)
        if norm > 0:
            vec /= norm
        return vec

    def extract_item_raw_features(
        self,
        category_id: str,
        brand: str,
        selling_price: float,
        rating_avg: float,
        sales_velocity: int,
        in_stock: bool,
    ) -> np.ndarray:
        """Converts item metadata into a normalized 32-dim feature vector."""
        vec = np.zeros(self.input_dim, dtype=np.float32)

        # 1. Category hash buckets (dims 0..11)
        c_bucket = abs(hash(category_id)) % 12
        vec[c_bucket] = 1.0

        # 2. Brand hash buckets (dims 12..21)
        b_bucket = 12 + (abs(hash(brand)) % 10)
        vec[b_bucket] = 1.0

        # 3. Price tier & log price (dims 22..24)
        log_p = math.log1p(max(selling_price, 100.0))
        vec[22] = log_p / 12.0
        if selling_price < 2500:
            vec[23] = 1.0
        elif selling_price > 20000:
            vec[24] = 1.0

        # 4. Ratings & sales velocity (dims 25..31)
        vec[25] = (rating_avg - 3.0) / 2.0
        vec[26] = min(sales_velocity / 100.0, 1.0)
        vec[27] = 1.0 if in_stock else 0.0

        norm = np.linalg.norm(vec)
        if norm > 0:
            vec /= norm
        return vec

    def encode_user(self, raw_features: np.ndarray) -> np.ndarray:
        """Projects user raw features into shared L2-normalized 64-dim embedding space."""
        h1 = np.maximum(0, np.dot(raw_features, self.user_w1) + self.user_b1)
        out = np.dot(h1, self.user_w2) + self.user_b2
        norm = np.linalg.norm(out)
        return (out / norm) if norm > 0 else out

    def encode_item(self, raw_features: np.ndarray) -> np.ndarray:
        """Projects item raw features into shared L2-normalized 64-dim embedding space."""
        h1 = np.maximum(0, np.dot(raw_features, self.item_w1) + self.item_b1)
        out = np.dot(h1, self.item_w2) + self.item_b2
        norm = np.linalg.norm(out)
        return (out / norm) if norm > 0 else out

    def retrieve_candidates(
        self,
        user_vector: np.ndarray,
        item_matrix: np.ndarray,
        product_ids: list[str],
        top_k: int = 15,
    ) -> list[tuple[str, float]]:
        """Computes dot-product similarity between user tower embedding and item embeddings."""
        if len(product_ids) == 0 or len(item_matrix) == 0:
            return []

        # Vectorized dot product on normalized embeddings = Cosine Similarity
        scores = np.dot(item_matrix, user_vector)
        # Shift to [0.0, 1.0]
        calibrated_scores = 0.5 + 0.5 * scores

        top_indices = np.argsort(-calibrated_scores)[:top_k]
        return [(product_ids[idx], float(calibrated_scores[idx])) for idx in top_indices]

    def compute_user_embedding(
        self,
        categories: list[str],
        brands: list[str],
        min_budget: float = 0,
        max_budget: float = 10000,
    ) -> np.ndarray:
        cat_map = {c: 1.0 for c in categories}
        br_map = {b: 1.0 for b in brands}
        price_tier = "BUDGET" if max_budget < 3000 else ("PREMIUM" if min_budget > 15000 else "MID")
        raw = self.extract_user_raw_features(cat_map, br_map, price_tier=price_tier)
        return self.encode_user(raw)

    def compute_item_embedding(
        self,
        category_id: str,
        brand: str,
        selling_price: float,
        rating_avg: float = 4.5,
        sales_velocity_ratio: float = 0.5,
    ) -> np.ndarray:
        raw = self.extract_item_raw_features(
            category_id=category_id,
            brand=brand,
            selling_price=selling_price,
            rating_avg=rating_avg,
            sales_velocity=int(sales_velocity_ratio * 100),
            in_stock=True,
        )
        return self.encode_item(raw)

    def predict_score(self, user_emb: np.ndarray, item_emb: np.ndarray) -> float:
        dot = float(np.dot(user_emb, item_emb))
        return float(np.clip(0.5 + 0.5 * dot, 0.0, 1.0))

    def save_weights(self, path: str):

        os.makedirs(os.path.dirname(path), exist_ok=True)
        payload = {
            "user_w1": self.user_w1.tolist(),
            "user_b1": self.user_b1.tolist(),
            "user_w2": self.user_w2.tolist(),
            "user_b2": self.user_b2.tolist(),
            "item_w1": self.item_w1.tolist(),
            "item_b1": self.item_b1.tolist(),
            "item_w2": self.item_w2.tolist(),
            "item_b2": self.item_b2.tolist(),
            "embed_dim": self.embed_dim,
            "input_dim": self.input_dim,
        }
        with open(path, "w") as f:
            json.dump(payload, f)
        logger.info(f"Two-Tower model weights successfully checkpointed to {path}")

    def load_weights(self, path: str):
        try:
            with open(path) as f:
                payload = json.load(f)
            self.user_w1 = np.array(payload["user_w1"], dtype=np.float32)
            self.user_b1 = np.array(payload["user_b1"], dtype=np.float32)
            self.user_w2 = np.array(payload["user_w2"], dtype=np.float32)
            self.user_b2 = np.array(payload["user_b2"], dtype=np.float32)
            self.item_w1 = np.array(payload["item_w1"], dtype=np.float32)
            self.item_b1 = np.array(payload["item_b1"], dtype=np.float32)
            self.item_w2 = np.array(payload["item_w2"], dtype=np.float32)
            self.item_b2 = np.array(payload["item_b2"], dtype=np.float32)
            logger.info(f"Two-Tower model weights loaded from {path}")
        except Exception as e:
            logger.warning(f"Could not load checkpoint from {path}: {e}")


_two_tower_instance: TwoTowerRecommender | None = None


def get_two_tower_recommender() -> TwoTowerRecommender:
    global _two_tower_instance
    if _two_tower_instance is None:
        _two_tower_instance = TwoTowerRecommender()
    return _two_tower_instance


get_two_tower_retriever = get_two_tower_recommender
