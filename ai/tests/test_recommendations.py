from ai.recommendations.engine import RecommendationEngine
from ai.schemas.recommendations import PlacementType, RecommendationRequest


def test_home_for_you_recommendations():
    engine = RecommendationEngine()
    req = RecommendationRequest(
        placement=PlacementType.HOME_FOR_YOU,
        limit=6,
    )
    res = engine.recommend(req)

    assert res.totalReturned > 0
    assert len(res.recommendations) <= 6
    assert res.requestId.startswith("rec_")
    assert res.strategy == "multi_stage_hybrid"
    for item in res.recommendations:
        assert item.inStock is True
        assert item.score > 0
        assert item.explanationText != ""


def test_pdp_similar_products_recommendations():
    engine = RecommendationEngine()
    anchor = "prod_apple_watch_ultra_2"
    req = RecommendationRequest(
        placement=PlacementType.PDP_SIMILAR,
        anchorProductId=anchor,
        limit=4,
    )
    res = engine.recommend(req)

    assert res.totalReturned > 0
    rec_ids = [r.productId for r in res.recommendations]
    assert anchor not in rec_ids  # Anchor product should not be recommended to itself


def test_cart_addons_recommendations():
    engine = RecommendationEngine()
    req = RecommendationRequest(
        placement=PlacementType.CART_ADDONS,
        cartProductIds=["prod_nike_air_jordan_1"],
        limit=3,
    )
    res = engine.recommend(req)

    assert res.totalReturned > 0
    rec_ids = [r.productId for r in res.recommendations]
    assert "prod_nike_air_jordan_1" not in rec_ids


def test_user_features_recommendations_with_purchases():
    from ai.feature_store.store import get_feature_store
    from ai.schemas.features import UserFeatures

    engine = RecommendationEngine()
    store = get_feature_store()
    user_id = "user_test_purchases"

    u_feat = UserFeatures(
        userId=user_id,
        categoryAffinities={"smartphones": 0.9},
        brandAffinities={"Apple": 0.8},
        recentlyViewedProductIds=["prod_apple_iphone_15_pro"],
        purchasedProductIds=["prod_apple_watch_ultra_2"],
        totalPurchases=1,
    )
    store.set_user_features(u_feat)

    req = RecommendationRequest(
        userId=user_id,
        placement=PlacementType.HOME_FOR_YOU,
        limit=5,
    )
    res = engine.recommend(req)

    assert res.totalReturned > 0
    assert res.metadata["isPersonalized"] is True
    assert res.metadata["interactionCount"] == 2
    assert res.metadata["personalizationLevel"] == "LEVEL_1_SESSION_AFFINITY"


def test_frequently_bought_together_with_missing_or_none_items():
    from unittest.mock import MagicMock
    from ai.models.candidate_generation import CandidateGenerationPipeline

    mock_store = MagicMock()
    mock_store.get_all_items.return_value = []
    # Test single-evaluation & null safety
    mock_store.get_item_features.return_value = None

    pipeline = CandidateGenerationPipeline(mock_store, MagicMock())
    candidates = pipeline.get_frequently_bought_together(["non_existent_id", None, ""])
    assert candidates == []


def test_pdp_frequently_bought_together_fallback():
    engine = RecommendationEngine()
    req = RecommendationRequest(
        placement=PlacementType.PDP_FREQUENTLY_BOUGHT_TOGETHER,
        anchorProductId="prod_non_existent_12345",
        limit=4,
    )
    res = engine.recommend(req)
    assert res.totalReturned > 0
    assert len(res.recommendations) <= 4


