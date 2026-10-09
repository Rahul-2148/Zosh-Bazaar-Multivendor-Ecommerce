import React, { useState } from "react";
import { CheckCircle, AccountBalanceOutlined, Search } from "@mui/icons-material";
import { TextField, InputAdornment } from "@mui/material";

interface BankItem {
  code: string;
  name: string;
  popular?: boolean;
}

interface NetBankingProps {
  popularBanks: BankItem[];
  allBanks: BankItem[];
  selectedBankCode: string | null;
  onSelectBank: (code: string) => void;
}

export const NetBanking: React.FC<NetBankingProps> = ({
  popularBanks,
  allBanks,
  selectedBankCode,
  onSelectBank,
}) => {
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);

  const filteredBanks = allBanks.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* 1. Popular Banks Grid */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">
          Popular retail banks:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {popularBanks.map((bank) => {
            const isSelected = selectedBankCode === bank.code;

            return (
              <button
                type="button"
                key={bank.code}
                onClick={() => onSelectBank(bank.code)}
                className={`p-3 rounded-xl border transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary"
                    : "border-border/80 hover:border-primary/40 bg-card"
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-foreground font-black text-xs">
                  {bank.code.slice(0, 3)}
                </div>
                <span className="text-xs font-bold text-foreground text-center truncate w-full">
                  {bank.name}
                </span>
                {isSelected && (
                  <span className="text-[10px] font-bold text-primary flex items-center gap-0.5">
                    <CheckCircle sx={{ fontSize: 11 }} /> Selected
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. All Banks Search / Dropdown Toggle */}
      <div className="pt-2 border-t border-border/60">
        {!showAll ? (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="text-xs font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
          >
            <AccountBalanceOutlined sx={{ fontSize: 16 }} />
            View all other banks ({allBanks.length})
          </button>
        ) : (
          <div className="space-y-3">
            <TextField
              fullWidth
              size="small"
              placeholder="Search bank name (e.g. Canara, IndusInd)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
            />

            <div className="max-h-48 overflow-y-auto space-y-1 pr-1 border border-border/60 rounded-xl p-2 bg-card">
              {filteredBanks.map((bank) => (
                <div
                  key={bank.code}
                  onClick={() => onSelectBank(bank.code)}
                  className={`p-2.5 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center justify-between ${
                    selectedBankCode === bank.code
                      ? "bg-primary text-primary-foreground font-bold"
                      : "hover:bg-muted text-foreground"
                  }`}
                >
                  <span>{bank.name}</span>
                  {selectedBankCode === bank.code && <CheckCircle sx={{ fontSize: 16 }} />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NetBanking;
