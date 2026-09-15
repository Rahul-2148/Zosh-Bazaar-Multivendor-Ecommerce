import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from ai.api.v1.admin import router as admin_router
from ai.api.v1.assistant import router as assistant_router
from ai.api.v1.events import router as events_router
from ai.api.v1.guides import router as guides_router
from ai.api.v1.logistics import router as logistics_router
from ai.api.v1.models import router as models_router
from ai.api.v1.recommendations import router as rec_router
from ai.api.v1.reviews import router as reviews_router
from ai.api.v1.search import router as search_router
from ai.api.v1.seller import router as seller_router
from ai.api.v1.vision import router as vision_router
from ai.configs.settings import get_settings
from ai.feature_store.store import get_feature_store
from ai.vector_store.index import get_vector_index

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("zosh_bazaar_ai")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initializes and warms up models and caches before accepting traffic."""
    logger.info("Initializing Zosh Bazaar AI Platform services...")
    settings = get_settings()

    # 1. Warm up feature store
    feature_store = get_feature_store()
    items = feature_store.get_all_items()
    logger.info(f"Loaded {len(items)} items into online feature store.")

    # 2. Warm up vector index
    vector_index = get_vector_index()
    vector_index.build_index(items)
    logger.info("Vector similarity index warmed up.")

    logger.info(f"Zosh Bazaar AI Platform ready on port {settings.PORT}.")
    yield
    logger.info("Shutting down Zosh Bazaar AI Platform...")


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="Zosh Bazaar AI/ML Platform",
        description="Dedicated production personalization, recommendation, search, and ecommerce intelligence service.",
        version="1.0.0",
        lifespan=lifespan,
    )

    # CORS configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Timing middleware
    @app.middleware("http")
    async def add_process_time_header(request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        process_time = (time.time() - start_time) * 1000
        response.headers["X-Process-Time-Ms"] = f"{process_time:.2f}"
        return response

    # Mount API routers
    app.include_router(rec_router, prefix="/api/v1")
    app.include_router(events_router, prefix="/api/v1")
    app.include_router(assistant_router, prefix="/api/v1")
    app.include_router(search_router, prefix="/api/v1")
    app.include_router(models_router, prefix="/api/v1")
    app.include_router(vision_router, prefix="/api/v1")
    app.include_router(reviews_router, prefix="/api/v1")
    app.include_router(guides_router, prefix="/api/v1")
    app.include_router(seller_router, prefix="/api/v1")
    app.include_router(admin_router, prefix="/api/v1")
    app.include_router(logistics_router, prefix="/api/v1")

    @app.get("/", tags=["Health"])
    def root():
        return {
            "name": "Zosh Bazaar AI Platform",
            "version": "1.0.0",
            "status": "online",
            "capabilities": [
                "multi_stage_recommendations",
                "realtime_session_personalization",
                "semantic_search",
                "grounded_ai_assistant",
                "behavioral_event_telemetry",
                "offline_evaluation",
            ],
        }

    @app.get("/health", tags=["Health"])
    def health_check():
        feature_store = get_feature_store()
        vector_index = get_vector_index()
        return {
            "status": "healthy",
            "itemsCount": len(feature_store.get_all_items()),
            "vectorIndexFitted": vector_index._is_fitted,
            "redisConnected": feature_store.redis_client is not None,
            "mongoConnected": feature_store.mongo_client is not None,
        }

    return app


app = create_app()

if __name__ == "__main__":
    import uvicorn

    settings = get_settings()
    uvicorn.run(
        "ai.apps.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
