import React from "react";
import { Star, ArrowForwardIos } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import SaveButton from "../Wishlist/components/SaveButton";

interface ProductRailProps {
  title: string;
  subtitle: string;
  products: any[];
  badge?: string;
  viewAllUrl?: string;
}

export const ProductRail: React.FC<ProductRailProps> = ({
  title,
  subtitle,
  products,
  badge,
  viewAllUrl,
}) => {
  const navigate = useNavigate();

  if (!products || products.length === 0) {
    return null;
  }

  const handleViewAll = () => {
    if (viewAllUrl) {
      navigate(viewAllUrl);
    } else {
      navigate("/products");
    }
  };

  return (
    <section className="mx-3 sm:mx-6 lg:mx-16 xl:mx-20 my-3 sm:my-5">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-2.5 sm:mb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-xl font-black text-foreground tracking-tight">
              {title}
            </h3>
            {badge && (
              <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {badge}
              </span>
            )}
          </div>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>

        <button
          type="button"
          onClick={handleViewAll}
          className="text-xs sm:text-sm font-bold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors group cursor-pointer"
        >
          <span>View All</span>
          <ArrowForwardIos sx={{ fontSize: 11 }} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* True Responsive Product Grid:
          - Mobile (<640px): 2 columns
          - Small Tablet (640-768px): 3 columns
          - Tablet / iPad (768-1024px): 4 columns
          - Laptop (1024-1280px): 5 columns
          - Desktop (1280px+): 6 columns
      */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3.5">
        {products.map((item) => {
          const sellingPrice = item.sellingPrice || item.mrpPrice || 0;
          const mrpPrice = item.mrpPrice || sellingPrice;
          const discount =
            mrpPrice > sellingPrice
              ? Math.round(((mrpPrice - sellingPrice) / mrpPrice) * 100)
              : 0;

          const productUrl = `/product-details/${item.category?.categoryId || "all"}/${encodeURIComponent(
            item.title || "product"
          )}/${item._id}`;

          return (
            <div
              key={item._id}
              onClick={() => navigate(productUrl)}
              className="group relative bg-card text-card-foreground border border-border/80 hover:border-primary/50 rounded-xl overflow-hidden shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between"
            >
              {/* Sleek Compact Image Container */}
              <div className="relative w-full h-[140px] sm:h-[160px] md:h-[175px] bg-muted/30 overflow-hidden flex items-center justify-center p-2.5">
                <img
                  src={item.images?.[0] || ""}
                  alt={item.title}
                  className="w-full h-full object-contain group-hover:scale-106 transition-transform duration-400 ease-out"
                  loading="lazy"
                />

                {/* Wishlist floating button */}
                <div className="absolute top-2 right-2 z-10">
                  <SaveButton product={item} size="small" />
                </div>

                {/* Discount Badge */}
                {discount > 0 && (
                  <span className="absolute bottom-2 left-2 text-[9px] sm:text-[10px] font-black uppercase tracking-tight bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded-md shadow-xs">
                    {discount}% OFF
                  </span>
                )}
              </div>

              {/* Compact Content Section */}
              <div className="p-2 sm:p-2.5 flex-1 flex flex-col justify-between space-y-1 border-t border-border/40">
                <div>
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider block truncate">
                    {item.brand || item.seller?.businessDetails?.businessName || "Zosh Certified"}
                  </span>
                  <h4 className="text-xs sm:text-[13px] font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors leading-tight">
                    {item.title}
                  </h4>
                </div>

                <div className="pt-0.5">
                  {/* Rating */}
                  <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground mb-1">
                    <div className="inline-flex items-center bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.2 rounded font-black">
                      <Star sx={{ fontSize: 11, mr: 0.2 }} />
                      <span>{item.ratings?.average?.toFixed(1) || "4.8"}</span>
                    </div>
                    <span className="text-muted-foreground text-[10px]">
                      ({item.ratings?.count || 48})
                    </span>
                  </div>

                  {/* Pricing */}
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-xs sm:text-sm font-black text-foreground">
                      ₹{sellingPrice.toLocaleString("en-IN")}
                    </span>
                    {mrpPrice > sellingPrice && (
                      <span className="text-[10px] sm:text-xs line-through text-muted-foreground font-medium">
                        ₹{mrpPrice.toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>

                  {/* Stock & Delivery Micro-Badges */}
                  <div className="flex items-center justify-between text-[10px] pt-1 text-muted-foreground border-t border-border/40 mt-1">
                    <span className="text-success font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
                      Free Delivery
                    </span>
                    {item.countInStock <= 5 && item.countInStock > 0 && (
                      <span className="text-warning font-semibold">
                        Only {item.countInStock} left
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ProductRail;
