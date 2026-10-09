import React, { useState, useEffect } from "react";
import {
  Typography,
  Divider,
  CircularProgress,
  Alert,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  ExpandMore,
  VerifiedUserOutlined,
  QrCode2Outlined,
  CreditCardOutlined,
  AccountBalanceWalletOutlined,
  AccountBalanceOutlined,
  LocalShippingOutlined,
  CreditScoreOutlined,
  CardGiftcardOutlined,
  FlashOnOutlined,
  LocalOfferOutlined,
} from "@mui/icons-material";
import { Api as api } from "../../../config/Api";
import { UpiPayment } from "./UpiPayment";
import { SavedCards } from "./SavedCards";
import { AddCard } from "./AddCard";
import { WalletPayment } from "./WalletPayment";
import { NetBanking } from "./NetBanking";
import { Emi } from "./Emi";
import { CodPayment } from "./CodPayment";
import { PaymentOffers } from "./PaymentOffers";
import { PaymentSummary } from "./PaymentSummary";
import { SecurityInfo } from "./SecurityInfo";
import { PaymentPending } from "./PaymentPending";
import { PaymentFailure } from "./PaymentFailure";
import { PaymentSuccess } from "./PaymentSuccess";

interface PaymentPageProps {
  orderIds: string[];
  initialAmount: number;
  deliveryAddress?: any;
  onPaymentComplete?: (intent: any) => void;
  onBackToPackages?: () => void;
}

