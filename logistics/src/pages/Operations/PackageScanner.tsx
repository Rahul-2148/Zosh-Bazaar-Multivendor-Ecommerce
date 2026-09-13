import React, { useState, useEffect, useRef } from "react";
import {
  Scan,
  CheckCircle2,
  AlertTriangle,
  History,
  Building2,
  Barcode,
  Volume2,
  VolumeX,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { Link } from "react-router-dom";
import { logisticsApi } from "../../services/api";

interface ScanLog {
  id: string;
  barcode: string;
  trackingNumber?: string;
  scanEvent: string;
  timestamp: string;
  status: "SUCCESS" | "FAILED";
  message: string;
  shipmentId?: string;
}

const SCAN_EVENTS = [
  { id: "PICKED", label: "Picked from Warehouse", desc: "Warehouse floor staging" },
  { id: "PACKED", label: "Packed in Corrugated Box", desc: "Sealed and weighed" },
  { id: "SORTED", label: "Sorted to Outbound Bin", desc: "Hub sortation lane" },
  { id: "LOADED", label: "Loaded into Line-Haul Vehicle", desc: "Inter-hub transit container" },
  { id: "DISPATCHED", label: "Dispatched from Hub", desc: "Vehicle departed" },
  { id: "ARRIVED_AT_HUB", label: "Arrived at Destination Hub", desc: "Inbound gate scan" },
  { id: "OUT_FOR_DELIVERY", label: "Assigned & Out for Delivery", desc: "Last-mile courier handoff" },
  { id: "DELIVERED", label: "Delivered to Customer Doorstep", desc: "POD recorded" },
];

export const PackageScanner: React.FC = () => {
  const [barcodeInput, setBarcodeInput] = useState("");
  const [selectedEvent, setSelectedEvent] = useState("SORTED");
  const [hubs, setHubs] = useState<any[]>([]);
  const [selectedHubId, setSelectedHubId] = useState("");
  const [operatorName, setOperatorName] = useState("Operator Desk 01");
  const [isProcessing, setIsProcessing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [scanHistory, setScanHistory] = useState<ScanLog[]>([]);
  const [lastScanResult, setLastScanResult] = useState<{
    success: boolean;
    barcode: string;
    message: string;
    shipment?: any;
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchHubs();
    inputRef.current?.focus();
  }, []);

  const fetchHubs = async () => {
    try {
      const res = await logisticsApi.getHubs({ status: "ACTIVE" });
      if (res.data?.hubs) {
        setHubs(res.data.hubs);
        if (res.data.hubs.length > 0) {
          setSelectedHubId(res.data.hubs[0]._id);
        }
      }
    } catch (err) {
      console.error("Failed to load hubs", err);
    }
  };

  const playFeedbackTone = (success: boolean) => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (success) {
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.08); // D6
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } else {
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.setValueAtTime(200, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch (e) {
      // AudioContext unavailable or restricted
    }
  };

  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanBarcode = barcodeInput.trim();
    if (!cleanBarcode || isProcessing) return;

    setIsProcessing(true);

    try {
      const res = await logisticsApi.processScan({
        barcode: cleanBarcode,
        scanEvent: selectedEvent,
        hubId: selectedHubId || undefined,
        operatorName: operatorName.trim() || "Warehouse Scanner",
      });

      const success = res.data?.success;
      const message = res.data?.message || "Scan processed successfully";
      const shipment = res.data?.shipment;

      setLastScanResult({
        success: true,
        barcode: cleanBarcode,
        message,
        shipment,
      });

      playFeedbackTone(true);

      const log: ScanLog = {
        id: Math.random().toString(36).substring(7),
        barcode: cleanBarcode,
        trackingNumber: shipment?.trackingNumber || cleanBarcode,
        scanEvent: selectedEvent,
        timestamp: new Date().toLocaleTimeString(),
        status: "SUCCESS",
        message,
        shipmentId: shipment?._id,
      };
      setScanHistory((prev) => [log, ...prev.slice(0, 49)]);
      setBarcodeInput("");
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message || "Scan failed: Invalid barcode or state conflict";

      setLastScanResult({
        success: false,
        barcode: cleanBarcode,
        message: errorMsg,
      });

      playFeedbackTone(false);

      const log: ScanLog = {
        id: Math.random().toString(36).substring(7),
        barcode: cleanBarcode,
        scanEvent: selectedEvent,
        timestamp: new Date().toLocaleTimeString(),
        status: "FAILED",
        message: errorMsg,
      };
      setScanHistory((prev) => [log, ...prev.slice(0, 49)]);
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Hub Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              High-Speed Package Scanner
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              OPERATIONAL
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Rapid barcode & QR scanning station for hub sortation, packing, and line-haul dispatch.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-lg border text-sm flex items-center gap-2 transition-colors ${
              soundEnabled
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-card border-border text-muted-foreground hover:text-foreground"
            }`}
            title={soundEnabled ? "Audio chime enabled" : "Audio muted"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden md:inline">{soundEnabled ? "Audio On" : "Audio Muted"}</span>
          </button>

          <div className="flex items-center gap-2 bg-card border border-border px-3 py-2 rounded-lg text-sm shadow-xs">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <select
              value={selectedHubId}
              onChange={(e) => setSelectedHubId(e.target.value)}
              className="bg-transparent border-none text-foreground text-sm focus:outline-none cursor-pointer"
            >
              <option value="">-- No Hub (Direct) --</option>
              {hubs.map((h) => (
                <option key={h._id} value={h._id} className="bg-card text-foreground">
                  {h.hubCode} — {h.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Scanner Input & Event Selection */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Scanner Card */}
          <div className="p-6 bg-card border border-border rounded-xl shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Barcode className="w-4 h-4 text-primary" /> Active Scan Event Trigger
              </label>
              <span className="text-xs text-muted-foreground">Step {SCAN_EVENTS.findIndex((e) => e.id === selectedEvent) + 1} of 8</span>
            </div>

            {/* Event Radio Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SCAN_EVENTS.map((evt) => {
                const isSelected = selectedEvent === evt.id;
                return (
                  <button
                    key={evt.id}
                    type="button"
                    onClick={() => {
                      setSelectedEvent(evt.id);
                      inputRef.current?.focus();
                    }}
                    className={`p-3 text-left rounded-lg border transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary shadow-xs ring-1 ring-primary"
                        : "border-border bg-surface-muted hover:border-border-strong text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div className="text-xs font-bold truncate">{evt.id}</div>
                    <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                      {evt.label}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Scan Form Input */}
            <form onSubmit={handleScanSubmit} className="space-y-3 pt-2">
              <label className="block text-xs font-medium text-muted-foreground">
                Barcode / Tracking Number / Package ID (USB or Optical Scanner Input)
              </label>
              <div className="relative">
                <Scan className="w-6 h-6 absolute left-4 top-1/2 -translate-y-1/2 text-primary animate-pulse" />
                <input
                  ref={inputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="Scan or type e.g. ZBSHP10245..."
                  disabled={isProcessing}
                  className="w-full pl-13 pr-28 py-4 bg-surface-muted border-2 border-primary/50 focus:border-primary focus:ring-4 focus:ring-primary/20 rounded-xl text-lg font-mono text-foreground placeholder:text-muted-foreground transition-all outline-none"
                />
                <button
                  type="submit"
                  disabled={isProcessing || !barcodeInput.trim()}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-semibold transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    "SUBMIT"
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                <span>Auto-detects USB barcode scanner enter key</span>
                <div className="flex items-center gap-2">
                  <span>Operator:</span>
                  <input
                    type="text"
                    value={operatorName}
                    onChange={(e) => setOperatorName(e.target.value)}
                    className="bg-transparent border-b border-border text-foreground font-mono text-xs focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </form>
          </div>

          {/* Real-time Feedback Banner */}
          {lastScanResult && (
            <div
              className={`p-5 rounded-xl border transition-all animate-in fade-in slide-in-from-top-2 ${
                lastScanResult.success
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100"
                  : "bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-100"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {lastScanResult.success ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0" />
                  )}
                  <div>
                    <h3 className="font-semibold text-sm">
                      {lastScanResult.success ? "Scan Verified & Processed" : "Scan Error Encountered"}
                    </h3>
                    <p className="text-xs mt-0.5 opacity-90">{lastScanResult.message}</p>
                    <div className="text-xs font-mono font-bold mt-1.5 opacity-75">
                      Barcode: {lastScanResult.barcode}
                    </div>
                  </div>
                </div>

                {lastScanResult.shipment && (
                  <Link
                    to={`/shipments/${lastScanResult.shipment._id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    View Shipment <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right 5 Cols: Scan Session Audit Log */}
        <div className="lg:col-span-5">
          <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
                <History className="w-4 h-4 text-muted-foreground" />
                Session Scan Activity
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                {scanHistory.length} Scans Logged
              </span>
            </div>

            {scanHistory.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground space-y-2">
                <Scan className="w-10 h-10 mx-auto opacity-30" />
                <p className="text-sm">No scans logged in this session yet.</p>
                <p className="text-xs">Scan any package barcode on the left to start.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {scanHistory.map((scan) => (
                  <div
                    key={scan.id}
                    className="p-3 bg-surface-muted border border-border rounded-lg text-xs space-y-1.5 hover:border-border-strong transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-foreground">
                        {scan.trackingNumber || scan.barcode}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                          scan.status === "SUCCESS"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {scan.scanEvent}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                      <span>{scan.message}</span>
                      <span className="font-mono text-muted-foreground">{scan.timestamp}</span>
                    </div>

                    {scan.shipmentId && (
                      <div className="pt-1">
                        <Link
                          to={`/shipments/${scan.shipmentId}`}
                          className="text-[11px] text-primary hover:underline inline-flex items-center gap-1"
                        >
                          Open Shipment File &rarr;
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
