import React, { useEffect, useState } from "react";
import {
  CreditCardOutlined,
  AddOutlined,
  DeleteOutline,
  CheckCircle,
  LockOutlined,
  ReceiptLongOutlined,
  Close,
  AccountBalanceWalletOutlined,
  BoltOutlined,
  ShieldOutlined,
  ArrowUpward,
} from "@mui/icons-material";
import { Api } from "../../../config/Api";
import {
  Button,
  Modal,
  Box,
  TextField,
  Typography,
  IconButton,
  Alert,
  CircularProgress,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import {
  fetchPaymentMethods,
  addPaymentMethod,
  deletePaymentMethod,
  setDefaultPaymentMethod,
  fetchCustomerTransactions,
} from "../../../Redux Toolkit/features/customer/UserSlice";

export const PaymentsView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { paymentMethods, transactions } = useAppSelector((store) => store.user);
  const jwt = localStorage.getItem("jwt") || "";

  const [activeTab, setActiveTab] = useState<"methods" | "transactions" | "wallet">("methods");
  const [modalOpen, setModalOpen] = useState(false);
  const [methodType, setMethodType] = useState<"CARD" | "UPI">("CARD");
  const [loadingAction, setLoadingAction] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Zosh Wallet State
  const [walletData, setWalletData] = useState<any>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [topupModalOpen, setTopupModalOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState<number>(1000);
  const [topupLoading, setTopupLoading] = useState(false);
  const [topupError, setTopupError] = useState<string | null>(null);

  // Form State
  const [cardHolder, setCardHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [upiId, setUpiId] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  const fetchWallet = async () => {
    try {
      setWalletLoading(true);
      const res = await Api.get("/payment/wallet");
      setWalletData(res.data?.wallet);
    } catch (err) {
      console.error("Failed to fetch wallet:", err);
    } finally {
      setWalletLoading(false);
    }
  };

  useEffect(() => {
    if (jwt) {
      dispatch(fetchPaymentMethods());
      dispatch(fetchCustomerTransactions());
      void Promise.resolve().then(() => fetchWallet());
    }
  }, [dispatch, jwt]);

  const handleTopup = async () => {
    if (!topupAmount || topupAmount <= 0) return;
    setTopupLoading(true);
    setTopupError(null);
    try {
      await Api.post("/payment/wallet/topup", { amount: topupAmount });
      await fetchWallet();
      setTopupModalOpen(false);
      setTopupAmount(1000);
    } catch (err: any) {
      setTopupError(err.response?.data?.message || "Failed to top up wallet.");
    } finally {
      setTopupLoading(false);
    }
  };

  const detectBrand = (num: string) => {
    const clean = num.replace(/\s+/g, "");
    if (clean.startsWith("4")) return "Visa";
    if (/^5[1-5]/.test(clean)) return "Mastercard";
    if (clean.startsWith("60") || clean.startsWith("65") || clean.startsWith("81") || clean.startsWith("82")) return "RuPay";
    if (clean.startsWith("34") || clean.startsWith("37")) return "Amex";
    return "Card";
  };

  const handleOpenAdd = () => {
    setCardHolder("");
    setCardNumber("");
    setCardExpiry("");
    setCardCvv("");
    setUpiId("");
    setIsDefault(false);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    setFormError(null);
    if (methodType === "CARD") {
      const cleanNum = cardNumber.replace(/\s+/g, "");
      if (!cardHolder.trim() || cleanNum.length < 12) {
        setFormError("Please enter valid card details.");
        return;
      }
      if (!cardExpiry.includes("/") || cardExpiry.trim().length < 4) {
        setFormError("Please enter valid expiry date (MM/YY).");
        return;
      }
      if (cardCvv.length < 3) {
        setFormError("Please enter a 3 or 4-digit CVV for verification.");
        return;
      }

      setLoadingAction(true);
      try {
        await dispatch(
          addPaymentMethod({
            type: "CARD",
            cardLast4: cleanNum.slice(-4),
            cardBrand: detectBrand(cleanNum),
            cardHolderName: cardHolder.trim(),
            cardExpiry: cardExpiry.trim(),
            isDefault,
          })
        ).unwrap();
        setModalOpen(false);
      } catch (err: any) {
        setFormError(err.message || "Failed to save card.");
      } finally {
        setLoadingAction(false);
      }
    } else {
      if (!upiId.includes("@") || upiId.trim().length < 5) {
        setFormError("Please enter a valid UPI ID (e.g. user@okhdfcbank).");
        return;
      }

      setLoadingAction(true);
      try {
        await dispatch(
          addPaymentMethod({
            type: "UPI",
            upiId: upiId.trim(),
            isDefault,
          })
        ).unwrap();
        setModalOpen(false);
      } catch (err: any) {
        setFormError(err.message || "Failed to save UPI ID.");
      } finally {
        setLoadingAction(false);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Remove this saved payment method from your account?")) {
      await dispatch(deletePaymentMethod(id));
    }
  };

  const handleSetDefault = async (id: string) => {
    await dispatch(setDefaultPaymentMethod(id));
  };

  const cards = (paymentMethods || []).filter((m: any) => m.type === "CARD");
  const upis = (paymentMethods || []).filter((m: any) => m.type === "UPI");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div>
          <h2 className="text-xl font-bold text-foreground">Payment Methods & History</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your saved cards, UPI IDs, and view previous transactions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddOutlined />}
            onClick={handleOpenAdd}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: "0.75rem" }}
          >
            Add Payment Method
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab("methods")}
          className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "methods"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Saved Methods ({paymentMethods?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("transactions")}
          className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "transactions"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Transaction History ({transactions?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("wallet")}
          className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "wallet"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <AccountBalanceWalletOutlined sx={{ fontSize: 16 }} />
          <span>Zosh Wallet {walletData ? `(₹${(walletData.availableBalance || 0).toLocaleString("en-IN")})` : ""}</span>
        </button>
      </div>

      {activeTab === "methods" && (
        <div className="space-y-6">
          {/* Security Reassurance Callout */}
          <div className="p-4 rounded-xl bg-muted/40 border border-border/60 flex items-start gap-3">
            <LockOutlined sx={{ fontSize: 20 }} className="text-emerald-500 mt-0.5 shrink-0" />
            <div className="text-xs text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">Secure Tokenized Processing:</span>{" "}
              ZoshBazaar never saves your full card numbers or CVV. All transactions are securely routed through certified payment gateways with bank-grade encryption.
            </div>
          </div>

          {paymentMethods?.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-border bg-card/50 space-y-3">
              <CreditCardOutlined sx={{ fontSize: 44 }} className="text-muted-foreground mx-auto" />
              <p className="text-sm font-semibold text-foreground">No payment methods saved</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Save your Credit/Debit card or UPI ID for seamless, 1-click checkout.
              </p>
              <Button
                variant="outlined"
                onClick={handleOpenAdd}
                sx={{ textTransform: "none", fontWeight: 600, borderRadius: "0.75rem" }}
              >
                Add Your First Method
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Credit / Debit Cards */}
              {cards.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Credit & Debit Cards ({cards.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cards.map((card: any) => (
                      <div
                        key={card._id}
                        className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                          card.isDefault
                            ? "border-primary/60 bg-primary/5 shadow-xs"
                            : "border-border/80 bg-card hover:border-primary/40"
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black tracking-widest text-primary uppercase bg-primary/10 px-2 py-0.5 rounded">
                              {card.cardBrand || "Card"}
                            </span>
                            {card.isDefault && (
                              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                <CheckCircle sx={{ fontSize: 13 }} /> Default
                              </span>
                            )}
                          </div>
                          <p className="text-base font-mono font-bold tracking-widest text-foreground">
                            •••• •••• •••• {card.cardLast4}
                          </p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div>
                              <p className="text-[10px] uppercase tracking-wider">Card Holder</p>
                              <p className="font-semibold text-foreground">{card.cardHolderName || "Valued Customer"}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-wider">Expires</p>
                              <p className="font-semibold text-foreground">{card.cardExpiry}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/60">
                          {!card.isDefault ? (
                            <button
                              onClick={() => handleSetDefault(card._id)}
                              className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                            >
                              Set as Default
                            </button>
                          ) : (
                            <span className="text-xs text-muted-foreground">Primary payment choice</span>
                          )}
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(card._id)}
                            color="error"
                            title="Remove card"
                          >
                            <DeleteOutline sx={{ fontSize: 18 }} />
                          </IconButton>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* UPI VPAs */}
              {upis.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    UPI IDs ({upis.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {upis.map((upi: any) => (
                      <div
                        key={upi._id}
                        className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                          upi.isDefault
                            ? "border-primary/60 bg-primary/5 shadow-xs"
                            : "border-border/80 bg-card hover:border-primary/40"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                            UPI
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground">{upi.upiId}</p>
                            {upi.isDefault ? (
                              <span className="text-[10px] font-bold text-emerald-600">Default UPI</span>
                            ) : (
                              <button
                                onClick={() => handleSetDefault(upi._id)}
                                className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                              >
                                Set as Default
                              </button>
                            )}
                          </div>
                        </div>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(upi._id)}
                          color="error"
                          title="Remove UPI ID"
                        >
                          <DeleteOutline sx={{ fontSize: 18 }} />
                        </IconButton>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === "transactions" && (
        <div className="space-y-4">
          {transactions?.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-border bg-card/50 space-y-3">
              <ReceiptLongOutlined sx={{ fontSize: 44 }} className="text-muted-foreground mx-auto" />
              <p className="text-sm font-semibold text-foreground">No transactions recorded</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Completed purchases, online payments, and refunds will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border/80 bg-card">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-muted/50 border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Transaction / Order</th>
                    <th className="py-3 px-4">Gateway</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {transactions.map((tx: any) => (
                    <tr key={tx._id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                        {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-foreground">
                        {tx.paymentId || (typeof tx.order === "object" ? tx.order?._id : tx.order) || tx._id}
                      </td>
                      <td className="py-3 px-4 font-semibold text-foreground">
                        {tx.paymentGateway || "Razorpay"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            tx.status === "COMPLETED" || tx.status === "SUCCESS"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : tx.status === "PENDING"
                              ? "bg-amber-500/10 text-amber-600"
                              : "bg-rose-500/10 text-rose-600"
                          }`}
                        >
                          {tx.status || "COMPLETED"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-foreground">
                        ₹{Number(tx.amount || 0).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Zosh Wallet Tab */}
      {activeTab === "wallet" && (
        <div className="space-y-6">
          {/* Main Wallet Hero Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-card border border-primary/25 p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black tracking-widest text-primary uppercase bg-primary/10 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <BoltOutlined sx={{ fontSize: 14 }} /> ZOSH SECURE WALLET
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Active Account
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Available Balance</p>
                  <div className="text-3xl sm:text-4xl font-black text-foreground mt-1 tracking-tight">
                    ₹{Number(walletData?.availableBalance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground max-w-md">
                  Backed by double-entry platform ledger. Use for 1-click instant checkout or split checkout with UPI/Cards.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<ArrowUpward />}
                  onClick={() => setTopupModalOpen(true)}
                  sx={{ textTransform: "none", fontWeight: 700, borderRadius: "0.75rem", px: 3, py: 1.2 }}
                >
                  Top Up Wallet
                </Button>
                <Button
                  variant="outlined"
                  onClick={fetchWallet}
                  disabled={walletLoading}
                  sx={{ textTransform: "none", fontWeight: 600, borderRadius: "0.75rem" }}
                >
                  {walletLoading ? "Syncing..." : "Refresh"}
                </Button>
              </div>
            </div>

            {/* Micro Balances Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-border/70">
              <div className="p-3.5 rounded-xl bg-card/60 border border-border/60">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  Reserved Balance
                </span>
                <span className="text-base font-bold text-foreground mt-1 block">
                  ₹{Number(walletData?.reservedBalance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-muted-foreground mt-0.5 block">
                  Locked for in-flight checkout
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-card/60 border border-border/60">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  Promotional Balance
                </span>
                <span className="text-base font-bold text-foreground mt-1 block">
                  ₹{Number(walletData?.promotionalBalance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-muted-foreground mt-0.5 block">
                  Cashbacks & platform credits
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-card/60 border border-border/60">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  Refund Balance
                </span>
                <span className="text-base font-bold text-foreground mt-1 block">
                  ₹{Number(walletData?.refundBalance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-muted-foreground mt-0.5 block">
                  Instant credit from returned items
                </span>
              </div>
            </div>
          </div>

          {/* Wallet Benefits Callout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-muted/30 border border-border/60 flex items-start gap-3">
              <BoltOutlined sx={{ fontSize: 20 }} className="text-primary mt-0.5 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-foreground">1-Click Instant Checkout</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Skip OTPs and gateway redirects. Pay instantly with your available wallet funds.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-muted/30 border border-border/60 flex items-start gap-3">
              <ShieldOutlined sx={{ fontSize: 20 }} className="text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-foreground">Split Payment Protection</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Combine wallet balance with UPI or Card if your balance is insufficient for full order.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-muted/30 border border-border/60 flex items-start gap-3">
              <ReceiptLongOutlined sx={{ fontSize: 20 }} className="text-purple-500 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-foreground">Double-Entry Audited</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Every debit and credit posting is strictly balanced and immutable in the platform ledger.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Topup Wallet Modal */}
      <Modal
        open={topupModalOpen}
        onClose={() => !topupLoading && setTopupModalOpen(false)}
        slotProps={{
          backdrop: {
            sx: {
              backdropFilter: "blur(6px)",
              backgroundColor: "rgba(0, 0, 0, 0.65)",
            },
          },
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "92%", sm: 440 },
            bgcolor: "var(--card)",
            color: "var(--foreground)",
            boxShadow: 24,
            borderRadius: "1rem",
            border: "1px solid var(--border)",
            p: 4,
          }}
        >
          <div className="flex items-center justify-between pb-3 border-b border-border/70 mb-4">
            <div className="flex items-center gap-2">
              <AccountBalanceWalletOutlined className="text-primary" />
              <Typography variant="h6" sx={{ fontWeight: 800, fontSize: "1.1rem" }}>
                Top Up Zosh Wallet
              </Typography>
            </div>
            <IconButton size="small" onClick={() => setTopupModalOpen(false)} disabled={topupLoading}>
              <Close fontSize="small" />
            </IconButton>
          </div>

          {topupError && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: "0.5rem", fontSize: "12px" }}>
              {topupError}
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Amount (₹ INR)
              </label>
              <TextField
                fullWidth
                type="number"
                size="small"
                value={topupAmount}
                onChange={(e) => setTopupAmount(Math.max(1, Number(e.target.value)))}
                disabled={topupLoading}
                placeholder="1000"
              />
            </div>

            {/* Quick Amount Chips */}
            <div>
              <p className="text-[11px] text-muted-foreground mb-1.5 font-semibold">Quick select:</p>
              <div className="flex items-center gap-2">
                {[500, 1000, 2000, 5000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTopupAmount(amt)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      topupAmount === amt
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-muted hover:bg-muted/80 text-foreground"
                    }`}
                  >
                    +₹{amt}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-[11px] text-muted-foreground">
              Funds are instantly credited to your wallet via our deterministic payment ledger.
            </div>

            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={handleTopup}
              disabled={topupLoading || topupAmount <= 0}
              sx={{ textTransform: "none", fontWeight: 700, borderRadius: "0.75rem", py: 1.2, mt: 1 }}
            >
              {topupLoading ? <CircularProgress size={20} color="inherit" /> : `Deposit ₹${topupAmount.toLocaleString("en-IN")}`}
            </Button>
          </div>
        </Box>
      </Modal>

      {/* Add Payment Method Modal */}
      <Modal
        open={modalOpen}
        onClose={() => !loadingAction && setModalOpen(false)}
        slotProps={{
          backdrop: {
            sx: {
              backdropFilter: "blur(6px)",
              backgroundColor: "rgba(0, 0, 0, 0.65)",
            },
          },
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "94%", sm: 500 },
            maxHeight: { xs: "92vh", sm: "88vh" },
            bgcolor: "var(--card)",
            color: "var(--foreground)",
            borderRadius: { xs: "1rem", sm: "1.25rem" },
            border: "1px solid var(--border)",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            outline: "none",
          }}
        >
          {/* Pinned Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border shrink-0 bg-card">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <CreditCardOutlined sx={{ fontSize: 20 }} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-foreground leading-tight">
                  Add Payment Method
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Save card or UPI for instant, secure 1-click checkout
                </p>
              </div>
            </div>
            <IconButton size="small" onClick={() => setModalOpen(false)} disabled={loadingAction} aria-label="Close modal">
              <Close sx={{ fontSize: 18 }} />
            </IconButton>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMethodType("CARD")}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  methodType === "CARD"
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                }`}
              >
                Credit / Debit Card
              </button>
              <button
                type="button"
                onClick={() => setMethodType("UPI")}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  methodType === "UPI"
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                }`}
              >
                UPI / VPA ID
              </button>
            </div>

            {formError && (
              <Alert severity="error" sx={{ borderRadius: "0.75rem", fontSize: 12, mb: 0.5 }}>
                {formError}
              </Alert>
            )}

            {methodType === "CARD" ? (
              <div className="flex flex-col gap-4.5">
                <TextField
                  fullWidth
                  label="Cardholder Full Name"
                  placeholder="Rahul Raj"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  size="small"
                  required
                />
                <TextField
                  fullWidth
                  label="16-Digit Card Number"
                  placeholder="4111 2222 3333 4444"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  size="small"
                  required
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <TextField
                    fullWidth
                    label="Expires (MM/YY)"
                    placeholder="08/28"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    size="small"
                    required
                  />
                  <TextField
                    fullWidth
                    label="CVV / Security Code"
                    type="password"
                    placeholder="•••"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.slice(0, 4))}
                    size="small"
                    helperText="CVV is never stored on servers"
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4.5">
                <TextField
                  fullWidth
                  label="Virtual Payment Address (UPI ID)"
                  placeholder="rahul@okhdfcbank"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  size="small"
                  helperText="Supported: Google Pay, PhonePe, Paytm, BHIM UPI"
                  required
                />
              </div>
            )}

            <div className="pt-1">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    size="small"
                    color="primary"
                  />
                }
                label={
                  <Typography sx={{ fontSize: 13, color: "text.primary" }}>
                    Set as default payment method for fast checkout
                  </Typography>
                }
              />
            </div>
          </div>

          {/* Pinned Footer */}
          <div className="p-4 sm:p-5 border-t border-border bg-card flex items-center justify-end gap-3 shrink-0">
            <Button
              variant="outlined"
              onClick={() => setModalOpen(false)}
              disabled={loadingAction}
              sx={{ textTransform: "none", fontWeight: 600, borderRadius: "0.75rem", px: 3 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              disabled={loadingAction}
              sx={{ textTransform: "none", fontWeight: 700, borderRadius: "0.75rem", px: 3 }}
            >
              {loadingAction ? <CircularProgress size={20} color="inherit" /> : "Save Payment Method"}
            </Button>
          </div>
        </Box>
      </Modal>
    </div>
  );
};
export default PaymentsView;
