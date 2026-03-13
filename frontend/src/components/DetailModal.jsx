import { useQueryStore } from "../hooks/useQueryStore";
import { CATEGORY_COLORS } from "../lib/sampleData";

const PLATFORM_ICONS = {
  whatsapp:  "💬",
  instagram: "📸",
  email:     "✉️",
  website:   "🌐",
};

const SENTIMENT_ICONS = {
  frustrated: "😤",
  urgent:     "🚨",
  neutral:    "😐",
  positive:   "😊",
};

export default function DetailModal({ query, onClose }) {
  const { node_classify, node_route, node_resolve, platform, timestamp, message, customer, meta } = query;
  const catColor = CATEGORY_COLORS[node_classify.category] || "#666";
  const links    = node_resolve.escalation?.deep_links || {};

  const handleContact = (url) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>

        {/* ── Modal Header ── */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <span className={`badge badge-${platform}`}>
              {PLATFORM_ICONS[platform]} {platform}
            </span>
            <span style={styles.timestamp}>
              {new Date(timestamp).toLocaleString()}
            </span>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* ── Message ── */}
        <div style={styles.messageBlock}>
          <span className="label">Customer Message</span>
          <p style={styles.messageText}>{message}</p>
          {customer?.name && (
            <div style={styles.customerRow}>
              <span style={styles.customerName}>— {customer.name}</span>
              {customer.order_id && (
                <span style={styles.orderId}>{customer.order_id}</span>
              )}
            </div>
          )}
        </div>

        <div style={styles.divider} />

        {/* ── Node 1: Classify ── */}
        <NodeSection
          number="01"
          label="CLASSIFY"
          color="var(--orange)"
        >
          <div className="grid-2" style={{ gap: 8 }}>
            <DataRow label="Category">
              <span style={{ color: catColor, fontWeight: 700 }}>
                {node_classify.category}
              </span>
            </DataRow>
            <DataRow label="Confidence">
              <div style={styles.confRow}>
                <span style={{
                  color: node_classify.confidence >= 0.85 ? "var(--green)" : "var(--red)",
                  fontWeight: 700,
                }}>
                  {Math.round(node_classify.confidence * 100)}%
                </span>
                <div className="confidence-bar" style={{ width: "60px" }}>
                  <div
                    className="confidence-fill"
                    style={{
                      width:      `${Math.round(node_classify.confidence * 100)}%`,
                      background: node_classify.confidence >= 0.85 ? "var(--green)" : "var(--red)",
                    }}
                  />
                </div>
              </div>
            </DataRow>
            <DataRow label="Sentiment">
              <span>
                {SENTIMENT_ICONS[node_classify.sentiment]} {node_classify.sentiment}
              </span>
            </DataRow>
            <DataRow label="Keywords">
              <div style={styles.keywordRow}>
                {node_classify.keywords.map((kw) => (
                  <span key={kw} style={styles.keyword}>{kw}</span>
                ))}
              </div>
            </DataRow>
          </div>
        </NodeSection>

        <div style={styles.divider} />

        {/* ── Node 2: Route ── */}
        <NodeSection
          number="02"
          label="ROUTE"
          color={node_route.escalate ? "var(--red)" : "var(--green)"}
        >
          <div className="grid-2" style={{ gap: 8 }}>
            <DataRow label="Decision">
              <span style={{
                color:      node_route.escalate ? "var(--red)" : "var(--green)",
                fontWeight: 700,
              }}>
                {node_route.decision.replace("_", " ").toUpperCase()}
              </span>
            </DataRow>
            <DataRow label="Escalate">
              <span style={{ color: node_route.escalate ? "var(--red)" : "var(--green)", fontWeight: 700 }}>
                {node_route.escalate ? "YES" : "NO"}
              </span>
            </DataRow>
          </div>
          <DataRow label="Reason" fullWidth>
            <span style={{ color: "var(--muted-2)" }}>{node_route.reason}</span>
          </DataRow>
        </NodeSection>

        <div style={styles.divider} />

        {/* ── Node 3: Resolve ── */}
        <NodeSection
          number="03"
          label="RESOLVE"
          color={
            node_resolve.action === "escalate" ? "var(--red)"    :
            node_resolve.action === "faq"      ? "var(--orange)" :
            "var(--blue)"
          }
        >
          <DataRow label="Action">
            <span className={`badge ${
              node_resolve.action === "escalate" ? "badge-escalate" :
              node_resolve.action === "faq"      ? "badge-faq"      :
              "badge-contact"
            }`}>
              {node_resolve.action.toUpperCase()}
            </span>
          </DataRow>

          {node_resolve.faq_link && (
            <DataRow label="FAQ Link">
              <a
                href={node_resolve.faq_link}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.link}
              >
                {node_resolve.faq_link}
              </a>
            </DataRow>
          )}

          {node_resolve.suggested_reply && (
            <div style={styles.replyBox}>
              <span className="label" style={{ marginBottom: 6, display: "block" }}>
                Suggested Reply
              </span>
              <p style={styles.replyText}>{node_resolve.suggested_reply}</p>
            </div>
          )}

          {node_resolve.escalation && (
            <div style={styles.escalationBox}>
              <span className="label" style={{ marginBottom: 8, display: "block" }}>
                Escalation Contact
              </span>
              <div style={{ marginBottom: 10 }}>
                {node_resolve.escalation.customer_name && (
                  <DataRow label="Name">
                    <span style={{ color: "var(--white)", fontWeight: 600 }}>
                      {node_resolve.escalation.customer_name}
                    </span>
                  </DataRow>
                )}
                {node_resolve.escalation.order_id && (
                  <DataRow label="Order ID">
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                      {node_resolve.escalation.order_id}
                    </span>
                  </DataRow>
                )}
              </div>
              <div style={styles.contactBtns}>
                {links.whatsapp && (
                  <button
                    className="btn btn-whatsapp"
                    onClick={() => handleContact(links.whatsapp)}
                  >
                    💬 WhatsApp
                  </button>
                )}
                {links.instagram && (
                  <button
                    className="btn btn-instagram"
                    onClick={() => handleContact(links.instagram)}
                  >
                    📸 Instagram
                  </button>
                )}
                {links.email && (
                  <button
                    className="btn btn-email"
                    onClick={() => handleContact(links.email)}
                  >
                    ✉️ Email
                  </button>
                )}
              </div>
            </div>
          )}

          <DataRow label="Resolution Time">
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted-2)" }}>
              {node_resolve.resolution_time_ms}ms
            </span>
          </DataRow>
        </NodeSection>

        <div style={styles.divider} />

        {/* ── Meta ── */}
        <div style={styles.meta}>
          <span style={styles.metaItem}>
            Mode: <strong>{meta.llm_used ? "LLM" : "Rule-based"}</strong>
          </span>
          <span style={styles.metaItem}>
            Total: <strong>{meta.processing_time_ms}ms</strong>
          </span>
          <span style={styles.metaItem}>
            Graph: <strong>v{meta.graph_version}</strong>
          </span>
          <span style={styles.metaItem}>
            ID: <strong style={{ fontFamily: "var(--font-mono)", fontSize: 10 }}>
              {query.query_id.slice(0, 8)}…
            </strong>
          </span>
        </div>

      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function NodeSection({ number, label, color, children }) {
  return (
    <div style={styles.nodeSection}>
      <div style={styles.nodeSectionHeader}>
        <span style={{ ...styles.nodeNumber, color }}>NODE {number}</span>
        <span style={{ ...styles.nodeLabel, color }}>{label}</span>
      </div>
      <div style={styles.nodeSectionBody}>{children}</div>
    </div>
  );
}

