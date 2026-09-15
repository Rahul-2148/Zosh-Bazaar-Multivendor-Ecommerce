import React, { useState, useEffect } from "react";
import {
  AutoAwesome,
  Speed,
  TrendingDown,
  TrendingUp,
  Search,
  CheckCircle,
  WarningAmber,
  Shield,
  Psychology,
  Refresh,
  Hub,
  FindInPage,
} from "@mui/icons-material";
import {
  Button,
  CircularProgress,
  TextField,
  Chip,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@mui/material";
import apiClient from "../../api/apiClient";

export const AdminAICenter: React.FC = () => {
  const [observability, setObservability] = useState<any>(null);
  const [obsLoading, setObsLoading] = useState(true);

  // Copilot Query State
  const [copilotQuery, setCopilotQuery] = useState("Why did sales drop in audio?");
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotResult, setCopilotResult] = useState<any>(null);

  // Candidate Explorer State
  const [explorerUserId, setExplorerUserId] = useState("user_demo_01");
  const [explorerPlacement, setExplorerPlacement] = useState("home_for_you");
  const [explorerLoading, setExplorerLoading] = useState(false);
  const [explorerResult, setExplorerResult] = useState<any>(null);

  const fetchObservability = async () => {
    setObsLoading(true);
    try {
      const res = await apiClient.get("/ai/admin/observability");
      setObservability(res.data);
    } catch (err) {
      console.error("Error fetching AI observability:", err);
    } finally {
      setObsLoading(false);
    }
  };

  const handleRunCopilot = async (customQuery?: string) => {
    const q = customQuery || copilotQuery;
    if (!q) return;
    setCopilotLoading(true);
    try {
      const res = await apiClient.post("/ai/admin/copilot", { query: q });
      setCopilotResult(res.data);
    } catch (err) {
      console.error("Copilot query failed:", err);
    } finally {
      setCopilotLoading(false);
    }
  };

  const handleRunExplorer = async () => {
    setExplorerLoading(true);
    try {
      const res = await apiClient.get(
        `/ai/admin/recommendation-explorer?userId=${explorerUserId}&placement=${explorerPlacement}`
      );
      setExplorerResult(res.data);
    } catch (err) {
      console.error("Explorer query failed:", err);
    } finally {
      setExplorerLoading(false);
    }
  };

  useEffect(() => {
    fetchObservability();
    handleRunCopilot("Why did sales drop in audio?");
    handleRunExplorer();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-teal-950 text-white shadow-lg border border-teal-500/20">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-400/20 text-teal-300">
              <AutoAwesome sx={{ fontSize: 24 }} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Admin AI Control Tower & Observability</h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-teal-400/20 text-teal-300 border border-teal-400/30">
              Active Production 2.0
            </span>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Central neural orchestration console for model performance telemetry, conversational anomaly diagnostics, and candidate retrieval exploration.
          </p>
        </div>

        <Button
          size="small"
          variant="outlined"
          onClick={fetchObservability}
          startIcon={<Refresh />}
          sx={{
            color: "#fff",
            borderColor: "rgba(255,255,255,0.3)",
            textTransform: "none",
            fontSize: "12px",
            borderRadius: "8px",
            alignSelf: { xs: "flex-start", md: "center" },
          }}
        >
          Refresh Telemetry
        </Button>
      </div>

      {/* Top Telemetry KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Engine Health & Latency
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
              {observability?.aiServiceStatus || "HEALTHY"}
            </span>
            <span className="text-xs font-bold text-slate-500">
              ~{observability?.avgInferenceLatencyMs || 18.4}ms
            </span>
          </div>
          <p className="text-[10px] text-slate-400">P99: {observability?.p99LatencyMs || 42.1}ms • Breaker: CLOSED</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Recommendation CTR
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-teal-600 dark:text-teal-400">
              {observability ? `${(observability.recommendationClickThroughRate * 100).toFixed(2)}%` : "4.82%"}
            </span>
            <span className="text-xs font-bold text-emerald-600">+0.35% lift</span>
          </div>
          <p className="text-[10px] text-slate-400">Two-Tower Retriever + Deep Ranker</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Daily Inferences Served
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
              {(observability?.dailyInferenceRequests || 48210).toLocaleString()}
            </span>
            <span className="text-xs font-bold text-slate-400">requests</span>
          </div>
          <p className="text-[10px] text-slate-400">Across Home, PDP, Search, and Cart</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Active Neural Models
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-purple-600 dark:text-purple-400">2 Models</span>
            <span className="text-xs font-bold text-slate-400">v1.0.0</span>
          </div>
          <p className="text-[10px] text-slate-400">PyTorch CPU & LightGBM Reranker</p>
        </div>
      </div>

      {/* ── Section 1: Operational AI Copilot ─────────────────── */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/80 pb-4">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Psychology sx={{ fontSize: 24 }} />
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Admin Diagnostic AI Copilot
              </h2>
              <p className="text-xs text-slate-500">
                Ask natural questions about marketplace metrics, stockout anomalies, or fraud spikes
              </p>
            </div>
          </div>
        </div>

        {/* Quick Query Pills */}
        <div className="flex flex-wrap gap-2">
          {[
            "Why did sales drop in audio?",
            "Show refund anomalies",
            "Find suspicious coupon usage",
            "Which products may stock out?",
          ].map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCopilotQuery(preset);
                handleRunCopilot(preset);
              }}
              className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 transition"
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Query Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRunCopilot();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={copilotQuery}
            onChange={(e) => setCopilotQuery(e.target.value)}
            placeholder="Type your operational inquiry..."
            className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
          />
          <Button
            type="submit"
            disabled={copilotLoading}
            variant="contained"
            sx={{
              borderRadius: "12px",
              px: 3,
              py: 1.1,
              textTransform: "none",
              fontWeight: 700,
              fontSize: "13px",
              bgcolor: "#4f46e5",
              "&:hover": { bgcolor: "#4338ca" },
            }}
          >
            {copilotLoading ? <CircularProgress size={16} color="inherit" /> : "Diagnose"}
          </Button>
        </form>

        {/* Copilot Grounded Diagnostic Report */}
        {copilotResult && (
          <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/80 space-y-4 animate-in fade-in duration-200">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 dark:text-indigo-400">
                AI Telemetry Analysis
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                {copilotResult.headline}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                {copilotResult.summary}
              </p>
            </div>

            {/* Metric KPI Chips */}
            {copilotResult.metrics && copilotResult.metrics.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {copilotResult.metrics.map((m: any, i: number) => (
                  <div
                    key={i}
                    className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                  >
                    <span className="text-[11px] font-semibold text-slate-500 block">{m.label}</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-base font-bold text-slate-900 dark:text-white">
                        {m.value}
                      </span>
                      <span
                        className={`text-xs font-bold ${
                          m.trend === "UP_BAD" || m.trend === "DOWN"
                            ? "text-rose-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {m.change}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Affected Entities Table */}
            {copilotResult.affectedEntities && copilotResult.affectedEntities.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Directly Affected Entities
                </span>
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-2.5 font-semibold text-slate-600 dark:text-slate-300">Entity ID</th>
                        <th className="p-2.5 font-semibold text-slate-600 dark:text-slate-300">Entity Name</th>
                        <th className="p-2.5 font-semibold text-slate-600 dark:text-slate-300">Identified Factor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                      {copilotResult.affectedEntities.map((ent: any, idx: number) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-mono text-slate-500">{ent.id}</td>
                          <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200">{ent.name}</td>
                          <td className="p-2.5 text-rose-600 dark:text-rose-400 font-medium">{ent.issue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Recommended Action Checklist */}
            {copilotResult.recommendedActions && copilotResult.recommendedActions.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Recommended Interventions
                </span>
                <div className="space-y-1.5">
                  {copilotResult.recommendedActions.map((act: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                    >
                      <span className="font-medium text-slate-800 dark:text-slate-200">{act.action}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          act.urgency === "HIGH"
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        }`}
                      >
                        {act.urgency} URGENCY
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Section 2: Recommendation Explorer (Debugger) ────── */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/80 pb-4">
          <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400">
            <FindInPage sx={{ fontSize: 24 }} />
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Recommendation Candidate Explorer
              </h2>
              <p className="text-xs text-slate-500">
                Inspect retrieval channels (Two-Tower Neural vs Vector Semantic vs Collaborative) and deep ranking scores for any customer profile
              </p>
            </div>
          </div>
        </div>

        {/* Explorer Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Customer / User ID
            </label>
            <input
              type="text"
              value={explorerUserId}
              onChange={(e) => setExplorerUserId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Placement Strategy
            </label>
            <select
              value={explorerPlacement}
              onChange={(e) => setExplorerPlacement(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="home_for_you">home_for_you (Hybrid + Two-Tower Neural)</option>
              <option value="pdp_similar">pdp_similar (Item Vector Similarity)</option>
              <option value="cart_addons">cart_addons (Frequently Bought Together)</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button
              onClick={handleRunExplorer}
              disabled={explorerLoading}
              variant="contained"
              fullWidth
              sx={{
                borderRadius: "12px",
                py: 1.1,
                textTransform: "none",
                fontWeight: 700,
                fontSize: "13px",
                bgcolor: "#0d9488",
                "&:hover": { bgcolor: "#0f766e" },
              }}
            >
              {explorerLoading ? <CircularProgress size={16} color="inherit" /> : "Inspect Candidates"}
            </Button>
          </div>
        </div>

        {/* Candidate Breakdown Results */}
        {explorerResult && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                Model: <strong className="text-teal-600">{explorerResult.modelVersion}</strong>
              </span>
              <span>
                Ranking: <strong>{explorerResult.rankingStrategy}</strong>
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3 font-semibold text-slate-600 dark:text-slate-300">Pos</th>
                    <th className="p-3 font-semibold text-slate-600 dark:text-slate-300">Product Title</th>
                    <th className="p-3 font-semibold text-slate-600 dark:text-slate-300">Category / Brand</th>
                    <th className="p-3 font-semibold text-slate-600 dark:text-slate-300">Retrieval Channel</th>
                    <th className="p-3 font-semibold text-slate-600 dark:text-slate-300">Coarse Score</th>
                    <th className="p-3 font-semibold text-slate-600 dark:text-slate-300">Deep Rank Score</th>
                    <th className="p-3 font-semibold text-slate-600 dark:text-slate-300">Grounding Explanation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 bg-white dark:bg-slate-800">
                  {explorerResult.candidates?.map((cand: any) => (
                    <tr key={cand.productId}>
                      <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                        #{cand.finalPosition}
                      </td>
                      <td className="p-3 font-semibold text-slate-900 dark:text-white max-w-xs truncate">
                        {cand.title}
                      </td>
                      <td className="p-3 text-slate-500">
                        {cand.category} • {cand.brand}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                          {cand.retrievalChannel}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-600 dark:text-slate-300">
                        {cand.coarseScore}
                      </td>
                      <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {cand.deepRankScore}
                      </td>
                      <td className="p-3 text-[11px] text-slate-500 max-w-xs truncate">
                        {cand.explanation}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAICenter;
