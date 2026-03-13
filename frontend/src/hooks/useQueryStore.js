import { create } from "zustand";
import { SAMPLE_QUERIES } from "../lib/sampleData";

export const useQueryStore = create((set, get) => ({

  // ── State ──────────────────────────────────────────────────────────────────
  queries:      SAMPLE_QUERIES,
  isProcessing: false,
  activeQuery:  null,

  // ── Actions ────────────────────────────────────────────────────────────────
  setActiveQuery:   (query) => set({ activeQuery: query }),
  clearActiveQuery: ()      => set({ activeQuery: null }),
  setProcessing:    (val)   => set({ isProcessing: val }),
  addQuery:         (query) => set((s) => ({ queries: [query, ...s.queries] })),
  addBulkQueries:   (qs)    => set((s) => ({ queries: [...qs, ...s.queries] })),
  clearQueries:     ()      => set({ queries: [] }),
  resetToSample:    ()      => set({ queries: SAMPLE_QUERIES }),

}));

// ── Stable KPI selector ────────────────────────────────────────────────────
export const selectKPIs = (queries) => {
  if (!queries.length) return { total: 0, autoResolved: 0, avgTime: 0, escalationRate: 0 };
  const total     = queries.length;
  const escalated = queries.filter((q) => q.node_route.escalate).length;
  const avgTime   = Math.round(
    queries.reduce((a, q) => a + (q.meta.processing_time_ms || 0), 0) / total
  );
  return {
    total,
    autoResolved:   Math.round(((total - escalated) / total) * 100),
    avgTime,
    escalationRate: Math.round((escalated / total) * 100),
  };
};