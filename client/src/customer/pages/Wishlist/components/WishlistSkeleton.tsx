import React from "react";

interface WishlistSkeletonProps {
  count?: number;
  viewMode?: "grid" | "list";
}

export const WishlistSkeleton: React.FC<WishlistSkeletonProps> = ({
  count = 8,
  viewMode = "grid",
}) => {
  return (
    <div
      className={
        viewMode === "grid"
          ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5"
          : "space-y-3"
      }
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="border border-border/70 rounded-2xl p-3 bg-card animate-pulse flex flex-col justify-between space-y-3"
        >
          {/* Image skeleton */}
          <div className="w-full aspect-square rounded-xl bg-muted" />

          {/* Content skeleton */}
          <div className="space-y-2 pt-1">
            <div className="h-3 w-1/3 bg-muted rounded" />
            <div className="h-4 w-5/6 bg-muted rounded" />
            <div className="h-3 w-1/2 bg-muted rounded" />

            <div className="pt-2 flex items-center justify-between">
              <div className="h-5 w-20 bg-muted rounded" />
              <div className="h-4 w-12 bg-muted rounded" />
            </div>

            <div className="h-8 w-full bg-muted rounded-xl mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default WishlistSkeleton;
