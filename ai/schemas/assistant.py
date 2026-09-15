from datetime import UTC, datetime
from typing import Any

from pydantic import BaseModel, Field

from .recommendations import RecommendationItem


def utc_now() -> datetime:
    return datetime.now(UTC)


class ChatMessage(BaseModel):
    role: str = Field(description="user | assistant | system | tool")
    content: str
    toolCalls: list[dict[str, Any]] | None = None
    timestamp: datetime = Field(default_factory=utc_now)


class ExecutionStep(BaseModel):
    stepName: str
    status: str = Field(default="COMPLETED", description="PENDING | RUNNING | COMPLETED | ERROR")
    detail: str = ""


class ComparisonAttributeRow(BaseModel):
    attributeName: str
    values: dict[str, Any] = Field(description="productId -> attribute value string")


class StructuredComparison(BaseModel):
    productIds: list[str] = Field(default_factory=list)
    productTitles: dict[str, str] = Field(default_factory=dict)
    attributeRows: list[ComparisonAttributeRow] = Field(default_factory=list)
    verdict: str = ""


class ActionPayload(BaseModel):
    actionType: str = Field(description="ADD_TO_CART | VIEW_PRODUCT | SET_PRICE_ALERT | BUY_NOW")
    productId: str | None = None
    title: str | None = None
    price: float | None = None
    payload: dict[str, Any] = Field(default_factory=dict)


class AssistantQueryRequest(BaseModel):
    """Input payload for conversational shopping assistant."""

    userId: str | None = None
    sessionId: str
    message: str
    chatHistory: list[ChatMessage] = Field(default_factory=list)
    currentProductId: str | None = None
    cartProductIds: list[str] = Field(default_factory=list)
    activeContext: dict[str, Any] = Field(default_factory=dict)


class GroundedToolExecution(BaseModel):
    toolName: str
    arguments: dict[str, Any]
    resultSummary: str


class AssistantQueryResponse(BaseModel):
    """Grounded output response from conversational shopping assistant."""

    reply: str
    suggestedProducts: list[RecommendationItem] = Field(default_factory=list)
    suggestedActions: list[str] = Field(default_factory=list)
    executedTools: list[GroundedToolExecution] = Field(default_factory=list)
    executionSteps: list[ExecutionStep] = Field(default_factory=list)
    structuredComparison: StructuredComparison | None = None
    actionPayloads: list[ActionPayload] = Field(default_factory=list)
    persistedContext: dict[str, Any] = Field(default_factory=dict)
    isGrounded: bool = True
    confidence: float = 0.95
    createdAt: datetime = Field(default_factory=utc_now)
