import React, { useState } from "react";
import { CheckCircle2, Clock, ChevronDown, ChevronUp, Cpu, Sparkles } from "lucide-react";
import type { ExecutionStep } from "../../../services/aiCommerceService";

interface AIToolExecutionTrackerProps {
  steps: ExecutionStep[];
  defaultExpanded?: boolean;
}

export const AIToolExecutionTracker: React.FC<AIToolExecutionTrackerProps> = ({
  steps,
  defaultExpanded = false,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (!steps || steps.length === 0) return null;

  const completedCount = steps.filter((s) => s.status?.toLowerCase() === "completed").length;
  const isAllCompleted = completedCount === steps.length;
  const latestActiveStep =
    steps.find((s) => s.status?.toLowerCase() === "running") || steps[steps.length - 1];

  const getStepName = (s?: ExecutionStep) => s?.step || (s as any)?.stepName || "Agent task";

  return (
    <div className="my-2 rounded-xl bg-slate-50 dark:bg-slate-850/80 border border-slate-200/80 dark:border-slate-800 text-xs overflow-hidden transition-all duration-200 shadow-2xs">
      {/* Tracker Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-2 flex items-center justify-between gap-2 text-left hover:bg-slate-100/70 dark:hover:bg-slate-800 transition cursor-pointer select-none"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-5 h-5 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
            {isAllCompleted ? (
              <Sparkles className="w-3 h-3 text-teal-600 dark:text-teal-400" />
            ) : (
              <Cpu className="w-3 h-3 animate-spin text-teal-600" />
            )}
          </div>
          <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] truncate">
            {isAllCompleted ? "Agent Execution Verified" : getStepName(latestActiveStep)}
          </span>
          <span className="text-[10px] font-semibold text-slate-500 shrink-0">
            ({completedCount}/{steps.length} steps)
          </span>
        </div>

        <div className="flex items-center gap-1 text-slate-400">
          <span className="text-[10px] uppercase font-semibold tracking-wider hidden sm:inline">
            {expanded ? "Hide Details" : "Inspect Tools"}
          </span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      {/* Expanded Steps List */}
      {expanded && (
        <div className="px-3 pb-2.5 pt-1 border-t border-slate-200/60 dark:border-slate-800/80 space-y-1.5">
          {steps.map((step, idx) => {
            const isDone = step.status?.toLowerCase() === "completed";
            const isRunning = step.status?.toLowerCase() === "running";

            return (
              <div key={idx} className="flex items-start gap-2 text-[11px]">
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                ) : isRunning ? (
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-teal-500 border-t-transparent animate-spin mt-0.5 shrink-0" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {getStepName(step)}
                  </span>
                  {step.detail && (
                    <span className="text-slate-500 dark:text-slate-400 ml-1.5 truncate">
                      — {step.detail}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AIToolExecutionTracker;
