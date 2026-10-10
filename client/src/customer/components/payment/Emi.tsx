import React, { useState } from "react";
import {
  Button,
  Chip,
} from "@mui/material";
import {
  CreditScoreOutlined,
  InfoOutlined,
} from "@mui/icons-material";

interface EmiPlan {
  tenureMonths: number;
  monthlyAmount: number;
  interestRate: number;
  totalPayable: number;
  processingFee: number;
  isNoCost: boolean;
}

interface EmiProps {
  orderAmount: number;
  onSelectEmiPlan: (plan: { bank: string; tenureMonths: number; monthlyAmount: number }) => void;
  disabled?: boolean;
}

const SUPPORTED_BANKS = [
  { id: "HDFC", name: "HDFC Bank", minAmount: 3000, rates: [0, 14, 15, 15] },
  { id: "ICICI", name: "ICICI Bank", minAmount: 3000, rates: [0, 13.5, 14.5, 15] },
  { id: "SBI", name: "State Bank of India", minAmount: 2500, rates: [0, 14, 15, 16] },
  { id: "AXIS", name: "Axis Bank", minAmount: 3000, rates: [0, 14, 15, 15] },
];

export const Emi: React.FC<EmiProps> = ({ orderAmount, onSelectEmiPlan, disabled = false }) => {
  const [selectedBank, setSelectedBank] = useState<string>("HDFC");
  const [selectedTenure, setSelectedTenure] = useState<number>(3);

  const calculatePlans = (bankId: string): EmiPlan[] => {
    const bank = SUPPORTED_BANKS.find((b) => b.id === bankId) || SUPPORTED_BANKS[0];
    const tenures = [3, 6, 9, 12];

    return tenures.map((months, idx) => {
      const isNoCost = months === 3;
      const rate = isNoCost ? 0 : bank.rates[idx] || 15;
      const monthlyRate = rate / (12 * 100);

      let monthlyAmount = 0;
      let totalPayable = orderAmount;

      if (isNoCost || monthlyRate === 0) {
        monthlyAmount = Math.ceil(orderAmount / months);
        totalPayable = orderAmount;
      } else {
        // Standard EMI Formula: [P x R x (1+R)^N]/[(1+R)^N-1]
        const emi = (orderAmount * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
        monthlyAmount = Math.ceil(emi);
        totalPayable = monthlyAmount * months;
      }

      return {
        tenureMonths: months,
        monthlyAmount,
        interestRate: rate,
        totalPayable,
        processingFee: 199,
        isNoCost,
      };
    });
  };

  const plans = calculatePlans(selectedBank);
  const activePlan = plans.find((p) => p.tenureMonths === selectedTenure) || plans[0];

  if (orderAmount < 2500) {
    return (
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs">
        <div className="flex items-center gap-1.5 font-bold mb-1">
          <InfoOutlined sx={{ fontSize: 16 }} />
          <span>EMI Unavailable for this order</span>
        </div>
        <p>Minimum order value for Equated Monthly Installment (EMI) plans is ₹2,500. Current order: ₹{orderAmount.toLocaleString("en-IN")}.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditScoreOutlined className="text-primary text-xl" />
          <div>
            <h4 className="font-bold text-sm text-foreground">Equated Monthly Installments (EMI)</h4>
            <p className="text-xs text-muted-foreground">Select your credit card issuing bank and tenure</p>
          </div>
        </div>
        <Chip
          label="No Cost EMI Available"
          size="small"
          color="success"
          variant="outlined"
          sx={{ fontWeight: 700, fontSize: "10px" }}
        />
      </div>

      {/* Bank Selector */}
      <div className="flex flex-wrap gap-2">
        {SUPPORTED_BANKS.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => setSelectedBank(b.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              selectedBank === b.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border/70 hover:border-primary/40 text-muted-foreground bg-background"
            }`}
          >
            {b.name}
          </button>
        ))}
      </div>

      {/* Tenure Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {plans.map((p) => (
          <div
            key={p.tenureMonths}
            onClick={() => setSelectedTenure(p.tenureMonths)}
            className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
              selectedTenure === p.tenureMonths
                ? "border-primary bg-primary/5 shadow-xs"
                : "border-border/70 hover:border-primary/30 bg-card"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm text-foreground">
                    ₹{p.monthlyAmount.toLocaleString("en-IN")}/mo
                  </span>
                  {p.isNoCost && (
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded">
                      No Cost
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  for {p.tenureMonths} months ({p.interestRate}% p.a.)
                </p>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-medium text-muted-foreground block">
                  Total ₹{p.totalPayable.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Active Plan Breakdown */}
      <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 text-xs space-y-1.5">
        <div className="flex justify-between text-muted-foreground">
          <span>Monthly Installment:</span>
          <span className="font-bold text-foreground">
            ₹{activePlan.monthlyAmount.toLocaleString("en-IN")} × {activePlan.tenureMonths} months
          </span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Annual Interest Rate:</span>
          <span className="font-semibold text-foreground">
            {activePlan.isNoCost ? "0% (Interest funded by Zosh)" : `${activePlan.interestRate}% p.a.`}
          </span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>One-time Processing Fee:</span>
          <span className="font-semibold text-foreground">₹{activePlan.processingFee} + GST</span>
        </div>
        <div className="flex justify-between border-t border-border/40 pt-1 font-bold text-foreground">
          <span>Effective Amount Payable:</span>
          <span className="text-primary font-black">₹{activePlan.totalPayable.toLocaleString("en-IN")}</span>
        </div>
      </div>

      <Button
        variant="contained"
        color="primary"
        fullWidth
        disabled={disabled}
        onClick={() =>
          onSelectEmiPlan({
            bank: selectedBank,
            tenureMonths: activePlan.tenureMonths,
            monthlyAmount: activePlan.monthlyAmount,
          })
        }
        sx={{
          py: 1.2,
          fontWeight: 700,
          borderRadius: "0.75rem",
          textTransform: "none",
        }}
      >
        Proceed with {activePlan.tenureMonths}-Month EMI (₹{activePlan.monthlyAmount.toLocaleString("en-IN")}/mo)
      </Button>
    </div>
  );
};
