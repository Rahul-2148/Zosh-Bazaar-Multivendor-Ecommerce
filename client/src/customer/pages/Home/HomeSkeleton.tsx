import React from "react";

export const HomeSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 sm:space-y-6 pb-16 animate-pulse">
      {/* 1. Hero Banner Skeleton */}
      <div className="mx-3 sm:mx-6 lg:mx-16 xl:mx-20 mt-4 rounded-2xl h-[160px] sm:h-[240px] md:h-[340px] lg:h-[420px] bg-muted/70 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-muted/50 via-muted/90 to-muted/50 animate-pulse" />
      </div>

      {/* 2. Category Quick Rail Skeleton */}
      <div className="mx-3 sm:mx-6 lg:mx-16 xl:mx-20 py-2">
        <div className="flex items-center gap-3 overflow-x-hidden">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 shrink-0 w-16 sm:w-20">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-muted/80" />
              <div className="h-2.5 w-12 bg-muted/60 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* 3. Flash Deals Section Skeleton */}
      <div className="mx-3 sm:mx-6 lg:mx-16 xl:mx-20 p-4 rounded-2xl bg-muted/40 border border-border/60">
        <div className="flex justify-between items-center mb-4">
          <div className="space-y-1.5">
            <div className="h-5 w-44 bg-muted/80 rounded" />
            <div className="h-3 w-60 bg-muted/50 rounded" />
          </div>
          <div className="h-7 w-28 bg-muted/70 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-2.5 rounded-2xl border border-border/50 bg-card/60 space-y-2">
              <div className="w-full aspect-[4/5] rounded-xl bg-muted/70" />
              <div className="h-3 w-3/4 bg-muted/80 rounded" />
              <div className="h-4 w-1/2 bg-muted/70 rounded" />
              <div className="h-8 w-full bg-muted/60 rounded-xl" />
            </div>
          ))}
        </div>
      </div>

      {/* 4. Product Rail Skeleton */}
      <div className="mx-3 sm:mx-6 lg:mx-16 xl:mx-20 space-y-3">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <div className="h-5 w-48 bg-muted/80 rounded" />
            <div className="h-3 w-64 bg-muted/50 rounded" />
          </div>
          <div className="h-6 w-16 bg-muted/60 rounded" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-2.5 rounded-2xl border border-border/50 bg-card/60 space-y-2">
              <div className="w-full aspect-[4/5] rounded-xl bg-muted/70" />
              <div className="h-3 w-3/4 bg-muted/80 rounded" />
              <div className="h-4 w-1/2 bg-muted/70 rounded" />
              <div className="h-8 w-full bg-muted/60 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeSkeleton;
