from fastapi import APIRouter, Depends, HTTPException

from ai.guides.buying_guides import (
    BuyingGuideService,
    CategoryBuyingGuide,
    get_buying_guide_service,
)

router = APIRouter(prefix="/guides", tags=["Category Buying Guides"])


@router.get("/{category_id}", response_model=CategoryBuyingGuide)
def get_category_guide(
    category_id: str,
    guide_service: BuyingGuideService = Depends(get_buying_guide_service),
):
    """Retrieves grounded educational buying guide for complex consumer categories."""
    guide = guide_service.get_guide_for_category(category_id)
    if not guide:
        raise HTTPException(status_code=404, detail="Buying guide not found for category")
    return guide
