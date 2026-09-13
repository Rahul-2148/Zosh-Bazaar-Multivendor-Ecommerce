import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  CircularProgress,
  Pagination,
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
} from "@mui/icons-material";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import { searchProduct } from "../../../Redux Toolkit/features/customer/ProductSlice";
import ProductCard from "../Product/ProductCard";
import FilterSection from "../Product/FilterSection";

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const sort = searchParams.get("sort") || "price_low_to_high";
  const [page, setPage] = useState(1);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const dispatch = useAppDispatch();
  const { product } = useAppSelector((store) => store);

  const handleSortProducts = (e: any) => {
    const newSort = e.target.value as string;
    const newParams = new URLSearchParams(searchParams);
    newParams.set("sort", newSort);
    newParams.delete("page");
    setSearchParams(newParams);
  };

  const handlePageChange = (_: any, value: number) => {
    setPage(value);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", String(value));
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Fetch search products with filters
  useEffect(() => {
    if (!query.trim()) return;

    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const minDiscount = searchParams.get("minDiscount");
    const inStock = searchParams.get("inStock");
    const color = searchParams.get("color");

    const queryPayload: any = {
      query: query.trim(),
      sort,
      pageNumber: page - 1,
      pageSize: 16,
    };

    if (minPrice) queryPayload.minPrice = minPrice;
    if (maxPrice) queryPayload.maxPrice = maxPrice;
    if (minDiscount) queryPayload.minDiscount = minDiscount;
    if (inStock) queryPayload.inStock = inStock;
    if (color) queryPayload.color = color;

    dispatch(searchProduct(queryPayload));
  }, [query, sort, searchParams, page, dispatch]);

  // Active filter chip helpers
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const minDiscount = searchParams.get("minDiscount");
  const inStock = searchParams.get("inStock") === "true";
  const color = searchParams.get("color");

  const removeFilter = (key: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (key === "price") {
      newParams.delete("minPrice");
      newParams.delete("maxPrice");
    } else {
      newParams.delete(key);
    }
    newParams.delete("page");
    setSearchParams(newParams);
  };

  const clearAllFilters = () => {
    const newParams = new URLSearchParams();
    if (query) newParams.set("q", query);
    setSearchParams(newParams);
  };

  const hasActiveFilters = Boolean(
    minPrice || maxPrice || minDiscount || inStock || color
  );

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      {/* Search Header Banner */}
      <div className="border-b border-border bg-card/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground pb-2">
            <Link to="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <ChevronRight fontSize="inherit" />
            <span>Search</span>
            {query && (
              <>
                <ChevronRight fontSize="inherit" />
                <span className="text-foreground font-semibold">"{query}"</span>
              </>
            )}
          </nav>
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
              <SearchOutlined className="text-primary text-2xl sm:text-3xl" />
              {query ? `Results for "${query}"` : "Search Catalog"}
            </h1>
            <Typography variant="body2" className="text-muted-foreground">
              {product.searchProducts.length > 0
                ? `${product.totalElements || product.searchProducts.length} items found`
                : "No items found"}
            </Typography>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Mobile Filter & Sort Bar */}
        <div className="lg:hidden flex items-center justify-between gap-3 mb-4 p-2 bg-card rounded-xl border border-border shadow-sm">
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={() => setMobileDrawerOpen(true)}
            size="small"
            className="rounded-lg text-xs font-bold border-border text-foreground hover:bg-muted"
          >
            Filters {hasActiveFilters && "(Active)"}
          </Button>

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select
              value={sort}
              onChange={handleSortProducts}
              displayEmpty
              sx={{ fontSize: "12px", borderRadius: "8px" }}
            >
              <MenuItem value="price_low_to_high">Price: Low to High</MenuItem>
              <MenuItem value="price_high_to_low">Price: High to Low</MenuItem>
              <MenuItem value="discount_high_to_low">Highest Discount</MenuItem>
              <MenuItem value="newest">Newest First</MenuItem>
            </Select>
          </FormControl>
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-6 p-3 bg-muted/40 rounded-xl border border-border">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Applied Filters:
            </span>
            {(minPrice || maxPrice) && (
              <Chip
                label={`Price: ₹${minPrice || 0} - ${
                  maxPrice ? `₹${maxPrice}` : "Above"
                }`}
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

        <div className="flex gap-8">
          {/* Desktop Left Sidebar */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-24">
              <FilterSection />
            </div>
          </aside>

          {/* Right Product Grid Column */}
          <main className="flex-1 min-w-0">
            {/* Desktop Sort Row */}
            <div className="hidden lg:flex items-center justify-between pb-4 mb-4 border-b border-border">
              <Typography variant="body2" className="text-muted-foreground font-medium">
                Showing {product.searchProducts.length} items
              </Typography>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground">Sort By:</span>
                <FormControl size="small" sx={{ minWidth: 190 }}>
                  <Select
                    value={sort}
                    onChange={handleSortProducts}
                    sx={{ fontSize: "13px", borderRadius: "10px" }}
                  >
                    <MenuItem value="price_low_to_high">Price: Low to High</MenuItem>
                    <MenuItem value="price_high_to_low">Price: High to Low</MenuItem>
                    <MenuItem value="discount_high_to_low">Highest Discount</MenuItem>
                    <MenuItem value="newest">Newest Arrivals</MenuItem>
                  </Select>
                </FormControl>
              </div>
            </div>

            {/* Product Display Area */}
            {product.loading ? (
              <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <CircularProgress size={40} thickness={4} />
                <p className="text-sm font-semibold text-muted-foreground animate-pulse">
                  Searching marketplace catalog...
                </p>
              </div>
            ) : product.searchProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5 sm:gap-4">
                {product.searchProducts.map((productItem: any, index: number) => (
                  <ProductCard
                    key={productItem._id || index}
                    item={productItem}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 px-4 bg-card rounded-2xl border border-dashed border-border text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  <SearchOff fontSize="large" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    No results found for "{query}"
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
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

            {/* Server Pagination */}
            {product.totalPages > 1 && (
              <div className="flex justify-center pt-10 pb-6">
                <Pagination
                  count={product.totalPages}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                  shape="rounded"
                  size="medium"
                />
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
          sx: { width: "85%", maxWidth: "340px", p: 2 },
        }}
      >
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <Typography variant="h6" fontWeight="bold">
            Filter Results
          </Typography>
          <IconButton size="small" onClick={() => setMobileDrawerOpen(false)}>
            <Close fontSize="small" />
          </IconButton>
        </div>
        <div className="pt-3 overflow-y-auto">
          <FilterSection onClose={() => setMobileDrawerOpen(false)} />
        </div>
      </Drawer>
    </div>
  );
};

export default SearchResults;
