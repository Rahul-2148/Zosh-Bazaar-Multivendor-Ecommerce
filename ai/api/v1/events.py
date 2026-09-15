import logging

from fastapi import APIRouter, Depends, HTTPException, status

from ai.schemas.events import AIInteractionEvent, EventBatch
from ai.services.event_service import EventService, get_event_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/events", tags=["Events Telemetry"])


@router.post("", status_code=status.HTTP_201_CREATED)
def ingest_event(
    event: AIInteractionEvent,
    service: EventService = Depends(get_event_service),
) -> dict[str, str]:
    """Ingest a single behavioral telemetry event."""
    try:
        success = service.ingest_event(event)
        return {
            "status": "success" if success else "duplicate_dropped",
            "eventId": event.eventId,
        }
    except Exception as e:
        logger.error(f"Failed to process event: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to ingest event: {e!s}",
        ) from e


@router.post("/batch", status_code=status.HTTP_201_CREATED)
def ingest_batch(
    batch: EventBatch,
    service: EventService = Depends(get_event_service),
) -> dict[str, int]:
    """Ingest a batch of debounced events dispatched by the client SDK."""
    return service.ingest_batch(batch.events)
