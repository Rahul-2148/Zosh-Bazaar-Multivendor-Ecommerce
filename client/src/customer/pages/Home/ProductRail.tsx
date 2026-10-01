import React from "react";
import { ArrowForwardIos } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import ProductCard from "../Product/ProductCard";

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
        {products.map((item) => (
          <ProductCard
            key={item._id || item.productId}
            item={item}
          />
        ))}
      </div>
    </section>
  );
};

export default ProductRail;
