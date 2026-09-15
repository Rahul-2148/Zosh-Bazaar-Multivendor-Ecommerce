from ai.evaluation.metrics import RecommendationEvaluator


def test_offline_metrics():
    evaluator = RecommendationEvaluator()

    recommended = ["item_a", "item_b", "item_c", "item_d", "item_e"]
    ground_truth = {"item_b", "item_d", "item_z"}

    p_at_5 = evaluator.precision_at_k(recommended, ground_truth, k=5)
    assert p_at_5 == 2.0 / 5.0  # 2 hits out of 5

    r_at_5 = evaluator.recall_at_k(recommended, ground_truth, k=5)
    assert r_at_5 == 2.0 / 3.0  # 2 hits out of 3 relevant

    mrr = evaluator.mrr(recommended, ground_truth)
    assert mrr == 1.0 / 2.0  # First hit is item_b at rank 2

    ndcg = evaluator.ndcg_at_k(recommended, ground_truth, k=5)
    assert ndcg > 0.45  # Positive discounted gain
