from ai.apps.main import create_app
from fastapi.testclient import TestClient

client = TestClient(create_app())


def test_health_check_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["itemsCount"] > 0


def test_home_recommendations_api():
    response = client.get("/api/v1/recommendations/home?limit=5")
    assert response.status_code == 200
    data = response.json()
    assert "recommendations" in data
    assert len(data["recommendations"]) <= 5
    assert data["placement"] == "home_for_you"


def test_product_recommendations_api():
    response = client.get("/api/v1/recommendations/product/prod_sony_wh1000xm5?limit=4")
    assert response.status_code == 200
    data = response.json()
    assert len(data["recommendations"]) <= 4


def test_event_ingestion_api():
    payload = {
        "eventId": "ev_api_test_001",
        "eventType": "product_view",
        "sessionId": "sess_api_test",
        "userId": "user_api_test",
        "productId": "prod_apple_watch_ultra_2",
        "categoryId": "cat_smartwatches",
    }
    response = client.post("/api/v1/events", json=payload)
    assert response.status_code == 201
    assert response.json()["status"] == "success"


def test_assistant_chat_api():
    payload = {
        "sessionId": "sess_chat_001",
        "message": "Recommend me the best wireless headphones under 30000",
    }
    response = client.post("/api/v1/assistant/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["isGrounded"] is True
    assert "reply" in data
    assert len(data["suggestedProducts"]) > 0


def test_semantic_search_api():
    response = client.get("/api/v1/search?q=banarasi+saree")
    assert response.status_code == 200
    results = response.json()
    assert len(results) > 0
    assert "saree" in results[0]["title"].lower() or "saree" in results[0]["categoryName"].lower()
