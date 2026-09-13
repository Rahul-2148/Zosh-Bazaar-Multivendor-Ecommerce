import React, { useState, useEffect, useRef } from "react";
import { X, Scan, Camera, Keyboard, AlertCircle, CheckCircle } from "lucide-react";

interface PackageScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  expectedBarcode: string;
  onScanSuccess: (barcode: string) => void;
}

export const PackageScanModal: React.FC<PackageScanModalProps> = ({
  isOpen,
  onClose,
  expectedBarcode,
  onScanSuccess,
}) => {
  const [manualBarcode, setManualBarcode] = useState("");
  const [useCamera, setUseCamera] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [validationState, setValidationState] = useState<{
    status: "idle" | "success" | "error";
    message: string;
  }>({ status: "idle", message: "" });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setValidationState({ status: "idle", message: "" });
      return;
    }

    if (useCamera) {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, useCamera]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } else {
        setCameraError("Camera device not accessible in this environment.");
        setUseCamera(false);
      }
    } catch {
      setCameraError("Camera permission not granted or device unavailable.");
      setUseCamera(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleVerifyBarcode = (codeToVerify: string) => {
    const cleanCode = codeToVerify.trim().toUpperCase();
    if (!cleanCode) return;

    if (cleanCode === expectedBarcode.toUpperCase() || cleanCode.includes(expectedBarcode.toUpperCase())) {
      setValidationState({
        status: "success",
        message: "Package Verified! Barcode matches stop consignment.",
      });
      setTimeout(() => {
        onScanSuccess(cleanCode);
        onClose();
      }, 700);
    } else {
      setValidationState({
        status: "error",
        message: `MISMATCH! Barcode '${cleanCode}' does not match expected '${expectedBarcode}'.`,
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-card rounded-t-3xl sm:rounded-3xl border border-border flex flex-col max-h-[92vh] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-6">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scan size={18} className="text-primary" />
            <h3 className="text-sm font-bold">Package Barcode Scanner</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:bg-muted"
          >
            <X size={18} />
          </button>
        </div>

        {/* Expected Barcode Banner */}
        <div className="px-4 py-2 bg-surface border-b border-border flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Expected Package:</span>
          <span className="font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
            {expectedBarcode}
          </span>
        </div>

        {/* Viewfinder / Manual Box */}
        <div className="p-4 flex-1 flex flex-col items-center justify-center">
          {useCamera && !cameraError ? (
            <div className="relative w-full aspect-square max-w-[280px] rounded-2xl overflow-hidden bg-black border-2 border-primary/50 shadow-inner flex items-center justify-center">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              {/* Laser animation */}
              <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-0.5 bg-rose-500 shadow-[0_0_12px_#ef4444] animate-pulse" />

              {/* Viewfinder Corners */}
              <div className="absolute inset-4 pointer-events-none border border-white/30 rounded-xl flex flex-col justify-between p-2">
                <div className="flex justify-between">
                  <div className="w-4 h-4 border-t-2 border-l-2 border-primary" />
                  <div className="w-4 h-4 border-t-2 border-r-2 border-primary" />
                </div>
                <div className="flex justify-between">
                  <div className="w-4 h-4 border-b-2 border-l-2 border-primary" />
                  <div className="w-4 h-4 border-b-2 border-r-2 border-primary" />
                </div>
              </div>

              {/* Quick Scan Test Button Overlay */}
              <button
                onClick={() => handleVerifyBarcode(expectedBarcode)}
                className="absolute bottom-3 bg-primary/90 text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow-lg hover:bg-primary"
              >
                Scan Target Package
              </button>
            </div>
          ) : (
            <div className="w-full py-4 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-muted text-muted-foreground mx-auto flex items-center justify-center">
                <Keyboard size={24} />
              </div>
              <p className="text-xs text-muted-foreground">
                Manual Barcode Input Mode
              </p>
            </div>
          )}

          {/* Validation Feedback Banner */}
          {validationState.status !== "idle" && (
            <div
              className={`w-full mt-3 p-3 rounded-xl flex items-start gap-2 text-xs font-bold ${
                validationState.status === "success"
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                  : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
              }`}
            >
              {validationState.status === "success" ? (
                <CheckCircle size={16} className="shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
              )}
              <span>{validationState.message}</span>
            </div>
          )}

          {/* Manual Input Form */}
          <div className="w-full mt-4 space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                placeholder="Or enter barcode manually..."
                className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-surface text-sm focus:outline-hidden focus:ring-2 focus:ring-primary uppercase font-mono"
              />
              <button
                onClick={() => handleVerifyBarcode(manualBarcode)}
                className="px-4 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-bold text-xs"
              >
                Verify
              </button>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => handleVerifyBarcode(expectedBarcode)}
                className="text-xs text-primary font-medium hover:underline"
              >
                Auto-fill Target Barcode
              </button>

              <button
                type="button"
                onClick={() => setUseCamera(!useCamera)}
                className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground"
              >
                {useCamera ? <Keyboard size={13} /> : <Camera size={13} />}
                <span>{useCamera ? "Switch to Manual" : "Switch to Camera"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
