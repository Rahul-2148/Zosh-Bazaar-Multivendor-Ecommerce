import pytest
from ai.apps.main import app
from ai.guides.buying_guides import get_buying_guides_catalog
from ai.models.neural_two_tower import get_two_tower_retriever
from ai.reviews.review_intelligence import get_review_intelligence_engine
from ai.vision.visual_search import get_visual_search_engine
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    return TestClient(app)


def test_neural_two_tower_embeddings():
    retriever = get_two_tower_retriever()
    user_vec = retriever.compute_user_embedding(["Electronics"], ["AudioPro"], 1000, 5000)
    item_vec = retriever.compute_item_embedding("Electronics", "AudioPro", 2499, 4.5, 0.8)

    assert user_vec.shape == (64,)
    assert item_vec.shape == (64,)

    score = retriever.predict_score(user_vec, item_vec)
    assert 0.0 <= score <= 1.0


def test_two_tower_evaluation_endpoint(client):
    res = client.get("/api/v1/models/two-tower/evaluate")
    assert res.status_code == 200
    data = res.json()
    assert "metrics" in data
    assert data["metrics"]["hitRateAt10"] > 0.60
    assert data["status"] == "EVALUATION_PASSED"


def test_review_intelligence(client):
    engine = get_review_intelligence_engine()
    summary = engine.analyze_product_reviews("prod_audio_01")
    assert summary.productId == "prod_audio_01"
    assert len(summary.aspects) >= 4
    assert len(summary.topPros) >= 2

    # Test API route
    res = client.get("/api/v1/reviews/summary/prod_audio_01")
    assert res.status_code == 200
    assert res.json()["productId"] == "prod_audio_01"


def test_visual_search(client):
    engine = get_visual_search_engine()
    matches = engine.search_by_image(image_data="data:image/jpeg;base64,sample", detected_category="Audio")
    assert len(matches) > 0

    # Test API route
    res = client.post("/api/v1/vision/search", json={"imageBase64": "sample", "categoryHint": "Shoes", "limit": 4})
    assert res.status_code == 200
    assert len(res.json()["matches"]) > 0


def test_buying_guides(client):
    catalog = get_buying_guides_catalog()
    guide = catalog.get_guide_for_category("audio")
    assert guide.categoryId == "cat_audio"
    assert len(guide.keySpecsToConsider) >= 3

    res = client.get("/api/v1/guides/audio")

    assert res.status_code == 200
    assert res.json()["title"] is not None


def test_assistant_multi_turn_and_comparison(client):
    # Step 1: Tell assistant budget and category
    res1 = client.post(
        "/api/v1/assistant/chat",
        json={
            "message": "I need running shoes under 3000",
            "sessionId": "test_sess_01",
        },
    )
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["isGrounded"] is True
    assert "executionSteps" in data1
    assert data1["persistedContext"]["category"] in ["cat_sneakers", "Running Shoes"]
    assert data1["persistedContext"]["maxBudget"] == 3000

    # Step 2: Ask to compare products
    res2 = client.post(
        "/api/v1/assistant/chat",
        json={
            "message": "Compare these top products",
            "sessionId": "test_sess_01",
            "activeContext": data1["persistedContext"],
        },
    )
    assert res2.status_code == 200
    data2 = res2.json()
    assert "structuredComparison" in data2
    assert len(data2["structuredComparison"]["attributeRows"]) >= 3


def test_seller_ai_endpoints(client):
    # Test listing optimization
    res_opt = client.post(
        "/api/v1/seller/optimize-listing",
        json={
            "title": "Wireless Bluetooth Headphones",
            "category": "Audio",
            "brand": "Boat",
            "description": "Long battery life.",
        },
    )
    assert res_opt.status_code == 200
    data_opt = res_opt.json()
    assert "recommendedTitle" in data_opt
    assert data_opt["requiresSellerReview"] is True

    # Test inventory forecast
    res_fc = client.get("/api/v1/seller/inventory-forecast/prod_audio_01?horizonDays=30")
    assert res_fc.status_code == 200
    assert res_fc.json()["predictedDailyDemand"] > 0

    # Test seller insights
    res_ins = client.get("/api/v1/seller/insights")
    assert res_ins.status_code == 200
    assert len(res_ins.json()["cards"]) >= 3

    # Test pricing simulation
    res_price = client.get("/api/v1/seller/pricing-simulation/prod_sony_wh1000xm5")
    assert res_price.status_code == 200
    assert "recommendedPrice" in res_price.json()
    assert res_price.json()["productId"] == "prod_sony_wh1000xm5"

    res_price_404 = client.get("/api/v1/seller/pricing-simulation/non_existent_sku")
    assert res_price_404.status_code == 404


def test_admin_ai_endpoints(client):
    # Test copilot natural language query
    res_cop = client.post(
        "/api/v1/admin/copilot",
        json={"query": "Why did sales drop in audio?"},
    )
    assert res_cop.status_code == 200
    data_cop = res_cop.json()
    assert "headline" in data_cop
    assert len(data_cop["metrics"]) > 0

    # Test recommendation explorer
    res_exp = client.get("/api/v1/admin/recommendation-explorer?userId=user_demo_01&placement=home_for_you")
    assert res_exp.status_code == 200
    assert len(res_exp.json()["candidates"]) > 0

    # Test observability
    res_obs = client.get("/api/v1/admin/observability")
    assert res_obs.status_code == 200
    obs_data = res_obs.json()
    assert obs_data["aiServiceStatus"] == "HEALTHY"
    assert len(obs_data["activeModels"]) > 0
    assert "modelName" in obs_data["activeModels"][0]

    # Test diagnose
    res_diag = client.post(
        "/api/v1/admin/diagnose",
        json={"categoryName": "Audio", "weeklyConversionDropPct": 14.5},
    )
    assert res_diag.status_code == 200

    # Test fraud evaluation
    res_fraud = client.post(
        "/api/v1/admin/fraud/evaluate",
        json={"orderAmount": 4500, "itemsCount": 3},
    )
    assert res_fraud.status_code == 200
    assert "riskScore" in res_fraud.json()


def test_logistics_and_delivery_endpoints(client):
    # Test SLA risk shipments
    res_log = client.get("/api/v1/logistics/risk-shipments")
    assert res_log.status_code == 200
    assert res_log.json()["totalMonitoredShipments"] > 0

    # Test delivery partner stop assistance
    res_del = client.get("/api/v1/delivery/stop-assistance?riderId=rider_104")
    assert res_del.status_code == 200
    assert res_del.json()["nextBestStop"]["deliverySuccessProbability"] > 0.90
