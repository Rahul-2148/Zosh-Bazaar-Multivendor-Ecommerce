from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from ai.vision.visual_search import VisualSearchPipeline, get_visual_search_pipeline

router = APIRouter(prefix="/vision", tags=["Visual Search"])


class VisualSearchRequest(BaseModel):
    imageData: str | None = Field(default=None, description="Base64 encoded image or image bytes")
    imageBase64: str | None = Field(default=None, description="Alias for imageData")
    imageUrl: str | None = Field(default=None, description="Direct URL of image to analyze")
    detectedCategory: str | None = None
    categoryHint: str | None = None
    dominantColors: list[str] = Field(default_factory=list)
    topK: int = 10
    limit: int | None = None


@router.post("/search", response_model=dict[str, Any])
def visual_product_search(
    req: VisualSearchRequest,
    pipeline: VisualSearchPipeline = Depends(get_visual_search_pipeline),
):
    """Processes an image query and returns visually similar products from the catalog."""
    img_data = req.imageData or req.imageBase64
    cat_hint = req.detectedCategory or req.categoryHint
    k = req.limit or req.topK

    matches = pipeline.search_by_image(
        image_data=img_data,
        image_url=req.imageUrl,
        detected_category=cat_hint,
        dominant_colors=req.dominantColors,
        top_k=k,
    )
    return {
        "matches": matches,
        "total": len(matches),
        "categoryDetected": cat_hint or "General",
    }
