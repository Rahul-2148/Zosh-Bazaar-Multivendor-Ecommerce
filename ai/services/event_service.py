import logging
import threading
from datetime import UTC, datetime

from ai.configs.settings import get_settings
from ai.feature_store.store import FeatureStore, get_feature_store
from ai.schemas.events import AIInteractionEvent, EventType
from ai.schemas.features import UserFeatures

logger = logging.getLogger(__name__)


class EventService:
    """Ingests, validates, deduplicates, and computes features from behavioral telemetry events."""

    def __init__(self, feature_store: FeatureStore | None = None):
        self.settings = get_settings()
        self.feature_store = feature_store or get_feature_store()
        self._seen_event_ids: set[str] = set()
        self._lock = threading.Lock()

        # Recommendation conversion attribution tracking
        self.recommendation_feedback: list[dict] = []

    def ingest_event(self, event: AIInteractionEvent) -> bool:
        """Processes a single validated event with idempotency check."""
        with self._lock:
            if event.eventId in self._seen_event_ids:
                logger.debug(f"Duplicate event {event.eventId} dropped.")
                return False
            self._seen_event_ids.add(event.eventId)
            if len(self._seen_event_ids) > 10000:
                self._seen_event_ids.clear()

        # 1. Update Ephemeral Session Features
        is_cart_event = event.eventType in [
            EventType.ADD_TO_CART,
            EventType.INCREASE_QUANTITY,
        ]
        self.feature_store.update_session(
            session_id=event.sessionId,
            user_id=event.userId,
            product_id=event.productId,
            category_id=event.categoryId,
            search_query=event.searchQuery,
            is_cart=is_cart_event,
        )

        # 2. Update Long-Term User Profile Features (if authenticated)
        if event.userId:
            self._update_user_features(event)

        # 3. Track Recommendation Feedback Loop
        if event.recommendationContext and event.recommendationContext.recommendationId:
            self._track_feedback(event)

        # 4. Asynchronously persist event to MongoDB if connected
        if self.feature_store.mongo_client:
            try:
                db = self.feature_store.mongo_client.get_database()
                db["ai_events"].insert_one(event.model_dump(mode="json"))
            except Exception as e:
                logger.error(f"Error persisting event to MongoDB: {e}")

        return True

    def ingest_batch(self, events: list[AIInteractionEvent]) -> dict[str, int]:
        processed = 0
        dropped = 0
        for ev in events:
            if self.ingest_event(ev):
                processed += 1
            else:
                dropped += 1
        return {"processed": processed, "dropped": dropped}

    def _update_user_features(self, event: AIInteractionEvent):
        user_id = event.userId
        user_feat = self.feature_store.get_user_features(user_id) or UserFeatures(userId=user_id)

        # Determine signal weight based on event hierarchy
        weight = 0.0
        if event.eventType == EventType.ORDER_PLACED:
            weight = self.settings.EVENT_WEIGHT_PURCHASE
            user_feat.totalPurchases += 1
        elif event.eventType == EventType.ADD_TO_CART:
            weight = self.settings.EVENT_WEIGHT_CART
            user_feat.totalCartAdds += 1
        elif event.eventType == EventType.WISHLIST_ADD:
            weight = self.settings.EVENT_WEIGHT_WISHLIST
        elif event.eventType in [EventType.PRODUCT_VIEW, EventType.PRODUCT_DETAIL_OPEN]:
            weight = self.settings.EVENT_WEIGHT_VIEW
            user_feat.totalViews += 1
            if event.productId and event.productId not in user_feat.recentlyViewedProductIds:
                user_feat.recentlyViewedProductIds.insert(0, event.productId)
                user_feat.recentlyViewedProductIds = user_feat.recentlyViewedProductIds[:20]

        # Update category affinity
        if event.categoryId and weight > 0:
            current = user_feat.categoryAffinities.get(event.categoryId, 0.0)
            # Exponential decay addition
            user_feat.categoryAffinities[event.categoryId] = round(min(current + (0.15 * weight), 1.0), 3)

        # Update brand affinity
        if event.brand and weight > 0:
            current_b = user_feat.brandAffinities.get(event.brand, 0.0)
            user_feat.brandAffinities[event.brand] = round(min(current_b + (0.15 * weight), 1.0), 3)

        # Update price context
        if event.price and event.price > 0:
            if user_feat.preferredPriceMax is None or event.price > user_feat.preferredPriceMax:
                user_feat.preferredPriceMax = event.price
            if user_feat.preferredPriceMin is None or event.price < user_feat.preferredPriceMin:
                user_feat.preferredPriceMin = event.price

        if event.searchQuery and event.searchQuery not in user_feat.recentSearchQueries:
            user_feat.recentSearchQueries.insert(0, event.searchQuery)
            user_feat.recentSearchQueries = user_feat.recentSearchQueries[:10]

        user_feat.updatedAt = datetime.now(UTC)
        self.feature_store.set_user_features(user_feat)

    def _track_feedback(self, event: AIInteractionEvent):
        rc = event.recommendationContext
        record = {
            "timestamp": event.timestamp,
            "recommendationId": rc.recommendationId,
            "requestId": rc.requestId,
            "placement": rc.placement,
            "modelVersion": rc.modelVersion,
            "eventType": event.eventType.value,
            "productId": event.productId,
            "userId": event.userId,
        }
        with self._lock:
            self.recommendation_feedback.append(record)
            if len(self.recommendation_feedback) > 5000:
                self.recommendation_feedback = self.recommendation_feedback[-5000:]


_event_service_instance: EventService | None = None


def get_event_service() -> EventService:
    global _event_service_instance
    if _event_service_instance is None:
        _event_service_instance = EventService()
    return _event_service_instance
