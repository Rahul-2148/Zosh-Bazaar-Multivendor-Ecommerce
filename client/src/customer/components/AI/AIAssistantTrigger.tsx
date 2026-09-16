import React, { useEffect } from "react";
import { Sparkles } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../../Redux Toolkit/Store";
import { openAssistant } from "../../../Redux Toolkit/features/customer/AiAssistantSlice";

export const AIAssistantTrigger: React.FC = () => {
  const dispatch = useDispatch();
  const { isOpen } = useSelector((state: RootState) => state.aiAssistant);

  // Global keyboard shortcut: Alt + A or Cmd/Ctrl + J
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey && e.key.toLowerCase() === "a") || (e.ctrlKey && e.key.toLowerCase() === "j")) {
        e.preventDefault();
        dispatch(openAssistant());
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dispatch]);

  // If assistant panel is already open, do not show floating trigger
  if (isOpen) return null;

  return (
    <aside
      aria-label="AI Shopping Assistant Shortcut"
      className="fixed bottom-5 right-5 z-40 group"
    >
      <button
        type="button"
        onClick={() => dispatch(openAssistant())}
        className="relative flex items-center gap-2 px-3.5 py-2.5 sm:px-4 sm:py-2.5 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xl shadow-slate-900/20 hover:shadow-teal-500/25 hover:scale-105 active:scale-95 transition-all duration-200 border border-white/20 dark:border-slate-850 cursor-pointer select-none"
        title="Open Zosh AI Shopping Assistant (Alt+A)"
        aria-label="Open AI Shopping Assistant"
      >
        <div className="relative flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-400"></span>
          </span>
        </div>

        <span className="text-xs font-bold tracking-wide">Ask AI</span>

        <span className="hidden sm:inline-block text-[10px] font-mono opacity-50 px-1 py-0.2 rounded bg-white/10 dark:bg-black/10">
          Alt+A
        </span>
      </button>
    </aside>
  );
};

export default AIAssistantTrigger;
