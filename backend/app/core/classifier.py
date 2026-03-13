import re
from app.models.schemas import Category, Sentiment, NodeClassify


# ── Keyword Rules ─────────────────────────────────────────────────────────────
# Order matters — first match wins.
# Each rule: (category, confidence, keywords_to_match)

CATEGORY_RULES: list[tuple[Category, float, list[str]]] = [
    (Category.REFUND_REQUEST, 0.92, [
        "refund", "money back", "return", "reimburse",
        "cancel order", "get my money", "charge back",
    ]),
    (Category.PAYMENT_FAILURE, 0.91, [
        "payment failed", "card declined", "transaction failed",
        "couldn't pay", "payment not going", "payment issue",
        "upi failed", "payment error",
    ]),
    (Category.DELIVERY_DELAY, 0.90, [
        "not delivered", "still waiting", "where is my delivery",
        "late delivery", "delayed", "expected delivery",
        "hasn't arrived", "not arrived", "delivery late",
    ]),
    (Category.ORDER_TRACKING, 0.90, [
        "where is my order", "track my order", "order status",
        "tracking", "shipped", "dispatch", "out for delivery",
        "order update", "where is my package",
    ]),
    (Category.PRODUCT_COMPLAINT, 0.89, [
        "damaged", "broken", "wrong product", "expired",
        "fake", "duplicate", "not working", "defective",
        "poor quality", "bad quality", "wrong item",
        "not what i ordered", "tampered",
    ]),
    (Category.SUBSCRIPTION, 0.88, [
        "subscription", "plan", "renewal", "auto renew",
        "cancel subscription", "membership", "recurring",
        "billing cycle", "unsubscribe",
    ]),
]

SENTIMENT_RULES: list[tuple[Sentiment, list[str]]] = [
    (Sentiment.URGENT, [
        "urgent", "asap", "immediately", "right now",
        "emergency", "critical", "very important",
    ]),
    (Sentiment.FRUSTRATED, [
        "frustrated", "angry", "unacceptable", "ridiculous",
        "terrible", "worst", "disgusting", "pathetic",
        "this is a joke", "never again", "cheated", "scam",
        "fraud", "useless", "waste", "disappointed",
    ]),
    (Sentiment.POSITIVE, [
        "thank", "thanks", "great", "love", "awesome",
        "excellent", "happy", "appreciate", "wonderful",
        "pleased", "satisfied",
    ]),
]


# ── Helpers ───────────────────────────────────────────────────────────────────

def _normalize(text: str) -> str:
    return text.lower().strip()


def _match_keywords(text: str, keywords: list[str]) -> list[str]:
    """Returns which keywords from the list are found in text."""
    return [kw for kw in keywords if kw in text]


def _classify_category(text: str) -> tuple[Category, float, list[str]]:
    for category, confidence, keywords in CATEGORY_RULES:
        matched = _match_keywords(text, keywords)
        if matched:
            # Boost confidence slightly if multiple keywords match
            boosted = min(confidence + (len(matched) - 1) * 0.02, 0.98)
            return category, boosted, matched

    # Default fallback
    return Category.GENERAL_QUERY, 0.75, []


def _classify_sentiment(text: str) -> Sentiment:
    for sentiment, keywords in SENTIMENT_RULES:
        if _match_keywords(text, keywords):
            return sentiment
    return Sentiment.NEUTRAL


# ── Public API ────────────────────────────────────────────────────────────────

def rule_based_classify(message: str) -> NodeClassify:
    """
    Keyword-based classifier.
    Used when USE_LLM=false or as fallback when OpenAI is unavailable.

    Accuracy: ~78% on support queries
    Latency:  <5ms
    Cost:     $0
    """
    text = _normalize(message)

    category, confidence, keywords = _classify_category(text)
    sentiment                       = _classify_sentiment(text)

    # Sentiment can downgrade confidence
    # If urgent/frustrated but low keyword match → less certain
    if sentiment in (Sentiment.URGENT, Sentiment.FRUSTRATED) and confidence < 0.85:
        confidence = max(confidence - 0.05, 0.60)

    return NodeClassify(
        category   = category,
        confidence = round(confidence, 2),
        sentiment  = sentiment,
        keywords   = keywords if keywords else ["general"],
    )