function DataRow({ label, children, fullWidth }) {
  return (
    <div style={{ ...styles.dataRow, gridColumn: fullWidth ? "1 / -1" : undefined }}>
      <span className="label" style={{ marginBottom: 3, display: "block" }}>{label}</span>
      <div style={styles.dataVal}>{children}</div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  header: {
    display:        "flex",
    alignItems:     "center",
    justifyContent: "space-between",
    padding:        "16px 20px",
    borderBottom:   "1px solid var(--border)",
  },

  headerLeft: {
    display:    "flex",
    alignItems: "center",
    gap:        "10px",
  },

  timestamp: {
    fontFamily: "var(--font-mono)",
    fontSize:   "11px",
    color:      "var(--muted-2)",
  },

  closeBtn: {
    background:  "transparent",
    border:      "none",
    color:       "var(--muted-2)",
    cursor:      "pointer",
    fontSize:    "16px",
    padding:     "4px",
    lineHeight:  1,
    transition:  "color 0.15s",
  },

  messageBlock: {
    padding: "16px 20px",
  },

  messageText: {
    fontFamily:  "var(--font-body)",
    fontSize:    "14px",
    color:       "var(--white)",
    lineHeight:  1.6,
    marginTop:   "8px",
  },

  customerRow: {
    display:    "flex",
    alignItems: "center",
    gap:        "10px",
    marginTop:  "8px",
  },

  customerName: {
    fontFamily: "var(--font-condensed)",
    fontSize:   "12px",
    color:      "var(--muted-2)",
  },

  orderId: {
    fontFamily:   "var(--font-mono)",
    fontSize:     "11px",
    color:        "var(--muted)",
    background:   "var(--surface-3)",
    padding:      "1px 6px",
    borderRadius: "4px",
  },

  divider: {
    height:     "1px",
    background: "var(--border)",
    margin:     "0 20px",
  },

  nodeSection: {
    padding: "14px 20px",
  },

  nodeSectionHeader: {
    display:    "flex",
    alignItems: "center",
    gap:        "10px",
    marginBottom: "12px",
  },

  nodeNumber: {
    fontFamily:    "var(--font-mono)",
    fontSize:      "10px",
    letterSpacing: "0.08em",
  },

  nodeLabel: {
    fontFamily:    "var(--font-display)",
    fontSize:      "18px",
    letterSpacing: "0.08em",
  },

  nodeSectionBody: {
    display:       "flex",
    flexDirection: "column",
    gap:           "10px",
  },

  dataRow: {
    display:       "flex",
    flexDirection: "column",
  },

  dataVal: {
    fontFamily: "var(--font-condensed)",
    fontSize:   "13px",
    color:      "var(--white)",
  },

  confRow: {
    display:    "flex",
    alignItems: "center",
    gap:        "8px",
  },

  keywordRow: {
    display:  "flex",
    flexWrap: "wrap",
    gap:      "4px",
  },

  keyword: {
    fontFamily:   "var(--font-mono)",
    fontSize:     "10px",
    color:        "var(--orange)",
    background:   "var(--orange-glow2)",
    border:       "1px solid var(--orange-dim)",
    borderRadius: "4px",
    padding:      "1px 6px",
  },

  replyBox: {
    padding:      "10px 12px",
    background:   "var(--surface-2)",
    borderRadius: "var(--radius)",
    borderLeft:   "2px solid var(--orange)",
  },

  replyText: {
    fontFamily: "var(--font-body)",
    fontSize:   "13px",
    color:      "var(--muted-2)",
    lineHeight: 1.6,
  },

  escalationBox: {
    padding:      "12px",
    background:   "rgba(239,68,68,0.05)",
    border:       "1px solid rgba(239,68,68,0.2)",
    borderRadius: "var(--radius)",
  },

  contactBtns: {
    display: "flex",
    gap:     "8px",
  },

  link: {
    color:          "var(--orange)",
    textDecoration: "none",
    fontFamily:     "var(--font-mono)",
    fontSize:       "11px",
  },

  meta: {
    display:    "flex",
    gap:        "16px",
    padding:    "12px 20px",
    background: "var(--surface-2)",
    flexWrap:   "wrap",
  },

  metaItem: {
    fontFamily: "var(--font-mono)",
    fontSize:   "10px",
    color:      "var(--muted)",
  },
};