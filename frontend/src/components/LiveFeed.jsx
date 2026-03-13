import { useRef, useEffect } from "react";
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

const ACTION_LABELS = {
  faq:      { label: "FAQ",      cls: "badge-faq"      },
  contact:  { label: "CONTACT",  cls: "badge-contact"  },
  escalate: { label: "ESCALATE", cls: "badge-escalate" },
};

function truncate(str, n = 65) {
  return str.length > n ? str.slice(0, n) + "…" : str;
}

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function LiveFeed() {
  const queries      = useQueryStore((s) => s.queries);
  const setActive    = useQueryStore((s) => s.setActiveQuery);
  const resetSample  = useQueryStore((s) => s.resetToSample);
  const clearAll     = useQueryStore((s) => s.clearQueries);
  const prevLen      = useRef(queries.length);
  const newIds       = useRef(new Set());

  // Track newly added queries for animation
  useEffect(() => {
    if (queries.length > prevLen.current) {
      const added = queries.slice(0, queries.length - prevLen.current);
      added.forEach((q) => newIds.current.add(q.query_id));
      setTimeout(() => {
        added.forEach((q) => newIds.current.delete(q.query_id));
      }, 600);
    }
    prevLen.current = queries.length;
  }, [queries.length]);

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>

      {/* Table Header */}
      <div style={styles.tableHeader}>
        <div style={styles.col.time}>TIME</div>
        <div style={styles.col.platform}>PLATFORM</div>
        <div style={styles.col.message}>MESSAGE</div>
        <div style={styles.col.category}>CATEGORY</div>
        <div style={styles.col.sentiment}>MOOD</div>
        <div style={styles.col.confidence}>CONF</div>
        <div style={styles.col.action}>ACTION</div>
      </div>

      {/* Rows */}
      <div style={styles.tableBody}>
        {queries.length === 0 ? (
          <div style={styles.empty}>
            <span style={{ fontSize: 32 }}>⚡</span>
            <p style={{ fontFamily: "var(--font-condensed)", color: "var(--muted-2)", marginTop: 8 }}>
              No queries yet. Use the Query Tester below or simulate bulk queries.
            </p>
          </div>
        ) : (
          queries.map((q) => (
            <FeedRow
              key={q.query_id}
              query={q}
              isNew={newIds.current.has(q.query_id)}
              onClick={() => setActive(q)}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>
          {queries.length} total · click any row for details
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={resetSample}>
            Reset Sample
          </button>
          <button className="btn btn-danger btn-sm" onClick={clearAll}>
            Clear All
          </button>
        </div>
      </div>

    </div>
  );
}

// ── Feed Row ──────────────────────────────────────────────────────────────────

function FeedRow({ query, isNew, onClick }) {
  const { node_classify, node_resolve, platform, timestamp, message } = query;
  const action   = ACTION_LABELS[node_resolve.action] || ACTION_LABELS.faq;
  const catColor = CATEGORY_COLORS[node_classify.category] || "#666";
  const confPct  = Math.round(node_classify.confidence * 100);

  return (
    <div
      style={{
        ...styles.row,
        animation: isNew ? "fadeInDown 0.35s ease forwards" : "none",
        borderLeftColor: node_resolve.action === "escalate"
          ? "var(--red)"
          : node_resolve.action === "contact"
          ? "var(--blue)"
          : "var(--orange)",
      }}
      onClick={onClick}
    >
      {/* Time */}
      <div style={styles.col.time}>
        <span style={styles.timeText}>{timeAgo(timestamp)}</span>
      </div>

      {/* Platform */}
      <div style={styles.col.platform}>
        <span className={`badge badge-${platform}`}>
          {PLATFORM_ICONS[platform]} {platform}
        </span>
      </div>

      {/* Message */}
      <div style={styles.col.message}>
        <span style={styles.messageText}>{truncate(message)}</span>
      </div>

      {/* Category */}
      <div style={styles.col.category}>
        <span style={{ ...styles.categoryTag, color: catColor, borderColor: `${catColor}44`, background: `${catColor}11` }}>
          {node_classify.category}
        </span>
      </div>

      {/* Sentiment */}
      <div style={styles.col.sentiment}>
        <span style={styles.sentimentText}>
          {SENTIMENT_ICONS[node_classify.sentiment]} {node_classify.sentiment}
        </span>
      </div>

      {/* Confidence */}
      <div style={styles.col.confidence}>
        <div style={styles.confWrap}>
          <span style={{ ...styles.confText, color: confPct >= 85 ? "var(--green)" : "var(--red)" }}>
            {confPct}%
          </span>
          <div className="confidence-bar" style={{ width: "48px" }}>
            <div
              className="confidence-fill"
              style={{
                width:      `${confPct}%`,
                background: confPct >= 85 ? "var(--green)" : "var(--red)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Action */}
      <div style={styles.col.action}>
        <span className={`badge ${action.cls}`}>{action.label}</span>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  tableHeader: {
    display:       "flex",
    alignItems:    "center",
    padding:       "10px 16px",
    borderBottom:  "1px solid var(--border)",
    background:    "var(--surface-2)",
    gap:           "12px",
  },

  tableBody: {
    maxHeight:  "420px",
    overflowY:  "auto",
  },

  row: {
    display:         "flex",
    alignItems:      "center",
    padding:         "10px 16px",
    gap:             "12px",
    borderBottom:    "1px solid var(--border)",
    borderLeft:      "3px solid transparent",
    cursor:          "pointer",
    transition:      "background 0.15s ease",
  },

  footer: {
    display:        "flex",
    alignItems:     "center",
    justifyContent: "space-between",
    padding:        "10px 16px",
    borderTop:      "1px solid var(--border)",
    background:     "var(--surface-2)",
  },

  empty: {
    display:        "flex",
    flexDirection:  "column",
    alignItems:     "center",
    justifyContent: "center",
    padding:        "48px",
    textAlign:      "center",
  },

  timeText: {
    fontFamily: "var(--font-mono)",
    fontSize:   "11px",
    color:      "var(--muted-2)",
    whiteSpace: "nowrap",
  },

  messageText: {
    fontFamily: "var(--font-body)",
    fontSize:   "12px",
    color:      "var(--muted-2)",
    lineHeight: 1.4,
  },

  categoryTag: {
    fontFamily:    "var(--font-condensed)",
    fontSize:      "11px",
    fontWeight:    600,
    letterSpacing: "0.04em",
    padding:       "2px 8px",
    borderRadius:  "4px",
    border:        "1px solid",
    whiteSpace:    "nowrap",
  },

  sentimentText: {
    fontFamily: "var(--font-condensed)",
    fontSize:   "11px",
    color:      "var(--muted-2)",
    whiteSpace: "nowrap",
  },

  confWrap: {
    display:       "flex",
    flexDirection: "column",
    gap:           "3px",
    alignItems:    "flex-start",
  },

  confText: {
    fontFamily: "var(--font-mono)",
    fontSize:   "11px",
  },

  col: {
    time:       { width: "60px",  flexShrink: 0, fontFamily: "var(--font-condensed)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", color: "var(--muted)" },
    platform:   { width: "110px", flexShrink: 0, fontFamily: "var(--font-condensed)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", color: "var(--muted)" },
    message:    { flex: 1,        minWidth: 0,   fontFamily: "var(--font-condensed)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", color: "var(--muted)" },
    category:   { width: "140px", flexShrink: 0, fontFamily: "var(--font-condensed)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", color: "var(--muted)" },
    sentiment:  { width: "110px", flexShrink: 0, fontFamily: "var(--font-condensed)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", color: "var(--muted)" },
    confidence: { width: "72px",  flexShrink: 0, fontFamily: "var(--font-condensed)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", color: "var(--muted)" },
    action:     { width: "90px",  flexShrink: 0, fontFamily: "var(--font-condensed)", fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", color: "var(--muted)" },
  },
};