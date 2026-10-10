import React from "react";

export interface ToastProps {
  id?: string;
  type?: "success" | "error" | "warning" | "info";
  title?: string;
  message: string;
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  type = "info",
  title,
  message,
  onClose,
}) => {
  const borderStyles = {
    success: "border-l-4 border-l-[#388E3C] bg-white",
    error: "border-l-4 border-l-[#FF6161] bg-white",
    warning: "border-l-4 border-l-[#FF9F00] bg-white",
    info: "border-l-4 border-l-[#2874F0] bg-white",
  };

  const iconMap = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ℹ",
  };

  const iconColors = {
    success: "text-[#388E3C] bg-emerald-50",
    error: "text-[#FF6161] bg-rose-50",
    warning: "text-[#FF9F00] bg-amber-50",
    info: "text-[#2874F0] bg-blue-50",
  };

  return (
    <div
      className={`flex items-start gap-3 p-3.5 rounded shadow-[0_2px_8px_rgba(0,0,0,0.12)] border border-gray-100 ${borderStyles[type]} max-w-sm w-full animate-in slide-in-from-top-2 duration-150`}
      role="alert"
    >
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${iconColors[type]}`}
      >
        {iconMap[type]}
      </div>
      <div className="flex-1 min-w-0">
        {title && <h5 className="text-xs font-bold text-[#212121] leading-tight">{title}</h5>}
        <p className="text-xs text-[#878787] mt-0.5 leading-relaxed">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-xs shrink-0 p-1"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export interface SnackbarProps {
  message: string;
  actionText?: string;
  onAction?: () => void;
  isOpen: boolean;
}

export const Snackbar: React.FC<SnackbarProps> = ({
  message,
  actionText,
  onAction,
  isOpen,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-[#212121] text-white px-4 py-2.5 rounded shadow-lg text-sm max-w-md w-[90%] md:w-auto">
      <span className="flex-1 truncate">{message}</span>
      {actionText && (
        <button
          onClick={onAction}
          className="text-[#FB641B] font-bold hover:underline shrink-0 text-xs uppercase tracking-wider"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
