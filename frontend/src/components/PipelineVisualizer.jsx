const NODES = [
  {
    id:       "classify",
    label:    "CLASSIFY",
    number:   "01",
    desc:     "Category · Confidence · Sentiment",
    icon:     "🧠",
  },
  {
    id:       "route",
    label:    "ROUTE",
    number:   "02",
    desc:     "Auto-resolve vs Escalate",
    icon:     "⚡",
  },
  {
    id:       "resolve",
    label:    "RESOLVE",
    number:   "03",
    desc:     "FAQ · Contact · Escalate",
    icon:     "✅",
  },
];

export default function PipelineVisualizer({ activeNode, result }) {
  return (
    <div style={styles.wrapper}>

      {/* Title */}
      <div style={styles.title}>
        <span className="label">LangGraph Pipeline</span>
      </div>

      {/* Nodes */}
      <div style={styles.nodes}>
        {NODES.map((node, i) => {
          const state = getNodeState(node.id, activeNode, result);
          return (
            <div key={node.id} style={styles.nodeRow}>

              {/* Node box */}
              <div style={{
                ...styles.node,
                borderColor: state === "active"   ? "var(--orange)"
                           : state === "done"     ? "var(--orange-dim)"
                           : state === "error"    ? "var(--red)"
                           : "var(--border)",
                background:  state === "active"   ? "var(--orange-glow)"
                           : state === "done"     ? "var(--orange-glow2)"
                           : "var(--surface-2)",
                boxShadow:   state === "active"   ? "0 0 16px rgba(255,92,0,0.25)" : "none",
              }}>

                {/* Node header */}
                <div style={styles.nodeHeader}>
                  <div style={styles.nodeLeft}>
                    <span style={{
                      ...styles.nodeNumber,
                      color: state === "idle" ? "var(--muted)" : "var(--orange)",
                    }}>
                      {node.number}
                    </span>
                    <span style={styles.nodeIcon}>{node.icon}</span>
                    <span style={{
                      ...styles.nodeLabel,
                      color: state === "idle" ? "var(--muted-2)" : "var(--white)",
                    }}>
                      {node.label}
                    </span>
                  </div>

                  {/* Status indicator */}
                  <NodeStatus state={state} />
                </div>

                <p style={styles.nodeDesc}>{node.desc}</p>

                {/* Output panel */}
                {state === "done" && result && (
                  <NodeOutput nodeId={node.id} result={result} />
                )}

                {/* Active pulse bar */}
                {state === "active" && (
                  <div style={styles.pulseBar}>
                    <div style={styles.pulseBarFill} />
                  </div>
                )}

              </div>

              {/* Connector arrow */}
              {i < NODES.length - 1 && (
                <div style={styles.connector}>
                  <div style={{
                    ...styles.connectorLine,
                    background: state === "done" ? "var(--orange)" : "var(--border)",
                  }} />
                  <span style={{
                    ...styles.connectorArrow,
                    color: state === "done" ? "var(--orange)" : "var(--border)",
                  }}>▼</span>
                </div>
              )}

            </div>
          );
        })}
      </div>

    </div>
  );
}

// ── Node Status Badge ─────────────────────────────────────────────────────────

function NodeStatus({ state }) {
  if (state === "idle")   return <span style={styles.statusIdle}>WAITING</span>;
  if (state === "active") return (
    <span style={styles.statusActive}>
      <span className="live-dot orange" style={{ width: 6, height: 6 }} />
      RUNNING
    </span>
  );
  if (state === "done")   return <span style={styles.statusDone}>✓ DONE</span>;
  if (state === "error")  return <span style={styles.statusError}>✗ ERROR</span>;
  return null;
}

// ── Node Output ───────────────────────────────────────────────────────────────

