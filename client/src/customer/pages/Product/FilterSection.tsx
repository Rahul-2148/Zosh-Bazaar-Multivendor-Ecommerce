import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  TextField,
  Typography,
  InputBase,
} from "@mui/material";
import {
  FilterList,
  RestartAlt,
  CheckCircleOutline,
  KeyboardArrowDown,
  Search,
  Star,
} from "@mui/icons-material";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import { fetchCategoryFilters } from "../../../Redux Toolkit/features/customer/ProductSlice";

interface FilterSectionProps {
  categoryId?: string;
  onClose?: () => void;
}

const defaultPriceRanges = [
  { label: "All Prices", min: undefined, max: undefined },
  { label: "Under ₹500", min: 0, max: 500 },
  { label: "₹500 - ₹1,000", min: 500, max: 1000 },
  { label: "₹1,000 - ₹2,500", min: 1000, max: 2500 },
  { label: "₹2,500 - ₹5,000", min: 2500, max: 5000 },
  { label: "₹5,000 - ₹10,000", min: 5000, max: 10000 },
  { label: "₹10,000 & Above", min: 10000, max: undefined },
];

const customerRatingBuckets = [
  { label: "4★ & above", rating: "4" },
  { label: "3★ & above", rating: "3" },
  { label: "2★ & above", rating: "2" },
  { label: "1★ & above", rating: "1" },
];

