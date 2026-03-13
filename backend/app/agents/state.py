from typing import Optional
from typing_extensions import TypedDict
from datetime import datetime

from app.models.schemas import (
    Platform,
    Category,
    Sentiment,
    Decision,
    ResolutionAction,
    Customer,
    NodeClassify,
    NodeRoute,
    NodeResolve,
)


# ── LangGraph State ───────────────────────────────────────────────────────────
# This TypedDict flows through all 3 nodes.
# Each node reads what it needs and writes its output key.
# Nothing is mutated — LangGraph merges returned dicts into state.

class AgentState(TypedDict):

    # ── Input (set once at graph entry) ──────────────────
    query_id:  str
    platform:  Platform
    timestamp: datetime
    message:   str
    customer:  Customer

    # ── Node 1 output ─────────────────────────────────────
    node_classify: Optional[NodeClassify]

    # ── Node 2 output ─────────────────────────────────────
    node_route: Optional[NodeRoute]

    # ── Node 3 output ─────────────────────────────────────
    node_resolve: Optional[NodeResolve]

    # ── Meta ──────────────────────────────────────────────
    llm_used:           bool
    started_at:         datetime
    processing_time_ms: int