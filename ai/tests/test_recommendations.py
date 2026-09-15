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
