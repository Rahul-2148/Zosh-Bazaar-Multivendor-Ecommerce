import React from "react";

interface StatusPillProps {
  status: string;
  size?: "sm" | "md";
}

export const StatusPill: React.FC<StatusPillProps> = ({ status, size = "md" }) => {
  const getStyles = () => {
    switch (status) {
      case "DELIVERED":
      case "COMPLETED":
      case "AVAILABLE":
      case "ACTIVE":
        return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
      case "ARRIVED":
        return "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30";
      case "EN_ROUTE":
      case "OUT_FOR_DELIVERY":
        return "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30";
      case "PENDING":
      case "PLANNED":
        return "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30";
      case "FAILED":
      case "SUSPENDED":
      case "BREACHED":
        return "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30";
      case "ON_BREAK":
      case "AT_RISK":
        return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
      default:
        return "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30";
    }
  };

  const padClass = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center font-bold tracking-wider uppercase rounded-full border ${padClass} ${getStyles()}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-80" />
      {status.replace(/_/g, " ")}
    </span>
  );
};
