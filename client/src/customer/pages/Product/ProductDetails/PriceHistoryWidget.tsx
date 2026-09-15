import React, { useState, useEffect } from "react";
import {
  TrendingDown,
  TrendingUp,
  Bell,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Clock,
  X,
  Lock,
} from "lucide-react";
import { aiCommerceService } from "../../../../services/aiCommerceService";
import type { PriceHistoryResponse } from "../../../../services/aiCommerceService";

interface PriceHistoryWidgetProps {
  productId: string;
  currentPrice: number;
}

export const PriceHistoryWidget: React.FC<PriceHistoryWidgetProps> = ({
  productId,
  currentPrice,
}) => {
  const [data, setData] = useState<PriceHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDays, setSelectedDays] = useState<number>(90);
  const [showAlertModal, setShowAlertModal] = useState(false);

  // Alert Form State
  const [targetPrice, setTargetPrice] = useState<number>(Math.round(currentPrice * 0.9));
  const [autoBuyEnabled, setAutoBuyEnabled] = useState(false);
  const [userConsent, setUserConsent] = useState(false);
  const [alertSubmitted, setAlertSubmitted] = useState(false);
  const [alertError, setAlertError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) return;
    let isMounted = true;
    setLoading(true);

    aiCommerceService
      .getPriceHistory(productId, selectedDays)
      .then((res) => {
        if (isMounted) {
          setData(res);
          setTargetPrice(Math.round(res.currentPrice * 0.9));
        }
      })
      .catch((err) => console.error("Error fetching price history:", err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [productId, selectedDays]);

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertError(null);

    const jwt = localStorage.getItem("jwt");
    if (!jwt) {
      setAlertError("Please sign in to configure price drop alerts.");
      return;
    }

    if (targetPrice >= currentPrice) {
      setAlertError("Target price must be lower than the current price.");
      return;
    }

    if (autoBuyEnabled && !userConsent) {
      setAlertError("You must explicitly check the authorization consent for Safe Auto-Buy.");
      return;
    }

    try {
      await aiCommerceService.createPriceAlert({
        productId,
        targetPrice,
        channels: ["IN_APP", "EMAIL"],
        autoBuyPolicy: autoBuyEnabled
          ? {
              enabled: true,
              maxAuthorizedPrice: targetPrice,
              quantityLimit: 1,
              paymentMethodType: "ONE_CLICK_COD",
            }
          : null,
      });

      setAlertSubmitted(true);
      setTimeout(() => {
        setShowAlertModal(false);
        setAlertSubmitted(false);
      }, 2000);
    } catch (err: any) {
      setAlertError(err.response?.data?.message || "Failed to set price alert. Try again.");
    }
  };

  if (loading) {
    return (
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 animate-pulse space-y-3">
        <div className="h-4 w-40 bg-slate-200 dark:bg-slate-700 rounded"></div>
        <div className="h-32 w-full bg-slate-100 dark:bg-slate-700/50 rounded-xl"></div>
      </div>
    );
  }

  if (!data || !data.points || data.points.length === 0) {
    return null;
  }

  // SVG Chart Calculations
  const points = data.points;
  const prices = points.map((p) => p.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;

  const svgWidth = 460;
  const svgHeight = 120;
  const paddingX = 20;
  const paddingY = 15;

  const polylinePoints = points
    .map((p, i) => {
      const x = paddingX + (i / (points.length - 1)) * (svgWidth - paddingX * 2);
      const y =
        svgHeight -
        paddingY -
        ((p.price - minPrice) / priceRange) * (svgHeight - paddingY * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              Price Intelligence & Trend
            </h3>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${
                data.trend === "FALLING"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
              }`}
            >
              {data.trend === "FALLING" ? (
                <>
                  <TrendingDown className="w-3 h-3" /> Price Drop Active
                </>
              ) : (
                <>
                  <TrendingUp className="w-3 h-3" /> Stable Value
                </>
              )}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Verified historical price tracking</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Day Toggles */}
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 text-xs font-semibold">
            <button
              onClick={() => setSelectedDays(30)}
              className={`px-2.5 py-1 rounded-md transition ${
                selectedDays === 30
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              30D
            </button>
            <button
              onClick={() => setSelectedDays(90)}
              className={`px-2.5 py-1 rounded-md transition ${
                selectedDays === 90
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              90D
            </button>
          </div>

          <button
            onClick={() => setShowAlertModal(true)}
            className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-xs"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Set Price Alert</span>
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 py-2 px-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
        <div>
          <span className="text-[11px] text-slate-400 font-medium">Lowest ({selectedDays}D)</span>
          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
            ₹{data.lowestPrice.toLocaleString("en-IN")}
          </p>
        </div>
        <div>
          <span className="text-[11px] text-slate-400 font-medium">Average Price</span>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
            ₹{data.averagePrice.toLocaleString("en-IN")}
          </p>
        </div>
        <div>
          <span className="text-[11px] text-slate-400 font-medium">Highest Observed</span>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
            ₹{data.highestPrice.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* SVG Trajectory Chart */}
      <div className="relative w-full overflow-hidden bg-slate-50/50 dark:bg-slate-900/30 rounded-xl p-2 border border-slate-100 dark:border-slate-800">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-28 overflow-visible"
          preserveAspectRatio="none"
        >
          {/* Subtle horizontal grid lines */}
          <line
            x1="0"
            y1={paddingY}
            x2={svgWidth}
            y2={paddingY}
            stroke="currentColor"
            className="text-slate-200 dark:text-slate-800"
            strokeDasharray="4 4"
          />
          <line
            x1="0"
            y1={svgHeight / 2}
            x2={svgWidth}
            y2={svgHeight / 2}
            stroke="currentColor"
            className="text-slate-200 dark:text-slate-800"
            strokeDasharray="4 4"
          />
          <line
            x1="0"
            y1={svgHeight - paddingY}
            x2={svgWidth}
            y2={svgHeight - paddingY}
            stroke="currentColor"
            className="text-slate-200 dark:text-slate-800"
            strokeDasharray="4 4"
          />

          {/* Price Line */}
          <polyline
            fill="none"
            stroke="#0d9488"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylinePoints}
          />

          {/* Current / Latest Marker */}
          {points.length > 0 && (
            <circle
              cx={svgWidth - paddingX}
              cy={
                svgHeight -
                paddingY -
                ((points[points.length - 1].price - minPrice) / priceRange) *
                  (svgHeight - paddingY * 2)
              }
              r="4.5"
              fill="#0d9488"
              stroke="#ffffff"
              strokeWidth="2"
            />
          )}
        </svg>

        <div className="flex justify-between text-[10px] text-slate-400 px-2 mt-1">
          <span>{points[0]?.date}</span>
          <span>{points[Math.floor(points.length / 2)]?.date}</span>
          <span>Today ({points[points.length - 1]?.date})</span>
        </div>
      </div>

      {/* Set Price Alert Modal with Safe Auto-Buy Policy */}
      {showAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
            <button
              onClick={() => setShowAlertModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-teal-600 mb-1">
              <Bell className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Set Price Drop Alert
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Get notified immediately via App & Email when the price reaches your target.
            </p>

            {alertSubmitted ? (
              <div className="py-6 flex flex-col items-center text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 animate-bounce" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Price Alert Successfully Created!
                </h4>
                <p className="text-xs text-slate-500">
                  We'll notify you the moment this product drops to or below ₹
                  {targetPrice.toLocaleString("en-IN")}.
                </p>
              </div>
            ) : (
              <form onSubmit={handleCreateAlert} className="space-y-4">
                {alertError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{alertError}</span>
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-baseline mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Target Price (₹)
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Current: ₹{currentPrice.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <input
                    type="number"
                    max={currentPrice - 1}
                    min={Math.round(currentPrice * 0.3)}
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-teal-500 outline-hidden"
                    required
                  />
                  <span className="text-[11px] text-teal-600 dark:text-teal-400 mt-1 block">
                    Target is{" "}
                    {currentPrice > targetPrice
                      ? Math.round(((currentPrice - targetPrice) / currentPrice) * 100)
                      : 0}
                    % below current selling price
                  </span>
                </div>

                {/* Safe Auto-Buy Policy Box */}
                <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Safe Agentic Purchase (Auto-Buy)
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoBuyEnabled}
                        onChange={(e) => setAutoBuyEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-teal-600"></div>
                    </label>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    Automatically places an order when price drops to or below ₹
                    {targetPrice.toLocaleString("en-IN")}. Requires your explicit authorization policy.
                  </p>

                  {autoBuyEnabled && (
                    <div className="space-y-2 pt-2 border-t border-indigo-100 dark:border-indigo-900/50">
                      <div className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          id="autoBuyConsent"
                          checked={userConsent}
                          onChange={(e) => setUserConsent(e.target.checked)}
                          className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
                          required
                        />
                        <label
                          htmlFor="autoBuyConsent"
                          className="text-[11px] text-slate-700 dark:text-slate-300 select-none leading-tight"
                        >
                          I authorize Zosh Bazaar to place 1 order at or below ₹
                          {targetPrice.toLocaleString("en-IN")} via One-Click COD. I can cancel
                          anytime before execution.
                        </label>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                        <Lock className="w-3 h-3" />
                        <span>Security Protected • Full Audit Trail</span>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md transition active:scale-95"
                >
                  Confirm & Activate Alert
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceHistoryWidget;
