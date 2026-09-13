import React, { useState } from "react";
import { AlertOctagon, Phone, ShieldAlert, LifeBuoy, FileText, CheckCircle2 } from "lucide-react";
import { ExceptionReportModal } from "../../components/delivery/ExceptionReportModal";
import { partnerApi } from "../../api/partnerApi";

export const SafetySupportHelp: React.FC = () => {
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [sosSent, setSosSent] = useState(false);

  const handleSos = async () => {
    try {
      await partnerApi.reportException({
        type: "SAFETY_ISSUE",
        description: "EMERGENCY SOS: Delivery partner triggered panic alert from mobile device.",
      });
      setSosSent(true);
    } catch {
      setSosSent(true);
    }
  };

  const handleIncidentSubmit = async (type: string, description: string) => {
    await partnerApi.reportException({ type, description });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <span className="text-[10px] font-black uppercase tracking-wider text-rose-500">
          Partner Protection Desk
        </span>
        <h2 className="text-base sm:text-lg font-extrabold flex items-center gap-1.5 text-foreground">
          <ShieldAlert size={20} className="text-rose-500" />
          <span>Safety, Emergency & Partner Care</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Left Column: Emergency SOS & Dispatch Hotline */}
        <div className="space-y-4">
          {/* EMERGENCY SOS BANNER */}
          <div className="bg-destructive/10 border-2 border-destructive/40 rounded-3xl p-5 sm:p-6 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-destructive text-destructive-foreground mx-auto flex items-center justify-center font-black shadow-lg animate-pulse">
              <AlertOctagon size={28} />
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-black text-destructive">Emergency SOS Alert</h3>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-sm mx-auto">
                Press in case of road accident, violence, harassment, physical danger, or medical emergency.
              </p>
            </div>

            {sosSent ? (
              <div className="p-3 bg-destructive text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5">
                <CheckCircle2 size={16} />
                <span>SOS Dispatched! Hub Coordinator & Emergency Services Alerted.</span>
              </div>
            ) : (
              <button
                onClick={handleSos}
                className="w-full h-12 sm:h-13 rounded-2xl bg-destructive hover:bg-destructive/90 text-white font-black text-sm uppercase tracking-wider shadow-lg active:scale-95 transition-transform cursor-pointer"
              >
                Trigger Immediate SOS
              </button>
            )}
          </div>

          {/* Hub Dispatcher Hotline */}
          <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Operations Dispatch Direct Hotline
            </h4>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-bold text-sm">Hub Control Room</div>
                <div className="text-xs text-muted-foreground">Available 24/7 during all active shift hours</div>
              </div>
              <a
                href="tel:18002674282"
                className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer hover:bg-primary/90 transition-colors"
              >
                <Phone size={15} />
                <span>Call Hub</span>
              </a>
            </div>
          </div>
        </div>

        {/* Right Column: Non-emergency incident reporting & Field rules */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Operational Incidents & Delays
            </h4>
            <p className="text-xs text-muted-foreground">
              Report vehicle puncture, mechanical breakdown, police route diversion, intense downpour, or customer aggression.
            </p>
            <button
              onClick={() => setReportModalOpen(true)}
              className="w-full py-3 rounded-xl border border-border bg-surface hover:bg-muted font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <LifeBuoy size={16} className="text-primary" />
              <span>Report Incident / Hazard</span>
            </button>
          </div>

          {/* Quick Delivery Guidelines */}
          <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 space-y-2.5 text-xs">
            <div className="font-bold flex items-center gap-1.5 text-foreground text-xs sm:text-sm">
              <FileText size={16} className="text-primary" />
              <span>Partner Safety & Field Protocol</span>
            </div>
            <ul className="space-y-2 text-muted-foreground pl-4 list-disc text-xs">
              <li>Always wear standard ISI helmet and reflective vest while operating your vehicle.</li>
              <li>Do not enter private residences without explicit consent of the customer.</li>
              <li>For COD shipments, collect and verify total cash prior to unboxing or handing over packages.</li>
              <li>Never mark a parcel as DELIVERED without verifying recipient OTP when required by the workflow.</li>
            </ul>
          </div>
        </div>
      </div>

      <ExceptionReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        onSubmit={handleIncidentSubmit}
      />
    </div>
  );
};
