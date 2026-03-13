from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum
from datetime import datetime
import uuid


# ── Enums ────────────────────────────────────────────────────────────────────

class Platform(str, Enum):
    WHATSAPP  = "whatsapp"
    INSTAGRAM = "instagram"
    EMAIL     = "email"
    WEBSITE   = "website"


class Category(str, Enum):
    ORDER_TRACKING    = "Order Tracking"
    DELIVERY_DELAY    = "Delivery Delay"
    REFUND_REQUEST    = "Refund Request"
    PRODUCT_COMPLAINT = "Product Complaint"
    PAYMENT_FAILURE   = "Payment Failure"
    SUBSCRIPTION      = "Subscription Issue"
    GENERAL_QUERY     = "General Query"


class Sentiment(str, Enum):
    FRUSTRATED = "frustrated"
    URGENT     = "urgent"
    NEUTRAL    = "neutral"
    POSITIVE   = "positive"


class Decision(str, Enum):
    AUTO_RESOLVE = "auto_resolve"
    ESCALATE     = "escalate"


class ResolutionAction(str, Enum):
    FAQ      = "faq"
    CONTACT  = "contact"
    ESCALATE = "escalate"


class UrgencyLevel(str, Enum):
    URGENT = "urgent"
    HIGH   = "high"
    MEDIUM = "medium"
    LOW    = "low"


# ── Customer Contact ─────────────────────────────────────────────────────────

class CustomerContact(BaseModel):
    """
    Stores only what the platform provides.
    WhatsApp  → phone only
    Instagram → handle only
    Email     → email only
    """
    whatsapp:          Optional[str] = None
    instagram:         Optional[str] = None
    email:             Optional[str] = None
    website_session:   Optional[str] = None


class Customer(BaseModel):
    name:     Optional[str] = None
    order_id: Optional[str] = None
    contact:  CustomerContact


# ── Incoming ─────────────────────────────────────────────────────────────────

class QueryRequest(BaseModel):
    query_id:  str      = Field(default_factory=lambda: str(uuid.uuid4()))
    platform:  Platform
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    message:   str
    customer:  Customer


class BulkQueryRequest(BaseModel):
    queries: list[QueryRequest]


# ── Node Outputs ─────────────────────────────────────────────────────────────

class NodeClassify(BaseModel):
    category:   Category
    confidence: float = Field(ge=0.0, le=1.0)
    sentiment:  Sentiment
    keywords:   list[str]


class NodeRoute(BaseModel):
    decision: Decision
    escalate: bool
    reason:   str


class EscalationContact(BaseModel):
    customer_name: Optional[str]
    order_id:      Optional[str]
    contact:       CustomerContact
    deep_links:    dict[str, str]   # e.g. {"whatsapp": "https://wa.me/..."}


class NodeResolve(BaseModel):
    action:             ResolutionAction
    faq_link:           Optional[str]   = None
    suggested_reply:    Optional[str]   = None
    escalation:         Optional[EscalationContact] = None
    resolution_time_ms: int             = 0


# ── Outgoing ─────────────────────────────────────────────────────────────────

class Meta(BaseModel):
    llm_used:           bool
    processing_time_ms: int
    graph_version:      str = "1.0"


class QueryResponse(BaseModel):
    query_id:  str
    platform:  Platform
    timestamp: datetime
    message:   str
    customer:  Customer

    node_classify: NodeClassify
    node_route:    NodeRoute
    node_resolve:  NodeResolve
    meta:          Meta


class BulkQueryResponse(BaseModel):
    results: list[QueryResponse]
    total:   int