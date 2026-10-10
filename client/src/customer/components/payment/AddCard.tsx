import React, { useState } from "react";
import { TextField, Button, Checkbox, FormControlLabel, CircularProgress, Alert } from "@mui/material";
import { CreditCardOutlined } from "@mui/icons-material";

interface AddCardProps {
  onSaveCard: (cardData: {
    cardNumber: string;
    cardHolderName: string;
    cardExpiry: string;
    saveCard: boolean;
  }) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

export const AddCard: React.FC<AddCardProps> = ({ onSaveCard, onCancel, loading }) => {
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [saveCard, setSaveCard] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const detectBrand = (num: string) => {
    const clean = num.replace(/\s+/g, "");
    if (clean.startsWith("4")) return "Visa";
    if (/^5[1-5]/.test(clean)) return "Mastercard";
    if (clean.startsWith("60") || clean.startsWith("65") || clean.startsWith("81") || clean.startsWith("82"))
      return "RuPay";
    if (clean.startsWith("34") || clean.startsWith("37")) return "Amex";
    return null;
  };

  const detectedNetwork = detectBrand(cardNumber);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanNum = cardNumber.replace(/\s+/g, "");
    if (cleanNum.length < 15) {
      setError("Please enter a valid 16-digit card number.");
      return;
    }
    if (!cardHolder.trim()) {
      setError("Please enter the name on the card.");
      return;
    }
    if (!cardExpiry.includes("/") || cardExpiry.trim().length < 4) {
      setError("Please enter a valid expiry date (MM/YY).");
      return;
    }

    try {
      await onSaveCard({
        cardNumber: cleanNum,
        cardHolderName: cardHolder.trim(),
        cardExpiry: cardExpiry.trim(),
        saveCard,
      });
    } catch (err: any) {
      setError(err.message || "Failed to process card details");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 rounded-2xl border border-border/80 bg-card space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div className="flex items-center gap-2">
          <CreditCardOutlined className="text-primary" sx={{ fontSize: 20 }} />
          <h4 className="text-xs sm:text-sm font-bold text-foreground">Add New Credit or Debit Card</h4>
        </div>
        {detectedNetwork && (
          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary">
            {detectedNetwork}
          </span>
        )}
      </div>

      {error && (
        <Alert severity="error" sx={{ borderRadius: "0.5rem", fontSize: 12 }}>
          {error}
        </Alert>
      )}

      <div className="space-y-3">
        <TextField
          fullWidth
          size="small"
          label="Card Number"
          placeholder="4111 2222 3333 4444"
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value)}
          inputProps={{ maxLength: 19 }}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextField
            fullWidth
            size="small"
            label="Name on Card"
            placeholder="Rahul Raj"
            value={cardHolder}
            onChange={(e) => setCardHolder(e.target.value)}
            required
          />
          <TextField
            fullWidth
            size="small"
            label="Valid Thru (MM/YY)"
            placeholder="12/28"
            value={cardExpiry}
            onChange={(e) => setCardExpiry(e.target.value)}
            inputProps={{ maxLength: 5 }}
            required
          />
        </div>

        <FormControlLabel
          control={
            <Checkbox
              checked={saveCard}
              onChange={(e) => setSaveCard(e.target.checked)}
              size="small"
              color="primary"
            />
          }
          label={
            <span className="text-xs text-muted-foreground">
              Securely save card for faster payments as per RBI guidelines
            </span>
          }
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
        <Button
          variant="outlined"
          size="small"
          onClick={onCancel}
          disabled={loading}
          sx={{ textTransform: "none", fontWeight: 600, borderRadius: "0.65rem" }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          size="small"
          color="primary"
          disabled={loading}
          sx={{ textTransform: "none", fontWeight: 700, borderRadius: "0.65rem", px: 3 }}
        >
          {loading ? <CircularProgress size={16} color="inherit" /> : "Save & Proceed"}
        </Button>
      </div>
    </form>
  );
};

export default AddCard;
