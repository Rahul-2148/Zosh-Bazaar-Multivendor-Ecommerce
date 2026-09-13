import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Button,
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  TextField,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  InputBase,
} from "@mui/material";
import {
  FilterList,
  RestartAlt,
  CheckCircleOutline,
  ExpandMore,
  Search,
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

  // Fetch category-specific filters on mount or when categoryId changes
  useEffect(() => {
    dispatch(fetchCategoryFilters({ category: categoryId }));
  }, [categoryId, dispatch]);

  const currentMinPrice = searchParams.get("minPrice");
  const currentMaxPrice = searchParams.get("maxPrice");
  const currentMinDiscount = searchParams.get("minDiscount");
  const currentInStock = searchParams.get("inStock") === "true";
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
  if (selectedBrands.length > 0) activeFilterCount += selectedBrands.length;

  // Add count for dynamic attributes
  categoryFilters?.attributes?.forEach((attr) => {
    const val = searchParams.get(attr.key);
    if (val) activeFilterCount += val.split(",").length;
  });

  return (
    <div className="space-y-4 bg-card text-card-foreground p-4 lg:p-5 rounded-2xl border border-border/80 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <FilterList className="text-primary text-xl" />
          <Typography variant="subtitle1" fontWeight="800" className="text-foreground text-sm tracking-tight">
            Filters
          </Typography>
          {activeFilterCount > 0 && (
            <span className="bg-primary/15 text-primary text-[10px] font-black px-2 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <Button
            size="small"
            onClick={handleClearAll}
            startIcon={<RestartAlt fontSize="small" />}
            className="text-xs text-muted-foreground hover:text-destructive capitalize p-0"
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Availability Filter */}
      <section className="space-y-1.5">
        <Typography variant="caption" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
          Availability
        </Typography>
        <div>
          <FormControlLabel
            control={
              <Checkbox
                checked={currentInStock}
                onChange={handleInStockToggle}
                size="small"
                color="primary"
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
      </section>

      <Divider />

      {/* Dynamic Brands Filter */}
      {categoryFilters?.brands && categoryFilters.brands.length > 0 && (
        <>
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <Typography variant="caption" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                Brand
              </Typography>
              {selectedBrands.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const newParams = new URLSearchParams(searchParams);
                    newParams.delete("brand");
                    setSearchParams(newParams);
                  }}
                  className="text-[10px] text-primary hover:underline font-semibold"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Brand Search if > 5 brands */}
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
          </section>
          <Divider />
        </>
      )}

      {/* Price Range Filter */}
      <section className="space-y-2">
        <Typography variant="caption" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
          Price Range
        </Typography>
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
                control={<Radio size="small" sx={{ p: 0.5 }} />}
                label={<span className="text-xs text-foreground font-medium">{range.label}</span>}
              />
            ))}
          </RadioGroup>
        </FormControl>

        {/* Custom Price Inputs */}
        <form onSubmit={handleApplyCustomPrice} className="pt-2 flex items-center gap-1.5">
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
      </section>

      <Divider />

      {/* Discount Filter */}
      <section className="space-y-2">
        <Typography variant="caption" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
          Minimum Discount
        </Typography>
        <FormControl component="fieldset" fullWidth>
          <RadioGroup
            value={currentMinDiscount || ""}
            onChange={handleDiscountChange}
            className="space-y-0.5"
          >
            <FormControlLabel
              value=""
              control={<Radio size="small" sx={{ p: 0.5 }} />}
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
                control={<Radio size="small" sx={{ p: 0.5 }} />}
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
      </section>

      {/* Category-Specific Dynamic Attributes (RAM, Storage, Size, Material, etc.) */}
      {categoryFilters?.attributes && categoryFilters.attributes.length > 0 && (
        <>
          <Divider />
          <div className="space-y-2">
            <Typography variant="caption" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
              Specifications
            </Typography>

            {categoryFilters.attributes.map((attr) => {
              const currentVal = searchParams.get(attr.key);
              const selectedOpts = currentVal ? currentVal.split(",").map((s) => s.trim()) : [];

              return (
                <Accordion
                  key={attr.key}
                  defaultExpanded={selectedOpts.length > 0}
                  disableGutters
                  elevation={0}
                  sx={{
                    "&:before": { display: "none" },
                    bgcolor: "transparent",
                    border: "none",
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMore sx={{ fontSize: 16 }} />}
                    sx={{ p: 0, minHeight: 32, "& .MuiAccordionSummary-content": { my: 0.5 } }}
                  >
                    <span className="text-xs font-bold text-foreground">
                      {attr.label}
                      {selectedOpts.length > 0 && (
                        <span className="ml-1 text-primary font-black text-[10px]">
                          ({selectedOpts.length})
                        </span>
                      )}
                    </span>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 0, pt: 0.5 }}>
                    <div className="space-y-0.5 max-h-36 overflow-y-auto scrollbar-thin">
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
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </div>
        </>
      )}

      {/* Mobile Drawer Close */}
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
