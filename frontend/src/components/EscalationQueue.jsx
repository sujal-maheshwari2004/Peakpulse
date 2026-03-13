import { useMemo } from "react";
import { useQueryStore } from "../hooks/useQueryStore";
import { CATEGORY_COLORS } from "../lib/sampleData";

const URGENCY_CONFIG = {
  urgent: { label: "URGENT", cls: "badge-urgent", dot: "var(--urgent)" },
  high:   { label: "HIGH",   cls: "badge-high",   dot: "var(--high)"   },
  medium: { label: "MEDIUM", cls: "badge-medium", dot: "var(--medium)" },
  low:    { label: "LOW",    cls: "badge-low",    dot: "var(--low)"    },
};

const PLATFORM_ICONS = { whatsapp: "💬", instagram: "📸", email: "✉️", website: "🌐" };
const toUrgency = (s) => ({ urgent: "urgent", frustrated: "high", neutral: "medium", positive: "low" }[s] || "medium");
const urgencyOrder = { urgent: 0, high: 1, medium: 2, low: 3 };

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function EscalationQueue() {
  const queries   = useQueryStore((s) => s.queries);
  const setActive = useQueryStore((s) => s.setActiveQuery);

  const queue = useMemo(() =>
    queries
      .filter((q) => q.node_route.escalate)
      .map((q) => ({ ...q, urgency: toUrgency(q.node_classify.sentiment) }))
      .sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]),
  [queries]);

  if (queue.length === 0) {
    return (
      <div className="card" style={styles.empty}>
        <span style={{ fontSize: 32 }}>✅</span>
        <p style={styles.emptyText}>No escalations pending</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={styles.tableHeader}>
        {["URGENCY","CUSTOMER","CATEGORY","PLATFORM","MESSAGE","TIME","CONTACT"].map((h) => (
          <div key={h} style={{ ...styles.col[h.toLowerCase()] || styles.col.message, ...styles.headerCell }}>{h}</div>
        ))}
      </div>

      <div style={{ maxHeight: "380px", overflowY: "auto" }}>
        {queue.map((q) => (
          <EscalationRow key={q.query_id} query={q} onClick={() => setActive(q)} />
        ))}
      </div>

      <div style={styles.footer}>
        <span style={styles.footerText}>{queue.length} pending escalation{queue.length !== 1 ? "s" : ""}</span>
        <span style={styles.footerHint}>click row for full details</span>
      </div>
    </div>
  );
}

function EscalationRow({ query, onClick }) {
  const { node_classify, node_resolve, platform, timestamp, message, urgency } = query;
  const urg      = URGENCY_CONFIG[urgency] || URGENCY_CONFIG.medium;
  const catColor = CATEGORY_COLORS[node_classify.category] || "#666";
  const links    = node_resolve.escalation?.deep_links || {};

  const handleContact = (e, url) => { e.stopPropagation(); window.open(url, "_blank", "noopener,noreferrer"); };

  return (
    <div
      style={styles.row}
      onClick={onClick}
      onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-2)"}
      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
    >
      <div style={styles.col.urgency}>
        <span className={`badge ${urg.cls}`}>
          <span style={{ width:6, height:6, borderRadius:"50%", background:urg.dot, display:"inline-block" }} />
          {urg.label}
        </span>
      </div>
      <div style={styles.col.customer}>
        <span style={styles.customerName}>{node_resolve.escalation?.customer_name || "Unknown"}</span>
        {node_resolve.escalation?.order_id && <span style={styles.orderId}>{node_resolve.escalation.order_id}</span>}
      </div>
      <div style={styles.col.category}>
        <span style={{ ...styles.categoryTag, color: catColor, borderColor: `${catColor}44`, background: `${catColor}11` }}>
          {node_classify.category}
        </span>
      </div>
      <div style={styles.col.platform}>
        <span className={`badge badge-${platform}`}>{PLATFORM_ICONS[platform]} {platform}</span>
      </div>
      <div style={styles.col.message}>
        <span style={styles.messageText}>{message.length > 55 ? message.slice(0,55)+"…" : message}</span>
      </div>
      <div style={styles.col.time}>
        <span style={styles.timeText}>{timeAgo(timestamp)}</span>
      </div>
      <div style={{ ...styles.col.contact, display:"flex", gap:"6px" }}>
        {links.whatsapp  && <button className="btn btn-whatsapp  btn-sm" onClick={(e) => handleContact(e, links.whatsapp)}>💬</button>}
        {links.instagram && <button className="btn btn-instagram btn-sm" onClick={(e) => handleContact(e, links.instagram)}>📸</button>}
        {links.email     && <button className="btn btn-email     btn-sm" onClick={(e) => handleContact(e, links.email)}>✉️</button>}
      </div>
    </div>
  );
}

const styles = {
  tableHeader:  { display:"flex", alignItems:"center", padding:"10px 16px", borderBottom:"1px solid var(--border)", background:"var(--surface-2)", gap:"12px" },
  headerCell:   { fontFamily:"var(--font-condensed)", fontSize:"10px", fontWeight:600, letterSpacing:"0.1em", color:"var(--muted)" },
  row:          { display:"flex", alignItems:"center", padding:"10px 16px", gap:"12px", borderBottom:"1px solid var(--border)", borderLeft:"3px solid var(--red)", cursor:"pointer", transition:"background 0.15s ease", background:"transparent" },
  footer:       { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 16px", borderTop:"1px solid var(--border)", background:"var(--surface-2)" },
  footerText:   { fontFamily:"var(--font-mono)", fontSize:"11px", color:"var(--red)" },
  footerHint:   { fontFamily:"var(--font-mono)", fontSize:"11px", color:"var(--muted)" },
  empty:        { display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"48px", textAlign:"center" },
  emptyText:    { fontFamily:"var(--font-condensed)", color:"var(--muted-2)", marginTop:"8px" },
  customerName: { display:"block", fontFamily:"var(--font-condensed)", fontSize:"13px", fontWeight:600, color:"var(--white)" },
  orderId:      { display:"block", fontFamily:"var(--font-mono)", fontSize:"10px", color:"var(--muted-2)", marginTop:"2px" },
  categoryTag:  { fontFamily:"var(--font-condensed)", fontSize:"11px", fontWeight:600, letterSpacing:"0.04em", padding:"2px 8px", borderRadius:"4px", border:"1px solid", whiteSpace:"nowrap" },
  messageText:  { fontFamily:"var(--font-body)", fontSize:"12px", color:"var(--muted-2)", lineHeight:1.4 },
  timeText:     { fontFamily:"var(--font-mono)", fontSize:"11px", color:"var(--muted-2)", whiteSpace:"nowrap" },
  col: {
    urgency:  { width:"90px",  flexShrink:0 },
    customer: { width:"130px", flexShrink:0 },
    category: { width:"140px", flexShrink:0 },
    platform: { width:"110px", flexShrink:0 },
    message:  { flex:1,        minWidth:0   },
    time:     { width:"65px",  flexShrink:0 },
    contact:  { width:"110px", flexShrink:0 },
  },
};