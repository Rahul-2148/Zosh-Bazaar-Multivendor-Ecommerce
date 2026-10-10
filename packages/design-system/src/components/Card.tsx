import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  elevated?: boolean;
  bordered?: boolean;
  interactive?: boolean;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  elevated = false,
  bordered = true,
  interactive = false,
  header,
  footer,
  className = "",
  ...props
}) => {
  return (
    <div
      className={`bg-white rounded ${
        bordered ? "border border-[#E0E0E0]" : ""
      } ${
        elevated
          ? "shadow-[0_2px_8px_rgba(0,0,0,0.12)]"
          : "shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
      } ${
        interactive
          ? "transition-all duration-150 hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 cursor-pointer"
          : ""
      } ${className}`}
      {...props}
    >
      {header && <div className="border-b border-[#E0E0E0] px-4 py-3">{header}</div>}
      <div className="p-4">{children}</div>
      {footer && <div className="border-t border-[#E0E0E0] px-4 py-3 bg-gray-50/50">{footer}</div>}
    </div>
  );
};

export interface StatCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  accentColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subValue,
  trend,
  icon,
  accentColor = "#2874F0",
}) => {
  return (
    <div className="bg-white border border-[#E0E0E0] rounded p-4 shadow-[0_1px_2px_rgba(0,0,0,0.08)] flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-[#878787] uppercase tracking-wider">
          {title}
        </span>
        {icon && (
          <div
            className="w-8 h-8 rounded flex items-center justify-center text-white"
            style={{ backgroundColor: accentColor }}
          >
            {icon}
          </div>
        )}
      </div>
      <div>
        <div className="text-2xl font-bold text-[#212121] tracking-tight">{value}</div>
        <div className="flex items-center gap-2 mt-1">
          {trend && (
            <span
              className={`text-xs font-semibold inline-flex items-center ${
                trend.isPositive ? "text-[#388E3C]" : "text-[#FF6161]"
              }`}
            >
              {trend.isPositive ? "↑ " : "↓ "}
              {trend.value}
            </span>
          )}
          {subValue && <span className="text-xs text-[#878787]">{subValue}</span>}
        </div>
      </div>
    </div>
  );
};

export interface KPIWidgetProps {
  label: string;
  metric: string | number;
  target?: string;
  progressPercent?: number;
  badgeText?: string;
}

export const KPIWidget: React.FC<KPIWidgetProps> = ({
  label,
  metric,
  target,
  progressPercent,
  badgeText,
}) => {
  return (
    <div className="bg-white border border-[#E0E0E0] rounded p-3 shadow-xs">
      <div className="flex justify-between items-start mb-1">
        <span className="text-xs text-[#878787] font-medium">{label}</span>
        {badgeText && (
          <span className="text-[10px] bg-blue-50 text-[#2874F0] px-1.5 py-0.5 rounded font-bold">
            {badgeText}
          </span>
        )}
      </div>
      <div className="text-xl font-bold text-[#212121]">{metric}</div>
      {progressPercent !== undefined && (
        <div className="mt-2">
          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-[#2874F0] h-1.5 rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            />
          </div>
          {target && (
            <div className="flex justify-between text-[11px] text-[#878787] mt-1">
              <span>Target: {target}</span>
              <span>{progressPercent}%</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
