import React from "react";

export interface SearchBarProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit?: (e: React.FormEvent) => void;
  placeholder?: string;
  onVoiceClick?: () => void;
  onCameraClick?: () => void;
  className?: string;
  autoFocus?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder = "Search for Products, Brands and More",
  onVoiceClick,
  onCameraClick,
  className = "",
  autoFocus = false,
}) => {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.(e);
      }}
      className={`relative flex items-center w-full bg-white rounded shadow-xs border border-transparent focus-within:border-[#2874F0] focus-within:ring-1 focus-within:ring-[#2874F0]/30 transition-all ${className}`}
    >
      {/* Search Magnifier Icon */}
      <div className="pl-3.5 pr-2 text-[#2874F0] shrink-0">
        <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2.2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>

      <input
        type="text"
        value={value}
        onChange={onChange}
        autoFocus={autoFocus}
        placeholder={placeholder}
        className="w-full h-10 py-2 pr-2 text-sm text-[#212121] bg-transparent outline-none placeholder:text-gray-400 placeholder:text-xs md:placeholder:text-sm"
      />

      {/* Action Buttons: Camera & Mic */}
      <div className="flex items-center gap-1 pr-2 shrink-0">
        {onCameraClick && (
          <button
            type="button"
            onClick={onCameraClick}
            title="Visual Search (Camera / Lens)"
            aria-label="Visual Search"
            className="p-1.5 text-gray-500 hover:text-[#2874F0] hover:bg-blue-50 rounded transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        )}

        {onVoiceClick && (
          <button
            type="button"
            onClick={onVoiceClick}
            title="Voice Search"
            aria-label="Voice Search"
            className="p-1.5 text-gray-500 hover:text-[#2874F0] hover:bg-blue-50 rounded transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
        )}
      </div>
    </form>
  );
};
