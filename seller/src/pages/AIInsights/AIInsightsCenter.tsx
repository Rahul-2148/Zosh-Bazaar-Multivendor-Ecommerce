import React, { useState, useEffect } from "react";
import {
  AutoAwesome,
  TrendingUp,
  WarningAmber,
  CheckCircle,
  PriceChange,
  Inventory2,
  EditNote,
  ArrowForward,
  Speed,
  Psychology,
  Refresh,
} from "@mui/icons-material";
import {
  Button,
  CircularProgress,
  Alert,
  TextField,
  Chip,
  LinearProgress,
} from "@mui/material";
import { api } from "../../services/api";

interface InsightCard {
  id: string;
  type: string;
  title: string;
  description: string;
  impact: string;
  confidence: number;
  actionType: string;
  actionLabel: string;
}

export const AIInsightsCenter: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<InsightCard[]>([]);
  const [healthScore, setHealthScore] = useState(92);

  // Listing Optimizer State
  const [optTitle, setOptTitle] = useState("Wireless Over-Ear Headphones with Mic");
  const [optCategory, setOptCategory] = useState("Audio & Headphones");
  const [optBrand, setOptBrand] = useState("Apex Sound");
  const [optDescription, setOptDescription] = useState("Good sound quality bluetooth headphone with battery.");
  const [optimizing, setOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<any>(null);

  // Demand Forecast State
  const [forecastProductId, setForecastProductId] = useState("prod_audio_01");
  const [forecasting, setForecasting] = useState(false);
  const [forecastResult, setForecastResult] = useState<any>(null);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const res = await api.get("/ai/seller/insights");
      if (res.data) {
        setCards(res.data.cards || []);
        setHealthScore(res.data.healthScore || 92);
      }
    } catch (err) {
      console.error("Error fetching seller insights:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const handleOptimizeListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setOptimizing(true);
    try {
      const res = await api.post("/ai/seller/optimize-listing", {
        title: optTitle,
        category: optCategory,
        brand: optBrand,
        description: optDescription,
      });
      setOptimizationResult(res.data);
    } catch (err) {
      console.error("Listing optimization failed:", err);
    } finally {
      setOptimizing(false);
    }
  };

  const handleRunForecast = async () => {
    setForecasting(true);
    try {
      const res = await api.get(`/ai/seller/inventory-forecast/${forecastProductId}?horizonDays=30`);
      setForecastResult(res.data);
    } catch (err) {
      console.error("Forecast failed:", err);
    } finally {
      setForecasting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-teal-900 via-indigo-950 to-slate-900 text-white shadow-lg border border-teal-500/20">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-400/20 text-teal-300">
              <AutoAwesome sx={{ fontSize: 22 }} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Seller AI Intelligence Center</h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-teal-400/20 text-teal-300 border border-teal-400/30">
              Production 2.0
            </span>
          </div>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Prescriptive intelligence grounded in buyer search queries, inventory velocity, review sentiment, and price elasticity.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-5 py-3 rounded-xl border border-white/15">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-300 block">
              Store Catalog Health
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black text-teal-300">{healthScore}</span>
              <span className="text-xs font-semibold text-slate-400">/100</span>
            </div>
          </div>
          <Button
            size="small"
            variant="outlined"
            onClick={fetchInsights}
            startIcon={<Refresh />}
            sx={{
              color: "#fff",
              borderColor: "rgba(255,255,255,0.3)",
              textTransform: "none",
              fontSize: "12px",
              borderRadius: "8px",
            }}
          >
            Refresh Telemetry
          </Button>
        </div>
      </div>

      {/* AI Opportunity & Risk Cards */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <Speed sx={{ fontSize: 18 }} className="text-teal-600" />
          Proactive Operational Action Cards
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-44 rounded-2xl bg-slate-100 dark:bg-slate-800"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card) => (
              <div
                key={card.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        card.type === "INVENTORY_RISK"
                          ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                          : card.type === "REVENUE_OPPORTUNITY"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
                      }`}
                    >
                      {card.type.replace(/_/g, " ")}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {Math.round(card.confidence * 100)}% Conf.
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                      {card.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-700/60 mt-4 flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-700 dark:text-teal-400">
                    {card.impact}
                  </span>
                  <button className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5">
                    {card.actionLabel} <ArrowForward sx={{ fontSize: 13 }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Two-Column Deep Tools: Listing Optimizer & Demand Forecasting */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Listing Optimizer Tool */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <EditNote sx={{ fontSize: 22 }} />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              AI Listing & SEO Optimizer
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Extract high-converting marketplace keywords, enhance title discoverability, and verify catalog completeness.
          </p>

          <form onSubmit={handleOptimizeListing} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Brand
                </label>
                <input
                  type="text"
                  value={optBrand}
                  onChange={(e) => setOptBrand(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={optCategory}
                  onChange={(e) => setOptCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Draft Product Title
              </label>
              <input
                type="text"
                value={optTitle}
                onChange={(e) => setOptTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Short Description
              </label>
              <textarea
                rows={2}
                value={optDescription}
                onChange={(e) => setOptDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
              />
            </div>

            <Button
              type="submit"
              disabled={optimizing}
              variant="contained"
              fullWidth
              sx={{
                borderRadius: "12px",
                py: 1.2,
                textTransform: "none",
                fontWeight: 700,
                fontSize: "13px",
                bgcolor: "#4f46e5",
                "&:hover": { bgcolor: "#4338ca" },
              }}
            >
              {optimizing ? <CircularProgress size={16} color="inherit" /> : "Run AI Listing Optimization"}
            </Button>
          </form>

          {optimizationResult && (
            <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Recommended High-Converting Title:
                </span>
                <span className="text-xs font-bold text-emerald-600">
                  Completeness: {optimizationResult.completenessScore}%
                </span>
              </div>
              <p className="text-xs font-bold text-indigo-900 dark:text-indigo-200 bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-indigo-200 dark:border-indigo-800">
                {optimizationResult.recommendedTitle}
              </p>

              <div>
                <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                  SEO Keywords:
                </span>
                <div className="flex flex-wrap gap-1">
                  {optimizationResult.seoKeywords?.map((kw: string, i: number) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded text-[10px] font-medium bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 block">Suggestions:</span>
                <ul className="text-[11px] text-slate-600 dark:text-slate-300 space-y-0.5">
                  {optimizationResult.suggestions?.map((s: string, idx: number) => (
                    <li key={idx} className="flex items-center gap-1">
                      <span className="text-teal-600 font-bold">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* 2. Inventory Demand & Velocity Simulator */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
          <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400">
            <Inventory2 sx={{ fontSize: 22 }} />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Inventory Demand & Stockout Predictor
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Evaluates 30-day sales velocity and seasonal lift multipliers to prevent costly out-of-stock events.
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Select SKU / Product
              </label>
              <select
                value={forecastProductId}
                onChange={(e) => setForecastProductId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="prod_audio_01">Active Noise Cancelling Over-Ear Headphones</option>
                <option value="prod_shoe_01">Trail Runner Pro Shoes</option>
                <option value="prod_saree_01">Banarasi Kanjivaram Silk Saree</option>
              </select>
            </div>

            <Button
              onClick={handleRunForecast}
              disabled={forecasting}
              variant="contained"
              fullWidth
              sx={{
                borderRadius: "12px",
                py: 1.2,
                textTransform: "none",
                fontWeight: 700,
                fontSize: "13px",
                bgcolor: "#0d9488",
                "&:hover": { bgcolor: "#0f766e" },
              }}
            >
              {forecasting ? <CircularProgress size={16} color="inherit" /> : "Run 30-Day Demand Forecast"}
            </Button>
          </div>

          {forecastResult && (
            <div className="p-4 rounded-xl bg-teal-50/50 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900/60 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  Stockout Risk Status:
                </span>
                <span
                  className={`px-2 py-0.5 rounded font-bold ${
                    forecastResult.stockoutRisk === "HIGH"
                      ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                  }`}
                >
                  {forecastResult.stockoutRisk} RISK
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-[10px] text-slate-400 block">Daily Demand</span>
                  <span className="font-bold text-slate-800 dark:text-white">
                    {forecastResult.predictedDailyDemand} units
                  </span>
                </div>
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-[10px] text-slate-400 block">Days Left</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">
                    {forecastResult.daysUntilStockout} days
                  </span>
                </div>
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-[10px] text-slate-400 block">Suggest Reorder</span>
                  <span className="font-bold text-teal-600 dark:text-teal-400">
                    {forecastResult.recommendedReorderUnits} units
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIInsightsCenter;
