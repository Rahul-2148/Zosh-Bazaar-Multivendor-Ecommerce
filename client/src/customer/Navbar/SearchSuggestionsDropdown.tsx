import React from "react";
import { Typography, Chip } from "@mui/material";
import { History, TrendingUp, Category, Search } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

interface SearchSuggestionsDropdownProps {
  suggestions: {
    products: any[];
    categories: any[];
    brands: string[];
  };
  recentSearches: string[];
  onSelectSearch: (query: string) => void;
  onClearRecent: () => void;
  loading: boolean;
  searchQuery: string;
}

export const SearchSuggestionsDropdown: React.FC<SearchSuggestionsDropdownProps> = ({
  suggestions,
  recentSearches,
  onSelectSearch,
  onClearRecent,
  loading,
  searchQuery,
}) => {
  const navigate = useNavigate();

  const hasProducts = suggestions.products && suggestions.products.length > 0;
  const hasCategories = suggestions.categories && suggestions.categories.length > 0;
  const hasBrands = suggestions.brands && suggestions.brands.length > 0;
  const hasRecent = recentSearches && recentSearches.length > 0;

  if (!searchQuery && !hasRecent) return null;

  return (
    <div className="absolute left-0 right-0 top-full mt-1.5 bg-card text-card-foreground border border-border shadow-2xl rounded-2xl overflow-hidden z-50 animate-in fade-in-50 duration-150 max-h-[480px] overflow-y-auto">
      {/* If empty query, show Recent Searches */}
      {!searchQuery && hasRecent && (
        <div className="p-3 border-b border-border/60">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
              <History sx={{ fontSize: 15 }} />
              <span>Recent Searches</span>
            </div>
            <button
              type="button"
              onClick={onClearRecent}
              className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
            >
              Clear
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {recentSearches.map((item, index) => (
              <Chip
                key={index}
                label={item}
                size="small"
                onClick={() => onSelectSearch(item)}
                icon={<Search sx={{ fontSize: 13 }} />}
                sx={{
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  fontSize: "12px",
                  bgcolor: "var(--muted)",
                  "&:hover": { bgcolor: "var(--surface-hover)" },
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Categories & Brands Suggestions Chips */}
      {(hasCategories || hasBrands) && (
        <div className="p-3 bg-muted/30 border-b border-border/60 space-y-2">
          {hasCategories && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                <Category sx={{ fontSize: 14 }} />
                Categories:
              </span>
              {suggestions.categories.map((cat: any) => (
                <button
                  type="button"
                  key={cat._id}
                  onClick={() => navigate(`/products/${cat.categoryId || cat._id}`)}
                  className="px-2.5 py-1 rounded-lg bg-card border border-border text-xs font-semibold text-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer"
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {hasBrands && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                <TrendingUp sx={{ fontSize: 14 }} />
                Brands:
              </span>
              {suggestions.brands.map((brand: string, idx: number) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => onSelectSearch(brand)}
                  className="px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 text-xs font-bold hover:bg-primary/20 transition-colors cursor-pointer"
                >
                  {brand}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Product Results */}
      {hasProducts && (
        <div className="p-2 space-y-1">
          <Typography variant="caption" className="px-2 py-1 font-bold text-muted-foreground uppercase tracking-wider block">
            Matching Products
          </Typography>
          {suggestions.products.map((p: any) => (
            <div
              key={p._id}
              onClick={() =>
                navigate(
                  `/product-details/${p.category?.categoryId || "all"}/${encodeURIComponent(p.title)}/${p._id}`
                )
              }
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/70 cursor-pointer transition-colors"
            >
              <img
                src={p.images?.[0] || ""}
                alt={p.title}
                className="w-10 h-12 object-cover rounded-lg border border-border/80 bg-muted shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{p.title}</p>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="font-bold text-primary">{p.brand || "Zosh Certified"}</span>
                  <span>·</span>
                  <span className="font-bold text-foreground">₹{p.sellingPrice?.toLocaleString("en-IN")}</span>
                  {p.mrpPrice > p.sellingPrice && (
                    <span className="line-through">₹{p.mrpPrice?.toLocaleString("en-IN")}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No results message when typing but no matches */}
      {searchQuery.trim().length >= 2 && !loading && !hasProducts && !hasCategories && !hasBrands && (
        <div className="p-5 text-center text-xs text-muted-foreground">
          No matching products found for "{searchQuery}".
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onSelectSearch(searchQuery)}
              className="text-primary font-bold hover:underline cursor-pointer"
            >
              Search all products for "{searchQuery}" →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchSuggestionsDropdown;
