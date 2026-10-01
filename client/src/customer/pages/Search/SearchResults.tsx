import React, { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
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
  SearchOutlined,
  ArrowUpward,
  LocalOfferOutlined,
  VerifiedOutlined,
  StyleOutlined,
} from "@mui/icons-material";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import { searchProduct } from "../../../Redux Toolkit/features/customer/ProductSlice";
import ProductCard from "../Product/ProductCard";
import FilterSection from "../Product/FilterSection";
import QuickHorizontalFilterBar from "../../components/QuickHorizontalFilterBar";

const SearchResults: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { product } = useAppSelector((store) => store);

  const query = searchParams.get("q") || "";
  const sort = searchParams.get("sort") || "price_low_to_high";
  const exact = searchParams.get("exact") === "true";

  const [page, setPage] = useState(1);
  const [accumulatedProducts, setAccumulatedProducts] = useState<any[]>([]);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Active filter params
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const minDiscount = searchParams.get("minDiscount");
  const inStock = searchParams.get("inStock") === "true";
  const color = searchParams.get("color");
  const brand = searchParams.get("brand");
  const rating = searchParams.get("rating");

  // Reset pagination and accumulated list when query, filters, sort, or exact changes
  useEffect(() => {
    setPage(1);
    setAccumulatedProducts([]);
  }, [query, sort, exact, minPrice, maxPrice, minDiscount, inStock, color, brand, rating]);

  // Fetch search products for current page
  useEffect(() => {
    if (!query.trim()) return;

    const queryPayload: any = {
      query: query.trim(),
      sort,
      pageNumber: page - 1,
      pageSize: 12,
      ...(exact ? { exact: true } : {}),
    };

    if (minPrice) queryPayload.minPrice = minPrice;
    if (maxPrice) queryPayload.maxPrice = maxPrice;
    if (minDiscount) queryPayload.minDiscount = minDiscount;
    if (inStock) queryPayload.inStock = inStock;
    if (color) queryPayload.color = color;
    if (brand) queryPayload.brand = brand;
    if (rating) queryPayload.rating = rating;

    dispatch(searchProduct(queryPayload));
  }, [query, sort, exact, minPrice, maxPrice, minDiscount, inStock, color, brand, rating, page, dispatch]);

  // Synchronize newly fetched products into accumulated list
  useEffect(() => {
    const rawList = Array.isArray(product.searchProducts) ? product.searchProducts : [];
    if (rawList.length === 0 && page === 1 && !product.loading) {
      setAccumulatedProducts([]);
      return;
    }

    if (page === 1) {
      setAccumulatedProducts(rawList);
    } else if (rawList.length > 0) {
      setAccumulatedProducts((prev) => {
        const existingIds = new Set(prev.map((p) => p._id));
        const newUnique = rawList.filter((p) => !existingIds.has(p._id));
        return [...prev, ...newUnique];
      });
    }
  }, [product.searchProducts, page, product.loading]);

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

  // Handle Sort Change
  const handleSortProducts = (e: any) => {
    const newSort = e.target.value as string;
    const newParams = new URLSearchParams(searchParams);
    newParams.set("sort", newSort);
    setSearchParams(newParams);
  };

  // Filter removal helpers
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
    if (query) newParams.set("q", query);
    if (exact) newParams.set("exact", "true");
    setSearchParams(newParams);
  };

  const hasActiveFilters = Boolean(
    minPrice || maxPrice || minDiscount || inStock || color || brand
  );

  const searchMetadata = product.searchMetadata;
  const curatedRails = searchMetadata?.curatedRails;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Top Search Banner & Breadcrumbs */}
      <div className="border-b border-border/80 bg-card/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground pb-1.5 overflow-x-auto no-scrollbar">
            <Link to="/" className="hover:text-primary transition-colors shrink-0">
              Home
            </Link>
            <ChevronRight fontSize="inherit" className="shrink-0" />
            <span className="shrink-0">Search</span>
            {query && (
              <>
                <ChevronRight fontSize="inherit" className="shrink-0" />
                <span className="text-foreground font-semibold truncate max-w-[180px] sm:max-w-none">
                  "{query}"
                </span>
              </>
            )}
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
            <h1 className="text-lg sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
              <SearchOutlined className="text-primary text-xl sm:text-2xl" />
              {query ? `Results for "${query}"` : "Search Marketplace Catalog"}
            </h1>
            <Typography variant="caption" className="text-muted-foreground font-medium">
              {totalElements > 0 ? `${totalElements} products found` : "0 items"}
            </Typography>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4">
        {/* Smart Query Correction Notice */}
        {searchMetadata?.isCorrected && (
          <div className="mb-4 px-4 py-3 bg-card border border-border/80 rounded-2xl shadow-xs flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs sm:text-sm animate-in fade-in duration-300">
            <span className="text-muted-foreground font-medium">Showing results for</span>
            <span className="font-black text-foreground text-sm sm:text-base tracking-tight">
              "{searchMetadata.showingResultsFor}"
            </span>
            <span className="text-muted-foreground hidden sm:inline">•</span>
            <div className="flex items-center gap-1 text-xs">
              <span className="text-muted-foreground">Search instead for</span>
              <Link
                to={searchMetadata.searchInsteadUrl || `/search?q=${encodeURIComponent(searchMetadata.originalQuery || "")}&exact=true`}
                className="text-primary font-bold hover:underline"
              >
                "{searchMetadata.originalQuery}"
              </Link>
            </div>
          </div>
        )}

        {/* Curated Deal Banner (If matching category banner exists) */}
        {curatedRails?.dealBanner && (
          <div className="mb-4 p-3.5 sm:p-5 rounded-2xl bg-gradient-to-r from-primary/15 via-primary/5 to-card border border-primary/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-primary/20 text-primary px-2.5 py-0.5 rounded-full">
                <LocalOfferOutlined sx={{ fontSize: 13 }} />
                {(curatedRails.dealBanner as any).badge || "Featured Deal"}
              </span>
              <h3 className="text-sm sm:text-lg font-black text-foreground tracking-tight">
                {curatedRails.dealBanner.title}
              </h3>
              <p className="text-xs text-muted-foreground font-medium">
                {curatedRails.dealBanner.subtitle}
              </p>
            </div>

            <Button
              variant="contained"
              size="small"
              onClick={() => {
                const newParams = new URLSearchParams(searchParams);
                newParams.set("minDiscount", "40");
                setSearchParams(newParams);
              }}
              className="rounded-xl text-xs font-bold shrink-0 self-start sm:self-center capitalize shadow-sm"
            >
              {(curatedRails.dealBanner as any).ctaText || "Explore Deals"}
            </Button>
          </div>
        )}

        {/* Quick Horizontal Scrollable Filter Pill Rail */}
        <QuickHorizontalFilterBar
          onOpenMobileFilters={() => setMobileDrawerOpen(true)}
          brands={product.categoryFilters?.brands}
          attributes={product.categoryFilters?.attributes}
          activeFilterCount={[minPrice || maxPrice, minDiscount, inStock, color, brand, rating].filter(Boolean).length}
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
            All Filters {hasActiveFilters && `(${[minPrice, minDiscount, inStock, color, brand, rating].filter(Boolean).length})`}
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
            {brand && (
              <Chip
                label={`Brand: ${brand}`}
                size="small"
                onDelete={() => removeFilter("brand")}
                color="primary"
                variant="outlined"
              />
            )}
            {(minPrice || maxPrice) && (
              <Chip
                label={`Price: ₹${minPrice || 0} - ${maxPrice ? `₹${maxPrice}` : "Above"}`}
                size="small"
                onDelete={() => removeFilter("price")}
                color="primary"
                variant="outlined"
              />
            )}
            {minDiscount && (
              <Chip
                label={`Discount: ${minDiscount}% & above`}
                size="small"
                onDelete={() => removeFilter("minDiscount")}
                color="primary"
                variant="outlined"
              />
            )}
            {inStock && (
              <Chip
                label="In Stock Only"
                size="small"
                onDelete={() => removeFilter("inStock")}
                color="primary"
                variant="outlined"
              />
            )}
            {color && (
              <Chip
                label={`Color: ${color}`}
                size="small"
                onDelete={() => removeFilter("color")}
                color="primary"
                variant="outlined"
              />
            )}
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
          {/* Desktop Left Filter Sidebar (Full Natural Height) */}
          <aside className="hidden lg:block w-72 shrink-0">
            <FilterSection />
          </aside>

          {/* Right Main Column */}
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
                  Searching marketplace catalog...
                </p>
              </div>
            ) : accumulatedProducts.length > 0 ? (
              <div className="space-y-6">
                {/* 2-Column Mobile Product Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
                  {accumulatedProducts.map((productItem: any, index: number) => {
                    const isBrandRailSlot = index === 3 && (curatedRails?.topBrands?.length ?? 0) > 0;
                    const isCategoryRailSlot = index === 7 && (curatedRails?.popularCategories?.length ?? 0) > 0;

                    return (
                      <React.Fragment key={productItem._id || index}>
                        <ProductCard item={productItem} />

                        {/* In-Feed Discovery Rail 1: Top Brands */}
                        {isBrandRailSlot && (
                          <div className="col-span-full my-3 p-3.5 bg-card/90 rounded-2xl border border-border shadow-xs">
                            <div className="flex items-center justify-between mb-2.5 px-1">
                              <h4 className="text-xs sm:text-sm font-black text-foreground flex items-center gap-1.5">
                                <VerifiedOutlined className="text-primary text-base" />
                                <span>Shop by Top Brands</span>
                              </h4>
                              <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                                Official Stores
                              </span>
                            </div>

                            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                              {curatedRails?.topBrands?.map((b: any) => (
                                <button
                                  key={b.slug}
                                  type="button"
                                  onClick={() => {
                                    const newParams = new URLSearchParams(searchParams);
                                    newParams.set("brand", b.name);
                                    setSearchParams(newParams);
                                  }}
                                  className="shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-muted/60 hover:bg-primary hover:text-primary-foreground border border-border/80 transition-all duration-200 cursor-pointer"
                                >
                                  {b.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* In-Feed Discovery Rail 2: Occasions & Styles */}
                        {isCategoryRailSlot && (
                          <div className="col-span-full my-3 p-3.5 bg-card/90 rounded-2xl border border-border shadow-xs">
                            <div className="flex items-center justify-between mb-2.5 px-1">
                              <h4 className="text-xs sm:text-sm font-black text-foreground flex items-center gap-1.5">
                                <StyleOutlined className="text-primary text-base" />
                                <span>Pick Your Occasion & Style</span>
                              </h4>
                            </div>

                            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                              {curatedRails?.popularCategories?.map((cat: any) => (
                                <button
                                  key={cat.query}
                                  type="button"
                                  onClick={() => {
                                    navigate(`/search?q=${encodeURIComponent(cat.query)}`);
                                  }}
                                  className="shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-muted/50 hover:bg-primary/15 hover:text-primary hover:border-primary/40 border border-border/70 transition-all duration-200 cursor-pointer"
                                >
                                  {cat.name}
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

                {/* Loading More Indicator */}
                {isLoadingMore && (
                  <div className="flex items-center justify-center gap-2.5 py-6">
                    <CircularProgress size={22} thickness={4} />
                    <span className="text-xs font-bold text-muted-foreground animate-pulse">
                      Loading more products...
                    </span>
                  </div>
                )}

                {/* Manual Load More fallback if needed */}
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
              /* Empty Search Results State */
              <div className="flex flex-col items-center justify-center py-20 px-4 bg-card rounded-2xl border border-dashed border-border text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  <SearchOff fontSize="large" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-foreground">
                    No results found for "{query}"
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto mt-1">
                    Try checking your spelling, using broader terms, or clearing your active filters.
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
                  <Link to="/">
                    <Button variant="contained" color="primary" className="rounded-xl font-bold text-xs">
                      Browse Marketplace
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
                Filter Results {hasActiveFilters && `(${[minPrice, minDiscount, inStock, color, brand, rating].filter(Boolean).length})`}
              </span>
            </div>
            <IconButton size="small" onClick={() => setMobileDrawerOpen(false)}>
              <Close fontSize="small" />
            </IconButton>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <FilterSection onClose={() => setMobileDrawerOpen(false)} />
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

export default SearchResults;
