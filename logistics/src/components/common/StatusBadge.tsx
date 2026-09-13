import React from "react";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md" | "lg";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = "md" }) => {
  let colorClasses = "bg-muted text-muted-foreground border-border";

  switch (status) {
    case "CREATED":
    case "ALLOCATED":
      colorClasses = "bg-secondary text-secondary-foreground border-border";
      break;
    case "PICKING":
    case "PICKED":
    case "PACKING":
    case "PACKED":
    case "READY_FOR_DISPATCH":
      colorClasses = "bg-primary/10 text-primary border-primary/20";
      break;
    case "DISPATCHED":
    case "IN_TRANSIT":
    case "AT_HUB":
      colorClasses = "bg-info/10 text-info border-info/20";
      break;
    case "OUT_FOR_DELIVERY":
      colorClasses = "bg-warning/10 text-warning border-warning/25 animate-pulse";
      break;
    case "DELIVERED":
    case "COMPLETED":
      colorClasses = "bg-success/10 text-success border-success/20";
      break;
    case "DELIVERY_FAILED":
    case "DELAYED":
    case "BREACHED":
    case "CANCELLED":
      colorClasses = "bg-destructive/10 text-destructive border-destructive/20";
      break;
    case "RETURN_IN_PROGRESS":
    case "RETURNED_TO_ORIGIN":
      colorClasses = "bg-warning/15 text-warning border-warning/30";
      break;
    default:
      colorClasses = "bg-muted text-muted-foreground border-border";
  }

  const sizeClasses =
    size === "sm"
      ? "text-[11px] px-2 py-0.5"
      : size === "lg"
      ? "text-xs px-3 py-1 font-semibold"
      : "text-[12px] px-2.5 py-0.5 font-medium";

  const label = status ? status.replace(/_/g, " ") : "UNKNOWN";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${sizeClasses} ${colorClasses} tracking-wide`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          status === "DELIVERED"
            ? "bg-success"
            : status === "OUT_FOR_DELIVERY"
            ? "bg-warning"
            : status === "DELIVERY_FAILED" || status === "DELAYED"
            ? "bg-destructive"
            : "bg-current"
        }`}
      />
      {label}
    </span>
  );
};
