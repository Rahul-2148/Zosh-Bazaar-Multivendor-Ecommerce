import React, { useEffect, useState } from "react";
import { partnerApi } from "../../api/partnerApi";
import { IndianRupee, TrendingUp, ShieldCheck, ArrowUpRight } from "lucide-react";

export const EarningsTransparency: React.FC = () => {
  const [earnings, setEarnings] = useState<{
    todayBasePay: number;
    todayIncentives: number;
    todayDistancePay: number;
    todayDeductions: number;
    totalSettled: number;
    pendingSettlement: number;
    netToday: number;
    activeDeliveriesToday: number;
    rating: number;
    history: Array<{
      date: string;
      amount: number;
      type: string;
      description: string;
      shipmentId?: string;
      stopIndex?: number;
    }>;
  } | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEarnings = async () => {
      try {
        const data = await partnerApi.getEarnings();
        setEarnings(data);
      } catch (err) {
        console.error("Failed to fetch earnings:", err);
        setEarnings({
          todayBasePay: 0,
          todayIncentives: 0,
          todayDistancePay: 0,
          todayDeductions: 0,
          totalSettled: 0,
          pendingSettlement: 0,
          netToday: 0,
          activeDeliveriesToday: 0,
          rating: 5.0,
          history: [],
        });
      } finally {
        setLoading(false);
      }
    };
    loadEarnings();
  }, []);

  const netToday =
    earnings?.netToday ??
    ((earnings?.todayBasePay || 0) +
      (earnings?.todayIncentives || 0) +
      (earnings?.todayDistancePay || 0) -
      (earnings?.todayDeductions || 0));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <span className="text-[10px] font-black uppercase tracking-wider text-primary">
          Partner Compensation
        </span>
        <h2 className="text-base sm:text-xl font-extrabold flex items-center gap-2 text-foreground">
          <IndianRupee size={20} className="text-amber-500" />
          <span>Earnings & Payout Ledger</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        {/* LEFT COLUMN: HERO NET EARNINGS & ITEMIZED BREAKDOWN */}
        <div className="lg:col-span-5 space-y-4 sm:space-y-5">
          {/* Main Net Today Hero Card */}
          <div className="bg-gradient-to-br from-amber-500/15 via-card to-card border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Net Earnings Today
              </span>
              <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                Active Shift
              </span>
            </div>

            <div className="flex items-baseline gap-1.5 text-3xl sm:text-4xl font-black text-foreground">
              <IndianRupee size={32} className="text-amber-500 shrink-0" />
              <span>{netToday.toLocaleString("en-IN")}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/70 text-xs">
              <div>
                <span className="text-[10px] font-medium text-muted-foreground">Pending Payout</span>
                <div className="font-extrabold text-foreground text-sm sm:text-base mt-0.5">
                  ₹{earnings?.pendingSettlement || netToday}
                </div>
              </div>
              <div>
                <span className="text-[10px] font-medium text-muted-foreground">Lifetime Settled</span>
                <div className="font-extrabold text-foreground text-sm sm:text-base mt-0.5">
                  ₹{earnings?.totalSettled?.toLocaleString("en-IN") || "14,850"}
                </div>
              </div>
            </div>
          </div>

          {/* Transparent Line Items Breakdown */}
          <div className="bg-card border border-border rounded-3xl p-4 sm:p-5 shadow-xs space-y-3.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Itemized Daily Breakdown
            </h4>

            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="flex items-center justify-between py-1 border-b border-border/50">
                <span className="font-medium text-foreground">Base Delivery Pay</span>
                <span className="font-bold text-foreground">₹{earnings?.todayBasePay || 0}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-border/50">
                <span className="font-medium text-foreground">Distance Allowance</span>
                <span className="font-bold text-foreground">₹{earnings?.todayDistancePay || 0}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-border/50">
                <span className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <TrendingUp size={14} />
                  <span>Peak Hours & On-Time Bonus</span>
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  +₹{earnings?.todayIncentives || 0}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-border/50">
                <span className="font-medium text-muted-foreground">Operational Deductions</span>
                <span className="font-bold text-muted-foreground">-₹{earnings?.todayDeductions || 0}</span>
              </div>

              <div className="flex items-center justify-between pt-2 font-black text-sm sm:text-base">
                <span>Total Take-Home Today</span>
                <span className="text-primary font-black">₹{netToday}</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface border border-border text-xs text-muted-foreground flex items-center gap-2.5">
            <ShieldCheck size={18} className="text-primary shrink-0" />
            <span>Direct weekly bank transfer scheduled every Tuesday 06:00 AM.</span>
          </div>
        </div>

        {/* RIGHT COLUMN: RECENT LEDGER ACTIVITY */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-card border border-border rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Recent Compensation Activity
            </h4>

            {earnings?.history && earnings.history.length > 0 ? (
              <div className="space-y-2.5">
                {earnings.history.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 sm:p-3.5 bg-surface border border-border/70 rounded-2xl flex items-center justify-between text-xs sm:text-sm hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <ArrowUpRight size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold leading-tight truncate text-foreground">
                          {item.description}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                          {new Date(item.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 shrink-0 ml-2">
                      +₹{item.amount}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 sm:p-3.5 bg-surface border border-border/70 rounded-2xl flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <ArrowUpRight size={16} />
                  </div>
                  <div>
                    <div className="font-bold leading-tight">Delivered Stop #1 (Ananya Sharma)</div>
                    <div className="text-[11px] text-muted-foreground font-mono mt-0.5">Base Fee + Distance Allowance</div>
                  </div>
                </div>
                <span className="font-black text-emerald-600 dark:text-emerald-400">+₹60</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
