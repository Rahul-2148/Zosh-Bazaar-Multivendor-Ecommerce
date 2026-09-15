import math


class RecommendationEvaluator:
    """Computes offline academic & industry recommendation evaluation metrics."""

    @staticmethod
    def precision_at_k(recommended: list[str], ground_truth: set[str], k: int = 10) -> float:
        if k <= 0 or not ground_truth:
            return 0.0
        rec_k = recommended[:k]
        hits = sum(1 for item in rec_k if item in ground_truth)
        return hits / float(k)

    @staticmethod
    def recall_at_k(recommended: list[str], ground_truth: set[str], k: int = 10) -> float:
        if not ground_truth:
            return 0.0
        rec_k = recommended[:k]
        hits = sum(1 for item in rec_k if item in ground_truth)
        return hits / float(len(ground_truth))

    @staticmethod
    def mrr(recommended: list[str], ground_truth: set[str]) -> float:
        """Mean Reciprocal Rank (MRR): 1 / rank of first relevant item."""
        for rank, item in enumerate(recommended, start=1):
            if item in ground_truth:
                return 1.0 / rank
        return 0.0

    @staticmethod
    def ndcg_at_k(recommended: list[str], ground_truth: set[str], k: int = 10) -> float:
        """Normalized Discounted Cumulative Gain (NDCG@K)."""
        if not ground_truth or k <= 0:
            return 0.0

        rec_k = recommended[:k]
        dcg = 0.0
        for i, item in enumerate(rec_k):
            if item in ground_truth:
                dcg += 1.0 / math.log2(i + 2)  # rank 1 gives log2(2) = 1

        # Ideal DCG: all hits ranked at the very top
        ideal_hits = min(len(ground_truth), k)
        idcg = sum(1.0 / math.log2(i + 2) for i in range(ideal_hits))
        if idcg == 0:
            return 0.0
        return dcg / idcg

    @staticmethod
    def map_at_k(recommended: list[str], ground_truth: set[str], k: int = 10) -> float:
        """Mean Average Precision (MAP@K)."""
        if not ground_truth or k <= 0:
            return 0.0

        rec_k = recommended[:k]
        score = 0.0
        num_hits = 0.0

        for i, p in enumerate(rec_k):
            if p in ground_truth:
                num_hits += 1.0
                score += num_hits / (i + 1.0)

        return score / min(len(ground_truth), k)

    @staticmethod
    def catalog_coverage(all_recommended_unique: set[str], total_catalog_count: int) -> float:
        if total_catalog_count <= 0:
            return 0.0
        return len(all_recommended_unique) / float(total_catalog_count)

    @staticmethod
    def intra_list_diversity(recommended_categories: list[str]) -> float:
        """Calculates categorical diversity: unique categories / total recommendations."""
        if not recommended_categories:
            return 0.0
        return len(set(recommended_categories)) / float(len(recommended_categories))

    def evaluate_recommendations_batch(
        self,
        batch_predictions: list[dict[str, list[str]]],
        k: int = 10,
        total_catalog_size: int = 100,
    ) -> dict[str, float]:
        """Runs batch evaluation over a list of {recommended: [...], groundTruth: [...]}."""
        precisions = []
        recalls = []
        ndcgs = []
        mrrs = []
        all_recommended_items = set()

        for entry in batch_predictions:
            recs = entry.get("recommended", [])
            truth = set(entry.get("groundTruth", []))
            all_recommended_items.update(recs[:k])

            precisions.append(self.precision_at_k(recs, truth, k=k))
            recalls.append(self.recall_at_k(recs, truth, k=k))
            ndcgs.append(self.ndcg_at_k(recs, truth, k=k))
            mrrs.append(self.mrr(recs, truth))

        n = len(batch_predictions) or 1
        return {
            f"Precision@{k}": round(sum(precisions) / n, 4),
            f"Recall@{k}": round(sum(recalls) / n, 4),
            f"NDCG@{k}": round(sum(ndcgs) / n, 4),
            "MRR": round(sum(mrrs) / n, 4),
            "CatalogCoverage": round(self.catalog_coverage(all_recommended_items, total_catalog_size), 4),
        }


_evaluator_instance = None


def get_evaluator() -> RecommendationEvaluator:
    global _evaluator_instance
    if _evaluator_instance is None:
        _evaluator_instance = RecommendationEvaluator()
    return _evaluator_instance
