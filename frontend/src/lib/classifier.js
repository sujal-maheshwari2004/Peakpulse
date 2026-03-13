import { v4 as uuidv4 } from "uuid";

// ── Mirrors backend app/core/classifier.py ────────────────────────────────────

const CATEGORY_RULES = [
  {
    category:   "Refund Request",
    confidence: 0.92,
    keywords:   ["refund", "money back", "return", "reimburse", "cancel order", "get my money", "charge back"],
  },
  {
    category:   "Payment Failure",
    confidence: 0.91,
    keywords:   ["payment failed", "card declined", "transaction failed", "couldn't pay", "payment not going", "payment issue", "upi failed", "payment error"],
  },
  {
    category:   "Delivery Delay",
    confidence: 0.90,
    keywords:   ["not delivered", "still waiting", "where is my delivery", "late delivery", "delayed", "expected delivery", "hasn't arrived", "not arrived", "delivery late"],
  },
  {
    category:   "Order Tracking",
    confidence: 0.90,
    keywords:   ["where is my order", "track my order", "order status", "tracking", "shipped", "dispatch", "out for delivery", "order update", "where is my package"],
  },
  {
    category:   "Product Complaint",
    confidence: 0.89,
    keywords:   ["damaged", "broken", "wrong product", "expired", "fake", "duplicate", "not working", "defective", "poor quality", "bad quality", "wrong item", "not what i ordered", "tampered"],
  },
  {
    category:   "Subscription Issue",
    confidence: 0.88,
    keywords:   ["subscription", "plan", "renewal", "auto renew", "cancel subscription", "membership", "recurring", "billing cycle", "unsubscribe"],
  },
];

const SENTIMENT_RULES = [
  {
    sentiment: "urgent",
    keywords:  ["urgent", "asap", "immediately", "right now", "emergency", "critical", "very important"],
  },
  {
    sentiment: "frustrated",
    keywords:  ["frustrated", "angry", "unacceptable", "ridiculous", "terrible", "worst", "disgusting", "pathetic", "this is a joke", "never again", "cheated", "scam", "fraud", "useless", "waste", "disappointed"],
  },
  {
    sentiment: "positive",
    keywords:  ["thank", "thanks", "great", "love", "awesome", "excellent", "happy", "appreciate", "wonderful", "pleased", "satisfied"],
  },
];

const FAQ_LINKS = {
  "Order Tracking":     "https://peakpulse.com/track",
  "Delivery Delay":     "https://peakpulse.com/faq/delivery",
  "Refund Request":     "https://peakpulse.com/returns",
  "Payment Failure":    "https://peakpulse.com/faq/payment",
  "Subscription Issue": "https://peakpulse.com/account",
  "General Query":      "https://peakpulse.com/faq",
};

const SUGGESTED_REPLIES = {
  "Order Tracking":     "Hi! You can track your order in real time here: https://peakpulse.com/track — let us know if you need anything else!",
  "Delivery Delay":     "Hi! We understand how frustrating delays can be. Check our delivery FAQ: https://peakpulse.com/faq/delivery",
  "Refund Request":     "Hi! You can initiate your refund directly here: https://peakpulse.com/returns — usually takes 3-5 business days.",
  "Payment Failure":    "Hi! Sorry about the payment issue. Check our troubleshooting guide: https://peakpulse.com/faq/payment",
  "Subscription Issue": "Hi! You can manage your subscription anytime here: https://peakpulse.com/account",
  "General Query":      "Hi! You can find answers to most questions in our FAQ: https://peakpulse.com/faq",
};


// ── Helpers ───────────────────────────────────────────────────────────────────

function normalize(text) {
  return text.toLowerCase().trim();
}

function matchKeywords(text, keywords) {
  return keywords.filter((kw) => text.includes(kw));
}

