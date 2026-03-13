import { useMemo } from "react";
import { useQueryStore, selectKPIs } from "../hooks/useQueryStore";

const CARDS = [
  { key: "total",          label: "Total Queries",    icon: "⚡", suffix: "",    color: "var(--orange)", dimColor: "var(--orange-glow)" },
  { key: "autoResolved",   label: "Auto Resolved",    icon: "✅", suffix: "%",   color: "var(--green)",  dimColor: "rgba(34,197,94,0.08)" },
  { key: "avgTime",        label: "Avg Process Time", icon: "⏱", suffix: "ms",  color: "var(--blue)",   dimColor: "rgba(59,130,246,0.08)" },
  { key: "escalationRate", label: "Escalation Rate",  icon: "🔴", suffix: "%",   color: "var(--red)",    dimColor: "rgba(239,68,68,0.08)" },
];

export default function KPICards() {
  const queries = useQueryStore((s) => s.queries);
  const kpis    = useMemo(() => selectKPIs(queries), [queries]);

  return (
    <div className="grid-4">
      {CARDS.map((card, i) => (
        <KPICard key={card.key} card={card} value={kpis[card.key]} index={i} />
      ))}
    </div>
  );
}

function KPICard({ card, value, index }) {
  return (
    <div
      className="card"
      style={{
        background:     card.dimColor,
        borderColor:    `${card.color}33`,
        animationDelay: `${index * 0.08}s`,
        animation:      "fadeInDown 0.4s ease forwards",
        opacity:        0,
      }}
    >
      <div style={styles.cardTop}>
        <span className="label">{card.label}</span>
        <div style={{ ...styles.iconWrap, background: `${card.color}18`, border: `1px solid ${card.color}33` }}>
          <span style={{ fontSize: "14px" }}>{card.icon}</span>
        </div>
      </div>
      <div style={styles.valueRow}>
        <span style={{ ...styles.value, color: card.color }}>
          {(value ?? 0).toLocaleString()}
        </span>
        {card.suffix && (
          <span style={{ ...styles.suffix, color: card.color }}>{card.suffix}</span>
        )}
      </div>
      <div style={styles.barTrack}>
        <div style={{
          ...styles.barFill,
          width:      card.suffix === "%" ? `${Math.min(value ?? 0, 100)}%` : "60%",
          background: card.color,
        }} />
      </div>
    </div>
  );
}

const styles = {
  cardTop:   { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" },
  iconWrap:  { width: "28px", height: "28px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center" },
  valueRow:  { display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "12px" },
  value:     { fontFamily: "var(--font-display)", fontSize: "42px", lineHeight: 1, letterSpacing: "0.02em" },
  suffix:    { fontFamily: "var(--font-condensed)", fontSize: "16px", fontWeight: 600, letterSpacing: "0.06em", opacity: 0.7 },
  barTrack:  { height: "3px", background: "var(--surface-3)", borderRadius: "2px", overflow: "hidden" },
  barFill:   { height: "100%", borderRadius: "2px", transition: "width 0.8s ease" },
};