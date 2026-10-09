import React from "react";
import { LockOutlined, VerifiedUserOutlined, ShieldOutlined } from "@mui/icons-material";

export const SecurityInfo: React.FC = () => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-muted/40 border border-border/70 text-xs text-muted-foreground">
      <div className="flex items-center gap-2">
        <LockOutlined className="text-emerald-500" sx={{ fontSize: 18 }} />
        <span>
          <strong className="text-foreground">256-Bit SSL/TLS Encryption</strong> · Zero Card/CVV Persistence
        </span>
      </div>
      <div className="flex items-center gap-4 text-[11px]">
        <span className="flex items-center gap-1">
          <VerifiedUserOutlined className="text-primary" sx={{ fontSize: 16 }} />
          Secure Payment Processing
        </span>
        <span className="flex items-center gap-1">
          <ShieldOutlined className="text-primary" sx={{ fontSize: 16 }} />
          Encrypted Data Transmission
        </span>
      </div>
    </div>
  );
};

export default SecurityInfo;
