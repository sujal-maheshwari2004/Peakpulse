import time
from datetime import datetime
from typing import Optional

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

from app.agents.state import AgentState
from app.models.schemas import (
    Category,
    Sentiment,
    Decision,
    ResolutionAction,
    NodeClassify,
    NodeRoute,
    NodeResolve,
    EscalationContact,
    CustomerContact,
)
from app.core.config import settings
from app.core.classifier import rule_based_classify


# ── FAQ Bank ─────────────────────────────────────────────────────────────────

FAQ_BANK: dict[Category, str] = {
    Category.ORDER_TRACKING:    "https://peakpulse.com/track",
    Category.DELIVERY_DELAY:    "https://peakpulse.com/faq/delivery",
    Category.REFUND_REQUEST:    "https://peakpulse.com/returns",
    Category.PAYMENT_FAILURE:   "https://peakpulse.com/faq/payment",
    Category.SUBSCRIPTION:      "https://peakpulse.com/account",
    Category.GENERAL_QUERY:     "https://peakpulse.com/faq",
}

SUGGESTED_REPLIES: dict[Category, str] = {
    Category.ORDER_TRACKING:    "Hi! You can track your order in real time here: https://peakpulse.com/track — let us know if you need anything else!",
    Category.DELIVERY_DELAY:    "Hi! We understand how frustrating delays can be. Check our delivery FAQ for updates: https://peakpulse.com/faq/delivery",
    Category.REFUND_REQUEST:    "Hi! You can initiate your refund directly here: https://peakpulse.com/returns — it usually takes 3-5 business days.",
    Category.PAYMENT_FAILURE:   "Hi! Sorry about the payment issue. Check our payment troubleshooting guide: https://peakpulse.com/faq/payment",
    Category.SUBSCRIPTION:      "Hi! You can manage your subscription anytime here: https://peakpulse.com/account",
    Category.GENERAL_QUERY:     "Hi! You can find answers to most questions in our FAQ: https://peakpulse.com/faq",
}

CONTACT_REPLY = "Hi! Our support team will personally help you with this. We will reach out to you shortly."


# ── LLM Structured Output Schema ─────────────────────────────────────────────

class ClassifyOutput(BaseModel):
    category:   Category   = Field(description="The category of the customer query")
    confidence: float      = Field(description="Confidence score between 0.0 and 1.0")
    sentiment:  Sentiment  = Field(description="Emotional tone of the message")
    keywords:   list[str]  = Field(description="Key terms that drove the classification")


# ── Helpers ───────────────────────────────────────────────────────────────────

def _build_deep_links(contact: CustomerContact, customer_name: Optional[str], order_id: Optional[str]) -> dict[str, str]:
    links = {}
    name    = customer_name or "there"
    oid     = f" regarding your order {order_id}" if order_id else ""
    message = f"Hi {name}{oid}, we received your support request and want to help you personally."

    if contact.whatsapp:
        number = contact.whatsapp.replace("+", "").replace(" ", "")
        links["whatsapp"] = f"https://wa.me/{number}?text={message.replace(' ', '%20')}"

    if contact.instagram:
        links["instagram"] = f"https://instagram.com/{contact.instagram}"

    if contact.email:
        subject = f"Your Support Request{oid}"
        links["email"] = f"mailto:{contact.email}?subject={subject.replace(' ', '%20')}&body={message.replace(' ', '%20')}"

    return links


def _sentiment_to_urgency(sentiment: Sentiment) -> str:
    return {
        Sentiment.URGENT:     "urgent",
        Sentiment.FRUSTRATED: "high",
        Sentiment.NEUTRAL:    "medium",
        Sentiment.POSITIVE:   "low",
    }[sentiment]


# ── Node 1: Classify ──────────────────────────────────────────────────────────

def node_classify(state: AgentState) -> dict:
    """
    Classifies the incoming message into a category, sentiment, and confidence.
    Uses OpenAI structured output if USE_LLM=true, else falls back to rule-based.
    """
    message = state["message"]

    if settings.USE_LLM:
        llm = ChatOpenAI(
            model       = "gpt-4o-mini",
            temperature = 0,
            api_key     = settings.OPENAI_API_KEY,
        ).with_structured_output(ClassifyOutput)

        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a customer support classifier for a sports supplements and fitness brand.

