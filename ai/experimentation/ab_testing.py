import hashlib

from pydantic import BaseModel


class ExperimentConfig(BaseModel):
    experimentId: str
    description: str
    controlModel: str = "hybrid_recommender_v1"
    variantModel: str = "hybrid_recommender_v2_deep"
    trafficAllocationPct: int = 50  # 50% to variant
    isActive: bool = True


class ExperimentManager:
    """Provides deterministic traffic allocation and variant routing for ML experiments."""

    def __init__(self):
        self.experiments: dict[str, ExperimentConfig] = {
            "exp_homepage_ranker_v2": ExperimentConfig(
                experimentId="exp_homepage_ranker_v2",
                description="Testing fine-tuned category affinity weights on homepage",
                controlModel="hybrid_recommender_v1",
                variantModel="hybrid_recommender_v2_boosted",
                trafficAllocationPct=50,
                isActive=True,
            )
        }

    def assign_variant(self, user_or_session_id: str, experiment_id: str) -> dict[str, str]:
        exp = self.experiments.get(experiment_id)
        if not exp or not exp.isActive:
            return {"experimentId": experiment_id, "variant": "CONTROL", "modelVersion": "hybrid_recommender_v1"}

        # Deterministic MD5 hash to 0-99 bucket
        hash_input = f"{user_or_session_id}:{experiment_id}".encode()
        bucket = int(hashlib.md5(hash_input).hexdigest(), 16) % 100

        if bucket < exp.trafficAllocationPct:
            return {
                "experimentId": experiment_id,
                "variant": "VARIANT_B",
                "modelVersion": exp.variantModel,
            }
        return {
            "experimentId": experiment_id,
            "variant": "CONTROL",
            "modelVersion": exp.controlModel,
        }


_exp_manager_instance = None


def get_experiment_manager() -> ExperimentManager:
    global _exp_manager_instance
    if _exp_manager_instance is None:
        _exp_manager_instance = ExperimentManager()
    return _exp_manager_instance
