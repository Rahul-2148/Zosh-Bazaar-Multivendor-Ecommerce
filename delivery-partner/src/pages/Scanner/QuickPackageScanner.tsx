import React, { useState } from "react";
import { useActiveRoute } from "../../context/ActiveRouteContext";
import { audioFeedback } from "../../components/common/AudioFeedback";
import { Scan, CheckCircle2, AlertCircle, Trash2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const QuickPackageScanner: React.FC = () => {
  const { route } = useActiveRoute();
  const navigate = useNavigate();

  const [inputCode, setInputCode] = useState("");
  const [scanHistory, setScanHistory] = useState<
    Array<{
      code: string;
      matched: boolean;
      stopIndex?: number;
      customerName?: string;
      timestamp: string;
    }>
  >([]);

  const handleScan = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = inputCode.trim().toUpperCase();
    if (!clean) return;

    const matchedStop = route?.stops?.find(
      (s) =>
        s.trackingNumber?.toUpperCase() === clean ||
        s.shipmentId?.toUpperCase() === clean
    );

    if (matchedStop) {
      audioFeedback.playSuccessChime();
      setScanHistory((prev) => [
        {
          code: clean,
          matched: true,
          stopIndex: matchedStop.stopIndex,
          customerName: matchedStop.customerName,
          timestamp: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
    } else {
      audioFeedback.playErrorBuzz();
      setScanHistory((prev) => [
        {
          code: clean,
          matched: false,
          timestamp: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
    }

    setInputCode("");
  };

  const clearHistory = () => setScanHistory([]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-primary">
            Van & Bag Staging
          </span>
          <h2 className="text-base sm:text-lg font-extrabold flex items-center gap-1.5">
            <Scan size={20} className="text-primary" />
            <span>High-Speed Package Scanner</span>
          </h2>
        </div>

        {scanHistory.length > 0 && (
          <button
            onClick={clearHistory}
            className="p-2 rounded-xl border border-border text-muted-foreground hover:bg-muted text-xs font-bold flex items-center gap-1 cursor-pointer"
            title="Clear Scan List"
          >
            <Trash2 size={14} />
            <span className="hidden sm:inline">Clear List</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Left Column: Barcode Input Form */}
        <div className="lg:col-span-5 space-y-4">
          <form onSubmit={handleScan} className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1.5">
                Scan with Handheld Laser or Camera
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  placeholder="e.g. ZB-TRK-98401..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-border bg-surface text-xs sm:text-sm font-mono font-bold uppercase focus:ring-2 focus:ring-primary focus:outline-hidden"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-black text-xs sm:text-sm shadow-xs cursor-pointer hover:bg-primary/90"
                >
                  Verify
                </button>
              </div>
            </div>

            {/* Manifest Reference Info */}
            {route?.stops && route.stops.length > 0 && (
              <div className="pt-2 border-t border-border/60 text-xs text-muted-foreground flex items-center justify-between">
                <span>Route {route.routeCode}</span>
                <span className="font-bold text-foreground">{route.stops.length} Parcels In Bag</span>
              </div>
            )}
          </form>

          <button
            onClick={() => navigate("/route")}
            className="w-full h-12 rounded-xl bg-surface border border-border hover:bg-muted font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <span>Back to Route Delivery Manifest</span>
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Right Column: Scans Ledger */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold px-1">
            <span className="text-muted-foreground">Session Verification Stream ({scanHistory.length})</span>
            <span className="text-primary font-mono bg-primary/10 px-2 py-0.5 rounded-md">
              {scanHistory.filter((s) => s.matched).length} Verified
            </span>
          </div>

          {scanHistory.length > 0 ? (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {scanHistory.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                    item.matched
                      ? "bg-emerald-500/10 border-emerald-500/30 text-foreground"
                      : "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {item.matched ? (
                      <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                    ) : (
                      <AlertCircle size={18} className="text-rose-500 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="font-mono font-bold leading-tight truncate">{item.code}</div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {item.matched
                          ? `Matches Stop #${item.stopIndex} • ${item.customerName}`
                          : "Package Not In Route"}
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] text-muted-foreground font-mono shrink-0 ml-2">
                    {item.timestamp}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center bg-card border border-border rounded-2xl space-y-2 text-muted-foreground">
              <Scan size={36} className="mx-auto text-muted-foreground/50 mb-1" />
              <p className="text-xs sm:text-sm font-semibold text-foreground">No parcels scanned yet</p>
              <p className="text-[11px] sm:text-xs">Scan barcodes with handheld or camera to verify manifest before departure.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