export const PaymentPage: React.FC<PaymentPageProps> = ({
  orderIds,
  initialAmount,
  deliveryAddress,
  onPaymentComplete,
  onBackToPackages,
}) => {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [paymentIntent, setPaymentIntent] = useState<any>(null);
  const [eligibility, setEligibility] = useState<any[]>([]);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [appliedOffer, setAppliedOffer] = useState<any>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [useWalletSplit, setUseWalletSplit] = useState(false);

  // UPI State
  const [selectedUpiApp, setSelectedUpiApp] = useState("gpay");
  const [upiId, setUpiId] = useState("");
  const [showQr, setShowQr] = useState(false);

  // Active accordion section
  const [expandedSection, setExpandedSection] = useState<string | false>("UPI");

  // Terminal UI States: 'IDLE' | 'PENDING' | 'SUCCESS' | 'FAILURE'
  const [uiState, setUiState] = useState<"IDLE" | "PENDING" | "SUCCESS" | "FAILURE">("IDLE");
  const [currentAttempt, setCurrentAttempt] = useState<any>(null);
  const [failureInfo, setFailureInfo] = useState<{ reason?: string; code?: string }>({});

  const jwt = localStorage.getItem("jwt") || "";

  // 1. Initialize Checkout Session (Create/Retrieve PaymentIntent)
  const initializeCheckout = async () => {
    try {
      setLoading(true);
      setError(null);

      // A. Initiate authoritative Payment Intent
      const res = await api.post(
        "/api/v1/payment/checkout/initiate",
        {
          orderIds,
          selectedMethod: "UPI",
          currency: "INR",
        },
        { headers: { Authorization: `Bearer ${jwt}` } }
      );

      const intent = res.data?.paymentIntent;
      setPaymentIntent(intent);

      // B. Fetch Dynamic Payment Eligibility
      const eligRes = await api.get(
        `/api/v1/payment/eligibility?amount=${intent?.amount || initialAmount}`,
        { headers: { Authorization: `Bearer ${jwt}` } }
      );
      setEligibility(eligRes.data?.eligibility || []);

      // B2. Fetch Server-Authoritative Available Methods & Capabilities (Phase 12)
      try {
        const methodsRes = await api.get(
          `/api/v1/payment/methods?amount=${intent?.amount || initialAmount}`,
          { headers: { Authorization: `Bearer ${jwt}` } }
        );
        if (methodsRes.data?.methods) {
          setAvailablePaymentMethods(methodsRes.data.methods);
        }
      } catch (mErr) {
        console.warn("Could not fetch server-authoritative payment methods:", mErr);
      }

      // C. Fetch Active Payment Offers
      const offersRes = await api.get(
        `/api/v1/payment/offers?amount=${intent?.amount || initialAmount}`,
        { headers: { Authorization: `Bearer ${jwt}` } }
      );
      setOffers(offersRes.data?.offers || []);

      // D. Fetch User Wallet Balance
      try {
        const walletRes = await api.get("/api/v1/payment/wallet", {
          headers: { Authorization: `Bearer ${jwt}` },
        });
        setWalletBalance(walletRes.data?.wallet?.availableBalance || 0);
      } catch (wErr) {
        setWalletBalance(0);
      }
    } catch (err: any) {
      console.error("Failed to initialize payment session:", err);
      setError(
        err.response?.data?.message ||
          "Failed to initialize secure payment session. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderIds && orderIds.length > 0) {
      initializeCheckout();
    }
  }, [orderIds.join(",")]);

  // Method Eligibility Helper
  const isMethodEligible = (methodKey: string) => {
    const found = eligibility.find((e) => e.method === methodKey);
    return found ? found.available : true;
  };

  const getMethodIneligibleReason = (methodKey: string) => {
    const found = eligibility.find((e) => e.method === methodKey);
    return found?.displayMessage || "Unavailable for this order value";
  };

  // 2. Submit Authoritative Payment Attempt
  const executePaymentAttempt = async (method: string, payload: any = {}) => {
    if (!paymentIntent?.intentId) return;

    try {
      setProcessing(true);
      setError(null);

      // Generate client idempotency key
      const idempotencyKey = `PAY_ATTEMPT_${paymentIntent.intentId}_${Date.now()}`;

      // Let backend PaymentRoutingService select healthy, prioritized provider
      const requestBody: any = {
        intentId: paymentIntent.intentId,
        method,
        splitWithWallet: useWalletSplit,
        walletAmount: useWalletSplit ? Math.min(walletBalance, paymentIntent.amount) : 0,
        payload,
      };
      if (payload?.forceAdapter) {
        requestBody.adapter = payload.forceAdapter;
      }

      const res = await api.post("/api/v1/payment/checkout/attempt", requestBody, {
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Idempotency-Key": idempotencyKey,
        },
      });

      const attempt = res.data?.attempt;
      setCurrentAttempt(attempt);

      if (attempt?.status === "CAPTURED" || attempt?.status === "SETTLED" || res.data?.intent?.status === "SUCCEEDED") {
        setUiState("SUCCESS");
        if (onPaymentComplete) {
          onPaymentComplete(res.data?.intent || paymentIntent);
        }
      } else if (attempt?.status === "PENDING" || attempt?.status === "INITIATED") {
        // If external link provided, open it
        if (attempt?.actionPayload?.paymentLinkUrl) {
          window.location.href = attempt.actionPayload.paymentLinkUrl;
          return;
        }
        setUiState("PENDING");
      } else {
        setFailureInfo({
          reason: attempt?.failureReason || "Transaction could not be completed.",
          code: attempt?.failureCode || "ATTEMPT_DECLINED",
        });
        setUiState("FAILURE");
      }
    } catch (err: any) {
      console.error("Payment attempt error:", err);
      setFailureInfo({
        reason: err.response?.data?.message || "Payment attempt failed. Please try another method.",
        code: err.response?.data?.code || "SUBMISSION_ERROR",
      });
      setUiState("FAILURE");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <CircularProgress size={42} sx={{ color: "var(--color-primary, #0d9488)" }} />
        <p className="text-sm font-semibold text-muted-foreground animate-pulse">
          Securing payment rails & calculating best offers...
        </p>
      </div>
    );
  }

  // Terminal States Handling
  if (uiState === "PENDING") {
    return (
      <PaymentPending
        intentId={paymentIntent?.intentId}
        attemptId={currentAttempt?.attemptId}
        amount={paymentIntent?.amount || initialAmount}
        method={currentAttempt?.method || "UPI"}
        onSuccess={(updatedIntent) => {
          setUiState("SUCCESS");
          if (onPaymentComplete) onPaymentComplete(updatedIntent);
        }}
        onFailure={(reason) => {
          setFailureInfo({ reason, code: "VERIFICATION_TIMEOUT" });
          setUiState("FAILURE");
        }}
        onCancel={() => setUiState("IDLE")}
      />
    );
  }

  if (uiState === "FAILURE") {
    return (
      <PaymentFailure
        reason={failureInfo.reason}
        errorCode={failureInfo.code}
        attemptId={currentAttempt?.attemptId}
        amount={paymentIntent?.amount || initialAmount}
        onRetry={() => {
          setUiState("IDLE");
          if (currentAttempt?.method) {
            executePaymentAttempt(currentAttempt.method, currentAttempt.actionPayload || {});
          }
        }}
        onChangeMethod={() => setUiState("IDLE")}
      />
    );
  }

  if (uiState === "SUCCESS") {
    return (
      <PaymentSuccess
        intent={paymentIntent}
        orders={orderIds.map((id) => ({ _id: id }))}
      />
    );
  }

  const payableAmount = paymentIntent?.amount || initialAmount;

  return (
    <div className="space-y-6">
      {/* Header Bar - Zepto/Flipkart Inspired */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border/70 gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Typography variant="h6" fontWeight="900" className="text-foreground tracking-tight">
              Payment Options
            </Typography>
            <Chip
              label="100% SECURE"
              size="small"
              color="success"
              variant="outlined"
              icon={<VerifiedUserOutlined />}
              sx={{ fontWeight: 800, fontSize: "10px", height: "22px" }}
            />
          </div>
          {deliveryAddress && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-md">
              Delivering to <strong className="text-foreground">{deliveryAddress.addressType || "Home"}</strong> — {deliveryAddress.address}, {deliveryAddress.city}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[11px] font-semibold text-muted-foreground block">To Pay:</span>
            <span className="text-xl font-black text-primary">
              ₹{payableAmount.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <Alert severity="error" sx={{ borderRadius: "0.75rem", fontSize: "13px" }}>
          {error}
        </Alert>
      )}

      {/* Payment Offers Banner */}
      {offers.length > 0 && (
        <PaymentOffers
          offers={offers}
          selectedOfferCode={appliedOffer?.code}
          onSelectOffer={(o) => setAppliedOffer(o)}
        />
      )}

      {/* Recommended Payments Quick Shelf (Zepto/Flipkart Style) */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
          Recommended Payment
        </span>
        <div
          onClick={() => {
            setExpandedSection("UPI");
            executePaymentAttempt("UPI", { upiApp: "BHIM", vpa: "customer@upi" });
          }}
          className="p-3.5 rounded-2xl border-2 border-primary/40 hover:border-primary bg-primary/5 transition-all flex items-center justify-between cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center font-black text-primary text-xs shadow-xs">
              UPI
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm text-foreground">BHIM UPI / Quick Pay</span>
                <span className="text-[9px] font-black uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                  Fastest
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Single-tap authorization via any installed UPI app</p>
            </div>
          </div>
          <span className="text-xs font-bold text-primary group-hover:translate-x-1 transition-transform">
            Pay ₹{payableAmount.toLocaleString("en-IN")} →
          </span>
        </div>
      </div>

      {(() => {
        const upiConfig = availablePaymentMethods.find((m) => m.type === "UPI");
        const nbConfig = availablePaymentMethods.find((m) => m.type === "NETBANKING");

        return (
          <div className="space-y-3">
            {/* 1. UPI Payment */}
            <Accordion
              expanded={expandedSection === "UPI"}
              onChange={(_, isExp) => setExpandedSection(isExp ? "UPI" : false)}
              className="!rounded-2xl border border-border/80 !shadow-xs overflow-hidden before:hidden"
            >
              <AccordionSummary expandIcon={<ExpandMore />} className="hover:bg-muted/30">
                <div className="flex items-center gap-3 w-full">
                  <QrCode2Outlined className="text-primary" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">UPI (Instant & Zero Fee)</span>
                      <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded">
                        Popular
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Google Pay, PhonePe, Paytm, BHIM or Dynamic QR</p>
                  </div>
                </div>
              </AccordionSummary>
              <AccordionDetails className="pt-0 pb-4 border-t border-border/50">
                <UpiPayment
                  payableAmount={payableAmount}
                  selectedUpiApp={selectedUpiApp}
                  onSelectUpiApp={(appId) => setSelectedUpiApp(appId)}
                  upiId={upiId}
                  onChangeUpiId={(id) => setUpiId(id)}
                  showQr={showQr}
                  onToggleQr={() => setShowQr(!showQr)}
                  availableApps={upiConfig?.apps}
                  qrPayload={
                    paymentIntent?.intentId
                      ? `upi://pay?pa=zoshbazaar@icici&pn=ZoshBazaar&am=${payableAmount}&tr=${paymentIntent.intentId}&cu=INR`
                      : undefined
                  }
                  onConfirmPayment={() =>
                    executePaymentAttempt("UPI", { upiApp: selectedUpiApp, vpa: upiId })
                  }
                  loading={processing}
                />
              </AccordionDetails>
            </Accordion>

        {/* 2. Credit & Debit Cards */}
        <Accordion
          expanded={expandedSection === "CARDS"}
          onChange={(_, isExp) => setExpandedSection(isExp ? "CARDS" : false)}
          className="!rounded-2xl border border-border/80 !shadow-xs overflow-hidden before:hidden"
        >
          <AccordionSummary expandIcon={<ExpandMore />} className="hover:bg-muted/30">
            <div className="flex items-center gap-3 w-full">
              <CreditCardOutlined className="text-primary" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-foreground">Credit & Debit Cards</span>
                  <span className="text-[10px] font-bold text-muted-foreground">Visa, Mastercard, RuPay</span>
                </div>
                <p className="text-xs text-muted-foreground">Save & secure cards with 100% RBI compliant tokenization</p>
              </div>
            </div>
          </AccordionSummary>
          <AccordionDetails className="pt-0 pb-4 border-t border-border/50 space-y-4">
            <SavedCards
              cards={[]}
              selectedCardId={null}
              onSelectCard={() => {}}
              cvv=""
              onChangeCvv={() => {}}
              payableAmount={payableAmount}
              onPayWithCard={() => {}}
              loading={processing}
              onOpenAddNew={() => {}}
            />
            <Divider />
            <AddCard
              onSaveCard={async (card) => {
                await executePaymentAttempt("CARD", card);
              }}
              onCancel={() => {}}
              loading={processing}
            />
          </AccordionDetails>
        </Accordion>

        {/* 3. Zosh Wallet */}
        <Accordion
          expanded={expandedSection === "WALLET"}
          onChange={(_, isExp) => setExpandedSection(isExp ? "WALLET" : false)}
          className="!rounded-2xl border border-border/80 !shadow-xs overflow-hidden before:hidden"
        >
          <AccordionSummary expandIcon={<ExpandMore />} className="hover:bg-muted/30">
            <div className="flex items-center gap-3 w-full">
              <AccountBalanceWalletOutlined className="text-primary" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-foreground">Zosh Wallet & Split Pay</span>
                  <span className="text-[10px] font-black uppercase text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                    Ledger Backed
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Available: ₹{walletBalance.toLocaleString("en-IN")} • Instant checkout
                </p>
              </div>
            </div>
          </AccordionSummary>
          <AccordionDetails className="pt-0 pb-4 border-t border-border/50">
            <WalletPayment
              walletBalance={walletBalance}
              payableAmount={payableAmount}
              useWallet={walletBalance >= payableAmount}
              onToggleUseWallet={() => executePaymentAttempt("WALLET", {})}
              splitWithWallet={useWalletSplit}
              onToggleSplit={(split: boolean) => setUseWalletSplit(split)}
            />
          </AccordionDetails>
        </Accordion>

        {/* 4. Net Banking */}
        <Accordion
          expanded={expandedSection === "NETBANKING"}
          onChange={(_, isExp) => setExpandedSection(isExp ? "NETBANKING" : false)}
          className="!rounded-2xl border border-border/80 !shadow-xs overflow-hidden before:hidden"
        >
          <AccordionSummary expandIcon={<ExpandMore />} className="hover:bg-muted/30">
            <div className="flex items-center gap-3 w-full">
              <AccountBalanceOutlined className="text-primary" />
              <div className="flex-1">
                <span className="font-bold text-sm text-foreground">Net Banking</span>
                <p className="text-xs text-muted-foreground">All Indian retail & corporate banks supported</p>
              </div>
            </div>
          </AccordionSummary>
          <AccordionDetails className="pt-0 pb-4 border-t border-border/50">
            <NetBanking
              popularBanks={
                nbConfig?.popularBanks || [
                  { code: "HDFC", name: "HDFC Bank", popular: true },
                  { code: "ICICI", name: "ICICI Bank", popular: true },
                  { code: "SBI", name: "State Bank of India", popular: true },
                  { code: "AXIS", name: "Axis Bank", popular: true },
                  { code: "KOTAK", name: "Kotak Mahindra Bank", popular: true },
                  { code: "PNB", name: "Punjab National Bank", popular: true },
                ]
              }
              allBanks={
                nbConfig?.allBanks || [
                  { code: "HDFC", name: "HDFC Bank" },
                  { code: "ICICI", name: "ICICI Bank" },
                  { code: "SBI", name: "State Bank of India" },
                  { code: "AXIS", name: "Axis Bank" },
                  { code: "KOTAK", name: "Kotak Mahindra Bank" },
                  { code: "PNB", name: "Punjab National Bank" },
                  { code: "BOB", name: "Bank of Baroda" },
                  { code: "CANARA", name: "Canara Bank" },
                  { code: "UNION", name: "Union Bank of India" },
                  { code: "IDBI", name: "IDBI Bank" },
                  { code: "INDUSIND", name: "IndusInd Bank" },
                  { code: "YES", name: "Yes Bank" },
                  { code: "FEDERAL", name: "Federal Bank" },
                ]
              }
              selectedBankCode={null}
              onSelectBank={(bankCode: string) =>
                executePaymentAttempt("NETBANKING", { bankCode })
              }
            />
          </AccordionDetails>
        </Accordion>

        {/* 5. EMI & Pay Later */}
        <Accordion
          expanded={expandedSection === "EMI"}
          onChange={(_, isExp) => setExpandedSection(isExp ? "EMI" : false)}
          className="!rounded-2xl border border-border/80 !shadow-xs overflow-hidden before:hidden"
        >
          <AccordionSummary expandIcon={<ExpandMore />} className="hover:bg-muted/30">
            <div className="flex items-center gap-3 w-full">
              <CreditScoreOutlined className="text-primary" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-foreground">EMI (Equated Monthly Installments)</span>
                  <span className="text-[10px] font-bold text-emerald-600">No Cost Available</span>
                </div>
                <p className="text-xs text-muted-foreground">Pay in 3, 6, 9 or 12 low monthly installments</p>
              </div>
            </div>
          </AccordionSummary>
          <AccordionDetails className="pt-0 pb-4 border-t border-border/50">
            <Emi
              orderAmount={payableAmount}
              onSelectEmiPlan={(plan) => executePaymentAttempt("EMI", plan)}
              disabled={processing}
            />
          </AccordionDetails>
        </Accordion>

        {/* 6. Cash on Delivery */}
        <Accordion
          expanded={expandedSection === "COD"}
          onChange={(_, isExp) => setExpandedSection(isExp ? "COD" : false)}
          className="!rounded-2xl border border-border/80 !shadow-xs overflow-hidden before:hidden"
        >
          <AccordionSummary expandIcon={<ExpandMore />} className="hover:bg-muted/30">
            <div className="flex items-center gap-3 w-full">
              <LocalShippingOutlined className="text-primary" />
              <div className="flex-1">
                <span className="font-bold text-sm text-foreground">Cash on Delivery (COD)</span>
                <p className="text-xs text-muted-foreground">
                  Pay via Cash or doorstep UPI QR upon delivery
                </p>
              </div>
            </div>
          </AccordionSummary>
          <AccordionDetails className="pt-0 pb-4 border-t border-border/50">
            <CodPayment
              available={isMethodEligible("COD")}
              reasonMessage={getMethodIneligibleReason("COD")}
              payableAmount={payableAmount}
              onConfirmCod={() => executePaymentAttempt("COD", {})}
              disabled={processing}
            />
          </AccordionDetails>
        </Accordion>
      </div>
    );
  })()}

      {/* Security & Regulatory Compliance Footer */}
      <SecurityInfo />
    </div>
  );
};
