import React from "react";
import { useSearchParams } from "react-router-dom";
import {
  FilterList,
  CheckCircle,
  Star,
  Close,
  RestartAlt,
  LocalOffer,
  KeyboardArrowDown,
} from "@mui/icons-material";

export interface FilterAttributeOption {
  value: string;
  count?: number;
}

export interface FilterAttribute {
  key: string;
  name?: string;
  label?: string;
  options: FilterAttributeOption[];
}

interface QuickHorizontalFilterBarProps {
  onOpenMobileFilters?: () => void;
  brands?: { name: string; count?: number }[];
  attributes?: FilterAttribute[];
  activeFilterCount?: number;
}

export const QuickHorizontalFilterBar: React.FC<QuickHorizontalFilterBarProps> = ({
  onOpenMobileFilters,
  brands = [],
  attributes = [],
  activeFilterCount = 0,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const inStock = searchParams.get("inStock") === "true";
  const rating = searchParams.get("rating") || searchParams.get("minRating");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const minDiscount = searchParams.get("minDiscount");
  const selectedBrands = (searchParams.get("brand") || "")
    .split(",")
    .filter(Boolean)
    .map((b) => b.trim());

  // Toggle in-stock
  const toggleInStock = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("page");
    if (inStock) {
      next.delete("inStock");
    } else {
      next.set("inStock", "true");
    }
    setSearchParams(next);
  };

  // Toggle rating
  const toggleRating = (rateVal: string) => {
    const next = new URLSearchParams(searchParams);
    next.delete("page");
    if (rating === rateVal) {
      next.delete("rating");
      next.delete("minRating");
    } else {
      next.set("minRating", rateVal);
    }
    setSearchParams(next);
  };

  // Toggle price preset
  const togglePriceRange = (min?: number, max?: number) => {
    const next = new URLSearchParams(searchParams);
    next.delete("page");
    const isCurrentlyActive =
      (min !== undefined ? String(min) === minPrice : !minPrice) &&
      (max !== undefined ? String(max) === maxPrice : !maxPrice);

    if (isCurrentlyActive) {
      next.delete("minPrice");
      next.delete("maxPrice");
    } else {
      if (min !== undefined) next.set("minPrice", String(min));
      else next.delete("minPrice");

      if (max !== undefined) next.set("maxPrice", String(max));
      else next.delete("maxPrice");
    }
    setSearchParams(next);
  };

  // Toggle discount
  const toggleDiscount = (discVal: string) => {
    const next = new URLSearchParams(searchParams);
    next.delete("page");
    if (minDiscount === discVal) {
      next.delete("minDiscount");
    } else {
      next.set("minDiscount", discVal);
    }
    setSearchParams(next);
  };

  // Clear brand filter
  const clearBrandFilter = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new URLSearchParams(searchParams);
    next.delete("page");
    next.delete("brand");
    setSearchParams(next);
  };

  // Clear specific attribute filter
  const clearAttributeFilter = (e: React.MouseEvent, attrKey: string) => {
    e.stopPropagation();
    const next = new URLSearchParams(searchParams);
    next.delete("page");
    next.delete(attrKey);
    setSearchParams(next);
  };

  // Clear all filters
  const handleClearAll = () => {
    const next = new URLSearchParams();
    const q = searchParams.get("q");
    if (q) next.set("q", q);
    setSearchParams(next);
  };

  // Handle open filter dimension
  const handleOpenDimension = (dimensionKey: string) => {
    if (onOpenMobileFilters) {
      onOpenMobileFilters();
    } else {
      // On desktop, scroll to the filter section
      const el = document.getElementById("filter-sidebar") || document.querySelector("aside");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  // Check active states for price presets
  const isUnder1000 = (minPrice === "0" || !minPrice) && maxPrice === "1000";
  const is1000To2500 = minPrice === "1000" && maxPrice === "2500";
  const isUnder500 = (minPrice === "0" || !minPrice) && maxPrice === "500";

  // Check active dynamic attributes
  const activeAttributes = attributes.filter((attr) =>
    Boolean(searchParams.get(attr.key))
  );

  const hasAnyFilter =
    inStock ||
    Boolean(rating) ||
    Boolean(minPrice || maxPrice) ||
    Boolean(minDiscount) ||
    selectedBrands.length > 0 ||
    activeAttributes.length > 0;

  return (
    <div className="relative w-full mb-3 select-none">
      {/* Scrollable Chip Rail */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none no-scrollbar snap-x">
        {/* 1. All Filters Button */}
        {onOpenMobileFilters && (
          <button
            type="button"
            onClick={onOpenMobileFilters}
            className={`lg:hidden shrink-0 snap-start flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all shadow-2xs active:scale-95 ${
              activeFilterCount > 0
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground border-border hover:bg-muted"
            }`}
          >
            <FilterList sx={{ fontSize: 15 }} />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="bg-primary-foreground text-primary text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        )}

        {/* 2. Clear All Pill (Only when filters are active) */}
        {hasAnyFilter && (
          <button
            type="button"
            onClick={handleClearAll}
            className="shrink-0 snap-start flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold text-destructive bg-destructive/10 border border-destructive/25 hover:bg-destructive/15 transition-all shadow-2xs active:scale-95"
            title="Clear all active filters"
          >
            <RestartAlt sx={{ fontSize: 14 }} />
            <span>Clear</span>
          </button>
        )}

        {/* 3. In Stock Only Pill */}
        <button
          type="button"
          onClick={toggleInStock}
          className={`shrink-0 snap-start flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all shadow-2xs active:scale-95 cursor-pointer ${
            inStock
              ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-700 dark:text-emerald-400 font-bold"
              : "bg-card hover:bg-muted/70 text-foreground border-border"
          }`}
        >
          {inStock ? (
            <CheckCircle sx={{ fontSize: 14 }} className="text-emerald-500" />
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          )}
          <span>In Stock</span>
          {inStock && <Close sx={{ fontSize: 13 }} className="text-emerald-600 ml-0.5" />}
        </button>

        {/* 4. Brand Dropdown Pill */}
        <button
          type="button"
          onClick={() => handleOpenDimension("brand")}
          className={`shrink-0 snap-start flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all shadow-2xs active:scale-95 cursor-pointer ${
            selectedBrands.length > 0
              ? "bg-primary/15 border-primary/40 text-primary font-bold"
              : "bg-card hover:bg-muted/70 text-foreground border-border"
          }`}
        >
          <span>
            {selectedBrands.length > 0
              ? `Brand: ${selectedBrands.slice(0, 2).join(", ")}${
                  selectedBrands.length > 2 ? ` +${selectedBrands.length - 2}` : ""
                }`
              : "Brand"}
          </span>
          {selectedBrands.length > 0 ? (
            <Close
              sx={{ fontSize: 13 }}
              className="text-primary hover:text-destructive ml-0.5"
              onClick={clearBrandFilter}
            />
          ) : (
            <KeyboardArrowDown sx={{ fontSize: 15 }} className="text-muted-foreground" />
          )}
        </button>

        {/* 5. 4★ & Above Rating Pill */}
        <button
          type="button"
          onClick={() => toggleRating("4")}
          className={`shrink-0 snap-start flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all shadow-2xs active:scale-95 cursor-pointer ${
            rating === "4"
              ? "bg-amber-500/15 border-amber-500/50 text-amber-700 dark:text-amber-400 font-bold"
              : "bg-card hover:bg-muted/70 text-foreground border-border"
          }`}
        >
          <span>4★ & above</span>
          <Star sx={{ fontSize: 13 }} className="text-amber-500" />
          {rating === "4" && <Close sx={{ fontSize: 13 }} className="text-amber-600 ml-0.5" />}
        </button>

        {/* 6. Active Category Specification Pills (Only active selected specs or dimension dropdowns) */}
        {activeAttributes.map((attr) => {
          const val = searchParams.get(attr.key);
          return (
            <button
              key={attr.key}
              type="button"
              onClick={() => handleOpenDimension(attr.key)}
              className="shrink-0 snap-start flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-primary/15 border border-primary/40 text-primary transition-all shadow-2xs active:scale-95 cursor-pointer"
            >
              <span className="text-[10px] uppercase font-bold text-primary/80">
                {attr.label || attr.name || attr.key}:
              </span>
              <span>{val}</span>
              <Close
                sx={{ fontSize: 13 }}
                className="text-primary hover:text-destructive ml-0.5"
                onClick={(e) => clearAttributeFilter(e, attr.key)}
              />
            </button>
          );
        })}

        {/* 7. Quick Price Preset Pills */}
        <button
          type="button"
          onClick={() => togglePriceRange(0, 500)}
          className={`shrink-0 snap-start flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all shadow-2xs active:scale-95 cursor-pointer ${
            isUnder500
              ? "bg-primary/15 border-primary/40 text-primary font-bold"
              : "bg-card hover:bg-muted/70 text-foreground border-border"
          }`}
        >
          <span>Under ₹500</span>
          {isUnder500 && <Close sx={{ fontSize: 13 }} className="text-primary ml-0.5" />}
        </button>

        <button
          type="button"
          onClick={() => togglePriceRange(0, 1000)}
          className={`shrink-0 snap-start flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all shadow-2xs active:scale-95 cursor-pointer ${
            isUnder1000
              ? "bg-primary/15 border-primary/40 text-primary font-bold"
              : "bg-card hover:bg-muted/70 text-foreground border-border"
          }`}
        >
          <span>Under ₹1,000</span>
          {isUnder1000 && <Close sx={{ fontSize: 13 }} className="text-primary ml-0.5" />}
        </button>

        <button
          type="button"
          onClick={() => togglePriceRange(1000, 2500)}
          className={`shrink-0 snap-start flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all shadow-2xs active:scale-95 cursor-pointer ${
            is1000To2500
              ? "bg-primary/15 border-primary/40 text-primary font-bold"
              : "bg-card hover:bg-muted/70 text-foreground border-border"
          }`}
        >
          <span>₹1,000 - ₹2,500</span>
          {is1000To2500 && <Close sx={{ fontSize: 13 }} className="text-primary ml-0.5" />}
        </button>

        {/* 8. Discount Offer Pills */}
        <button
          type="button"
          onClick={() => toggleDiscount("30")}
          className={`shrink-0 snap-start flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all shadow-2xs active:scale-95 cursor-pointer ${
            minDiscount === "30"
              ? "bg-primary/15 border-primary/40 text-primary font-bold"
              : "bg-card hover:bg-muted/70 text-foreground border-border"
          }`}
        >
          <LocalOffer sx={{ fontSize: 12 }} className="text-primary" />
          <span>30% Off or more</span>
          {minDiscount === "30" && <Close sx={{ fontSize: 13 }} className="text-primary ml-0.5" />}
        </button>

        <button
          type="button"
          onClick={() => toggleDiscount("50")}
          className={`shrink-0 snap-start flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all shadow-2xs active:scale-95 cursor-pointer ${
            minDiscount === "50"
              ? "bg-primary/15 border-primary/40 text-primary font-bold"
              : "bg-card hover:bg-muted/70 text-foreground border-border"
          }`}
        >
          <LocalOffer sx={{ fontSize: 12 }} className="text-primary" />
          <span>50% Off or more</span>
          {minDiscount === "50" && <Close sx={{ fontSize: 13 }} className="text-primary ml-0.5" />}
        </button>
      </div>
    </div>
  );
};

export default QuickHorizontalFilterBar;
