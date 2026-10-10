import React from "react";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: "primary" | "success" | "warning" | "danger" | "neutral" | "gold" | "assured";
  size?: "sm" | "md";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
}) => {
  const sizeStyles = {
    sm: "px-1.5 py-0.5 text-[10px] font-semibold",
    md: "px-2 py-0.5 text-xs font-semibold",
  };

  const variantStyles = {
    primary: "bg-[#e8f0fe] text-[#2874F0] border border-[#2874F0]/20",
    success: "bg-[#e8f5e9] text-[#388E3C] border border-[#388E3C]/20",
    warning: "bg-[#fff8e1] text-[#FF9F00] border border-[#FF9F00]/20",
    danger: "bg-[#ffebee] text-[#FF6161] border border-[#FF6161]/20",
    neutral: "bg-gray-100 text-[#212121] border border-gray-200",
    gold: "bg-[#fff9c4] text-[#b78103] border border-[#FFB800]/40 font-bold",
    assured:
      "bg-gradient-to-r from-[#2874F0] to-[#125cd4] text-white shadow-xs italic font-bold",
  };

  return (
    <span
      className={`inline-flex items-center justify-center rounded ${sizeStyles[size]} ${variantStyles[variant]} select-none ${className}`}
    >
      {variant === "assured" && (
        <span className="mr-1 text-[9px] font-black uppercase tracking-wider not-italic">
          ZOSH
        </span>
      )}
      {children}
    </span>
  );
};

export interface StatusPillProps {
  status: string;
  variant?: "success" | "warning" | "danger" | "neutral" | "info";
  dot?: boolean;
}

export const StatusPill: React.FC<StatusPillProps> = ({
  status,
  variant = "neutral",
  dot = true,
}) => {
  const colorMap = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
    neutral: "bg-gray-50 text-gray-700 border-gray-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
  };

  const dotColorMap = {
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-rose-500",
    neutral: "bg-gray-400",
    info: "bg-blue-500",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${colorMap[variant]}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColorMap[variant]}`} />}
      {status}
    </span>
  );
};
