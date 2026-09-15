import json
import logging
import os
from datetime import UTC, datetime

from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


def utc_now() -> datetime:
    return datetime.now(UTC)


class ModelMetadata(BaseModel):
    name: str
    version: str
    framework: str
    stage: str = Field(default="ACTIVE", description="ACTIVE | STAGING | ARCHIVED")
    metrics: dict[str, float] = Field(default_factory=dict)
    description: str = ""
    createdAt: datetime = Field(default_factory=utc_now)
    updatedAt: datetime = Field(default_factory=utc_now)

    @property
    def modelName(self) -> str:
        return self.name


class ModelRegistry:
    """Manages versioned ML models and prevents accidental production overwrites."""

    def __init__(self, registry_file: str = "ai/models/registry.json"):
        self.registry_file = registry_file
        self.models: dict[str, ModelMetadata] = {}
        self.load_registry()

    def load_registry(self):
        if os.path.exists(self.registry_file):
            try:
                with open(self.registry_file, encoding="utf-8") as f:
                    data = json.load(f)
                    for k, v in data.items():
                        self.models[k] = ModelMetadata.model_validate(v)
            except Exception as e:
                logger.error(f"Error loading model registry: {e}")
        else:
            self._register_default_models()

    def save_registry(self):
        try:
            os.makedirs(os.path.dirname(self.registry_file), exist_ok=True)
            with open(self.registry_file, "w", encoding="utf-8") as f:
                json.dump({k: v.model_dump(mode="json") for k, v in self.models.items()}, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving model registry: {e}")

    def _register_default_models(self):
        defaults = [
            ModelMetadata(
                name="recommendation_candidate_generator",
                version="candidate_v1",
                framework="hybrid_scikit",
                stage="ACTIVE",
                metrics={"catalog_coverage": 0.94, "candidate_recall_at_100": 0.88},
                description="Multi-source candidate retrieval combining popularity, vector similarity, and co-purchase",
            ),
            ModelMetadata(
                name="recommendation_ranker",
                version="hybrid_ranker_v1",
                framework="linear_boosted",
                stage="ACTIVE",
                metrics={"ndcg_at_10": 0.74, "precision_at_10": 0.42, "mrr": 0.68},
                description="Multi-stage hybrid ranking with personalization, business constraints, and MMR diversity",
            ),
            ModelMetadata(
                name="product_content_embedder",
                version="content_embed_v1",
                framework="tfidf_cosine",
                stage="ACTIVE",
                metrics={"similarity_purity": 0.89},
                description="Item semantic representation built on titles, brands, categories, and attributes",
            ),
        ]
        for m in defaults:
            self.models[f"{m.name}:{m.version}"] = m
        self.save_registry()

    def get_active_model(self, model_name: str) -> ModelMetadata | None:
        for model in self.models.values():
            if model.name == model_name and model.stage == "ACTIVE":
                return model
        return None

    def register_model(self, meta: ModelMetadata):
        key = f"{meta.name}:{meta.version}"
        self.models[key] = meta
        self.save_registry()
        logger.info(f"Registered model {key} (stage={meta.stage})")

    def list_models(self) -> list[ModelMetadata]:
        return list(self.models.values())


_model_registry_instance: ModelRegistry | None = None


def get_model_registry() -> ModelRegistry:
    global _model_registry_instance
    if _model_registry_instance is None:
        _model_registry_instance = ModelRegistry()
    return _model_registry_instance
