import React from "react";

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm animate-pulse">
      {/* Image placeholder */}
      <div className="w-full aspect-4/5 bg-muted relative" />

      {/* Content placeholder */}
      <div className="p-3.5 space-y-2.5">
        {/* Brand */}
        <div className="w-16 h-3 bg-muted rounded-md" />

        {/* Title (2 lines) */}
        <div className="w-full h-4 bg-muted rounded-md" />
        <div className="w-3/4 h-4 bg-muted rounded-md" />

        {/* Price row */}
        <div className="flex items-center gap-2 pt-1">
          <div className="w-20 h-5 bg-muted rounded-md" />
          <div className="w-12 h-3 bg-muted rounded-md" />
        </div>

        {/* Stock/Badge */}
        <div className="w-24 h-4 bg-muted rounded-md" />
      </div>
    </div>
  );
};

export const ProductGridSkeleton: React.FC<{ count?: number }> = ({
  count = 8,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-5">
      {Array.from({ length: count }).map((_, idx) => (
        <ProductCardSkeleton key={idx} />
      ))}
    </div>
  );
};
