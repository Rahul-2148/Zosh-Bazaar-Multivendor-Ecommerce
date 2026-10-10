import React from "react";

export interface KanbanColumn<T> {
  id: string;
  title: string;
  color?: string;
  items: T[];
}

export interface KanbanProps<T> {
  columns: KanbanColumn<T>[];
  renderCard: (item: T, columnId: string) => React.ReactNode;
  onItemMove?: (itemId: string, fromColumnId: string, toColumnId: string) => void;
}

export function Kanban<T extends { id: string }>({
  columns,
  renderCard,
}: KanbanProps<T>) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 select-none">
      {columns.map((col) => (
        <div
          key={col.id}
          className="flex-1 min-w-[280px] max-w-[340px] bg-[#F1F3F6] rounded border border-[#E0E0E0] p-3 flex flex-col"
        >
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: col.color || "#2874F0" }}
              />
              <h4 className="text-xs font-bold text-[#212121] uppercase tracking-wider">
                {col.title}
              </h4>
            </div>
            <span className="text-[10px] bg-white text-gray-600 px-2 py-0.5 rounded-full font-bold shadow-xs">
              {col.items.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 min-h-[150px]">
            {col.items.map((item) => (
              <div key={item.id} className="transition-all hover:shadow-md">
                {renderCard(item, col.id)}
              </div>
            ))}
            {col.items.length === 0 && (
              <div className="h-20 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-[11px] text-gray-400">
                Empty
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export interface TimelineEvent {
  id: string;
  title: string;
  timestamp: string;
  description?: string;
  completed?: boolean;
  active?: boolean;
  color?: string;
}

export interface TimelineProps {
  events: TimelineEvent[];
}

export const Timeline: React.FC<TimelineProps> = ({ events }) => {
  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E0E0E0]">
      {events.map((event) => (
        <div key={event.id} className="relative group">
          <span
            className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-white transition-all ${
              event.active
                ? "bg-[#2874F0] ring-4 ring-[#2874F0]/20"
                : event.completed
                ? "bg-[#388E3C]"
                : "bg-gray-300"
            }`}
            style={event.color ? { backgroundColor: event.color } : undefined}
          />
          <div>
            <div className="flex items-baseline justify-between">
              <h5 className="text-xs font-bold text-[#212121]">{event.title}</h5>
              <span className="text-[10px] text-[#878787]">{event.timestamp}</span>
            </div>
            {event.description && (
              <p className="text-xs text-[#878787] mt-0.5">{event.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export interface StepperProps {
  steps: string[];
  currentStep: number;
}

export const Stepper: React.FC<StepperProps> = ({ steps, currentStep }) => {
  return (
    <div className="flex items-center justify-between w-full">
      {steps.map((step, idx) => {
        const isDone = idx < currentStep;
        const isCurrent = idx === currentStep;

        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isDone
                    ? "bg-[#388E3C] text-white"
                    : isCurrent
                    ? "bg-[#2874F0] text-white ring-4 ring-[#2874F0]/20"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {isDone ? "✓" : idx + 1}
              </div>
              <span
                className={`text-[11px] mt-1 text-center font-medium ${
                  isCurrent ? "text-[#2874F0] font-bold" : "text-[#878787]"
                }`}
              >
                {step}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-2 -mt-4 transition-all ${
                  idx < currentStep ? "bg-[#388E3C]" : "bg-gray-200"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export interface TabItem {
  id: string;
  label: string;
  badge?: string | number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: "line" | "pill";
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = "line",
}) => {
  return (
    <div
      className={`flex items-center gap-2 overflow-x-auto ${
        variant === "line" ? "border-b border-[#E0E0E0]" : ""
      }`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        if (variant === "pill") {
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-[#2874F0] text-white shadow-xs"
                  : "bg-gray-100 text-[#878787] hover:bg-gray-200 hover:text-[#212121]"
              }`}
            >
              {tab.label}
              {tab.badge !== undefined && (
                <span
                  className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] ${
                    isActive ? "bg-white/20 text-white" : "bg-gray-300 text-gray-700"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        }

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
              isActive
                ? "border-[#2874F0] text-[#2874F0]"
                : "border-transparent text-[#878787] hover:text-[#212121] hover:border-gray-300"
            }`}
          >
            {tab.label}
            {tab.badge !== undefined && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-gray-100 text-[#878787] rounded-full text-[10px]">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
