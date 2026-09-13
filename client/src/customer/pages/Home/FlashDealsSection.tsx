import React, { useState, useEffect } from "react";
import { Bolt, TimerOutlined, ArrowForwardIos } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

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
        {deals.slice(0, 6).map((product) => {
          const sellingPrice = product.sellingPrice || product.mrpPrice || 0;
          const mrpPrice = product.mrpPrice || sellingPrice;
          const discount =
            mrpPrice > sellingPrice
              ? Math.round(((mrpPrice - sellingPrice) / mrpPrice) * 100)
              : 0;

          return (
            <div
              key={product._id}
              onClick={() =>
                navigate(
                  `/product-details/${product.category?.categoryId || "all"}/${encodeURIComponent(product.title)}/${product._id}`
                )
              }
              className="group bg-card border border-border/80 hover:border-amber-500/60 rounded-xl p-2.5 sm:p-3 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="relative w-full h-[130px] sm:h-[150px] rounded-lg bg-muted/30 overflow-hidden mb-2 p-2 flex items-center justify-center">
                <img
                  src={product.images?.[0] || ""}
                  alt={product.title}
                  className="w-full h-full object-contain group-hover:scale-106 transition-transform duration-300"
                  loading="lazy"
                />
                {discount > 0 && (
                  <span className="absolute top-2 left-2 bg-destructive text-destructive-foreground font-black text-[9px] sm:text-[10px] uppercase tracking-tight px-1.5 py-0.5 rounded-md shadow-xs">
                    {discount}% OFF
                  </span>
                )}
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block truncate">
                  {product.brand || "Authentic"}
                </span>
                <h4 className="text-xs sm:text-[13px] font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                  {product.title}
                </h4>
                <div className="flex items-baseline gap-1.5 pt-1">
                  <span className="text-xs sm:text-sm font-black text-foreground">
                    ₹{sellingPrice.toLocaleString("en-IN")}
                  </span>
                  {mrpPrice > sellingPrice && (
                    <span className="text-[10px] sm:text-xs line-through text-muted-foreground font-medium">
                      ₹{mrpPrice.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default FlashDealsSection;
