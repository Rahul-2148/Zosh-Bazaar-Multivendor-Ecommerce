import React from "react";
import dayjs from "dayjs";

interface SlaIndicatorProps {
  slaStatus: string;
  promisedTo?: string | Date;
  actualDeliveredAt?: string | Date;
  size?: "sm" | "md";
}

export const SlaIndicator: React.FC<SlaIndicatorProps> = ({
  slaStatus,
  promisedTo,
  actualDeliveredAt,
  size = "md",
}) => {
  let badgeStyle = "bg-muted text-muted-foreground border-border";
  let dotColor = "bg-muted-foreground";

  switch (slaStatus) {
    case "ON_TRACK":
      badgeStyle = "bg-success/10 text-success border-success/20";
      dotColor = "bg-success";
      break;
    case "AT_RISK":
      badgeStyle = "bg-warning/15 text-warning border-warning/30 animate-pulse";
      dotColor = "bg-warning";
      break;
    case "BREACHED":
      badgeStyle = "bg-destructive/15 text-destructive border-destructive/30";
      dotColor = "bg-destructive";
      break;
    case "COMPLETED":
      badgeStyle = "bg-info/10 text-info border-info/20";
      dotColor = "bg-info";
      break;
  }

  let timeText = "";
  if (promisedTo && slaStatus !== "COMPLETED") {
    const diffHours = dayjs(promisedTo).diff(dayjs(), "hour");
    if (diffHours > 0) {
      timeText = `${diffHours}h left`;
    } else if (diffHours < 0) {
      timeText = `${Math.abs(diffHours)}h late`;
    } else {
      const diffMins = dayjs(promisedTo).diff(dayjs(), "minute");
      timeText = diffMins > 0 ? `${diffMins}m left` : "Overdue";
    }
  } else if (actualDeliveredAt) {
    timeText = dayjs(actualDeliveredAt).format("DD MMM, HH:mm");
  }

  const padding = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs font-medium";

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-md border ${padding} ${badgeStyle}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span className="font-semibold">{slaStatus.replace(/_/g, " ")}</span>
      {timeText && <span className="opacity-75 font-mono text-[11px]">({timeText})</span>}
    </div>
  );
};
