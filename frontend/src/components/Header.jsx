import { useState, useEffect } from "react";
import { ping } from "../lib/api";

export default function Header() {
  const [backendStatus, setBackendStatus] = useState("checking");

  useEffect(() => {
    const check = async () => {
      const res = await ping();
      setBackendStatus(res ? "online" : "offline");
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header style={styles.header}>

      {/* Left — Brand */}
      <div style={styles.brand}>
        <div style={styles.logoMark}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <polygon points="14,2 26,8 26,20 14,26 2,20 2,8" fill="none" stroke="var(--orange)" strokeWidth="1.5" />
            <polygon points="14,7 21,11 21,17 14,21 7,17 7,11" fill="var(--orange)" opacity="0.2" />
            <circle cx="14" cy="14" r="3" fill="var(--orange)" />
          </svg>
        </div>
        <div>
          <h1 style={styles.brandName}>PEAKPULSE</h1>
          <p style={styles.brandTagline}>Customer Intelligence at Peak Performance</p>
        </div>
      </div>

      {/* Center — Status bar */}
      <div style={styles.statusBar}>
        <div style={styles.statusItem}>
          <span className="live-dot" />
          <span style={styles.statusText}>LIVE</span>
        </div>

        <div style={styles.statusDivider} />

        <div style={styles.statusItem}>
          <span style={{ ...styles.statusLabel }}>PIPELINE</span>
          <span style={styles.statusValue}>v1.0</span>
        </div>

        <div style={styles.statusDivider} />

        <div style={styles.statusItem}>
          <span style={styles.statusLabel}>BACKEND</span>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{
              width:        "6px",
              height:       "6px",
              borderRadius: "50%",
              background:   backendStatus === "online"   ? "var(--green)"
                          : backendStatus === "offline"  ? "var(--red)"
                          : "var(--muted)",
              flexShrink: 0,
            }} />
            <span style={{
              ...styles.statusValue,
              color: backendStatus === "online"  ? "var(--green)"
                   : backendStatus === "offline" ? "var(--red)"
                   : "var(--muted)",
            }}>
              {backendStatus.toUpperCase()}
            </span>
          </div>
        </div>

        <div style={styles.statusDivider} />

        <div style={styles.statusItem}>
          <span style={styles.statusLabel}>MODE</span>
          <span style={{ ...styles.statusValue, color: "var(--orange)" }}>
            AI + RULES
          </span>
        </div>
      </div>

      {/* Right — Info */}
      <div style={styles.right}>
        <span style={styles.infoText}>
          LLM on backend · rule-based fallback
        </span>
      </div>

    </header>
  );
}

const styles = {
  header: {
    display:        "flex",
    alignItems:     "center",
    justifyContent: "space-between",
    padding:        "0 24px",
    height:         "64px",
    background:     "var(--surface)",
    borderBottom:   "1px solid var(--border)",
    position:       "sticky",
    top:            0,
    zIndex:         50,
    gap:            "24px",
  },
  brand: {
    display:    "flex",
    alignItems: "center",
    gap:        "12px",
    flexShrink: 0,
  },
  logoMark: {
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
  },
  brandName: {
    fontFamily:    "var(--font-display)",
    fontSize:      "22px",
    letterSpacing: "0.12em",
    color:         "var(--white)",
    lineHeight:    1,
  },
  brandTagline: {
    fontFamily:    "var(--font-condensed)",
    fontSize:      "10px",
    letterSpacing: "0.1em",
    color:         "var(--muted)",
    textTransform: "uppercase",
    marginTop:     "2px",
  },
  statusBar: {
    display:      "flex",
    alignItems:   "center",
    gap:          "16px",
    background:   "var(--surface-2)",
    border:       "1px solid var(--border)",
    borderRadius: "20px",
    padding:      "6px 16px",
    flexShrink:   0,
  },
  statusItem: {
    display:    "flex",
    alignItems: "center",
    gap:        "6px",
  },
  statusText: {
    fontFamily:    "var(--font-condensed)",
    fontSize:      "10px",
    fontWeight:    600,
    letterSpacing: "0.1em",
    color:         "var(--green)",
  },
  statusLabel: {
    fontFamily:    "var(--font-condensed)",
    fontSize:      "10px",
    fontWeight:    600,
    letterSpacing: "0.1em",
    color:         "var(--muted-2)",
  },
  statusValue: {
    fontFamily:    "var(--font-mono)",
    fontSize:      "10px",
    color:         "var(--white)",
  },
  statusDivider: {
    width:      "1px",
    height:     "12px",
    background: "var(--border)",
  },
  right: {
    flexShrink: 0,
  },
  infoText: {
    fontFamily:    "var(--font-mono)",
    fontSize:      "10px",
    color:         "var(--muted)",
    letterSpacing: "0.04em",
  },
};