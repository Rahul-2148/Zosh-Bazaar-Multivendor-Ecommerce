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
    const targetFocus = Math.min(pasted.length, length - 1);
    inputsRef.current[targetFocus]?.focus();

    if (pasted.length === length) {
      onComplete?.(pasted);
    }
  };

  const handleResendClick = async () => {
    if (cooldown > 0 || isResending || !onResend) return;
    setIsResending(true);
    try {
      await onResend();
      setCooldown(60);
    } finally {
      setIsResending(false);
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              inputsRef.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            autoComplete="one-time-code"
            disabled={isLoading}
            value={digit}
            onChange={(e) => handleInputChange(e, i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            onPaste={handlePaste}
            className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl transition-all duration-200 outline-hidden ${
              digit
                ? "bg-primary text-primary-foreground border-2 border-primary shadow-sm"
                : "bg-muted text-foreground border border-input focus:bg-card focus:border-primary focus:ring-4 focus:ring-primary/20"
            }`}
          />
        ))}
      </div>

      {onResend && (
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <span>Didn't receive code?</span>
          {cooldown > 0 ? (
            <span className="font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-md">
              Resend in {formatSeconds(cooldown)}
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResendClick}
              disabled={isResending || isLoading}
              className="font-bold text-primary hover:text-primary/80 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {isResending && <CircularProgress size={12} color="inherit" />}
              <span>Resend OTP</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
