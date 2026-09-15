from fastapi import APIRouter, Depends, Query

from ai.search.semantic_search import SemanticSearchEngine, get_semantic_search

router = APIRouter(prefix="/search", tags=["Semantic Search"])


@router.get("", response_model=list[dict])
def semantic_search(
    q: str = Query(..., description="Natural language search query"),
    categoryId: str | None = Query(None),
    limit: int = Query(15, ge=1, le=50),
    search_engine: SemanticSearchEngine = Depends(get_semantic_search),
):
    """Hybrid semantic and lexical search supporting vernacular Hinglish and price intent."""
    return search_engine.search(query=q, limit=limit, category_id=categoryId)
