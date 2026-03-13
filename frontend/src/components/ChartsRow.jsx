import { useMemo } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { useQueryStore } from "../hooks/useQueryStore";
import { CATEGORY_COLORS } from "../lib/sampleData";

const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={styles.tooltip}>
      <span style={{ color: d.fill, fontFamily: "var(--font-condensed)", fontWeight: 700 }}>{d.name}</span>
      <span style={{ fontFamily: "var(--font-mono)", color: "var(--white)", marginLeft: 8 }}>{d.percentage}% · {d.count}</span>
    </div>
  );
};

const AreaTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ ...styles.tooltip, flexDirection: "column", gap: 4 }}>
      <div style={{ fontFamily: "var(--font-mono)", color: "var(--muted-2)", fontSize: 10 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, display: "inline-block", flexShrink: 0 }} />
          <span style={{ fontFamily: "var(--font-condensed)", color: "var(--muted-2)", fontSize: 11, flex: 1 }}>{p.dataKey}</span>
          <span style={{ fontFamily: "var(--font-mono)", color: "var(--white)" }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const CustomLegend = ({ data }) => (
  <div style={styles.legend}>
    {data.map((d) => (
      <div key={d.name} style={styles.legendItem}>
        <span style={{ ...styles.legendDot, background: CATEGORY_COLORS[d.name] || "#666" }} />
        <span style={styles.legendName}>{d.name}</span>
        <span style={styles.legendPct}>{d.percentage}%</span>
      </div>
    ))}
  </div>
);

export default function ChartsRow() {
  const queries = useQueryStore((s) => s.queries);
  const total   = queries.length;

  const distribution = useMemo(() => {
    if (!queries.length) return [];
    const counts = {};
    queries.forEach((q) => { const c = q.node_classify.category; counts[c] = (counts[c] || 0) + 1; });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count, percentage: Math.round((count / queries.length) * 100), fill: CATEGORY_COLORS[name] || "#666" }))
      .sort((a, b) => b.count - a.count);
  }, [queries]);

  const trendData = useMemo(() => {
    const now = new Date();
    const buckets = {};
    for (let i = 23; i >= 0; i--) {
      const d = new Date(now); d.setHours(now.getHours() - i, 0, 0, 0);
      const key = `${d.getHours()}:00`;
      buckets[key] = { time: key, total: 0, escalated: 0, resolved: 0 };
    }
    queries.forEach((q) => {
      const key = `${new Date(q.timestamp).getHours()}:00`;
      if (buckets[key]) { buckets[key].total++; q.node_route.escalate ? buckets[key].escalated++ : buckets[key].resolved++; }
    });
    return Object.values(buckets);
  }, [queries]);

  return (
    <div className="grid-2" style={{ gap: 16 }}>

      {/* Donut */}
      <div className="card">
        <div style={styles.cardHeader}>
          <span className="label">Issue Distribution</span>
          <span style={styles.cardBadge}>{distribution.length} categories</span>
        </div>
        <div style={styles.donutWrap}>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={distribution}
                cx="50%" cy="50%"
                innerRadius={70} outerRadius={100}
                paddingAngle={2}
                dataKey="count"
                strokeWidth={0}
                isAnimationActive={false}
              >
                {distribution.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} opacity={0.9} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={styles.donutCenter}>
            <span style={styles.donutTotal}>{total}</span>
            <span style={styles.donutLabel}>QUERIES</span>
          </div>
        </div>
        <CustomLegend data={distribution} />
      </div>

      {/* Area Chart */}
      <div className="card">
        <div style={styles.cardHeader}>
          <span className="label">Query Trend (24h)</span>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={styles.trendLegendItem}><span style={{ ...styles.trendDot, background: "var(--orange)" }} /><span style={styles.trendLegendText}>Resolved</span></div>
            <div style={styles.trendLegendItem}><span style={{ ...styles.trendDot, background: "var(--red)" }} /><span style={styles.trendLegendText}>Escalated</span></div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={trendData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradResolved" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="var(--orange)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--orange)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradEscalated" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="var(--red)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--red)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="time" tick={{ fontFamily: "var(--font-mono)", fontSize: 10, fill: "var(--muted)" }} tickLine={false} axisLine={false} interval={3} />
            <YAxis tick={{ fontFamily: "var(--font-mono)", fontSize: 10, fill: "var(--muted)" }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip content={<AreaTooltip />} />
            <Area type="monotone" dataKey="resolved"  stroke="var(--orange)" strokeWidth={2} fill="url(#gradResolved)"  isAnimationActive={false} />
            <Area type="monotone" dataKey="escalated" stroke="var(--red)"    strokeWidth={2} fill="url(#gradEscalated)" isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}

const styles = {
  cardHeader:      { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" },
  cardBadge:       { fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--muted-2)", background: "var(--surface-3)", border: "1px solid var(--border)", borderRadius: "20px", padding: "2px 8px" },
  donutWrap:       { position: "relative" },
  donutCenter:     { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none" },
  donutTotal:      { display: "block", fontFamily: "var(--font-display)", fontSize: "34px", color: "var(--white)", lineHeight: 1 },
  donutLabel:      { display: "block", fontFamily: "var(--font-condensed)", fontSize: "10px", letterSpacing: "0.12em", color: "var(--muted-2)", marginTop: "4px" },
  legend:          { display: "flex", flexDirection: "column", gap: "6px", marginTop: "12px" },
  legendItem:      { display: "flex", alignItems: "center", gap: "8px" },
  legendDot:       { width: "8px", height: "8px", borderRadius: "2px", flexShrink: 0 },
  legendName:      { fontFamily: "var(--font-condensed)", fontSize: "12px", color: "var(--muted-2)", flex: 1 },
  legendPct:       { fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--white)" },
  tooltip:         { background: "var(--surface-2)", border: "1px solid var(--border-bright)", borderRadius: "var(--radius)", padding: "8px 12px", fontSize: "12px", display: "flex", alignItems: "center" },
  trendLegendItem: { display: "flex", alignItems: "center", gap: "6px" },
  trendDot:        { width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0 },
  trendLegendText: { fontFamily: "var(--font-condensed)", fontSize: "11px", color: "var(--muted-2)" },
};