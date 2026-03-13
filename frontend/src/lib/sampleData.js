import { v4 as uuidv4 } from "uuid";

// ── Helpers ───────────────────────────────────────────────────────────────────

const ts = (hoursAgo) => {
  const d = new Date();
  d.setHours(d.getHours() - hoursAgo);
  return d.toISOString();
};

const makeContact = (platform, value) => {
  if (platform === "whatsapp")  return { whatsapp: value };
  if (platform === "instagram") return { instagram: value };
  if (platform === "email")     return { email: value };
  return {};
};

const makeDeepLinks = (platform, value, name, orderId) => {
  const msg = `Hi ${name}, regarding your order ${orderId}, we received your support request and want to help you personally.`;
  if (platform === "whatsapp") {
    const num = value.replace("+", "").replace(" ", "");
    return { whatsapp: `https://wa.me/${num}?text=${encodeURIComponent(msg)}` };
  }
  if (platform === "instagram") {
    return { instagram: `https://instagram.com/${value}` };
  }
  if (platform === "email") {
    return { email: `mailto:${value}?subject=Your Order ${orderId}&body=${encodeURIComponent(msg)}` };
  }
  return {};
};


// ── Raw Query Templates ───────────────────────────────────────────────────────

const TEMPLATES = [
  // Order Tracking
  { message: "Hey where is my order? I placed it 4 days ago and haven't received any update.", category: "Order Tracking", sentiment: "frustrated", confidence: 0.94, keywords: ["order", "4 days", "no update"], platform: "whatsapp", action: "faq" },
  { message: "Can you tell me the tracking status of my order ORD-2025-1234?", category: "Order Tracking", sentiment: "neutral", confidence: 0.96, keywords: ["tracking", "order status"], platform: "email", action: "faq" },
  { message: "My order was supposed to arrive yesterday. Can you check the status?", category: "Order Tracking", sentiment: "frustrated", confidence: 0.91, keywords: ["order", "arrive", "status"], platform: "instagram", action: "faq" },
  { message: "Where is my package? It's been dispatched but I see no movement.", category: "Order Tracking", sentiment: "neutral", confidence: 0.93, keywords: ["package", "dispatched", "no movement"], platform: "whatsapp", action: "faq" },
  { message: "Hi! Just wanted to check if my order has been shipped yet?", category: "Order Tracking", sentiment: "positive", confidence: 0.95, keywords: ["order", "shipped"], platform: "email", action: "faq" },

  // Delivery Delay
  { message: "It's been 10 days and my order still hasn't arrived. This is unacceptable!", category: "Delivery Delay", sentiment: "frustrated", confidence: 0.93, keywords: ["10 days", "not arrived", "unacceptable"], platform: "whatsapp", action: "faq" },
  { message: "My delivery was expected 3 days ago. No update at all. Please help!", category: "Delivery Delay", sentiment: "urgent", confidence: 0.91, keywords: ["expected", "3 days", "no update"], platform: "instagram", action: "escalate" },
  { message: "The delivery is delayed by almost a week now. What is going on?", category: "Delivery Delay", sentiment: "frustrated", confidence: 0.90, keywords: ["delayed", "week"], platform: "email", action: "faq" },
  { message: "I ordered 2 weeks back still no delivery. Please resolve this ASAP.", category: "Delivery Delay", sentiment: "urgent", confidence: 0.92, keywords: ["2 weeks", "no delivery", "asap"], platform: "whatsapp", action: "escalate" },

  // Refund Request
  { message: "I want a full refund for my order. The product was not as described.", category: "Refund Request", sentiment: "frustrated", confidence: 0.95, keywords: ["refund", "not as described"], platform: "email", action: "faq" },
  { message: "Please process my refund. I returned the item 5 days ago.", category: "Refund Request", sentiment: "neutral", confidence: 0.94, keywords: ["refund", "returned", "5 days"], platform: "whatsapp", action: "faq" },
  { message: "I need my money back. The supplement I received was expired.", category: "Refund Request", sentiment: "urgent", confidence: 0.93, keywords: ["money back", "expired"], platform: "instagram", action: "escalate" },
  { message: "Can I get a refund or exchange for the wrong product I received?", category: "Refund Request", sentiment: "neutral", confidence: 0.92, keywords: ["refund", "exchange", "wrong product"], platform: "email", action: "faq" },

  // Product Complaint
  { message: "The protein powder I received looks fake. The seal was already broken.", category: "Product Complaint", sentiment: "urgent", confidence: 0.96, keywords: ["fake", "seal broken"], platform: "whatsapp", action: "escalate" },
  { message: "I got a completely different product than what I ordered. This is fraud!", category: "Product Complaint", sentiment: "frustrated", confidence: 0.95, keywords: ["different product", "fraud"], platform: "instagram", action: "escalate" },
  { message: "The supplement container was damaged when I received it. Photos attached.", category: "Product Complaint", sentiment: "neutral", confidence: 0.93, keywords: ["damaged", "container"], platform: "email", action: "escalate" },
  { message: "Worst product quality ever. The powder has a strange smell and color.", category: "Product Complaint", sentiment: "frustrated", confidence: 0.91, keywords: ["worst quality", "strange smell"], platform: "whatsapp", action: "escalate" },

  // Payment Failure
  { message: "My payment failed but the money was deducted from my account. Please help!", category: "Payment Failure", sentiment: "urgent", confidence: 0.95, keywords: ["payment failed", "money deducted"], platform: "whatsapp", action: "faq" },
  { message: "I'm trying to place an order but my UPI payment keeps failing.", category: "Payment Failure", sentiment: "frustrated", confidence: 0.92, keywords: ["upi", "payment failing"], platform: "instagram", action: "faq" },
  { message: "Card declined twice while trying to checkout. Please check.", category: "Payment Failure", sentiment: "neutral", confidence: 0.91, keywords: ["card declined", "checkout"], platform: "email", action: "faq" },

  // Subscription Issue
  { message: "I was charged for a subscription I cancelled last month. Please refund.", category: "Subscription Issue", sentiment: "frustrated", confidence: 0.93, keywords: ["charged", "subscription", "cancelled"], platform: "email", action: "faq" },
  { message: "How do I cancel my monthly subscription plan?", category: "Subscription Issue", sentiment: "neutral", confidence: 0.94, keywords: ["cancel", "subscription", "monthly"], platform: "whatsapp", action: "faq" },
  { message: "My subscription was supposed to renew but it's showing expired.", category: "Subscription Issue", sentiment: "neutral", confidence: 0.90, keywords: ["subscription", "renew", "expired"], platform: "instagram", action: "faq" },

  // General Query
  { message: "What are the ingredients in your whey protein isolate?", category: "General Query", sentiment: "neutral", confidence: 0.88, keywords: ["ingredients", "whey protein"], platform: "instagram", action: "faq" },
  { message: "Do you ship internationally? I'm based in Dubai.", category: "General Query", sentiment: "neutral", confidence: 0.87, keywords: ["ship internationally", "dubai"], platform: "email", action: "contact" },
  { message: "Is your creatine monohydrate safe for beginners?", category: "General Query", sentiment: "positive", confidence: 0.89, keywords: ["creatine", "beginners"], platform: "whatsapp", action: "faq" },
  { message: "What's the recommended dosage for your mass gainer?", category: "General Query", sentiment: "neutral", confidence: 0.88, keywords: ["dosage", "mass gainer"], platform: "instagram", action: "faq" },
  { message: "Can I stack your pre-workout with creatine?", category: "General Query", sentiment: "positive", confidence: 0.86, keywords: ["stack", "pre-workout", "creatine"], platform: "whatsapp", action: "faq" },
  { message: "Hi, do you have any ongoing discounts or offers?", category: "General Query", sentiment: "positive", confidence: 0.85, keywords: ["discounts", "offers"], platform: "instagram", action: "contact" },
  { message: "What is your return policy for opened supplements?", category: "General Query", sentiment: "neutral", confidence: 0.87, keywords: ["return policy", "opened"], platform: "email", action: "faq" },
];


