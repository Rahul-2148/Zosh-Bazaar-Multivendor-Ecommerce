import React from "react";

export interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  variant?: "text" | "rectangular" | "circular";
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  width,
  height,
  variant = "rectangular",
}) => {
  const variantStyles = {
    text: "rounded h-4 my-1",
    rectangular: "rounded",
    circular: "rounded-full",
  };

  const style: React.CSSProperties = {
    width: width,
    height: height,
  };

  return (
    <div
      style={style}
      className={`animate-pulse bg-gray-200/80 ${variantStyles[variant]} ${className}`}
    />
  );
};

export interface LoaderProps {
  size?: "sm" | "md" | "lg";
  color?: string;
  label?: string;
}

export const Loader: React.FC<LoaderProps> = ({
  size = "md",
  color = "#2874F0",
  label,
}) => {
  const sizeMap = {
    sm: "w-5 h-5 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4",
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 gap-3">
      <div
        className={`rounded-full animate-spin border-t-transparent ${sizeMap[size]}`}
        style={{ borderColor: `${color} transparent transparent transparent`, borderRightColor: color, borderBottomColor: color, borderLeftColor: color }}
      />
      {label && <p className="text-xs text-[#878787] font-medium">{label}</p>}
    </div>
  );
};

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionText,
  onAction,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 bg-white border border-[#E0E0E0] rounded my-4 ${className}`}
    >
      <div className="w-16 h-16 rounded-full bg-blue-50 text-[#2874F0] flex items-center justify-center mb-4 text-2xl">
        {icon || "📦"}
      </div>
      <h3 className="text-base font-bold text-[#212121]">{title}</h3>
      {description && (
        <p className="text-xs text-[#878787] max-w-sm mt-1 mb-4 leading-relaxed">
          {description}
        </p>
      )}
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2 bg-[#2874F0] hover:bg-[#125cd4] text-white text-xs font-semibold rounded shadow-sm transition-all"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export interface ErrorStateProps {
  title?: string;
  message?: string;
  retryText?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Something went wrong",
  message = "We encountered an unexpected error while loading this data. Please try again.",
  retryText = "Try Again",
  onRetry,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 bg-rose-50/50 border border-rose-200 rounded my-4 ${className}`}
    >
      <div className="w-14 h-14 rounded-full bg-rose-100 text-[#FF6161] flex items-center justify-center mb-3 text-2xl font-bold">
        ⚠️
      </div>
      <h3 className="text-base font-bold text-[#212121]">{title}</h3>
      <p className="text-xs text-[#878787] max-w-md mt-1 mb-4 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-[#212121] text-xs font-medium rounded shadow-xs transition-all"
        >
          {retryText}
        </button>
      )}
    </div>
  );
};
