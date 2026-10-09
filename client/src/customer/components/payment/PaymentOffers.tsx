import React from "react";
import { LocalOfferOutlined, CheckCircle } from "@mui/icons-material";

export interface PaymentOfferItem {
  code: string;
  title: string;
  description: string;
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: number;
  maxDiscount?: number;
  minOrderValue: number;
  applicableRail: string;
  applicableBanks?: string[];
}

interface PaymentOffersProps {
  offers: PaymentOfferItem[];
  selectedOfferCode: string | null;
  onSelectOffer: (code: string | null) => void;
}

export const PaymentOffers: React.FC<PaymentOffersProps> = ({
  offers,
  selectedOfferCode,
  onSelectOffer,
}) => {
  if (!offers || offers.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        <LocalOfferOutlined className="text-primary" sx={{ fontSize: 16 }} />
        <span>Bank Offers & Instant Discounts ({offers.length})</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {offers.map((offer) => {
          const isSelected = selectedOfferCode === offer.code;

          return (
            <div
              key={offer.code}
              onClick={() => onSelectOffer(isSelected ? null : offer.code)}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                isSelected
                  ? "border-primary bg-primary/10 shadow-xs"
                  : "border-border/70 hover:border-primary/50 bg-card"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {offer.code}
                  </span>
                  <span className="text-xs font-bold text-foreground">{offer.title}</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {offer.description}
                </p>
              </div>

              {isSelected && (
                <CheckCircle className="text-primary shrink-0" sx={{ fontSize: 18 }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PaymentOffers;