export const FilterSection: React.FC<FilterSectionProps> = ({
  categoryId,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { categoryFilters } = useAppSelector((store) => store.product);

  const [brandSearch, setBrandSearch] = useState("");
  const [customMin, setCustomMin] = useState(searchParams.get("minPrice") || "");
  const [customMax, setCustomMax] = useState(searchParams.get("maxPrice") || "");

  // Collapsible dropdown state: Core 5 filters open by default, granular specs closed by default
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    availability: true,
    price: true,
    brand: true,
    ratings: true,
    discount: true,
  });

  const isSectionOpen = (sectionKey: string, isCore = true) => {
    if (openSections[sectionKey] !== undefined) {
      return openSections[sectionKey];
    }
    if (!isCore) {
      return Boolean(searchParams.get(sectionKey));
    }
    return true;
  };

  const toggleSection = (sectionKey: string, isCore = true) => {
    setOpenSections((prev) => {
      const current =
        prev[sectionKey] !== undefined
          ? prev[sectionKey]
          : isCore
          ? true
          : Boolean(searchParams.get(sectionKey));
      return {
        ...prev,
        [sectionKey]: !current,
      };
    });
  };

  // Fetch category-specific filters on mount or when categoryId changes
  useEffect(() => {
    dispatch(fetchCategoryFilters({ category: categoryId }));
  }, [categoryId, dispatch]);

  const currentMinPrice = searchParams.get("minPrice");
  const currentMaxPrice = searchParams.get("maxPrice");
  const currentMinDiscount = searchParams.get("minDiscount");
  const currentInStock = searchParams.get("inStock") === "true";
  const currentRating = searchParams.get("rating") || searchParams.get("minRating");

  // Keep section open if user has an active filter in that category
  useEffect(() => {
    void Promise.resolve().then(() => {
      setOpenSections((prev) => ({
        ...prev,
        availability: currentInStock ? true : (prev.availability ?? true),
        price: (currentMinPrice || currentMaxPrice) ? true : (prev.price ?? true),
        brand: (searchParams.get("brand") ? true : (prev.brand ?? true)),
        ratings: currentRating ? true : (prev.ratings ?? true),
        discount: currentMinDiscount ? true : (prev.discount ?? true),
      }));
    });
  }, [currentInStock, currentMinPrice, currentMaxPrice, searchParams, currentRating, currentMinDiscount]);

  const selectedBrands = useMemo(() => {
    const b = searchParams.get("brand");
    return b ? b.split(",").map((s) => s.trim().toLowerCase()) : [];
  }, [searchParams]);

  // Determine active price range
  const activePriceRange = defaultPriceRanges.find((r) => {
    if (r.min === undefined && r.max === undefined) {
      return !currentMinPrice && !currentMaxPrice;
    }
    const minMatch = r.min !== undefined ? String(r.min) === currentMinPrice : !currentMinPrice;
    const maxMatch = r.max !== undefined ? String(r.max) === currentMaxPrice : !currentMaxPrice;
    return minMatch && maxMatch;
  });

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = defaultPriceRanges.find((r) => r.label === e.target.value);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("page");

    if (selected && (selected.min !== undefined || selected.max !== undefined)) {
      if (selected.min !== undefined) newParams.set("minPrice", String(selected.min));
      else newParams.delete("minPrice");

      if (selected.max !== undefined) newParams.set("maxPrice", String(selected.max));
      else newParams.delete("maxPrice");
    } else {
      newParams.delete("minPrice");
      newParams.delete("maxPrice");
    }

    setSearchParams(newParams);
  };

  const handleApplyCustomPrice = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("page");

    if (customMin.trim()) newParams.set("minPrice", customMin.trim());
    else newParams.delete("minPrice");

    if (customMax.trim()) newParams.set("maxPrice", customMax.trim());
    else newParams.delete("maxPrice");

    setSearchParams(newParams);
  };

  const handleBrandToggle = (brandName: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("page");
    const lower = brandName.toLowerCase();

    let updated: string[];
    if (selectedBrands.includes(lower)) {
      updated = selectedBrands.filter((b) => b !== lower);
    } else {
      updated = [...selectedBrands, lower];
    }

    if (updated.length > 0) {
      newParams.set("brand", updated.join(","));
    } else {
      newParams.delete("brand");
    }

    setSearchParams(newParams);
  };

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("page");

    if (val) {
      newParams.set("minDiscount", val);
    } else {
      newParams.delete("minDiscount");
    }

    setSearchParams(newParams);
  };

  const handleRatingChange = (ratingVal: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("page");

    if (ratingVal && ratingVal !== currentRating) {
      newParams.set("minRating", ratingVal);
    } else {
      newParams.delete("minRating");
      newParams.delete("rating");
    }

    setSearchParams(newParams);
  };

  const handleInStockToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("page");

    if (checked) {
      newParams.set("inStock", "true");
    } else {
      newParams.delete("inStock");
    }

    setSearchParams(newParams);
  };

  // Generic dynamic attribute toggle
  const handleAttributeToggle = (attrKey: string, optionValue: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("page");

    const currentRaw = newParams.get(attrKey);
    const currentValues = currentRaw
      ? currentRaw.split(",").map((v) => v.trim())
      : [];

    let updatedValues: string[];
    if (currentValues.includes(optionValue)) {
      updatedValues = currentValues.filter((v) => v !== optionValue);
    } else {
      updatedValues = [...currentValues, optionValue];
    }

    if (updatedValues.length > 0) {
      newParams.set(attrKey, updatedValues.join(","));
    } else {
      newParams.delete(attrKey);
    }

    setSearchParams(newParams);
  };

  const handleClearAll = () => {
    const newParams = new URLSearchParams();
    const q = searchParams.get("q");
    if (q) newParams.set("q", q);

    setCustomMin("");
    setCustomMax("");
    setBrandSearch("");
    // Restore default accordion states
    setOpenSections({
      availability: true,
      price: true,
      brand: true,
      ratings: true,
      discount: true,
    });
    setSearchParams(newParams);
  };

  // Filtered brands list based on search
  const brandsList = categoryFilters?.brands;
  const filteredBrands = useMemo(() => {
    if (!brandsList) return [];
    if (!brandSearch.trim()) return brandsList;
    return brandsList.filter((b) =>
      b.name.toLowerCase().includes(brandSearch.trim().toLowerCase())
    );
  }, [brandsList, brandSearch]);

  // Count active filters
  let activeFilterCount = 0;
  if (currentMinPrice || currentMaxPrice) activeFilterCount++;
  if (currentMinDiscount) activeFilterCount++;
  if (currentInStock) activeFilterCount++;
  if (currentRating) activeFilterCount++;
  if (selectedBrands.length > 0) activeFilterCount += selectedBrands.length;

  // Add count for dynamic attributes
  categoryFilters?.attributes?.forEach((attr) => {
    const val = searchParams.get(attr.key);
    if (val) activeFilterCount += val.split(",").length;
  });

  return (
    <div className="space-y-3 bg-card text-card-foreground p-4 lg:p-5 rounded-2xl border border-border/80 shadow-xs [&_.MuiFormControlLabel-root]:!ml-0 [&_.MuiFormControlLabel-root]:!mr-0">
      {/* Filters Title Header with Professional Reset / Clear Button */}
      <div className="sticky top-0 bg-card z-20 flex items-center justify-between pb-3 border-b border-border -mt-1 pt-1">
        <div className="flex items-center gap-2">
          <FilterList className="text-primary text-xl" />
          <Typography variant="subtitle1" fontWeight="800" className="text-foreground text-sm tracking-tight uppercase">
            Filters
          </Typography>
          {activeFilterCount > 0 && (
            <span className="bg-primary/15 text-primary text-[10px] font-black px-2 py-0.5 rounded-full ring-1 ring-primary/25">
              {activeFilterCount}
            </span>
          )}
        </div>

        {/* Professional Clear / Reset Action */}
        {activeFilterCount > 0 ? (
          <button
            type="button"
            onClick={handleClearAll}
            className="flex items-center gap-1.5 text-xs font-bold text-destructive bg-destructive/10 hover:bg-destructive/15 border border-destructive/25 px-2.5 py-1 rounded-lg transition-all cursor-pointer select-none active:scale-95 shadow-2xs"
            title="Clear all active filters"
          >
            <RestartAlt sx={{ fontSize: 14 }} />
            <span>CLEAR ALL</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleClearAll}
            className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/50 px-2 py-0.5 rounded-md transition-all cursor-pointer select-none"
            title="Reset sections to default open view"
          >
            <RestartAlt sx={{ fontSize: 13 }} />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* 1. AVAILABILITY (Top Priority - In Stock Only benchmark) */}
      <div className="border-b border-border/70 pb-3">
        <button
          type="button"
          onClick={() => toggleSection("availability", true)}
          className="w-full flex items-center justify-between py-1 text-left group cursor-pointer select-none"
        >
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black uppercase tracking-wider text-foreground group-hover:text-primary transition-colors">
              Availability
            </span>
            {currentInStock && (
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.2 rounded-full">
                In Stock
              </span>
            )}
          </div>
          <KeyboardArrowDown
            className="text-muted-foreground group-hover:text-foreground text-base"
            style={{
              transform: isSectionOpen("availability", true) ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 280ms cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        </button>

        <div
          style={{
            display: "grid",
            gridTemplateRows: isSectionOpen("availability", true) ? "1fr" : "0fr",
            transition: "grid-template-rows 280ms cubic-bezier(0.4, 0, 0.2, 1), opacity 220ms ease",
            opacity: isSectionOpen("availability", true) ? 1 : 0,
            pointerEvents: isSectionOpen("availability", true) ? "auto" : "none",
          }}
        >
          <div className="overflow-hidden px-0.5">
            <div className="pt-2">
              <FormControlLabel
                sx={{ ml: 0, mr: 0, width: "100%" }}
                control={
                  <Checkbox
                    checked={currentInStock}
                    onChange={handleInStockToggle}
                    size="small"
                    color="primary"
                    sx={{ p: 0.5, ml: 0 }}
                  />
                }
                label={
                  <span className="text-xs font-semibold text-foreground flex items-center justify-between gap-2 w-full">
                    <span className="flex items-center gap-1.5">
                      <CheckCircleOutline sx={{ fontSize: 15 }} className="text-emerald-500" />
                      In Stock Only
                    </span>
                    {categoryFilters?.inStockCount !== undefined && (
                      <span className="text-[10px] text-muted-foreground font-normal">
                        ({categoryFilters.inStockCount})
                      </span>
                    )}
                  </span>
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. PRICE RANGE (Collapsible Dropdown) */}
      <div className="border-b border-border/70 pb-3">
        <button
          type="button"
          onClick={() => toggleSection("price", true)}
          className="w-full flex items-center justify-between py-1 text-left group cursor-pointer select-none"
        >
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black uppercase tracking-wider text-foreground group-hover:text-primary transition-colors">
              Price
            </span>
            {(currentMinPrice || currentMaxPrice) && (
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.2 rounded-full">
                ₹{currentMinPrice || 0}-{currentMaxPrice || "Max"}
              </span>
            )}
          </div>
          <KeyboardArrowDown
            className="text-muted-foreground group-hover:text-foreground text-base"
            style={{
              transform: isSectionOpen("price", true) ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 280ms cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        </button>

        <div
          style={{
            display: "grid",
            gridTemplateRows: isSectionOpen("price", true) ? "1fr" : "0fr",
            transition: "grid-template-rows 280ms cubic-bezier(0.4, 0, 0.2, 1), opacity 220ms ease",
            opacity: isSectionOpen("price", true) ? 1 : 0,
            pointerEvents: isSectionOpen("price", true) ? "auto" : "none",
          }}
        >
          <div className="overflow-hidden px-0.5">
            <div className="pt-2 space-y-2">
              <FormControl component="fieldset" fullWidth>
                <RadioGroup
                  value={activePriceRange ? activePriceRange.label : ""}
                  onChange={handlePriceChange}
                  className="space-y-0.5"
                >
                  {defaultPriceRanges.map((range) => (
                    <FormControlLabel
                      key={range.label}
                      value={range.label}
                      sx={{ ml: 0, mr: 0, width: "100%" }}
                      control={<Radio size="small" sx={{ p: 0.5, ml: 0 }} />}
                      label={<span className="text-xs text-foreground font-medium">{range.label}</span>}
                    />
                  ))}
                </RadioGroup>
              </FormControl>

              {/* Custom Price Range Form */}
              <form onSubmit={handleApplyCustomPrice} className="pt-1.5 flex items-center gap-1.5">
                <TextField
                  size="small"
                  placeholder="Min ₹"
                  type="number"
                  value={customMin}
                  onChange={(e) => setCustomMin(e.target.value)}
                  className="w-20"
                  inputProps={{ min: 0, style: { fontSize: "11px", padding: "5px 6px" } }}
                />
                <span className="text-muted-foreground text-xs font-bold">-</span>
                <TextField
                  size="small"
                  placeholder="Max ₹"
                  type="number"
                  value={customMax}
                  onChange={(e) => setCustomMax(e.target.value)}
                  className="w-20"
                  inputProps={{ min: 0, style: { fontSize: "11px", padding: "5px 6px" } }}
                />
                <Button
                  type="submit"
                  variant="outlined"
                  size="small"
                  sx={{ minWidth: "36px", padding: "3px 8px", fontSize: "11px", borderRadius: "6px" }}
                >
                  Go
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BRAND (Collapsible Dropdown with Search) */}
      {categoryFilters?.brands && categoryFilters.brands.length > 0 && (
        <div className="border-b border-border/70 pb-3">
          <button
            type="button"
            onClick={() => toggleSection("brand", true)}
            className="w-full flex items-center justify-between py-1 text-left group cursor-pointer select-none"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-foreground group-hover:text-primary transition-colors">
                Brand
              </span>
              {selectedBrands.length > 0 && (
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.2 rounded-full">
                  {selectedBrands.length} selected
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {selectedBrands.length > 0 && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    const newParams = new URLSearchParams(searchParams);
                    newParams.delete("brand");
                    setSearchParams(newParams);
                  }}
                  className="text-[10px] text-primary hover:underline font-semibold mr-1"
                >
                  Clear
                </span>
              )}
              <KeyboardArrowDown
                className="text-muted-foreground group-hover:text-foreground text-base"
                style={{
                  transform: isSectionOpen("brand", true) ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 280ms cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              />
            </div>
          </button>

          <div
            style={{
              display: "grid",
              gridTemplateRows: isSectionOpen("brand", true) ? "1fr" : "0fr",
              transition: "grid-template-rows 280ms cubic-bezier(0.4, 0, 0.2, 1), opacity 220ms ease",
              opacity: isSectionOpen("brand", true) ? 1 : 0,
              pointerEvents: isSectionOpen("brand", true) ? "auto" : "none",
            }}
          >
            <div className="overflow-hidden">
              <div className="pt-2 space-y-2">
                {/* Brand Search box if > 5 brands */}
                {categoryFilters.brands.length > 5 && (
                  <div className="flex items-center h-[30px] bg-muted/60 border border-border rounded-lg px-2 text-xs">
                    <Search sx={{ fontSize: 14 }} className="text-muted-foreground mr-1" />
                    <InputBase
                      placeholder="Search brand..."
                      value={brandSearch}
                      onChange={(e) => setBrandSearch(e.target.value)}
                      className="text-xs flex-1 text-foreground"
                      inputProps={{ "aria-label": "Search brand" }}
                    />
                  </div>
                )}

                <div className="max-h-48 overflow-y-auto space-y-0.5 scrollbar-thin pr-1">
                  {filteredBrands.map((b, bIdx) => {
                    const isChecked = selectedBrands.includes(b.name.toLowerCase());
                    return (
                      <div
                        key={`${b.name}-${bIdx}`}
                        onClick={() => handleBrandToggle(b.name)}
                        className="flex items-center justify-between py-1 px-1 rounded-md hover:bg-muted/50 cursor-pointer select-none text-xs"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Checkbox
                            checked={isChecked}
                            size="small"
                            sx={{ p: 0.5 }}
                          />
                          <span className="text-foreground truncate font-medium">
                            {b.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground ml-1 shrink-0">
                          {b.count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. CUSTOMER RATINGS (Collapsible Dropdown) */}
      <div className="border-b border-border/70 pb-3">
        <button
          type="button"
          onClick={() => toggleSection("ratings", true)}
          className="w-full flex items-center justify-between py-1 text-left group cursor-pointer select-none"
        >
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black uppercase tracking-wider text-foreground group-hover:text-primary transition-colors">
              Customer Ratings
            </span>
            {currentRating && (
              <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                {currentRating}★ & above
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {currentRating && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  handleRatingChange("");
                }}
                className="text-[10px] text-primary hover:underline font-semibold mr-1"
              >
                Clear
              </span>
            )}
            <KeyboardArrowDown
              className="text-muted-foreground group-hover:text-foreground text-base"
              style={{
                transform: isSectionOpen("ratings", true) ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 280ms cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />
          </div>
        </button>

        <div
          style={{
            display: "grid",
            gridTemplateRows: isSectionOpen("ratings", true) ? "1fr" : "0fr",
            transition: "grid-template-rows 280ms cubic-bezier(0.4, 0, 0.2, 1), opacity 220ms ease",
            opacity: isSectionOpen("ratings", true) ? 1 : 0,
            pointerEvents: isSectionOpen("ratings", true) ? "auto" : "none",
          }}
        >
          <div className="overflow-hidden">
            <div className="pt-2 space-y-1">
              {customerRatingBuckets.map((bucket) => {
                const isSelected = currentRating === bucket.rating;
                return (
                  <div
                    key={bucket.rating}
                    onClick={() => handleRatingChange(bucket.rating)}
                    className={`flex items-center justify-between py-1 px-1.5 rounded-lg cursor-pointer select-none text-xs transition-colors ${
                      isSelected ? "bg-amber-500/15 font-bold" : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={isSelected}
                        size="small"
                        sx={{ p: 0.5 }}
                      />
                      <div className="flex items-center gap-1 text-foreground font-medium">
                        <span>{bucket.label}</span>
                        <Star sx={{ fontSize: 13 }} className="text-amber-500" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 5. DISCOUNT (Collapsible Dropdown) */}
      <div className="border-b border-border/70 pb-3">
        <button
          type="button"
          onClick={() => toggleSection("discount", true)}
          className="w-full flex items-center justify-between py-1 text-left group cursor-pointer select-none"
        >
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black uppercase tracking-wider text-foreground group-hover:text-primary transition-colors">
              Discount
            </span>
            {currentMinDiscount && (
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.2 rounded-full">
                {currentMinDiscount}%+
              </span>
            )}
          </div>
          <KeyboardArrowDown
            className="text-muted-foreground group-hover:text-foreground text-base"
            style={{
              transform: isSectionOpen("discount", true) ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 280ms cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        </button>

        <div
          style={{
            display: "grid",
            gridTemplateRows: isSectionOpen("discount", true) ? "1fr" : "0fr",
            transition: "grid-template-rows 280ms cubic-bezier(0.4, 0, 0.2, 1), opacity 220ms ease",
            opacity: isSectionOpen("discount", true) ? 1 : 0,
            pointerEvents: isSectionOpen("discount", true) ? "auto" : "none",
          }}
        >
          <div className="overflow-hidden px-0.5">
            <div className="pt-2 space-y-1">
              <FormControl component="fieldset" fullWidth>
                <RadioGroup
                  value={currentMinDiscount || ""}
                  onChange={handleDiscountChange}
                  className="space-y-0.5"
                >
                  <FormControlLabel
                    value=""
                    sx={{ ml: 0, mr: 0, width: "100%" }}
                    control={<Radio size="small" sx={{ p: 0.5, ml: 0 }} />}
                    label={<span className="text-xs text-foreground font-medium">All Discounts</span>}
                  />
                  {(categoryFilters?.discountBuckets && categoryFilters.discountBuckets.length > 0
                    ? categoryFilters.discountBuckets
                    : [
                        { label: "10% or more", minDiscount: 10, count: 0 },
                        { label: "20% or more", minDiscount: 20, count: 0 },
                        { label: "30% or more", minDiscount: 30, count: 0 },
                        { label: "40% or more", minDiscount: 40, count: 0 },
                        { label: "50% or more", minDiscount: 50, count: 0 },
                      ]
                  ).map((disc) => (
                    <FormControlLabel
                      key={disc.minDiscount}
                      value={String(disc.minDiscount)}
                      sx={{ ml: 0, mr: 0, width: "100%" }}
                      control={<Radio size="small" sx={{ p: 0.5, ml: 0 }} />}
                      label={
                        <span className="text-xs text-foreground font-medium flex items-center justify-between w-full">
                          <span>{disc.label}</span>
                          {disc.count > 0 && (
                            <span className="text-[10px] text-muted-foreground ml-1.5">
                              ({disc.count})
                            </span>
                          )}
                        </span>
                      }
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            </div>
          </div>
        </div>
      </div>

      {/* 6. SPECIFICATIONS & DYNAMIC ATTRIBUTES (RAM, Size, Storage, etc. - Closed by default) */}
      {categoryFilters?.attributes && categoryFilters.attributes.length > 0 && (
        <div className="space-y-3 pt-1">
          {categoryFilters.attributes.map((attr) => {
            const isOpen = isSectionOpen(attr.key, false);
            const currentVal = searchParams.get(attr.key);
            const selectedOpts = currentVal ? currentVal.split(",").map((s) => s.trim()) : [];

            return (
              <div key={attr.key} className="border-b border-border/70 pb-3">
                <button
                  type="button"
                  onClick={() => toggleSection(attr.key, false)}
                  className="w-full flex items-center justify-between py-1 text-left group cursor-pointer select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black uppercase tracking-wider text-foreground group-hover:text-primary transition-colors">
                      {attr.label || (attr as any).name || attr.key}
                    </span>
                    {selectedOpts.length > 0 && (
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.2 rounded-full">
                        {selectedOpts.length}
                      </span>
                    )}
                  </div>
                  <KeyboardArrowDown
                    className="text-muted-foreground group-hover:text-foreground text-base"
                    style={{
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 280ms cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                  />
                </button>

                <div
                  style={{
                    display: "grid",
                    gridTemplateRows: isOpen ? "1fr" : "0fr",
                    transition: "grid-template-rows 280ms cubic-bezier(0.4, 0, 0.2, 1), opacity 220ms ease",
                    opacity: isOpen ? 1 : 0,
                    pointerEvents: isOpen ? "auto" : "none",
                  }}
                >
                  <div className="overflow-hidden">
                    <div className="pt-2 space-y-0.5 max-h-36 overflow-y-auto scrollbar-thin pr-1">
                      {attr.options.map((opt, optIdx) => {
                        const isChecked = selectedOpts.includes(opt.value);
                        return (
                          <div
                            key={`${attr.key}-${opt.value}-${optIdx}`}
                            onClick={() => handleAttributeToggle(attr.key, opt.value)}
                            className="flex items-center justify-between py-0.5 px-1 rounded hover:bg-muted/50 cursor-pointer select-none text-xs"
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Checkbox
                                checked={isChecked}
                                size="small"
                                sx={{ p: 0.5 }}
                              />
                              <span className="text-foreground truncate font-medium">
                                {opt.value}
                              </span>
                            </div>
                            <span className="text-[10px] text-muted-foreground ml-1 shrink-0">
                              {opt.count}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mobile Drawer Close Button */}
      {onClose && (
        <div className="pt-3 border-t border-border lg:hidden">
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={onClose}
            className="rounded-xl font-bold py-2 text-xs"
          >
            Apply Filters
          </Button>
        </div>
      )}
    </div>
  );
};

export default FilterSection;
