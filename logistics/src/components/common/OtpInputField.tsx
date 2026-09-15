import React, { useRef, useState, useEffect } from "react";
import { CircularProgress } from "@mui/material";

interface OtpInputFieldProps {
  length?: number;
  value: string;
  onChange: (otp: string) => void;
  onComplete?: (otp: string) => void;
  onResend?: () => Promise<void>;
  initialCooldown?: number;
  isLoading?: boolean;
}

export const OtpInputField: React.FC<OtpInputFieldProps> = ({
  length = 6,
  value,
  onChange,
  onComplete,
  onResend,
  initialCooldown = 60,
  isLoading = false,
}) => {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [cooldown, setCooldown] = useState<number>(initialCooldown);
  const [isResending, setIsResending] = useState<boolean>(false);

  const digits = Array.from({ length }, (_, i) => value[i] || "");

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const rawVal = e.target.value.replace(/\D/g, "");
    if (!rawVal) {
      const nextArr = [...digits];
      nextArr[idx] = "";
      const updated = nextArr.join("");
      onChange(updated);
      return;
    }

    const entered = rawVal[rawVal.length - 1];
    const nextArr = [...digits];
    nextArr[idx] = entered;
    const updated = nextArr.join("");
    onChange(updated);

    if (idx < length - 1) {
      inputsRef.current[idx + 1]?.focus();
    }

    if (updated.length === length) {
      onComplete?.(updated);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === "Backspace") {
      if (!digits[idx] && idx > 0) {
        inputsRef.current[idx - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    } else if (e.key === "ArrowRight" && idx < length - 1) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;

    onChange(pasted);
    const targetIdx = Math.min(pasted.length, length - 1);
    inputsRef.current[targetIdx]?.focus();

    if (pasted.length === length) {
      onComplete?.(pasted);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending || !onResend) return;
    try {
      setIsResending(true);
      await onResend();
      setCooldown(60);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 max-w-sm mx-auto">
        {Array.from({ length }).map((_, idx) => (
          <input
            key={idx}
            ref={(el) => {
              inputsRef.current[idx] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digits[idx] || ""}
            disabled={isLoading}
            onChange={(e) => handleInputChange(e, idx)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            onPaste={handlePaste}
            className={`w-11 h-13 text-center font-mono text-xl font-bold rounded-xl border bg-surface text-foreground transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary/40 ${
              digits[idx]
                ? "border-primary shadow-xs"
                : "border-border hover:border-muted-foreground/40"
            }`}
          />
        ))}
      </div>

      {onResend && (
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>Didn't receive code?</span>
          <button
            type="button"
            disabled={cooldown > 0 || isResending || isLoading}
            onClick={handleResend}
            className="text-primary hover:underline font-medium disabled:text-muted-foreground disabled:no-underline disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            {isResending && <CircularProgress size={12} color="inherit" />}
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
          </button>
        </div>
      )}
    </div>
  );
};
