import React, { useState } from "react";
import { X, Check, Ruler, Info } from "lucide-react";

export interface SizeChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: string;
  onSelectSize?: (size: string) => void;
  selectedSize?: string;
}

export const SizeChartModal: React.FC<SizeChartModalProps> = ({
  isOpen,
  onClose,
  category = "apparel",
  onSelectSize,
  selectedSize,
}) => {
  const [unit, setUnit] = useState<"in" | "cm">("in");
  const [activeTab, setActiveTab] = useState<"chart" | "measure">("chart");

  if (!isOpen) return null;

  const isFootwear =
    (category || "").toLowerCase().includes("footwear") ||
    (category || "").toLowerCase().includes("shoes") ||
    (category || "").toLowerCase().includes("sneakers");

  // Apparel Sizes Database
  const apparelData = [
    { size: "XS", chestIn: 34, chestCm: 86, waistIn: 28, waistCm: 71, lengthIn: 26, lengthCm: 66, shoulderIn: 16.5, shoulderCm: 42 },
    { size: "S", chestIn: 36, chestCm: 91, waistIn: 30, waistCm: 76, lengthIn: 27, lengthCm: 69, shoulderIn: 17.5, shoulderCm: 44.5 },
    { size: "M", chestIn: 38, chestCm: 97, waistIn: 32, waistCm: 81, lengthIn: 28, lengthCm: 71, shoulderIn: 18.5, shoulderCm: 47 },
    { size: "L", chestIn: 40, chestCm: 102, waistIn: 34, waistCm: 86, lengthIn: 29, lengthCm: 74, shoulderIn: 19.5, shoulderCm: 49.5 },
    { size: "XL", chestIn: 42, chestCm: 107, waistIn: 36, waistCm: 91, lengthIn: 30, lengthCm: 76, shoulderIn: 20.5, shoulderCm: 52 },
    { size: "XXL", chestIn: 44, chestCm: 112, waistIn: 38, waistCm: 97, lengthIn: 31, lengthCm: 79, shoulderIn: 21.5, shoulderCm: 54.5 },
    { size: "3XL", chestIn: 46, chestCm: 117, waistIn: 40, waistCm: 102, lengthIn: 32, lengthCm: 81, shoulderIn: 22.5, shoulderCm: 57 },
  ];

  // Footwear Sizes Database
  const footwearData = [
    { uk: "6", us: "7", eu: "40", lengthCm: "24.5", lengthIn: "9.6" },
    { uk: "7", us: "8", eu: "41", lengthCm: "25.4", lengthIn: "10.0" },
    { uk: "8", us: "9", eu: "42", lengthCm: "26.0", lengthIn: "10.2" },
    { uk: "9", us: "10", eu: "43", lengthCm: "27.0", lengthIn: "10.6" },
    { uk: "10", us: "11", eu: "44", lengthCm: "27.9", lengthIn: "11.0" },
    { uk: "11", us: "12", eu: "45", lengthCm: "28.6", lengthIn: "11.3" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-card text-card-foreground rounded-2xl sm:rounded-3xl border border-border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="size-chart-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-primary/10 text-primary">
              <Ruler className="w-5 h-5" />
            </span>
            <div>
              <h2 id="size-chart-title" className="text-base sm:text-lg font-black tracking-tight">
                {isFootwear ? "Footwear Size Guide" : "Apparel Size Chart & Fit Guide"}
              </h2>
              <p className="text-[11px] text-muted-foreground font-medium">
                Standard Indian sizing with verified garment measurements
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
            aria-label="Close size chart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-Header Tabs & Unit Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 border-b border-border bg-muted/10">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("chart")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === "chart"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Measurements Table
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("measure")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === "measure"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              How to Measure
            </button>
          </div>

          {activeTab === "chart" && (
            <div className="flex items-center gap-1 bg-muted p-0.5 rounded-lg border border-border">
              <button
                type="button"
                onClick={() => setUnit("in")}
                className={`px-2.5 py-0.5 text-xs font-bold rounded-md transition ${
                  unit === "in"
                    ? "bg-card text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Inches (in)
              </button>
              <button
                type="button"
                onClick={() => setUnit("cm")}
                className={`px-2.5 py-0.5 text-xs font-bold rounded-md transition ${
                  unit === "cm"
                    ? "bg-card text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Centimeters (cm)
              </button>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {activeTab === "chart" ? (
            isFootwear ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-[11px] font-black uppercase text-muted-foreground">
                      <th className="py-2.5 px-3">UK / India</th>
                      <th className="py-2.5 px-3">US Men</th>
                      <th className="py-2.5 px-3">EU</th>
                      <th className="py-2.5 px-3">Foot Length ({unit})</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {footwearData.map((row) => {
                      const isRowSelected = selectedSize === row.uk;
                      return (
                        <tr
                          key={row.uk}
                          className={`hover:bg-muted/30 transition-colors ${
                            isRowSelected ? "bg-primary/10 font-bold" : ""
                          }`}
                        >
                          <td className="py-2.5 px-3 font-bold text-foreground">{row.uk}</td>
                          <td className="py-2.5 px-3">{row.us}</td>
                          <td className="py-2.5 px-3">{row.eu}</td>
                          <td className="py-2.5 px-3 font-mono">
                            {unit === "cm" ? `${row.lengthCm} cm` : `${row.lengthIn} in`}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {onSelectSize && (
                              <button
                                type="button"
                                onClick={() => {
                                  onSelectSize(row.uk);
                                  onClose();
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                                  isRowSelected
                                    ? "bg-primary text-primary-foreground"
                                    : "border border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
                                }`}
                              >
                                {isRowSelected ? "Selected" : "Select"}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-[11px] font-black uppercase text-muted-foreground">
                      <th className="py-2.5 px-3">Size</th>
                      <th className="py-2.5 px-3">Chest ({unit})</th>
                      <th className="py-2.5 px-3">Waist ({unit})</th>
                      <th className="py-2.5 px-3">Length ({unit})</th>
                      <th className="py-2.5 px-3">Shoulder ({unit})</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {apparelData.map((row) => {
                      const isRowSelected = (selectedSize || "").toUpperCase() === row.size;
                      return (
                        <tr
                          key={row.size}
                          className={`hover:bg-muted/30 transition-colors ${
                            isRowSelected ? "bg-primary/10 font-bold" : ""
                          }`}
                        >
                          <td className="py-2.5 px-3 font-black text-foreground">{row.size}</td>
                          <td className="py-2.5 px-3 font-mono">
                            {unit === "cm" ? `${row.chestCm} cm` : `${row.chestIn} in`}
                          </td>
                          <td className="py-2.5 px-3 font-mono">
                            {unit === "cm" ? `${row.waistCm} cm` : `${row.waistIn} in`}
                          </td>
                          <td className="py-2.5 px-3 font-mono">
                            {unit === "cm" ? `${row.lengthCm} cm` : `${row.lengthIn} in`}
                          </td>
                          <td className="py-2.5 px-3 font-mono">
                            {unit === "cm" ? `${row.shoulderCm} cm` : `${row.shoulderIn} in`}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {onSelectSize && (
                              <button
                                type="button"
                                onClick={() => {
                                  onSelectSize(row.size);
                                  onClose();
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                                  isRowSelected
                                    ? "bg-primary text-primary-foreground shadow-xs"
                                    : "border border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
                                }`}
                              >
                                {isRowSelected ? "Selected" : "Select"}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <div className="space-y-4 text-xs leading-relaxed">
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <p>
                  For the most accurate fit, keep the measuring tape comfortably snug but not tight.
                  If your measurements fall between two sizes, we recommend selecting the larger size for a relaxed fit or the smaller size for a tailored slim fit.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-xl border border-border bg-card space-y-1">
                  <span className="font-bold text-foreground">1. Chest / Bust</span>
                  <p className="text-muted-foreground text-[11px]">
                    Measure around the fullest part of your chest, keeping the tape horizontal under your arms and across your shoulder blades.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border border-border bg-card space-y-1">
                  <span className="font-bold text-foreground">2. Waist</span>
                  <p className="text-muted-foreground text-[11px]">
                    Measure around your natural waistline, which is typically the narrowest part of your torso, keeping the tape comfortably loose.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border border-border bg-card space-y-1">
                  <span className="font-bold text-foreground">3. Shoulder Width</span>
                  <p className="text-muted-foreground text-[11px]">
                    Measure from the outer edge of one shoulder bone across the back of your neck to the opposite shoulder edge.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border border-border bg-card space-y-1">
                  <span className="font-bold text-foreground">4. Garment Length</span>
                  <p className="text-muted-foreground text-[11px]">
                    Measured straight down from the highest point of the shoulder seam to the bottom hem of the garment.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border bg-muted/30 flex items-center justify-between text-xs">
          <span className="text-muted-foreground flex items-center gap-1">
            <Check className="w-3.5 h-3.5 text-emerald-500" /> Hassle-free 7-day size exchange
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SizeChartModal;
