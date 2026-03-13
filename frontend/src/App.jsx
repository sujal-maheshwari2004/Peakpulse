import { useEffect } from "react";
import { useQueryStore } from "./hooks/useQueryStore";

import Header          from "./components/Header";
import KPICards        from "./components/KPICards";
import ChartsRow       from "./components/ChartsRow";
import LiveFeed        from "./components/LiveFeed";
import EscalationQueue from "./components/EscalationQueue";
import QueryTester     from "./components/QueryTester";
import DetailModal     from "./components/DetailModal";

import "./index.css";

export default function App() {
  const activeQuery = useQueryStore((s) => s.activeQuery);
  const clearActive = useQueryStore((s) => s.clearActiveQuery);
  const total       = useQueryStore((s) => s.queries.length);
  const escalated   = useQueryStore((s) => s.queries.filter((q) => q.node_route.escalate).length);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") clearActive(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [clearActive]);

  return (
    <div className="app">
      <Header />

      <main className="main-content">

        <section className="section">
          <KPICards />
        </section>

        <section className="section">
          <div className="section-header">
            <h2 className="section-title">ANALYTICS</h2>
          </div>
          <ChartsRow />
        </section>

        <section className="section">
          <div className="section-header">
            <h2 className="section-title">LIVE FEED</h2>
            <span className="section-count">{total} queries</span>
          </div>
          <LiveFeed />
        </section>

        <section className="section">
          <div className="section-header">
            <h2 className="section-title">ESCALATION QUEUE</h2>
            <span className="section-count" style={{ borderColor:"var(--red)", color:"var(--red)" }}>
              {escalated} pending
            </span>
          </div>
          <EscalationQueue />
        </section>

        <section className="section">
          <div className="section-header">
            <h2 className="section-title">QUERY TESTER</h2>
          </div>
          <QueryTester />
        </section>

      </main>

      {activeQuery && <DetailModal query={activeQuery} onClose={clearActive} />}
    </div>
  );
}