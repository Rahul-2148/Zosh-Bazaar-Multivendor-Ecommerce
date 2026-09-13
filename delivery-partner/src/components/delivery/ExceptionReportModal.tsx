import React, { useState } from "react";
import { X, AlertOctagon, Send } from "lucide-react";

interface ExceptionReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (type: string, description: string) => Promise<void>;
}

const INCIDENT_TYPES = [
  { id: "VEHICLE_ISSUE", label: "Vehicle Breakdown / Puncture / Battery Low" },
  { id: "ROUTE_DEVIATION", label: "Road Blocked / Waterlogging / Protest" },
  { id: "SAFETY_ISSUE", label: "Accident / Aggressive Animal / Personal Safety" },
  { id: "PACKAGE_DAMAGED", label: "Package Damaged / Leakage" },
  { id: "PACKAGE_MISSING", label: "Package Missing in Bag" },
];

export const ExceptionReportModal: React.FC<ExceptionReportModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [selectedType, setSelectedType] = useState("VEHICLE_ISSUE");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!description.trim()) {
      setErrorMsg("Please provide brief details of the incident.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");
      await onSubmit(selectedType, description.trim());
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Report failed";
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
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <AlertOctagon size={18} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold leading-tight">Report Road Incident / Hazard</h3>
              <p className="text-[11px] text-muted-foreground">Alerts logistics operations dispatcher</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:bg-muted">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-2 my-2">
          {INCIDENT_TYPES.map((item) => (
            <label
              key={item.id}
              className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                selectedType === item.id
                  ? "bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400"
                  : "bg-surface border-border hover:bg-muted text-foreground"
              }`}
            >
              <span>{item.label}</span>
              <input
                type="radio"
                name="incident_type"
                value={item.id}
                checked={selectedType === item.id}
                onChange={() => setSelectedType(item.id)}
                className="accent-amber-500"
              />
            </label>
          ))}
        </div>

        <div className="my-2">
          <label className="text-xs font-bold text-muted-foreground block mb-1">
            Incident Description & Location Details
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Explain what happened and what assistance is needed..."
            rows={2}
            className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
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
          className="w-full mt-2 h-12 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md active:scale-98 transition-transform"
        >
          <Send size={15} />
          <span>{loading ? "Sending..." : "Transmit Incident Report to Hub"}</span>
        </button>
      </div>
    </div>
  );
};
