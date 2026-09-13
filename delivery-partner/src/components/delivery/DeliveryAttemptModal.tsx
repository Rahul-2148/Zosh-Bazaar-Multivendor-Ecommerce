import React, { useState } from "react";
import { X, AlertTriangle, Send } from "lucide-react";

interface DeliveryAttemptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, notes: string) => Promise<void>;
}

const FAILURE_REASONS = [
  { id: "CUSTOMER_UNAVAILABLE", label: "Customer Unavailable / Door Locked" },
  { id: "PHONE_UNREACHABLE", label: "Phone Switched Off / No Answer" },
  { id: "WRONG_ADDRESS", label: "Address Incomplete or Incorrect" },
  { id: "CUSTOMER_REFUSED", label: "Customer Refused Delivery / COD" },
  { id: "ACCESS_ISSUE", label: "Gated Community / Entry Denied" },
  { id: "PACKAGE_DAMAGED", label: "Package Damaged During Transit" },
  { id: "SAFETY_ISSUE", label: "Hazard / Aggressive Animal / Weather" },
  { id: "OTHER", label: "Other Operational Issue" },
];

export const DeliveryAttemptModal: React.FC<DeliveryAttemptModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [selectedReason, setSelectedReason] = useState("CUSTOMER_UNAVAILABLE");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      await onSubmit(selectedReason, notes);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to record attempt";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-card rounded-t-3xl sm:rounded-3xl border border-border flex flex-col p-5 pb-safe pb-6 sm:pb-5 shadow-2xl animate-in slide-in-from-bottom-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center font-bold">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold leading-tight">Unable to Deliver</h3>
              <p className="text-[11px] text-muted-foreground">Select structured attempt failure reason</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:bg-muted">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-2 my-2 max-h-[40vh] overflow-y-auto pr-1">
          {FAILURE_REASONS.map((r) => (
            <label
              key={r.id}
              className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                selectedReason === r.id
                  ? "bg-destructive/10 border-destructive/40 text-destructive"
                  : "bg-surface border-border hover:bg-muted text-foreground"
              }`}
            >
              <span>{r.label}</span>
              <input
                type="radio"
                name="failure_reason"
                value={r.id}
                checked={selectedReason === r.id}
                onChange={() => setSelectedReason(r.id)}
                className="accent-destructive"
              />
            </label>
          ))}
        </div>

        <div className="my-2">
          <label className="text-xs font-bold text-muted-foreground block mb-1">
            Driver Operational Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="E.g. Called customer 3 times, guard said resident out of town..."
            rows={2}
            className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs focus:ring-2 focus:ring-destructive focus:outline-hidden"
          />
        </div>

        {errorMsg && (
          <div className="my-1.5 p-2 rounded-xl bg-destructive/10 text-destructive text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full mt-2 h-12 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground font-black text-xs flex items-center justify-center gap-2 shadow-md active:scale-98 transition-transform"
        >
          <Send size={15} />
          <span>{loading ? "Submitting..." : "Submit Delivery Attempt Failure"}</span>
        </button>
      </div>
    </div>
  );
};
