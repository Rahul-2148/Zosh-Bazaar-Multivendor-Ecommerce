import React from "react";

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="bg-card rounded-2xl border border-border/80 overflow-hidden shadow-2xs animate-pulse p-2 sm:p-2.5 flex flex-col justify-between">
      {/* Image placeholder */}
      <div className="w-full aspect-[4/5] bg-muted rounded-xl relative" />

      {/* Content placeholder */}
      <div className="pt-2 sm:pt-2.5 px-0.5 space-y-2 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          {/* Brand & Rating row */}
          <div className="flex items-center justify-between gap-1">
            <div className="w-16 h-3 bg-muted rounded-md" />
            <div className="w-10 h-3.5 bg-muted rounded-md" />
          </div>

          {/* Title (2 lines) */}
          <div className="w-full h-3.5 bg-muted rounded-md" />
          <div className="w-3/4 h-3.5 bg-muted rounded-md" />
        </div>

        {/* Price row */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center gap-2">
            <div className="w-20 h-5 bg-muted rounded-md" />
            <div className="w-12 h-3 bg-muted rounded-md" />
          </div>

          {/* Delivery/Stock row */}
          <div className="flex items-center justify-between pt-1 border-t border-border/40">
            <div className="w-16 h-3 bg-muted rounded-md" />
            <div className="w-12 h-3 bg-muted rounded-md" />
          </div>
        </div>

        {/* Button placeholder */}
        <div className="pt-2 mt-auto">
          <div className="w-full h-8 sm:h-9 bg-muted rounded-xl" />
        </div>
      </div>
    </div>
  );
};

export const ProductGridSkeleton: React.FC<{ count?: number }> = ({
  count = 8,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
      {Array.from({ length: count }).map((_, idx) => (
        <ProductCardSkeleton key={idx} />
      ))}
    </div>
  );
};

export default ProductCardSkeleton;
