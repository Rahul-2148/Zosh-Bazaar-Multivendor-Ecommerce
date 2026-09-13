import React, { useState, useRef, useEffect } from "react";
import { X, ShieldCheck, AlertCircle } from "lucide-react";

interface OtpInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  expectedOtp?: string;
  onVerifySuccess: () => void;
  onVerifyOtp: (otp: string) => Promise<{ success: boolean; message: string }>;
}

export const OtpInputModal: React.FC<OtpInputModalProps> = ({
  isOpen,
  onClose,
  onVerifySuccess,
  onVerifyOtp,
}) => {
  const [digits, setDigits] = useState<string[]>(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setDigits(["", "", "", ""]);
      setErrorMsg("");
      setTimeout(() => inputRefs.current[0]?.focus(), 150);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newDigits = [...digits];
    newDigits[index] = val.slice(-1);
    setDigits(newDigits);
    setErrorMsg("");

    if (val && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async () => {
    const fullOtp = digits.join("");
    if (fullOtp.length < 4) {
      setErrorMsg("Please enter the complete 4-digit code.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");
      const res = await onVerifyOtp(fullOtp);
      if (res.success) {
        onVerifySuccess();
        onClose();
      } else {
        setErrorMsg(res.message || "Invalid OTP code.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Verification error";
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
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold leading-tight">Customer Delivery OTP</h3>
              <p className="text-[11px] text-muted-foreground">Ask recipient for the 4-digit code sent to their phone</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:bg-muted cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* 4 Digit Boxes */}
        <div className="my-5 flex justify-center gap-3">
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => { inputRefs.current[idx] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className="w-13 h-15 text-2xl font-black text-center bg-surface border-2 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-2xl transition-all"
            />
          ))}
        </div>

        {errorMsg && (
          <div className="mb-4 p-2.5 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-xs font-semibold flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
          <span>Enter code received by customer</span>
          <span>Max 5 attempts allowed</span>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || digits.some((d) => !d)}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-extrabold text-sm disabled:opacity-50 shadow-md active:scale-98 transition-transform cursor-pointer"
        >
          {loading ? "Verifying with Server..." : "Verify OTP Code"}
        </button>
      </div>
    </div>
  );
};