function NodeOutput({ nodeId, result }) {
  const rows = getOutputRows(nodeId, result);
  if (!rows.length) return null;

  return (
    <div style={styles.output}>
      {rows.map(({ key, value, color }) => (
        <div key={key} style={styles.outputRow}>
          <span style={styles.outputKey}>{key}</span>
          <span style={{ ...styles.outputVal, color: color || "var(--white)" }}>
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getNodeState(nodeId, activeNode, result) {
  if (!activeNode) return "idle";

  const order = ["classify", "route", "resolve"];
  const activeIdx = order.indexOf(activeNode);
  const nodeIdx   = order.indexOf(nodeId);

  if (activeNode === "done") {
    return result ? "done" : "idle";
  }

  if (nodeIdx < activeIdx)  return "done";
  if (nodeIdx === activeIdx) return "active";
  return "idle";
}

function getOutputRows(nodeId, result) {
  if (!result) return [];

  if (nodeId === "classify" && result.node_classify) {
    const c = result.node_classify;
    return [
      { key: "Category",   value: c.category,
        color: "var(--orange)" },
      { key: "Confidence", value: `${Math.round(c.confidence * 100)}%`,
        color: c.confidence >= 0.85 ? "var(--green)" : "var(--red)" },
      { key: "Sentiment",  value: c.sentiment,
        color: c.sentiment === "urgent" ? "var(--red)" : c.sentiment === "frustrated" ? "var(--high)" : "var(--muted-2)" },
      { key: "Keywords",   value: c.keywords.slice(0, 3).join(", "),
        color: "var(--muted-2)" },
    ];
  }

  if (nodeId === "route" && result.node_route) {
    const r = result.node_route;
    return [
      { key: "Decision", value: r.decision,
        color: r.escalate ? "var(--red)" : "var(--green)" },
      { key: "Escalate", value: r.escalate ? "YES" : "NO",
        color: r.escalate ? "var(--red)" : "var(--green)" },
      { key: "Reason",   value: r.reason.length > 42 ? r.reason.slice(0, 42) + "…" : r.reason,
        color: "var(--muted-2)" },
    ];
  }

  if (nodeId === "resolve" && result.node_resolve) {
    const r = result.node_resolve;
    const rows = [
      { key: "Action", value: r.action.toUpperCase(),
        color: r.action === "escalate" ? "var(--red)" : r.action === "faq" ? "var(--orange)" : "var(--blue)" },
    ];
    if (r.faq_link) {
      rows.push({ key: "FAQ Link", value: r.faq_link, color: "var(--orange)" });
    }
    if (r.escalation?.customer_name) {
      rows.push({ key: "Customer", value: r.escalation.customer_name, color: "var(--white)" });
    }
    if (r.resolution_time_ms !== undefined) {
      rows.push({ key: "Time", value: `${r.resolution_time_ms}ms`, color: "var(--muted-2)" });
    }
    return rows;
  }

  return [];
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  wrapper: {
    display:       "flex",
    flexDirection: "column",
    gap:           "12px",
    height:        "100%",
  },

  title: {
    paddingBottom: "8px",
    borderBottom:  "1px solid var(--border)",
  },

  nodes: {
    display:       "flex",
    flexDirection: "column",
    gap:           0,
    flex:          1,
  },

  nodeRow: {
    display:       "flex",
    flexDirection: "column",
  },

  node: {
    border:        "1px solid",
    borderRadius:  "var(--radius)",
    padding:       "12px",
    transition:    "all 0.3s ease",
    position:      "relative",
    overflow:      "hidden",
  },

  nodeHeader: {
    display:        "flex",
    alignItems:     "center",
    justifyContent: "space-between",
    marginBottom:   "4px",
  },

  nodeLeft: {
    display:    "flex",
    alignItems: "center",
    gap:        "8px",
  },

  nodeNumber: {
    fontFamily:    "var(--font-mono)",
    fontSize:      "10px",
    letterSpacing: "0.05em",
  },

  nodeIcon: {
    fontSize: "14px",
  },

  nodeLabel: {
    fontFamily:    "var(--font-display)",
    fontSize:      "16px",
    letterSpacing: "0.08em",
  },

  nodeDesc: {
    fontFamily: "var(--font-condensed)",
    fontSize:   "11px",
    color:      "var(--muted)",
    marginBottom: "0",
  },

  output: {
    marginTop:     "10px",
    padding:       "8px",
    background:    "var(--surface-3)",
    borderRadius:  "4px",
    display:       "flex",
    flexDirection: "column",
    gap:           "4px",
  },

  outputRow: {
    display:        "flex",
    justifyContent: "space-between",
    alignItems:     "flex-start",
    gap:            "8px",
  },

  outputKey: {
    fontFamily:  "var(--font-mono)",
    fontSize:    "10px",
    color:       "var(--muted)",
    flexShrink:  0,
  },

  outputVal: {
    fontFamily: "var(--font-condensed)",
    fontSize:   "11px",
    fontWeight: 600,
    textAlign:  "right",
    wordBreak:  "break-all",
  },

  connector: {
    display:        "flex",
    flexDirection:  "column",
    alignItems:     "center",
    padding:        "2px 0",
  },

  connectorLine: {
    width:      "1px",
    height:     "10px",
    transition: "background 0.3s ease",
  },

  connectorArrow: {
    fontSize:   "8px",
    lineHeight: 1,
    transition: "color 0.3s ease",
  },

  pulseBar: {
    position:   "absolute",
    bottom:     0,
    left:       0,
    right:      0,
    height:     "2px",
    background: "var(--surface-3)",
    overflow:   "hidden",
  },

  pulseBarFill: {
    height:     "100%",
    width:      "40%",
    background: "var(--orange)",
    animation:  "shimmer 1.2s infinite linear",
    backgroundImage: "linear-gradient(90deg, transparent, var(--orange), transparent)",
    backgroundSize:  "200% 100%",
  },

  statusIdle:   { fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--muted)",  letterSpacing: "0.08em" },
  statusActive: { fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--orange)", letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: "4px" },
  statusDone:   { fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--green)",  letterSpacing: "0.08em" },
  statusError:  { fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--red)",    letterSpacing: "0.08em" },
};