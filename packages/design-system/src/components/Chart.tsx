import React from "react";

export interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface ChartProps {
  data: DataPoint[];
  type?: "bar" | "line" | "donut";
  title?: string;
  height?: number;
  color?: string;
}

export const Chart: React.FC<ChartProps> = ({
  data,
  type = "bar",
  title,
  height = 200,
  color = "#2874F0",
}) => {
  if (!data || data.length === 0) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center text-xs text-gray-400 bg-gray-50 border border-dashed rounded"
      >
        No chart data available
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  if (type === "donut") {
    const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
    let accumulatedAngle = 0;
    const radius = 60;
    const strokeWidth = 24;
    const center = 80;
    const circumference = 2 * Math.PI * radius;

    return (
      <div className="flex flex-col items-center">
        {title && <h4 className="text-xs font-bold text-gray-700 mb-2">{title}</h4>}
        <div className="flex items-center gap-6">
          <svg width={160} height={160} className="-rotate-90">
            {data.map((item, idx) => {
              const slicePercent = item.value / total;
              const strokeDasharray = `${slicePercent * circumference} ${circumference}`;
              const strokeDashoffset = -(accumulatedAngle * circumference);
              accumulatedAngle += slicePercent;
              const itemColor =
                item.color ||
                ["#2874F0", "#FB641B", "#388E3C", "#FF9F00", "#6A1B9A", "#0F9D58"][
                  idx % 6
                ];

              return (
                <circle
                  key={item.label}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="transparent"
                  stroke={itemColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-300 hover:opacity-80"
                />
              );
            })}
          </svg>
          <div className="flex flex-col gap-1.5 text-xs">
            {data.map((item, idx) => {
              const itemColor =
                item.color ||
                ["#2874F0", "#FB641B", "#388E3C", "#FF9F00", "#6A1B9A", "#0F9D58"][
                  idx % 6
                ];
              return (
                <div key={item.label} className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: itemColor }}
                  />
                  <span className="text-[#878787] truncate max-w-[100px]">
                    {item.label}
                  </span>
                  <span className="font-semibold text-[#212121]">
                    {Math.round((item.value / total) * 100)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (type === "line") {
    const width = 360;
    const padding = 20;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const points = data
      .map((d, idx) => {
        const x = padding + (idx / Math.max(1, data.length - 1)) * chartWidth;
        const y = height - padding - (d.value / maxValue) * chartHeight;
        return `${x},${y}`;
      })
      .join(" ");

    return (
      <div className="w-full">
        {title && <h4 className="text-xs font-bold text-gray-700 mb-2">{title}</h4>}
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          {/* Subtle grid lines */}
          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            stroke="#E0E0E0"
            strokeWidth="1"
          />
          <line
            x1={padding}
            y1={padding}
            x2={width - padding}
            y2={padding}
            stroke="#E0E0E0"
            strokeDasharray="3 3"
            strokeWidth="1"
          />
          {/* Path line */}
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
          {/* Data dots */}
          {data.map((d, idx) => {
            const x = padding + (idx / Math.max(1, data.length - 1)) * chartWidth;
            const y = height - padding - (d.value / maxValue) * chartHeight;
            return (
              <circle
                key={d.label}
                cx={x}
                cy={y}
                r="4"
                fill="#ffffff"
                stroke={color}
                strokeWidth="2"
              />
            );
          })}
        </svg>
        <div className="flex justify-between text-[10px] text-[#878787] mt-1 px-2">
          {data.map((d) => (
            <span key={d.label}>{d.label}</span>
          ))}
        </div>
      </div>
    );
  }

  // Default: Bar Chart
  return (
    <div className="w-full">
      {title && <h4 className="text-xs font-bold text-gray-700 mb-2">{title}</h4>}
      <div
        style={{ height }}
        className="flex items-end gap-2 border-b border-[#E0E0E0] pt-4 pb-1 px-1"
      >
        {data.map((item) => {
          const barHeightPercent = Math.round((item.value / maxValue) * 100);
          return (
            <div
              key={item.label}
              className="flex-1 flex flex-col items-center h-full justify-end group relative"
            >
              {/* Tooltip on hover */}
              <div className="absolute -top-7 hidden group-hover:block bg-[#212121] text-white text-[10px] px-1.5 py-0.5 rounded shadow whitespace-nowrap z-10">
                {item.value}
              </div>
              <div
                style={{
                  height: `${Math.max(4, barHeightPercent)}%`,
                  backgroundColor: item.color || color,
                }}
                className="w-full rounded-t transition-all duration-300 hover:brightness-110"
              />
              <span className="text-[10px] text-[#878787] mt-1 truncate max-w-full">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
