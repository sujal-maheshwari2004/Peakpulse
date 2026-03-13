import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useQueryStore } from "../hooks/useQueryStore";
import { analyzeQuery, analyzeBulk } from "../lib/api";
import PipelineVisualizer from "./PipelineVisualizer";

const PLATFORMS = ["whatsapp", "instagram", "email", "website"];

const BULK_SAMPLES = [
  { message: "Where is my order? It's been 5 days!",                      platform: "whatsapp"  },
  { message: "My payment failed but money was deducted.",                  platform: "whatsapp"  },
  { message: "I want a refund, product was damaged.",                      platform: "email"     },
  { message: "Can you track my shipment ORD-2025-1234?",                   platform: "instagram" },
  { message: "The protein powder smells weird, I think it's expired.",     platform: "whatsapp"  },
  { message: "How do I cancel my subscription plan?",                      platform: "email"     },
  { message: "Delivery delayed by a week, this is unacceptable!",          platform: "instagram" },
  { message: "Card keeps declining at checkout, please help.",             platform: "website"   },
  { message: "What are the ingredients in your mass gainer?",              platform: "instagram" },
  { message: "I got the wrong product in my order!",                       platform: "whatsapp"  },
];

const makeContact = (platform) => {
  if (platform === "whatsapp")  return { whatsapp:  "+91-9999999999" };
  if (platform === "instagram") return { instagram: "demo_user"      };
  if (platform === "email")     return { email:     "demo@example.com" };
  return {};
};

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

