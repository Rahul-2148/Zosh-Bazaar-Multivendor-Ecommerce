import React, { useEffect, useState, useMemo } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
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
  SentimentDissatisfied,
  RestartAlt,
} from "@mui/icons-material";
import FilterSection from "./FilterSection";
import ProductCard from "./ProductCard";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import { getAllProducts } from "../../../Redux Toolkit/features/customer/ProductSlice";

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const sort = searchParams.get("sort") || "price_low_to_high";
  const [page, setPage] = useState(1);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const { categoryId } = useParams();

  const { product } = useAppSelector((store) => store);
  const dispatch = useAppDispatch();

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

  // Trigger product fetch when category, sort, page, or searchParams change
  useEffect(() => {
    const queryPayload: any = {
      sort,
      category: categoryId,
      pageNumber: page - 1,
      pageSize: 16,
    };

    searchParams.forEach((val, key) => {
      if (key !== "page" && key !== "sort") {
        queryPayload[key] = val;
      }
    });

    dispatch(getAllProducts(queryPayload));
  }, [sort, categoryId, searchParams, page, dispatch]);

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
    const minP = searchParams.get("minPrice");
    const maxP = searchParams.get("maxPrice");
    if (minP || maxP) {
      chips.push({
        key: "price",
        label: `Price: ₹${minP || 0} - ${maxP ? `₹${maxP}` : "Above"}`,
        deleteKey: "price",
      });
    }
    const minD = searchParams.get("minDiscount");
    if (minD) {
      chips.push({
        key: "minDiscount",
        label: `Discount: ${minD}% & above`,
        deleteKey: "minDiscount",
      });
    }
    const inSt = searchParams.get("inStock");
    if (inSt === "true") {
      chips.push({
        key: "inStock",
        label: "In Stock Only",
        deleteKey: "inStock",
      });
    }
    const br = searchParams.get("brand");
    if (br) {
      chips.push({
        key: "brand",
        label: `Brand: ${br}`,
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
  }, [searchParams]);

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
    const q = searchParams.get("q");
    if (q) newParams.set("q", q);
    setSearchParams(newParams);
  };

  const hasActiveFilters = activeChips.length > 0;

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      {/* Breadcrumb & Header */}
      <div className="border-b border-border bg-card/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground pb-2">
            <Link to="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <ChevronRight fontSize="inherit" />
            <Link to="/products" className="hover:text-primary transition-colors">
              Categories
            </Link>
            {categoryId && (
              <>
                <ChevronRight fontSize="inherit" />
                <span className="text-foreground font-semibold">
                  {displayTitle}
                </span>
              </>
            )}
          </nav>
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              {displayTitle}
            </h1>
            <Typography variant="body2" className="text-muted-foreground">
              {product.totalElements > 0
                ? `${product.totalElements} products available`
                : "No items matching criteria"}
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
            Filters {hasActiveFilters && `(${activeChips.length})`}
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
          <div className="flex flex-wrap items-center gap-1.5 mb-5 p-3 bg-muted/30 rounded-xl border border-border">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mr-1">
              Applied Filters:
            </span>
            {activeChips.map((chip: { key: string; label: string; deleteKey: string }) => (
              <Chip
                key={chip.key}
                label={chip.label}
                size="small"
                onDelete={() => removeFilter(chip.deleteKey)}
                color="primary"
                variant="outlined"
                sx={{ fontSize: "11px", fontWeight: 600 }}
              />
            ))}
            <Button
              size="small"
              onClick={clearAllFilters}
              startIcon={<RestartAlt fontSize="small" />}
              className="text-xs text-destructive hover:underline capitalize ml-1"
            >
              Clear All
            </Button>
          </div>
        )}

        <div className="flex gap-8">
          {/* Desktop Left Sidebar */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-24">
              <FilterSection categoryId={categoryId} />
            </div>
          </aside>

          {/* Right Product Grid Column */}
          <main className="flex-1 min-w-0">
            {/* Desktop Sort Row */}
            <div className="hidden lg:flex items-center justify-between pb-4 mb-4 border-b border-border">
              <Typography variant="body2" className="text-muted-foreground font-medium">
                Showing {product.products.length} of {product.totalElements} items
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
                  Loading verified products...
                </p>
              </div>
            ) : product.products.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5 sm:gap-4">
                {product.products.map((item, index) => (
                  <ProductCard key={item._id || index} item={item} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 px-4 bg-card rounded-2xl border border-dashed border-border text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  <SentimentDissatisfied fontSize="large" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    No products matched your criteria
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
                    Try loosening your price, discount, or stock filters to see more marketplace offerings.
                  </p>
                </div>
                {hasActiveFilters && (
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={clearAllFilters}
                    className="rounded-xl font-bold text-xs"
                  >
                    Clear All Filters
                  </Button>
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
            Filter Products
          </Typography>
          <IconButton size="small" onClick={() => setMobileDrawerOpen(false)}>
            <Close fontSize="small" />
          </IconButton>
        </div>
        <div className="pt-3 overflow-y-auto">
          <FilterSection categoryId={categoryId} onClose={() => setMobileDrawerOpen(false)} />
        </div>
      </Drawer>
    </div>
  );
};

export default Products;
