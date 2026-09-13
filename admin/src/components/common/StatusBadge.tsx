import React from "react";

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const normalized = status?.toUpperCase() || "UNKNOWN";

  let colorClasses = "bg-muted text-muted-foreground border-border";

  switch (normalized) {
    case "ACTIVE":
    case "DELIVERED":
    case "COMPLETED":
      colorClasses = "bg-success-soft text-success border-success/25";
      break;
    case "PENDING":
    case "PENDING_VERIFICATION":
    case "PLACED":
      colorClasses = "bg-warning-soft text-warning border-warning/25";
      break;
    case "CONFIRMED":
    case "SHIPPED":
    case "PROCESSING":
      colorClasses = "bg-info-soft text-info border-info/25";
      break;
    case "CANCELLED":
    case "FAILED":
    case "BANNED":
    case "SUSPENDED":
      colorClasses = "bg-destructive-soft text-destructive border-destructive/25";
      break;
    case "DEACTIVATED":
      colorClasses = "bg-muted text-muted-foreground border-border";
      break;
  }

  const formatText = (text: string) =>
    text.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${colorClasses}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {formatText(normalized)}
    </span>
  );
};
