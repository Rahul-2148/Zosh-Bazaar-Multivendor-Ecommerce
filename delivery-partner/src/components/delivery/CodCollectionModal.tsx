import React, { useState } from "react";
import { X, IndianRupee, Banknote, QrCode, CheckCircle2, Calculator } from "lucide-react";

interface CodCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  expectedAmount: number;
  onPaymentSuccess: (amount: number, method: string) => void;
  onCollectPayment: (amount: number, method: string) => Promise<{ success: boolean; message: string }>;
}

export const CodCollectionModal: React.FC<CodCollectionModalProps> = ({
  isOpen,
  onClose,
  expectedAmount,
  onPaymentSuccess,
  onCollectPayment,
}) => {
  const [method, setMethod] = useState<"CASH" | "UPI">("CASH");
  const [receivedAmount, setReceivedAmount] = useState<string>(String(expectedAmount));
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const numReceived = Number(receivedAmount) || 0;
  const changeToReturn = Math.max(0, numReceived - expectedAmount);

  const handleConfirm = async () => {
    if (numReceived < expectedAmount) {
      setErrorMsg(`Amount received cannot be less than required ₹${expectedAmount}`);
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");
      const res = await onCollectPayment(expectedAmount, method);
      if (res.success) {
        onPaymentSuccess(expectedAmount, method);
        onClose();
      } else {
        setErrorMsg(res.message || "Payment collection failed.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Payment error";
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
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <IndianRupee size={18} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold leading-tight">Cash on Delivery (COD)</h3>
              <p className="text-[11px] text-muted-foreground">Collect payment before handing parcel</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:bg-muted">
            <X size={18} />
          </button>
        </div>

        {/* Expected Amount Banner */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-center my-2">
          <span className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
            Total Amount to Collect
          </span>
          <div className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-1 flex items-center justify-center gap-0.5">
            <IndianRupee size={28} />
            <span>{expectedAmount.toLocaleString("en-IN")}</span>
          </div>
        </div>

        {/* Payment Method Switcher */}
        <div className="grid grid-cols-2 gap-2 my-3">
          <button
            type="button"
            onClick={() => setMethod("CASH")}
            className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-bold text-xs transition-colors ${
              method === "CASH"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-surface text-muted-foreground border-border hover:bg-muted"
            }`}
          >
            <Banknote size={16} />
            <span>Cash Collection</span>
          </button>

          <button
            type="button"
            onClick={() => setMethod("UPI")}
            className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-1.5 font-bold text-xs transition-colors ${
              method === "UPI"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-surface text-muted-foreground border-border hover:bg-muted"
            }`}
          >
            <QrCode size={16} />
            <span>UPI / Digital QR</span>
          </button>
        </div>

        {method === "CASH" ? (
          <div className="space-y-3 my-2">
            <div>
              <label className="text-xs font-bold text-muted-foreground flex items-center gap-1 mb-1">
                <Calculator size={13} />
                <span>Cash Received from Customer</span>
              </label>
              <div className="relative">
                <IndianRupee size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="number"
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 bg-surface border border-border rounded-xl font-bold text-base focus:ring-2 focus:ring-primary focus:outline-hidden"
                />
              </div>
            </div>

            {/* Quick cash pills */}
            <div className="flex gap-2 text-xs">
              <button
                type="button"
                onClick={() => setReceivedAmount(String(expectedAmount))}
                className="flex-1 py-1.5 rounded-lg border border-border bg-surface font-semibold hover:bg-muted"
              >
                Exact (₹{expectedAmount})
              </button>
              <button
                type="button"
                onClick={() => setReceivedAmount(String(Math.ceil(expectedAmount / 500) * 500))}
                className="flex-1 py-1.5 rounded-lg border border-border bg-surface font-semibold hover:bg-muted"
              >
                Round ₹{Math.ceil(expectedAmount / 500) * 500}
              </button>
            </div>

            {changeToReturn > 0 && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <span>Change to Return to Customer:</span>
                <span className="text-sm">₹{changeToReturn}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="my-2 p-4 bg-surface rounded-2xl border border-border text-center space-y-2">
            <div className="w-36 h-36 mx-auto bg-white p-2 rounded-xl border border-slate-200 flex items-center justify-center">
              {/* Simulated QR Pattern */}
              <div className="w-full h-full border-2 border-dashed border-slate-800 rounded-lg flex flex-col items-center justify-center text-slate-800 text-[10px] font-mono">
                <QrCode size={48} className="text-slate-900 mb-1" />
                <span>UPI: ZB-PAY@{expectedAmount}</span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Customer can scan using Google Pay, PhonePe, Paytm or any UPI App
            </p>
          </div>
        )}

        {errorMsg && (
          <div className="my-2 p-2 rounded-xl bg-destructive/10 text-destructive text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <button
          onClick={handleConfirm}
          disabled={loading}
          className="w-full mt-2 h-12 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md active:scale-98 transition-transform"
        >
          <CheckCircle2 size={18} />
          <span>{loading ? "Recording..." : `Confirm Collected ₹${expectedAmount}`}</span>
        </button>
      </div>
    </div>
  );
};
