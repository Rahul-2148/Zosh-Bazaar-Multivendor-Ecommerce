import logging

from fastapi import APIRouter, Depends

from ai.agents.assistant import ShoppingAssistantAgent, get_shopping_assistant
from ai.schemas.assistant import AssistantQueryRequest, AssistantQueryResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/assistant", tags=["AI Shopping Assistant"])


@router.post("/chat", response_model=AssistantQueryResponse)
def chat_with_assistant(
    req: AssistantQueryRequest,
    assistant: ShoppingAssistantAgent = Depends(get_shopping_assistant),
):
    """Grounded AI shopping assistant answering product questions, comparisons, and discovery."""
    return assistant.process_query(req)