// ── Customer Pool ─────────────────────────────────────────────────────────────

const CUSTOMERS = [
  { name: "Rahul Sharma",   whatsapp: "+919876543210", instagram: "rahul_lifts",    email: "rahul.sharma@gmail.com",   orderId: "ORD-2025-8821" },
  { name: "Priya Mehta",    whatsapp: "+919823456781", instagram: "priya_fitlife",  email: "priya.mehta@gmail.com",    orderId: "ORD-2025-7743" },
  { name: "Arjun Singh",    whatsapp: "+919812345670", instagram: "arjun_gains",    email: "arjun.singh@gmail.com",    orderId: "ORD-2025-6612" },
  { name: "Sneha Patel",    whatsapp: "+919898765432", instagram: "sneha_wellness", email: "sneha.patel@gmail.com",    orderId: "ORD-2025-5521" },
  { name: "Vikram Nair",    whatsapp: "+919867543219", instagram: "vikram_beast",   email: "vikram.nair@gmail.com",    orderId: "ORD-2025-4410" },
  { name: "Anjali Reddy",   whatsapp: "+919845321678", instagram: "anjali_fit",     email: "anjali.reddy@gmail.com",   orderId: "ORD-2025-3309" },
  { name: "Karan Malhotra", whatsapp: "+919834512367", instagram: "karan_strong",   email: "karan.malhotra@gmail.com", orderId: "ORD-2025-2208" },
];

