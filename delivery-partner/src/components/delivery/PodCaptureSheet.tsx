import React, { useState, useRef } from "react";
import { X, Camera, CheckCircle2, UserCheck, ShieldCheck } from "lucide-react";
import { SignatureCanvas } from "./SignatureCanvas";

interface PodCaptureSheetProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCustomerName: string;
  onComplete: (pod: {
    recipientName: string;
    relationship: string;
    signatureUrl?: string;
    photoUrl?: string;
  }) => Promise<void>;
}

export const PodCaptureSheet: React.FC<PodCaptureSheetProps> = ({
  isOpen,
  onClose,
  defaultCustomerName,
  onComplete,
}) => {
  const [recipientName, setRecipientName] = useState(defaultCustomerName);
  const [relationship, setRelationship] = useState("SELF");
  const [signatureUrl, setSignatureUrl] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!recipientName.trim()) {
      setErrorMsg("Recipient name is required.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");
      await onComplete({
        recipientName: recipientName.trim(),
        relationship,
        signatureUrl,
        photoUrl,
      });
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to record POD";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-card rounded-t-3xl sm:rounded-3xl border border-border flex flex-col max-h-[92vh] overflow-y-auto p-5 pb-safe pb-6 sm:pb-5 shadow-2xl animate-in slide-in-from-bottom-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold leading-tight">Proof of Delivery (POD)</h3>
              <p className="text-[11px] text-muted-foreground">Verify recipient & record handover proof</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:bg-muted">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3.5 my-2">
          {/* Recipient Details */}
          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1">
              Handed Over To (Name)
            </label>
            <div className="relative">
              <UserCheck size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Name of recipient..."
                className="w-full pl-9 pr-3 py-2 bg-surface border border-border rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1">
              Relationship to Customer
            </label>
            <select
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary focus:outline-hidden"
            >
              <option value="SELF">Self (Account Owner)</option>
              <option value="FAMILY_MEMBER">Family Member</option>
              <option value="NEIGHBOUR">Neighbour</option>
              <option value="SECURITY_GUARD">Security Guard / Building Desk</option>
              <option value="FRONT_DOOR">Safe Drop (Front Door / Porch)</option>
            </select>
          </div>

          {/* Photo Capture */}
          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1">
              Doorstep Photo / Parcel Handover
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoUpload}
            />

            {photoUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-border aspect-video bg-black flex items-center justify-center">
                <img src={photoUrl} alt="POD Proof" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-black/70 text-white text-[10px] font-bold"
                >
                  Retake
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 rounded-2xl border-2 border-dashed border-border bg-surface hover:bg-muted flex flex-col items-center justify-center gap-1 transition-colors"
              >
                <Camera size={22} className="text-primary" />
                <span className="text-xs font-bold">Take Delivery Photo</span>
                <span className="text-[10px] text-muted-foreground">Parcel near doorstep or in customer hands</span>
              </button>
            )}
          </div>

          {/* Recipient Signature */}
          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1">
              Recipient Signature
            </label>
            <SignatureCanvas onSave={setSignatureUrl} />
          </div>
        </div>

        {errorMsg && (
          <div className="my-2 p-2 rounded-xl bg-destructive/10 text-destructive text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full mt-3 h-13 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-transform"
        >
          <CheckCircle2 size={18} />
          <span>{loading ? "Completing..." : "Complete & Finalize Delivery"}</span>
        </button>
      </div>
    </div>
  );
};
