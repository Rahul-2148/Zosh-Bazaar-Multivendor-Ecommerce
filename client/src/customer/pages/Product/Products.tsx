import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import {
  CircularProgress,
  Typography,
  FormControl,
  Select,
  MenuItem,
  Chip,
  Button,
  Drawer,
  IconButton,
} from "@mui/material";
import {
  FilterList,
  Close,
  ChevronRight,
  SearchOff,
  RestartAlt,
  ArrowUpward,
  LocalOfferOutlined,
  VerifiedOutlined,
  CategoryOutlined,
} from "@mui/icons-material";
import FilterSection from "./FilterSection";
import ProductCard from "./ProductCard";
import QuickHorizontalFilterBar from "../../components/QuickHorizontalFilterBar";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import { getAllProducts } from "../../../Redux Toolkit/features/customer/ProductSlice";

const Products: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const sort = searchParams.get("sort") || "price_low_to_high";
  const [page, setPage] = useState(1);
  const [accumulatedProducts, setAccumulatedProducts] = useState<any[]>([]);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const { categoryId } = useParams();
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const { product } = useAppSelector((store) => store);
  const dispatch = useAppDispatch();

  // Active filter params
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const minDiscount = searchParams.get("minDiscount");
  const inStock = searchParams.get("inStock");
  const brand = searchParams.get("brand");

  // Reset pagination and accumulated list when category, sort, or filters change
  useEffect(() => {
    void Promise.resolve().then(() => {
      setPage(1);
      setAccumulatedProducts([]);
    });
  }, [categoryId, sort, minPrice, maxPrice, minDiscount, inStock, brand]);

  // Trigger product fetch when category, sort, page, or searchParams change
  useEffect(() => {
    const queryPayload: any = {
      sort,
      category: categoryId,
      pageNumber: page - 1,
      pageSize: 12,
    };

    searchParams.forEach((val, key) => {
      if (key !== "page" && key !== "sort") {
        queryPayload[key] = val;
      }
    });

    dispatch(getAllProducts(queryPayload));
  }, [sort, categoryId, searchParams, page, dispatch]);

  // Synchronize newly fetched products into accumulated list for infinite scrolling
  useEffect(() => {
    const rawList = Array.isArray(product.products) ? product.products : [];
    if (rawList.length === 0 && page === 1 && !product.loading) {
      void Promise.resolve().then(() => setAccumulatedProducts([]));
      return;
    }

    if (page === 1) {
      void Promise.resolve().then(() => setAccumulatedProducts(rawList));
    } else if (rawList.length > 0) {
      void Promise.resolve().then(() => {
        setAccumulatedProducts((prev) => {
          const existingIds = new Set(prev.map((p) => p._id));
          const newUnique = rawList.filter((p: any) => !existingIds.has(p._id));
          return [...prev, ...newUnique];
        });
      });
    }
  }, [product.products, page, product.loading]);

  const totalPages = product.totalPages || 1;
  const totalElements = product.totalElements || accumulatedProducts.length;
  const hasMore = page < totalPages && accumulatedProducts.length < totalElements;
  const isInitialLoading = product.loading && page === 1 && accumulatedProducts.length === 0;
  const isLoadingMore = product.loading && page > 1;

  // Infinite scroll trigger via IntersectionObserver
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasMore && !product.loading) {
        setPage((prev) => prev + 1);
      }
    },
    [hasMore, product.loading]
  );

  useEffect(() => {
    const element = sentinelRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: "350px",
      threshold: 0.1,
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [handleObserver]);

  // Derive human-readable title
  const displayTitle = categoryId
    ? categoryId
        .replace(/_/g, " ")
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
    : "All Products";

  // Active filter chips
  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; deleteKey: string }[] = [];
    if (minPrice || maxPrice) {
      chips.push({
        key: "price",
        label: `Price: ₹${minPrice || 0} - ${maxPrice ? `₹${maxPrice}` : "Above"}`,
        deleteKey: "price",
      });
    }
    if (minDiscount) {
      chips.push({
        key: "minDiscount",
        label: `Discount: ${minDiscount}% & above`,
        deleteKey: "minDiscount",
      });
    }
    if (inStock === "true") {
      chips.push({
        key: "inStock",
        label: "In Stock Only",
        deleteKey: "inStock",
      });
    }
    if (brand) {
      chips.push({
        key: "brand",
        label: `Brand: ${brand}`,
        deleteKey: "brand",
      });
    }
    // Dynamic attributes (RAM, Storage, Size, Color, etc.)
    searchParams.forEach((val, key) => {
      if (!["minPrice", "maxPrice", "minDiscount", "inStock", "brand", "page", "sort", "q"].includes(key)) {
        chips.push({
          key,
          label: `${key.toUpperCase()}: ${val}`,
          deleteKey: key,
        });
      }
    });
    return chips;
  }, [searchParams, minPrice, maxPrice, minDiscount, inStock, brand]);

  const handleSortProducts = (e: any) => {
    const newSort = e.target.value as string;
    const newParams = new URLSearchParams(searchParams);
    newParams.set("sort", newSort);
    setSearchParams(newParams);
  };

  const removeFilter = (key: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (key === "price") {
      newParams.delete("minPrice");
      newParams.delete("maxPrice");
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const clearAllFilters = () => {
    const newParams = new URLSearchParams();
    const q = searchParams.get("q");
    if (q) newParams.set("q", q);
    setSearchParams(newParams);
  };

  const hasActiveFilters = activeChips.length > 0;
  const availableBrands = product.categoryFilters?.brands || [];

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Top Header & Breadcrumbs */}
      <div className="border-b border-border/80 bg-card/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground pb-1.5 overflow-x-auto no-scrollbar">
            <Link to="/" className="hover:text-primary transition-colors shrink-0">
              Home
            </Link>
            <ChevronRight fontSize="inherit" className="shrink-0" />
            <Link to="/products" className="hover:text-primary transition-colors shrink-0">
              Categories
            </Link>
            {categoryId && (
              <>
                <ChevronRight fontSize="inherit" className="shrink-0" />
                <span className="text-foreground font-semibold truncate shrink-0">
                  {displayTitle}
                </span>
              </>
            )}
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
            <h1 className="text-lg sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
              <CategoryOutlined className="text-primary text-xl sm:text-2xl" />
              {displayTitle}
            </h1>
            <Typography variant="caption" className="text-muted-foreground font-medium">
              {totalElements > 0 ? `${totalElements} products available` : "0 items"}
            </Typography>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4">
        {/* Category Spotlight Banner */}
        <div className="mb-4 p-3.5 sm:p-5 rounded-2xl bg-gradient-to-r from-primary/15 via-primary/5 to-card border border-primary/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-primary/20 text-primary px-2.5 py-0.5 rounded-full">
              <LocalOfferOutlined sx={{ fontSize: 13 }} />
              Category Spotlight
            </span>
            <h3 className="text-sm sm:text-lg font-black text-foreground tracking-tight">
              Best Deals in {displayTitle}
            </h3>
            <p className="text-xs text-muted-foreground font-medium">
              Handpicked verified selections from trusted sellers • Min. 30% to 70% Off
            </p>
          </div>

          <Button
            variant="contained"
            size="small"
            onClick={() => {
              const newParams = new URLSearchParams(searchParams);
              newParams.set("minDiscount", "30");
              setSearchParams(newParams);
            }}
            className="rounded-xl text-xs font-bold shrink-0 self-start sm:self-center capitalize shadow-sm"
          >
            Explore Top Offers
          </Button>
        </div>

        {/* Quick Horizontal Scrollable Filter Pill Rail */}
        <QuickHorizontalFilterBar
          onOpenMobileFilters={() => setMobileDrawerOpen(true)}
          brands={product.categoryFilters?.brands}
          attributes={product.categoryFilters?.attributes}
          activeFilterCount={activeChips.length}
        />

        {/* Mobile Filter & Sort Bar */}
        <div className="lg:hidden flex items-center justify-between gap-2.5 mb-3 p-2 bg-card rounded-xl border border-border shadow-xs">
          <Button
            variant="outlined"
            startIcon={<FilterList fontSize="small" />}
            onClick={() => setMobileDrawerOpen(true)}
            size="small"
            className="rounded-lg text-xs font-bold border-border text-foreground hover:bg-muted"
          >
            All Filters {hasActiveFilters && `(${activeChips.length})`}
          </Button>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
              value={sort}
              onChange={handleSortProducts}
              displayEmpty
              sx={{ fontSize: "12px", borderRadius: "8px", height: "34px" }}
            >
              <MenuItem value="price_low_to_high">Price: Low to High</MenuItem>
              <MenuItem value="price_high_to_low">Price: High to Low</MenuItem>
              <MenuItem value="discount_high_to_low">Highest Discount</MenuItem>
              <MenuItem value="newest">Newest First</MenuItem>
            </Select>
          </FormControl>
        </div>

        {/* Active Filter Chips Bar */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-4 p-2.5 bg-muted/40 rounded-xl border border-border">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Filters:
            </span>
            {activeChips.map((chip) => (
              <Chip
                key={chip.key}
                label={chip.label}
                size="small"
                onDelete={() => removeFilter(chip.deleteKey)}
                color="primary"
                variant="outlined"
              />
            ))}
            <Button
              size="small"
              onClick={clearAllFilters}
              startIcon={<RestartAlt fontSize="small" />}
              className="text-xs text-destructive hover:underline capitalize"
            >
              Clear All
            </Button>
          </div>
        )}

        <div className="flex gap-8 items-start">
          {/* Desktop Left Sidebar (Full Natural Height) */}
          <aside className="hidden lg:block w-72 shrink-0">
            <FilterSection categoryId={categoryId} />
          </aside>

          {/* Right Product Grid Column */}
          <main className="flex-1 min-w-0">
            {/* Desktop Sort Row */}
            <div className="hidden lg:flex items-center justify-between pb-3 mb-4 border-b border-border">
              <Typography variant="body2" className="text-muted-foreground font-medium">
                Showing {accumulatedProducts.length} of {totalElements} items
              </Typography>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground">Sort By:</span>
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <Select
                    value={sort}
                    onChange={handleSortProducts}
                    sx={{ fontSize: "13px", borderRadius: "10px", height: "36px" }}
                  >
                    <MenuItem value="price_low_to_high">Price: Low to High</MenuItem>
                    <MenuItem value="price_high_to_low">Price: High to Low</MenuItem>
                    <MenuItem value="discount_high_to_low">Highest Discount</MenuItem>
                    <MenuItem value="newest">Newest Arrivals</MenuItem>
                  </Select>
                </FormControl>
              </div>
            </div>

            {/* Initial Page Loading State */}
            {isInitialLoading ? (
              <div className="flex flex-col items-center justify-center py-28 space-y-4">
                <CircularProgress size={36} thickness={4} />
                <p className="text-sm font-semibold text-muted-foreground animate-pulse">
                  Loading verified {displayTitle}...
                </p>
              </div>
            ) : accumulatedProducts.length > 0 ? (
              <div className="space-y-6">
                {/* 2-Column Mobile-First Product Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
                  {accumulatedProducts.map((item: any, index: number) => {
                    const isBrandRailSlot = index === 3 && availableBrands.length > 0;

                    return (
                      <React.Fragment key={item._id || index}>
                        <ProductCard item={item} />

                        {/* In-Feed Discovery Rail: Shop by Top Brands in this Category */}
                        {isBrandRailSlot && (
                          <div className="col-span-full my-3 p-3.5 bg-card/90 rounded-2xl border border-border shadow-xs">
                            <div className="flex items-center justify-between mb-2.5 px-1">
                              <h4 className="text-xs sm:text-sm font-black text-foreground flex items-center gap-1.5">
                                <VerifiedOutlined className="text-primary text-base" />
                                <span>Top Brands in {displayTitle}</span>
                              </h4>
                              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                                Official Stores
                              </span>
                            </div>

                            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                              {availableBrands.slice(0, 8).map((b: any) => (
                                <button
                                  key={b.value || b.name}
                                  type="button"
                                  onClick={() => {
                                    const newParams = new URLSearchParams(searchParams);
                                    newParams.set("brand", b.value || b.name);
                                    setSearchParams(newParams);
                                  }}
                                  className="shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-muted/60 hover:bg-primary hover:text-primary-foreground border border-border/80 transition-all duration-200 cursor-pointer"
                                >
                                  {b.name} ({b.count})
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Infinite Scroll Sentinel */}
                <div ref={sentinelRef} className="h-4 w-full" />

                {/* Loading More Spinner */}
                {isLoadingMore && (
                  <div className="flex items-center justify-center gap-2.5 py-6">
                    <CircularProgress size={22} thickness={4} />
                    <span className="text-xs font-bold text-muted-foreground animate-pulse">
                      Loading more products...
                    </span>
                  </div>
                )}

                {/* Manual Load More Button fallback */}
                {hasMore && !isLoadingMore && (
                  <div className="flex justify-center pt-2">
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setPage((prev) => prev + 1)}
                      className="rounded-xl text-xs font-bold border-border text-foreground hover:bg-muted"
                    >
                      Load More Products
                    </Button>
                  </div>
                )}

                {/* End of Results Reached Notice */}
                {!hasMore && accumulatedProducts.length > 0 && (
                  <div className="pt-8 pb-4 text-center border-t border-border/60">
                    <p className="text-xs font-bold text-muted-foreground">
                      ✓ You've viewed all {accumulatedProducts.length} items
                    </p>
                    <button
                      type="button"
                      onClick={scrollToTop}
                      className="mt-2.5 inline-flex items-center gap-1 text-xs font-extrabold text-primary hover:underline cursor-pointer"
                    >
                      <ArrowUpward fontSize="inherit" />
                      Back to Top
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Empty Results State */
              <div className="flex flex-col items-center justify-center py-20 px-4 bg-card rounded-2xl border border-dashed border-border text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  <SearchOff fontSize="large" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-foreground">
                    No products matched your criteria
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto mt-1">
                    Try loosening your price, discount, or stock filters to see more marketplace offerings.
                  </p>
                </div>
                {hasActiveFilters ? (
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={clearAllFilters}
                    className="rounded-xl font-bold text-xs"
                  >
                    Clear All Filters
                  </Button>
                ) : (
                  <Link to="/products">
                    <Button variant="contained" color="primary" className="rounded-xl font-bold text-xs">
                      View All Categories
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <Drawer
        anchor="left"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        PaperProps={{
          sx: { width: "88%", maxWidth: "360px", p: 0 },
        }}
      >
        <div className="flex flex-col h-full bg-background text-foreground">
          <div className="flex items-center justify-between p-3.5 border-b border-border bg-card">
            <div className="flex items-center gap-2">
              <FilterList className="text-primary text-base" />
              <span className="font-extrabold text-sm uppercase tracking-tight">
                Filter Products {hasActiveFilters && `(${activeChips.length})`}
              </span>
            </div>
            <IconButton size="small" onClick={() => setMobileDrawerOpen(false)}>
              <Close fontSize="small" />
            </IconButton>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <FilterSection categoryId={categoryId} onClose={() => setMobileDrawerOpen(false)} />
          </div>
          <div className="p-3 border-t border-border bg-card flex items-center gap-2">
            <Button
              variant="outlined"
              fullWidth
              size="small"
              onClick={clearAllFilters}
              disabled={!hasActiveFilters}
              className="rounded-xl text-xs font-bold border-border"
            >
              Clear All
            </Button>
            <Button
              variant="contained"
              fullWidth
              size="small"
              onClick={() => setMobileDrawerOpen(false)}
              className="rounded-xl text-xs font-bold"
            >
              Apply ({totalElements})
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
};

export default Products;