function classifyCategory(text) {
  for (const rule of CATEGORY_RULES) {
    const matched = matchKeywords(text, rule.keywords);
    if (matched.length > 0) {
      const boosted = Math.min(rule.confidence + (matched.length - 1) * 0.02, 0.98);
      return { category: rule.category, confidence: boosted, keywords: matched };
    }
  }
  return { category: "General Query", confidence: 0.75, keywords: [] };
}

function classifySentiment(text) {
  for (const rule of SENTIMENT_RULES) {
    if (matchKeywords(text, rule.keywords).length > 0) {
      return rule.sentiment;
    }
  }
  return "neutral";
}

function buildDeepLinks(platform, contact, name, orderId) {
  const msg = `Hi ${name || "there"}${orderId ? ` regarding your order ${orderId}` : ""}, we received your support request and want to help you personally.`;

  if (platform === "whatsapp" && contact.whatsapp) {
    const num = contact.whatsapp.replace("+", "").replace(/\s/g, "");
    return { whatsapp: `https://wa.me/${num}?text=${encodeURIComponent(msg)}` };
  }
  if (platform === "instagram" && contact.instagram) {
    return { instagram: `https://instagram.com/${contact.instagram}` };
  }
  if (platform === "email" && contact.email) {
    return { email: `mailto:${contact.email}?subject=Your Support Request&body=${encodeURIComponent(msg)}` };
  }
  return {};
}


// ── Main Export ───────────────────────────────────────────────────────────────

export function rule_based_classify(request) {
  const started = Date.now();
  const text    = normalize(request.message);

  // Node 1 — Classify
  let { category, confidence, keywords } = classifyCategory(text);
  const sentiment                         = classifySentiment(text);

  // Sentiment can downgrade confidence
  if (["urgent", "frustrated"].includes(sentiment) && confidence < 0.85) {
    confidence = Math.max(confidence - 0.05, 0.60);
  }

  const node_classify = {
    category,
    confidence: Math.round(confidence * 100) / 100,
    sentiment,
    keywords: keywords.length ? keywords : ["general"],
  };

  // Node 2 — Route
  const shouldEscalate =
    confidence < 0.85 ||
    sentiment === "urgent" ||
    category === "Product Complaint";

  const node_route = {
    decision: shouldEscalate ? "escalate" : "auto_resolve",
    escalate: shouldEscalate,
    reason: shouldEscalate
      ? confidence < 0.85
        ? "Low confidence classification — human review needed"
        : sentiment === "urgent"
        ? "Customer marked urgent — escalating to human agent"
        : "Product complaints always require human review"
      : `High confidence ${category} query — auto-resolving`,
  };

  // Node 3 — Resolve
  const resolutionTime = Date.now() - started;
  let node_resolve;

  if (!shouldEscalate) {
    const faqLink = FAQ_LINKS[category];
    node_resolve = {
      action:             faqLink ? "faq" : "contact",
      faq_link:           faqLink || null,
      suggested_reply:    SUGGESTED_REPLIES[category] || null,
      escalation:         null,
      resolution_time_ms: resolutionTime,
    };
  } else {
    const contact    = request.customer?.contact || {};
    const deepLinks  = buildDeepLinks(
      request.platform,
      contact,
      request.customer?.name,
      request.customer?.order_id
    );
    node_resolve = {
      action:          "escalate",
      faq_link:        null,
      suggested_reply: null,
      escalation: {
        customer_name: request.customer?.name || null,
        order_id:      request.customer?.order_id || null,
        contact,
        deep_links:    deepLinks,
      },
      resolution_time_ms: resolutionTime,
    };
  }

  const processingTime = Date.now() - started;

  return {
    query_id:      request.query_id  || uuidv4(),
    platform:      request.platform,
    timestamp:     request.timestamp || new Date().toISOString(),
    message:       request.message,
    customer:      request.customer,
    node_classify,
    node_route,
    node_resolve,
    meta: {
      llm_used:           false,
      processing_time_ms: processingTime,
      graph_version:      "1.0",
    },
  };
}