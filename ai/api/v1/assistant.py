import asyncio
import json
import logging

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

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


@router.post("/stream")
async def stream_chat_with_assistant(
    req: AssistantQueryRequest,
    assistant: ShoppingAssistantAgent = Depends(get_shopping_assistant),
):
    """Server-Sent Events (SSE) streaming endpoint for real-time tokens and tool execution progression."""

    async def event_generator():
        try:
            # Generate grounded query response from agent
            res = assistant.process_query(req)

            # 1. Stream tool execution steps progressively
            for step in res.executionSteps:
                yield f"data: {json.dumps({'type': 'step', 'step': step.model_dump()})}\n\n"
                await asyncio.sleep(0.04)

            # 2. Stream reply words/tokens progressively
            words = res.reply.split(" ")
            for i, word in enumerate(words):
                prefix = "" if i == 0 else " "
                yield f"data: {json.dumps({'type': 'token', 'token': prefix + word})}\n\n"
                await asyncio.sleep(0.015)

            # 3. Stream structured commerce results & action payloads
            payload_data = {
                "type": "payload",
                "suggestedProducts": [p.model_dump() for p in res.suggestedProducts],
                "suggestedActions": res.suggestedActions,
                "structuredComparison": res.structuredComparison.model_dump() if res.structuredComparison else None,
                "actionPayloads": [a.model_dump() for a in res.actionPayloads],
                "persistedContext": res.persistedContext,
                "isGrounded": res.isGrounded,
                "confidence": res.confidence,
            }
            yield f"data: {json.dumps(payload_data)}\n\n"

            # 4. Stream completion event
            yield f"data: {json.dumps({'type': 'done'})}\n\n"

        except Exception as e:
            logger.error(f"Error in streaming assistant response: {e}")
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
