import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useActiveRoute } from "../../context/ActiveRouteContext";
import { StatusPill } from "../../components/common/StatusPill";
import { MiniMapLeaflet } from "../../components/navigation/MiniMapLeaflet";
import { PackageScanModal } from "../../components/delivery/PackageScanModal";
import { OtpInputModal } from "../../components/delivery/OtpInputModal";
import { CodCollectionModal } from "../../components/delivery/CodCollectionModal";
import { PodCaptureSheet } from "../../components/delivery/PodCaptureSheet";
import { DeliveryAttemptModal } from "../../components/delivery/DeliveryAttemptModal";
import { ExceptionReportModal } from "../../components/delivery/ExceptionReportModal";
import { partnerApi } from "../../api/partnerApi";
import {
  ArrowLeft,
  Phone,
  Navigation,
  MapPin,
  CheckCircle2,
  Scan,
  ShieldCheck,
  IndianRupee,
  Camera,
  AlertTriangle,
  AlertOctagon,
  Package,
} from "lucide-react";

export const ActiveDeliveryMode: React.FC = () => {
  const { stopId } = useParams<{ stopId: string }>();
  const navigate = useNavigate();
  const {
    route,
    arriveAtStop,
    scanPackage,
    verifyOtp,
    collectPayment,
    completeDelivery,
    failDelivery,
  } = useActiveRoute();

  // Modals state
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [codModalOpen, setCodModalOpen] = useState(false);
  const [podSheetOpen, setPodSheetOpen] = useState(false);
  const [failModalOpen, setFailModalOpen] = useState(false);
  const [incidentModalOpen, setIncidentModalOpen] = useState(false);

  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Find targeted stop
  const stop = useMemo(() => {
    if (!route?.stops || !stopId) return null;
    return route.stops.find((s) => s._id === stopId) || null;
  }, [route?.stops, stopId]);

  if (!stop) {
    return (
      <div className="p-6 text-center space-y-3">
        <p className="text-sm font-semibold text-muted-foreground">Stop details not found.</p>
        <button
          onClick={() => navigate("/route")}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs"
        >
          Return to Route
        </button>
      </div>
    );
  }

  const isArrived = stop.status === "ARRIVED" || stop.status === "DELIVERED";
  const isScanned = !!stop.isPackageScanned;
  const isOtpDone = !stop.otpRequired || !!stop.otpVerified;
  const isCodDone = stop.paymentType !== "COD" || !!stop.codCollected;
  const isDelivered = stop.status === "DELIVERED";
  const isFailed = stop.status === "FAILED";

  const handleArrive = async () => {
    try {
      await arriveAtStop(stop._id);
      setFeedbackBanner({ type: "success", message: "Arrival recorded. Proceed to scan package." });
    } catch (err: unknown) {
      setFeedbackBanner({
        type: "error",
        message: err instanceof Error ? err.message : "Arrival failed",
      });
    }
  };

  const handleScanSuccess = () => {
    setFeedbackBanner({ type: "success", message: "Package scanned & verified!" });
  };

  const handleOtpSuccess = () => {
    setFeedbackBanner({ type: "success", message: "Customer OTP verified successfully!" });
  };

  const handlePaymentSuccess = (amount: number) => {
    setFeedbackBanner({ type: "success", message: `₹${amount} payment collected successfully!` });
  };

  const handleCompletePod = async (podData: {
    recipientName: string;
    relationship: string;
    signatureUrl?: string;
    photoUrl?: string;
  }) => {
    try {
      const res = await completeDelivery(stop._id, {
        ...podData,
        location: stop.location,
      });

      if (res.success) {
        setFeedbackBanner({
          type: "success",
          message: `Delivery complete! Earned ₹${res.earnedAmount || 60}.`,
        });

        // Navigate to next stop or summary after brief celebration
        setTimeout(() => {
          navigate("/route");
        }, 1200);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to complete delivery");
    }
  };

  const handleFailSubmit = async (reason: string, notes: string) => {
    try {
      await failDelivery(stop._id, { reason, notes });
      setFeedbackBanner({
        type: "error",
        message: "Attempt failure logged. Moving to next stop.",
      });
      setTimeout(() => navigate("/route"), 1200);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to submit attempt");
    }
  };

  const handleIncidentSubmit = async (type: string, description: string) => {
    try {
      await partnerApi.reportException({
        type,
        description,
        routeId: route?._id,
        stopIndex: stop.stopIndex,
      });
      setFeedbackBanner({ type: "success", message: "Incident alert dispatched to Hub." });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Report failed");
    }
  };

  // Helper for the Primary Dynamic Action Button
  const renderActionDock = () => {
    if (isDelivered) {
      return (
        <div className="space-y-2">
          <div className="py-2 text-center text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            ✓ Stop Completed & Handover Proof Recorded
          </div>
          <button
            onClick={() => navigate("/route")}
            className="w-full h-12 sm:h-13 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-md active:scale-98 transition-transform"
          >
            <span>View Route Manifest</span>
            <ArrowLeft size={16} className="rotate-180" />
          </button>
        </div>
      );
    }

    if (!isArrived) {
      return (
        <div className="flex flex-col sm:flex-row gap-2">
          {stop.location?.lat && stop.location?.lng && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${stop.location.lat},${stop.location.lng}`}
              target="_blank"
              rel="noreferrer"
              className="h-12 sm:h-13 px-4 rounded-2xl bg-surface border border-border text-foreground font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs hover:bg-muted active:scale-98 transition-transform"
            >
              <Navigation size={16} className="text-primary" />
              <span>Navigate in Maps</span>
            </a>
          )}
          <button
            onClick={handleArrive}
            className="flex-1 h-12 sm:h-13 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-transform"
          >
            <CheckCircle2 size={18} />
            <span>I Have Arrived</span>
          </button>
        </div>
      );
    }

    if (!isScanned) {
      return (
        <button
          onClick={() => setScanModalOpen(true)}
          className="w-full h-12 sm:h-13 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-transform"
        >
          <Scan size={18} />
          <span>Scan Package Barcode ({stop.packagesCount || 1} Expected)</span>
        </button>
      );
    }

    if (!isCodDone) {
      return (
        <button
          onClick={() => setCodModalOpen(true)}
          className="w-full h-12 sm:h-13 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-transform"
        >
          <IndianRupee size={18} />
          <span>Collect ₹{stop.codAmount} Cash on Delivery</span>
        </button>
      );
    }

    if (!isOtpDone) {
      return (
        <button
          onClick={() => setOtpModalOpen(true)}
          className="w-full h-12 sm:h-13 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-transform"
        >
          <ShieldCheck size={18} />
          <span>Enter Customer Delivery OTP</span>
        </button>
      );
    }

    return (
      <button
        onClick={() => setPodSheetOpen(true)}
        className="w-full h-12 sm:h-13 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-transform"
      >
        <Camera size={18} />
        <span>Record POD & Complete Delivery</span>
      </button>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-background pb-24 lg:pb-8">
      {/* Top Sticky Navigation Bar */}
      <div className="sticky top-0 z-30 bg-card/95 backdrop-blur-md border-b border-border px-3 sm:px-6 py-2.5 flex items-center justify-between shadow-xs mb-3 sm:mb-5">
        <button
          onClick={() => navigate("/route")}
          className="p-1.5 -ml-1 rounded-xl text-muted-foreground hover:bg-muted transition-colors flex items-center gap-1 text-xs font-bold"
        >
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">Back to Route</span>
        </button>

        <div className="text-center">
          <span className="text-[10px] font-black uppercase tracking-wider text-primary">
            STOP #{stop.stopIndex}
          </span>
          <div className="text-xs sm:text-sm font-extrabold truncate max-w-[180px] sm:max-w-none">
            {stop.trackingNumber || stop.shipmentId}
          </div>
        </div>

        <StatusPill status={stop.status} size="sm" />
      </div>

      {/* Main Execution View: Responsive 2-Column on Desktop */}
      <div className="space-y-4">
        {/* Feedback Alert */}
        {feedbackBanner && (
          <div
            className={`p-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-between shadow-xs ${
              feedbackBanner.type === "success"
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
            }`}
          >
            <span>{feedbackBanner.message}</span>
            <button onClick={() => setFeedbackBanner(null)} className="text-current opacity-70 hover:opacity-100">
              ✕
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
          {/* LEFT COLUMN: CUSTOMER, ADDRESS & MAP PREVIEW */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-card border border-border rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Customer Recipient
                  </span>
                  <h2 className="text-lg sm:text-xl font-black text-foreground leading-tight truncate">
                    {stop.customerName}
                  </h2>
                  <span className="text-xs text-muted-foreground font-mono">
                    {stop.trackingNumber || stop.shipmentId}
                  </span>
                </div>

                {stop.customerPhone && (
                  <a
                    href={`tel:${stop.customerPhone}`}
                    className="px-3 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    <Phone size={14} />
                    <span>Call</span>
                  </a>
                )}
              </div>

              <div className="p-3 rounded-2xl bg-surface border border-border/70 text-xs sm:text-sm space-y-1.5">
                <div className="flex items-start gap-1.5">
                  <MapPin size={15} className="shrink-0 mt-0.5 text-primary" />
                  <span className="font-semibold leading-relaxed">{stop.address}</span>
                </div>
                {stop.customerInstructions && (
                  <div className="pt-1 text-xs text-amber-600 dark:text-amber-400 font-bold">
                    ⚠️ Note: {stop.customerInstructions}
                  </div>
                )}
              </div>

              {/* MiniMap Preview */}
              {stop.location?.lat && stop.location?.lng && (
                <div className="rounded-2xl overflow-hidden border border-border">
                  <MiniMapLeaflet
                    lat={stop.location.lat}
                    lng={stop.location.lng}
                    title={`Stop #${stop.stopIndex} • ${stop.customerName}`}
                  />
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: HANDOVER CHECKLIST & EXECUTION WORKSPACE */}
          <div className="lg:col-span-7 space-y-4">
            {/* Checklist Container */}
            <div className="bg-card border border-border rounded-3xl p-4 sm:p-5 shadow-xs space-y-3.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Handover Verification Checklist
              </h4>

              {/* Step 1: Arrive */}
              <div
                className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                  isArrived ? "bg-emerald-500/10 border-emerald-500/30" : "bg-surface border-border"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                      isArrived ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isArrived ? "✓" : "1"}
                  </div>
                  <div>
                    <h5 className="text-xs sm:text-sm font-bold leading-tight">Step 1: Arrived at Destination</h5>
                    <p className="text-[11px] text-muted-foreground">Confirm parked safely at delivery site</p>
                  </div>
                </div>

                {!isArrived && (
                  <button
                    onClick={handleArrive}
                    className="px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground font-black text-xs shadow-xs active:scale-95 transition-transform"
                  >
                    Arrived
                  </button>
                )}
              </div>

              {/* Step 2: Package Scanning */}
              <div
                className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                  isScanned ? "bg-emerald-500/10 border-emerald-500/30" : "bg-surface border-border"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                      isScanned ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isScanned ? "✓" : "2"}
                  </div>
                  <div>
                    <h5 className="text-xs sm:text-sm font-bold leading-tight">Step 2: Scan Parcel Barcode</h5>
                    <p className="text-[11px] text-muted-foreground">
                      {isScanned ? `Verified (${stop.scannedBarcode || stop.trackingNumber})` : "Match barcode before delivery"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setScanModalOpen(true)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 shadow-xs transition-colors ${
                    isScanned
                      ? "bg-surface border border-border text-foreground hover:bg-muted"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  <Scan size={14} />
                  <span>{isScanned ? "Rescan" : "Scan"}</span>
                </button>
              </div>

              {/* Step 3: Payment / OTP */}
              {stop.paymentType === "COD" && (
                <div
                  className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                    isCodDone ? "bg-emerald-500/10 border-emerald-500/30" : "bg-surface border-border"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                        isCodDone ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                      }`}
                    >
                      {isCodDone ? "✓" : "₹"}
                    </div>
                    <div>
                      <h5 className="text-xs sm:text-sm font-bold leading-tight">Cash on Delivery (COD)</h5>
                      <p className="text-[11px] text-muted-foreground font-semibold">
                        {isCodDone ? `₹${stop.codAmount} Collected` : `Collect ₹${stop.codAmount} Cash/UPI`}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setCodModalOpen(true)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 shadow-xs transition-colors ${
                      isCodDone
                        ? "bg-surface border border-border text-foreground hover:bg-muted"
                        : "bg-amber-600 text-white hover:bg-amber-700"
                    }`}
                  >
                    <IndianRupee size={14} />
                    <span>{isCodDone ? "Edit" : "Collect"}</span>
                  </button>
                </div>
              )}

              {stop.otpRequired && (
                <div
                  className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                    isOtpDone ? "bg-emerald-500/10 border-emerald-500/30" : "bg-surface border-border"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                        isOtpDone ? "bg-emerald-500 text-white" : "bg-blue-500 text-white"
                      }`}
                    >
                      {isOtpDone ? "✓" : "OTP"}
                    </div>
                    <div>
                      <h5 className="text-xs sm:text-sm font-bold leading-tight">Delivery OTP Verification</h5>
                      <p className="text-[11px] text-muted-foreground">
                        {isOtpDone ? "Customer OTP Verified" : "Customer must share 4-digit code"}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setOtpModalOpen(true)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 shadow-xs transition-colors ${
                      isOtpDone
                        ? "bg-surface border border-border text-foreground hover:bg-muted"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    <ShieldCheck size={14} />
                    <span>{isOtpDone ? "Verified" : "Enter OTP"}</span>
                  </button>
                </div>
              )}

              {/* Desktop-Only Embedded Primary Action Dock */}
              <div className="hidden lg:block pt-3 border-t border-border/80">
                {renderActionDock()}
              </div>
            </div>

            {/* Secondary Operational Buttons: Fail or Hazard */}
            {!isDelivered && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => setFailModalOpen(true)}
                  className="py-3 px-3 rounded-2xl border border-destructive/30 bg-destructive/5 hover:bg-destructive/10 text-destructive font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <AlertTriangle size={15} />
                  <span>Unable to Deliver</span>
                </button>

                <button
                  onClick={() => setIncidentModalOpen(true)}
                  className="py-3 px-3 rounded-2xl border border-border bg-card hover:bg-muted font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <AlertOctagon size={15} className="text-amber-500" />
                  <span>Report Road Hazard</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile-Only Sticky Bottom Action Dock (< lg) */}
      <div className="block lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border p-3 shadow-lg pb-safe">
        <div className="max-w-lg mx-auto">
          {renderActionDock()}
        </div>
      </div>

      {/* MODALS */}
      <PackageScanModal
        isOpen={scanModalOpen}
        onClose={() => setScanModalOpen(false)}
        expectedBarcode={stop.trackingNumber || stop.shipmentId}
        onScanSuccess={handleScanSuccess}
      />

      <OtpInputModal
        isOpen={otpModalOpen}
        onClose={() => setOtpModalOpen(false)}
        expectedOtp={stop.otp}
        onVerifySuccess={handleOtpSuccess}
        onVerifyOtp={(otp) => verifyOtp(stop._id, otp)}
      />

      <CodCollectionModal
        isOpen={codModalOpen}
        onClose={() => setCodModalOpen(false)}
        expectedAmount={stop.codAmount}
        onPaymentSuccess={handlePaymentSuccess}
        onCollectPayment={(amt, method) => collectPayment(stop._id, amt, method)}
      />

      <PodCaptureSheet
        isOpen={podSheetOpen}
        onClose={() => setPodSheetOpen(false)}
        defaultCustomerName={stop.customerName}
        onComplete={handleCompletePod}
      />

      <DeliveryAttemptModal
        isOpen={failModalOpen}
        onClose={() => setFailModalOpen(false)}
        onSubmit={handleFailSubmit}
      />

      <ExceptionReportModal
        isOpen={incidentModalOpen}
        onClose={() => setIncidentModalOpen(false)}
        onSubmit={handleIncidentSubmit}
      />
    </div>
  );
};
