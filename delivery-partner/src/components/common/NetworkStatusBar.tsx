import React from "react";
import { usePartnerSocket } from "../../context/PartnerSocketContext";
import { WifiOff } from "lucide-react";

export const NetworkStatusBar: React.FC = () => {
  const { online, connected } = usePartnerSocket();

  if (online && connected) return null;

  return (
    <div className="bg-amber-500 text-amber-950 px-3 py-1 text-xs font-semibold flex items-center justify-between shadow-sm animate-pulse z-50">
      <div className="flex items-center gap-1.5">
        <WifiOff size={14} />
        <span>{!online ? "Device is Offline — Offline Queue Active" : "Reconnecting to Telemetry..."}</span>
      </div>
      <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">Syncing Local</span>
    </div>
  );
};