export default function QueryTester() {
  const [message,   setMessage]   = useState("");
  const [platform,  setPlatform]  = useState("whatsapp");
  const [activeNode, setActiveNode] = useState(null);
  const [result,    setResult]    = useState(null);
  const [error,     setError]     = useState(null);
  const [isBulking, setIsBulking] = useState(false);

  const isProc   = useQueryStore((s) => s.isProcessing);
  const setProc  = useQueryStore((s) => s.setProcessing);
  const addQuery = useQueryStore((s) => s.addQuery);
  const addBulk  = useQueryStore((s) => s.addBulkQueries);

  // ── Single Analyze ──────────────────────────────────────────────────────────

  const handleAnalyze = async () => {
    if (!message.trim() || isProc) return;
    setError(null);
    setResult(null);
    setProc(true);

    const request = {
      message:  message.trim(),
      platform,
      customer: {
        name:     "Demo User",
        order_id: "ORD-2025-DEMO",
        contact:  makeContact(platform),
      },
    };

    try {
      setActiveNode("classify");
      await delay(600);
      setActiveNode("route");
      await delay(500);
      setActiveNode("resolve");
      await delay(400);

      const res = await analyzeQuery(request);

      setActiveNode("done");
      setResult(res);
      addQuery(res);
    } catch (err) {
      setError(err.message || "Something went wrong");
      setActiveNode(null);
    } finally {
      setProc(false);
    }
  };

  // ── Bulk Simulate ───────────────────────────────────────────────────────────

  const handleBulkSimulate = async () => {
    if (isBulking) return;
    setIsBulking(true);
    setError(null);
    setResult(null);
    setActiveNode(null);

    try {
      const queries = BULK_SAMPLES.map((s) => ({
        query_id:  uuidv4(),
        platform:  s.platform,
        timestamp: new Date().toISOString(),
        message:   s.message,
        customer: {
          name:     "Bulk User",
          order_id: `ORD-BULK-${uuidv4().slice(0, 6)}`,
          contact:  makeContact(s.platform),
        },
      }));

      const results = await analyzeBulk({ queries });
      addBulk(results);
    } catch (err) {
      setError(err.message || "Bulk simulation failed");
    } finally {
      setIsBulking(false);
    }
  };

  return (
    <div className="grid-2" style={{ gap: 16, alignItems: "stretch" }}>

      {/* Input Panel */}
      <div className="card">
        <div style={styles.inputHeader}>
          <span className="label">Customer Message</span>
          <span style={styles.hint}>⌘+Enter to analyze</span>
        </div>

        {/* Platform selector */}
        <div style={styles.platformRow}>
          {PLATFORMS.map((p) => (
            <button
              key={p}
              className={`btn btn-sm ${platform === p ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setPlatform(p)}
              style={{ flex: 1 }}
            >
              {p === "whatsapp" ? "💬" : p === "instagram" ? "📸" : p === "email" ? "✉️" : "🌐"} {p}
            </button>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          className="input"
          placeholder={`Type a customer message from ${platform}...\n\nExamples:\n• "Where is my order? It's been 5 days!"\n• "My payment failed but money was deducted"\n• "I want a refund, product was damaged"`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAnalyze(); }}
          style={{ minHeight: "140px", marginTop: "12px" }}
        />

        {error && (
          <div style={styles.errorBox}>⚠️ {error}</div>
        )}

        {/* Buttons */}
        <div style={styles.btnRow}>
          <button className="btn btn-primary" onClick={handleAnalyze} disabled={!message.trim() || isProc} style={{ flex: 1 }}>
            {isProc ? "⚡ ANALYZING..." : "⚡ ANALYZE"}
          </button>
          <button className="btn btn-ghost" onClick={handleBulkSimulate} disabled={isBulking} style={{ flex: 1 }}>
            {isBulking ? "⏳ SIMULATING..." : "🚀 BULK SIMULATE (10)"}
          </button>
        </div>

        {/* Mode indicator */}
        <div style={{ marginTop: "10px" }}>
          <span style={styles.modeText}>
            ⚡ LLM on backend · rule-based fallback if unreachable
          </span>
        </div>

        {/* Result summary */}
        {result && !isProc && (
          <div style={styles.resultSummary}>
            <div style={styles.resultRow}>
              <span style={styles.resultKey}>Category</span>
              <span style={{ ...styles.resultVal, color: "var(--orange)" }}>{result.node_classify.category}</span>
            </div>
            <div style={styles.resultRow}>
              <span style={styles.resultKey}>Decision</span>
              <span style={{ ...styles.resultVal, color: result.node_route.escalate ? "var(--red)" : "var(--green)" }}>
                {result.node_route.decision.replace("_", " ").toUpperCase()}
              </span>
            </div>
            <div style={styles.resultRow}>
              <span style={styles.resultKey}>Action</span>
              <span style={{ ...styles.resultVal, color: "var(--blue)" }}>{result.node_resolve.action.toUpperCase()}</span>
            </div>
            <div style={styles.resultRow}>
              <span style={styles.resultKey}>Mode</span>
              <span style={{ ...styles.resultVal, color: "var(--muted-2)" }}>
                {result.meta.llm_used ? "LLM" : "Rule-based"}
              </span>
            </div>
            {result.node_resolve.suggested_reply && (
              <div style={styles.replyBox}>
                <span style={styles.replyLabel}>Suggested Reply</span>
                <p style={styles.replyText}>{result.node_resolve.suggested_reply}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pipeline Visualizer */}
      <div className="card">
        <PipelineVisualizer activeNode={activeNode} result={result} />
      </div>

    </div>
  );
}

const styles = {
  inputHeader:    { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" },
  hint:           { fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--muted)" },
  platformRow:    { display: "flex", gap: "6px" },
  btnRow:         { display: "flex", gap: "8px", marginTop: "12px" },
  errorBox:       { marginTop: "8px", padding: "8px 12px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "var(--radius)", fontFamily: "var(--font-condensed)", fontSize: "12px", color: "var(--red)" },
  modeText:       { fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--muted-2)" },
  resultSummary:  { marginTop: "16px", padding: "12px", background: "var(--surface-2)", borderRadius: "var(--radius)", border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "6px" },
  resultRow:      { display: "flex", justifyContent: "space-between", alignItems: "center" },
  resultKey:      { fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--muted)" },
  resultVal:      { fontFamily: "var(--font-condensed)", fontSize: "13px", fontWeight: 600 },
  replyBox:       { marginTop: "8px", padding: "8px", background: "var(--surface-3)", borderRadius: "4px", borderLeft: "2px solid var(--orange)" },
  replyLabel:     { display: "block", fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--muted)", marginBottom: "4px", letterSpacing: "0.08em" },
  replyText:      { fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--muted-2)", lineHeight: 1.5 },
};