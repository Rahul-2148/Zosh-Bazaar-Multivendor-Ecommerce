from ai.schemas.events import AIInteractionEvent, EventType
from ai.services.event_service import EventService


def test_event_schema_validation():
    event = AIInteractionEvent(
        eventId="ev_test_1",
        eventType=EventType.PRODUCT_VIEW,
        sessionId="sess_100",
        userId="user_100",
        productId="prod_apple_watch_ultra_2",
        categoryId="cat_smartwatches",
        brand="Apple",
        price=79900.0,
    )
    assert event.eventId == "ev_test_1"
    assert event.eventType == EventType.PRODUCT_VIEW
    assert event.price == 79900.0


def test_event_service_deduplication_and_feature_update():
    service = EventService()

    event = AIInteractionEvent(
        eventId="ev_dedup_test",
        eventType=EventType.PRODUCT_VIEW,
        sessionId="sess_test_1",
        userId="user_tester_1",
        productId="prod_sony_wh1000xm5",
        categoryId="cat_audio",
        brand="Sony",
    )

    first_ingest = service.ingest_event(event)
    assert first_ingest is True

    # Duplicate should be dropped
    second_ingest = service.ingest_event(event)
    assert second_ingest is False

    # Check updated user features
    user_features = service.feature_store.get_user_features("user_tester_1")
    assert user_features is not None
    assert "cat_audio" in user_features.categoryAffinities
    assert "Sony" in user_features.brandAffinities
