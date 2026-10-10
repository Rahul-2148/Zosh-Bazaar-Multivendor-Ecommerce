import React from "react";
import { TextField, Button, CircularProgress } from "@mui/material";
import { CreditCardOutlined, CheckCircle } from "@mui/icons-material";

interface SavedCardItem {
  _id: string;
  type: string;
  cardBrand: string;
  cardLast4: string;
  cardHolderName?: string;
  cardExpiry?: string;
  isDefault?: boolean;
}

interface SavedCardsProps {
  cards: SavedCardItem[];
  selectedCardId: string | null;
  onSelectCard: (cardId: string) => void;
  cvv: string;
  onChangeCvv: (cvv: string) => void;
  payableAmount: number;
  onPayWithCard: () => void;
  loading: boolean;
  onOpenAddNew: () => void;
}

export const SavedCards: React.FC<SavedCardsProps> = ({
  cards,
  selectedCardId,
  onSelectCard,
  cvv,
  onChangeCvv,
  payableAmount,
  onPayWithCard,
  loading,
  onOpenAddNew,
}) => {
  return (
    <div className="space-y-3">
      {cards.map((card) => {
        const isSelected = selectedCardId === card._id;

        return (
          <div
            key={card._id}
            onClick={() => onSelectCard(card._id)}
            className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
              isSelected
                ? "border-primary bg-primary/5 shadow-xs"
                : "border-border/80 hover:border-primary/40 bg-card"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <CreditCardOutlined sx={{ fontSize: 22 }} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs uppercase px-2 py-0.5 rounded bg-muted text-foreground">
                      {card.cardBrand || "Card"}
                    </span>
                    <span className="font-mono text-sm font-bold text-foreground">
                      •••• •••• •••• {card.cardLast4}
                    </span>
                    {card.isDefault && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        DEFAULT
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Holder: <strong className="text-foreground">{card.cardHolderName || "Customer"}</strong> · Expires: {card.cardExpiry || "—"}
                  </p>
                </div>
              </div>

              {isSelected && <CheckCircle className="text-primary" sx={{ fontSize: 20 }} />}
            </div>

            {/* Expanded CVV & Pay Action for selected card */}
            {isSelected && (
              <div
                className="mt-4 pt-3.5 border-t border-border/60 flex flex-col sm:flex-row items-center gap-3"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-full sm:w-44">
                  <TextField
                    fullWidth
                    size="small"
                    type="password"
                    label="CVV"
                    placeholder="•••"
                    value={cvv}
                    onChange={(e) => onChangeCvv(e.target.value.slice(0, 4))}
                    inputProps={{ maxLength: 4 }}
                    helperText="3 or 4 digits on back"
                  />
                </div>
                <div className="w-full sm:flex-1 flex gap-2">
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    disabled={loading || cvv.length < 3}
                    onClick={onPayWithCard}
                    sx={{
                      py: 1,
                      borderRadius: "0.65rem",
                      fontWeight: 700,
                      textTransform: "none",
                    }}
                  >
                    {loading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      `Pay ₹${payableAmount.toLocaleString("en-IN")}`
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={onOpenAddNew}
        className="w-full p-3 rounded-xl border border-dashed border-primary/60 text-primary bg-primary/5 hover:bg-primary/10 transition-colors font-bold text-xs cursor-pointer text-center"
      >
        + Add New Credit or Debit Card
      </button>
    </div>
  );
};

export default SavedCards;
