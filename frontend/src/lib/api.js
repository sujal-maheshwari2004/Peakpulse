import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { rule_based_classify } from "./classifier";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});


// ── Single Query ──────────────────────────────────────────────────────────────

export async function analyzeQuery({ message, platform, customer }) {
  const payload = {
    query_id:  uuidv4(),
    platform,
    timestamp: new Date().toISOString(),
    message,
    customer,
  };

  try {
    const { data } = await client.post("/api/analyze", payload);
    return data;
  } catch (err) {
    console.warn("Backend unreachable, using rule-based fallback:", err.message);
    return rule_based_classify(payload);
  }
}


// ── Bulk Query ────────────────────────────────────────────────────────────────

export async function analyzeBulk({ queries }) {
  try {
    const { data } = await client.post("/api/analyze/bulk", { queries });
    return data.results;
  } catch (err) {
    console.warn("Bulk backend unreachable, using rule-based fallback:", err.message);
    return queries.map((q) => rule_based_classify(q));
  }
}


// ── Ping ──────────────────────────────────────────────────────────────────────

export async function ping() {
  try {
    const { data } = await client.get("/api/ping");
    return data;
  } catch {
    return null;
  }
}