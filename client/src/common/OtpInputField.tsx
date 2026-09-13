import React, { useRef, useState, useEffect } from "react";
import { CircularProgress } from "@mui/material";

interface OtpInputFieldProps {
  length?: number;
  value: string;
  onChange: (otp: string) => void;
  onComplete?: (otp: string) => void;
  onResend?: () => Promise<void>;
  initialCooldown?: number; // seconds
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

  // Split string into array of digits safely
  const safeValue = typeof value === "string" ? value : "";
  const digits = Array.from({ length }, (_, i) => safeValue[i] || "");

  // Sync cooldown only when initialCooldown prop changes
  const prevInitialCooldownRef = useRef(initialCooldown);
  useEffect(() => {
    if (prevInitialCooldownRef.current !== initialCooldown) {
      prevInitialCooldownRef.current = initialCooldown;
      setCooldown(initialCooldown);
    }
  }, [initialCooldown]);

  // Countdown timer effect
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // WebOTP API auto-read on supported devices (Android Chrome etc.)
  useEffect(() => {
    if (!("OTPCredential" in window)) return;

    const ac = new AbortController();
    navigator.credentials
      ?.get({
        otp: { transport: ["sms"] },
        signal: ac.signal,
      } as any)
      .then((otpCredential: any) => {
        if (otpCredential && otpCredential.code) {
          const rawCode = otpCredential.code.replace(/\D/g, "").slice(0, length);
          if (rawCode.length === length) {
            onChange(rawCode);
            onComplete?.(rawCode);
          }
        }
      })
      .catch(() => {
        // User aborted or unsupported, continue normal manual entry
      });

    return () => {
      ac.abort();
    };
  }, [length, onChange, onComplete]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const rawVal = e.target.value.replace(/\D/g, "");
    if (!rawVal) {
      // Clear current digit
      const nextArr = [...digits];
      nextArr[idx] = "";
      const updated = nextArr.join("");
      onChange(updated);
      return;
    }

    // Handle single or multiple digit entry
    const entered = rawVal[rawVal.length - 1]; // take the newest digit
    const nextArr = [...digits];
    nextArr[idx] = entered;
    const updated = nextArr.join("");
    onChange(updated);

    // Auto-advance to next box
    if (idx < length - 1) {
      inputsRef.current[idx + 1]?.focus();
    }

    if (updated.length === length && !updated.includes(" ")) {
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
      {/* 6 Digit Box Matrix */}
      <div className="flex items-center justify-between gap-2 sm:gap-3">
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
            className={`w-11 h-13 sm:w-13 sm:h-15 text-center text-xl sm:text-2xl font-bold rounded-xl transition-all duration-200 outline-hidden ${
              digit
                ? "bg-primary/10 text-primary border-2 border-primary shadow-sm"
                : "bg-muted text-foreground border border-input focus:bg-card focus:border-primary focus:ring-4 focus:ring-primary/20"
            }`}
          />
        ))}
      </div>

      {/* Resend & Cooldown Footer */}
      {onResend && (
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 px-1">
          <span>Didn't receive code?</span>
          {cooldown > 0 ? (
            <span className="font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
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