const FAQ_LINKS = {
  "Order Tracking":    "https://peakpulse.com/track",
  "Delivery Delay":    "https://peakpulse.com/faq/delivery",
  "Refund Request":    "https://peakpulse.com/returns",
  "Payment Failure":   "https://peakpulse.com/faq/payment",
  "Subscription Issue":"https://peakpulse.com/account",
  "General Query":     "https://peakpulse.com/faq",
};

const SUGGESTED_REPLIES = {
  "Order Tracking":    "Hi! You can track your order in real time here: https://peakpulse.com/track — let us know if you need anything else!",
  "Delivery Delay":    "Hi! We understand how frustrating delays can be. Check our delivery FAQ: https://peakpulse.com/faq/delivery",
  "Refund Request":    "Hi! You can initiate your refund directly here: https://peakpulse.com/returns — usually takes 3-5 business days.",
  "Payment Failure":   "Hi! Sorry about the payment issue. Check our troubleshooting guide: https://peakpulse.com/faq/payment",
  "Subscription Issue":"Hi! You can manage your subscription anytime here: https://peakpulse.com/account",
  "General Query":     "Hi! You can find answers to most questions in our FAQ: https://peakpulse.com/faq",
};


// ── Build Sample Queries ──────────────────────────────────────────────────────

export const SAMPLE_QUERIES = TEMPLATES.map((t, i) => {
  const customer = CUSTOMERS[i % CUSTOMERS.length];
  const contact  = makeContact(t.platform, 
    t.platform === "whatsapp"  ? customer.whatsapp  :
    t.platform === "instagram" ? customer.instagram :
    customer.email
  );

  const isEscalate = t.action === "escalate" ||
    t.sentiment === "urgent" ||
    t.category === "Product Complaint" ||
    t.confidence < 0.85;

  return {
    query_id:  uuidv4(),
    platform:  t.platform,
    timestamp: ts(i * 0.8),
    message:   t.message,
    customer: {
      name:     customer.name,
      order_id: customer.orderId,
      contact,
    },
    node_classify: {
      category:   t.category,
      confidence: t.confidence,
      sentiment:  t.sentiment,
      keywords:   t.keywords,
    },
    node_route: {
      decision: isEscalate ? "escalate" : "auto_resolve",
      escalate: isEscalate,
      reason:   isEscalate
        ? "Requires human review"
        : `High confidence ${t.category} — auto-resolving`,
    },
    node_resolve: {
      action:          isEscalate ? "escalate" : t.action,
      faq_link:        !isEscalate && t.action === "faq" ? FAQ_LINKS[t.category] : null,
      suggested_reply: !isEscalate ? SUGGESTED_REPLIES[t.category] : null,
      escalation: isEscalate ? {
        customer_name: customer.name,
        order_id:      customer.orderId,
        contact,
        deep_links:    makeDeepLinks(
          t.platform,
          t.platform === "whatsapp"  ? customer.whatsapp  :
          t.platform === "instagram" ? customer.instagram :
          customer.email,
          customer.name,
          customer.orderId
        ),
      } : null,
      resolution_time_ms: Math.floor(Math.random() * 400) + 200,
    },
    meta: {
      llm_used:           false,
      processing_time_ms: Math.floor(Math.random() * 600) + 300,
      graph_version:      "1.0",
    },
  };
});


// ── Derived Stats ─────────────────────────────────────────────────────────────

export const CATEGORIES = [
  "Order Tracking",
  "Delivery Delay",
  "Refund Request",
  "Product Complaint",
  "Payment Failure",
  "Subscription Issue",
  "General Query",
];

export const CATEGORY_COLORS = {
  "Order Tracking":    "#FF5C00",
  "Delivery Delay":    "#FF8C42",
  "Refund Request":    "#FFB347",
  "Product Complaint": "#CC2200",
  "Payment Failure":   "#FF3366",
  "Subscription Issue":"#AA44FF",
  "General Query":     "#666666",
};

export const PLATFORMS = ["whatsapp", "instagram", "email", "website"];

export const PLATFORM_COLORS = {
  whatsapp:  "#25D366",
  instagram: "#E1306C",
  email:     "#4A90E2",
  website:   "#FF5C00",
};