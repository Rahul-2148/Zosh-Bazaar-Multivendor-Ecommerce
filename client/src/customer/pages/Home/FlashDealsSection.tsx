import React, { useState, useEffect } from "react";
import { Bolt, TimerOutlined, ArrowForwardIos } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import ProductCard from "../Product/ProductCard";

interface FlashDealsProps {
  deals: any[];
}

export const FlashDealsSection: React.FC<FlashDealsProps> = ({ deals }) => {
  const navigate = useNavigate();

  // Real countdown timer towards end of day (23:59:59)
  const calculateTimeLeft = () => {
    const now = new Date();
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59
    );
    const diff = Math.max(0, Math.floor((endOfDay.getTime() - now.getTime()) / 1000));
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
    return { hours, minutes, seconds };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!deals || deals.length === 0) {
    return null;
  }

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <section className="mx-3 sm:mx-6 lg:mx-16 xl:mx-20 my-3 sm:my-4 p-3.5 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-card to-primary/5 border border-amber-500/25 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-amber-500 text-white flex items-center justify-center">
              <Bolt sx={{ fontSize: 16 }} />
            </span>
            <h3 className="text-base sm:text-xl font-black text-foreground tracking-tight">
              Flash Deals & Lightning Offers
            </h3>
          </div>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
            Limited-time price drops from certified marketplace sellers
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Live Countdown Badge */}
          <div className="flex items-center gap-2 bg-card/90 border border-border px-3 py-1 rounded-xl shadow-xs shrink-0 self-start sm:self-auto">
            <TimerOutlined sx={{ fontSize: 15 }} className="text-amber-500" />
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Ends in:
            </span>
            <div className="flex items-center gap-1 font-mono text-xs font-black text-foreground">
              <span className="bg-muted px-1.5 py-0.2 rounded">{pad(timeLeft.hours)}h</span>
              <span>:</span>
              <span className="bg-muted px-1.5 py-0.2 rounded">{pad(timeLeft.minutes)}m</span>
              <span>:</span>
              <span className="bg-muted px-1.5 py-0.2 rounded text-amber-600 dark:text-amber-400">
                {pad(timeLeft.seconds)}s
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/products?minDiscount=20")}
            className="text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400 hover:text-amber-500 flex items-center gap-1 transition-colors cursor-pointer group"
          >
            <span>View All</span>
            <ArrowForwardIos sx={{ fontSize: 11 }} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3.5">
        {deals.slice(0, 6).map((product) => (
          <ProductCard
            key={product._id || product.productId}
            item={product}
            badge="Flash Deal"
            className="border-amber-500/30 hover:border-amber-500 shadow-amber-500/5"
          />
        ))}
      </div>
    </section>
  );
};

export default FlashDealsSection;
