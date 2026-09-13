import React from "react";
import {
  Search,
  GridViewOutlined,
  ViewListOutlined,
  TrendingDown,
  LocalOfferOutlined,
  CheckCircleOutline,
} from "@mui/icons-material";
import { MenuItem, Select, FormControl } from "@mui/material";
import type { AvailabilityFilter, SortFilter } from "../../../../types/wishlistTypes";

interface WishlistFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  availability: AvailabilityFilter;
  onAvailabilityChange: (val: AvailabilityFilter) => void;
  sort: SortFilter;
  onSortChange: (val: SortFilter) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  totalCount: number;
}

export const WishlistFilters: React.FC<WishlistFiltersProps> = ({
  search,
  onSearchChange,
  availability,
  onAvailabilityChange,
  sort,
  onSortChange,
  viewMode,
  onViewModeChange,
}) => {
  const tabs: Array<{ id: AvailabilityFilter; label: string; icon?: React.ReactNode }> = [
    { id: "all", label: "All Items" },
    { id: "in_stock", label: "In Stock", icon: <CheckCircleOutline sx={{ fontSize: 13 }} /> },
    { id: "price_dropped", label: "Price Drops", icon: <TrendingDown sx={{ fontSize: 13 }} /> },
    { id: "on_sale", label: "On Sale", icon: <LocalOfferOutlined sx={{ fontSize: 13 }} /> },
    { id: "out_of_stock", label: "Unavailable" },
  ];

  return (
    <div className="space-y-3">
      {/* Top row: Search Bar + Sort + View mode */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search
            sx={{ fontSize: 18 }}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search saved products, brands, notes..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-border bg-card text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary shadow-xs"
          />
        </div>

        {/* Sort and View Mode */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <Select
              value={sort}
              onChange={(e) => onSortChange(e.target.value as SortFilter)}
              sx={{
                fontSize: "12px",
                fontWeight: 600,
                borderRadius: "0.75rem",
                bgcolor: "var(--card)",
                height: "36px",
              }}
            >
              <MenuItem value="recently_added" sx={{ fontSize: "12px" }}>
                Recently Added
              </MenuItem>
              <MenuItem value="price_low_high" sx={{ fontSize: "12px" }}>
                Price: Low to High
              </MenuItem>
              <MenuItem value="price_high_low" sx={{ fontSize: "12px" }}>
                Price: High to Low
              </MenuItem>
              <MenuItem value="biggest_discount" sx={{ fontSize: "12px" }}>
                Biggest Discount
              </MenuItem>
              <MenuItem value="title_asc" sx={{ fontSize: "12px" }}>
                Product Name (A-Z)
              </MenuItem>
            </Select>
          </FormControl>

          {/* Grid / List Switcher */}
          <div className="hidden sm:flex items-center border border-border rounded-xl bg-card p-0.5">
            <button
              type="button"
              onClick={() => onViewModeChange("grid")}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === "grid"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label="Grid view"
            >
              <GridViewOutlined sx={{ fontSize: 16 }} />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("list")}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === "list"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label="List view"
            >
              <ViewListOutlined sx={{ fontSize: 16 }} />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map((tab) => {
          const isActive = availability === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onAvailabilityChange(tab.id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-xs font-bold"
                  : "bg-card text-muted-foreground hover:text-foreground hover:bg-muted/80 border border-border/70"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default WishlistFilters;