Classify the customer message into exactly one of these categories:
- Order Tracking     : customer asking about order status or whereabouts
- Delivery Delay     : customer complaining their order is late
- Refund Request     : customer wants a refund or return
- Product Complaint  : customer unhappy with product quality or received wrong item
- Payment Failure    : customer's payment didn't go through
- Subscription Issue : issues with subscription plans or renewals
- General Query      : anything else including product questions

Also assess:
- confidence: how certain you are (0.0 to 1.0)
- sentiment: frustrated / urgent / neutral / positive
- keywords: 2-4 key terms that drove your decision

Be concise. Do not overthink. Classify based on primary intent only."""),
            ("human", "{message}"),
        ])

        result: ClassifyOutput = (prompt | llm).invoke({"message": message})

        classify = NodeClassify(
            category   = result.category,
            confidence = result.confidence,
            sentiment  = result.sentiment,
            keywords   = result.keywords,
        )

    else:
        # Rule-based fallback
        classify = rule_based_classify(message)

    return {"node_classify": classify, "llm_used": settings.USE_LLM}


# ── Node 2: Route ─────────────────────────────────────────────────────────────

def node_route(state: AgentState) -> dict:
    """
    Decides whether to auto-resolve or escalate to a human agent.

    Rules:
      confidence < 0.85                    → escalate (uncertain classification)
      sentiment == urgent                  → escalate (needs human urgency)
      category == PRODUCT_COMPLAINT        → always escalate
      everything else                      → auto_resolve
    """
    classify: NodeClassify = state["node_classify"]

    escalate = False
    reason   = ""

    if classify.confidence < 0.85:
        escalate = True
        reason   = "Low confidence classification — human review needed"

    elif classify.sentiment == Sentiment.URGENT:
        escalate = True
        reason   = "Customer marked urgent — escalating to human agent"

    elif classify.category == Category.PRODUCT_COMPLAINT:
        escalate = True
        reason   = "Product complaints always require human review"

    else:
        escalate = False
        reason   = f"High confidence {classify.category} query — auto-resolving"

    route = NodeRoute(
        decision = Decision.ESCALATE if escalate else Decision.AUTO_RESOLVE,
        escalate = escalate,
        reason   = reason,
    )

    return {"node_route": route}


# ── Node 3: Resolve ───────────────────────────────────────────────────────────

def node_resolve(state: AgentState) -> dict:
    """
    Resolves the query based on routing decision.

    auto_resolve:
      - FAQ exists for category     → action: faq   + faq_link + suggested_reply
      - no FAQ                      → action: contact + suggested_reply

    escalate:
      - builds deep links from platform-native contact
      - action: escalate
    """
    started_at: datetime       = state["started_at"]
    route:      NodeRoute      = state["node_route"]
    classify:   NodeClassify   = state["node_classify"]
    customer                   = state["customer"]

    resolution_time_ms = int((datetime.utcnow() - started_at).total_seconds() * 1000)

    if not route.escalate:
        faq_link = FAQ_BANK.get(classify.category)

        if faq_link:
            resolve = NodeResolve(
                action             = ResolutionAction.FAQ,
                faq_link           = faq_link,
                suggested_reply    = SUGGESTED_REPLIES.get(classify.category),
                resolution_time_ms = resolution_time_ms,
            )
        else:
            resolve = NodeResolve(
                action             = ResolutionAction.CONTACT,
                suggested_reply    = CONTACT_REPLY,
                resolution_time_ms = resolution_time_ms,
            )

    else:
        deep_links = _build_deep_links(
            contact       = customer.contact,
            customer_name = customer.name,
            order_id      = customer.order_id,
        )

        escalation = EscalationContact(
            customer_name = customer.name,
            order_id      = customer.order_id,
            contact       = customer.contact,
            deep_links    = deep_links,
        )

        resolve = NodeResolve(
            action             = ResolutionAction.ESCALATE,
            escalation         = escalation,
            resolution_time_ms = resolution_time_ms,
        )

    processing_time_ms = int((datetime.utcnow() - started_at).total_seconds() * 1000)

    return {
        "node_resolve":        resolve,
        "processing_time_ms":  processing_time_ms,
    }