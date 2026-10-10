import React, { useEffect, useState } from "react";

export interface CommandItem {
  id: string;
  title: string;
  category?: string;
  icon?: React.ReactNode;
  shortcut?: string;
  onSelect: () => void;
}

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: CommandItem[];
  placeholder?: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  commands,
  placeholder = "Type a command or search...",
}) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        // Toggle or open handled by caller
      }
      if (!isOpen) return;
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = commands.filter((cmd) =>
    cmd.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white rounded shadow-2xl overflow-hidden border border-[#E0E0E0] z-10 animate-in fade-in zoom-in-95 duration-100">
        <div className="flex items-center px-4 border-b border-[#E0E0E0]">
          <span className="text-gray-400 mr-2 text-sm">🔍</span>
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder={placeholder}
            className="w-full py-3.5 text-sm text-[#212121] bg-transparent outline-none"
          />
          <kbd className="text-[10px] bg-gray-100 border border-gray-300 rounded px-1.5 py-0.5 text-gray-500">
            ESC
          </kbd>
        </div>

        <div className="max-h-72 overflow-y-auto p-2 divide-y divide-gray-50">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-xs text-gray-400">
              No results found for "{query}"
            </div>
          ) : (
            filtered.map((cmd, idx) => (
              <button
                key={cmd.id}
                onClick={() => {
                  cmd.onSelect();
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded text-xs text-left transition-colors ${
                  idx === selectedIndex
                    ? "bg-blue-50 text-[#2874F0] font-medium"
                    : "text-[#212121] hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {cmd.icon && <span className="text-gray-400">{cmd.icon}</span>}
                  <span>{cmd.title}</span>
                  {cmd.category && (
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider ml-1">
                      • {cmd.category}
                    </span>
                  )}
                </div>
                {cmd.shortcut && (
                  <kbd className="text-[10px] bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 text-gray-400">
                    {cmd.shortcut}
                  </kbd>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export interface LiveCounterProps {
  count: number;
  label?: string;
  prefix?: string;
  suffix?: string;
  color?: string;
}

export const LiveCounter: React.FC<LiveCounterProps> = ({
  count,
  label,
  prefix = "",
  suffix = "",
  color = "#2874F0",
}) => {
  return (
    <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-white border border-[#E0E0E0] rounded shadow-xs">
      <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: color }} />
      <span className="text-xs font-bold text-[#212121]">
        {prefix}
        {count.toLocaleString()}
        {suffix}
      </span>
      {label && <span className="text-[10px] text-[#878787] uppercase font-semibold">{label}</span>}
    </div>
  );
};

export interface ProgressRingProps {
  progress: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 56,
  strokeWidth = 5,
  color = "#2874F0",
  label,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, progress));
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E0E0E0"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-300"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[#212121]">
          {clamped}%
        </div>
      </div>
      {label && <span className="text-[10px] text-[#878787] mt-1">{label}</span>}
    </div>
  );
};
