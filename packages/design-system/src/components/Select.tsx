import React from "react";

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  error,
  helperText,
  fullWidth = true,
  className = "",
  id,
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className={`${fullWidth ? "w-full" : "inline-block"} flex flex-col gap-1`}>
      {label && (
        <label htmlFor={selectId} className="text-xs font-semibold text-[#212121]">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          className={`h-10 text-sm rounded border bg-white px-3 pr-8 text-[#212121] appearance-none transition-colors duration-150 focus:outline-none focus:ring-2 disabled:bg-gray-50 disabled:text-gray-400 ${
            error
              ? "border-[#FF6161] focus:ring-[#FF6161]/30 focus:border-[#FF6161]"
              : "border-[#E0E0E0] focus:ring-[#2874F0]/30 focus:border-[#2874F0]"
          } ${fullWidth ? "w-full" : ""} ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>
      {error ? (
        <p className="text-xs text-[#FF6161] mt-0.5">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-[#878787] mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
};
