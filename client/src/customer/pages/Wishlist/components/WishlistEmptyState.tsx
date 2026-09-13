import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FavoriteBorder,
  FolderOpenOutlined,
  SearchOffOutlined,
  ShoppingBagOutlined,
} from "@mui/icons-material";
import { Button } from "@mui/material";

interface WishlistEmptyStateProps {
  type: "wishlist" | "collection" | "search" | "filter";
  collectionName?: string;
  searchQuery?: string;
  onClearFilters?: () => void;
}

export const WishlistEmptyState: React.FC<WishlistEmptyStateProps> = ({
  type,
  collectionName = "Collection",
  searchQuery = "",
  onClearFilters,
}) => {
  const navigate = useNavigate();

  if (type === "search" || type === "filter") {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted/60 border border-border flex items-center justify-center text-muted-foreground mb-3 shadow-xs">
          <SearchOffOutlined sx={{ fontSize: 32 }} />
        </div>
        <h3 className="text-sm sm:text-base font-bold text-foreground">
          No items match your filter
        </h3>
        <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
          {searchQuery
            ? `No saved products match "${searchQuery}". Try a different keyword or reset filters.`
            : "No saved items match the selected availability or discount criteria."}
        </p>
        <Button
          variant="outlined"
          size="small"
          onClick={onClearFilters}
          sx={{
            textTransform: "none",
            fontWeight: 700,
            borderRadius: "0.75rem",
          }}
        >
          Clear Filters
        </Button>
      </div>
    );
  }

  if (type === "collection") {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center mb-3 shadow-xs">
          <FolderOpenOutlined sx={{ fontSize: 32 }} />
        </div>
        <h3 className="text-sm sm:text-base font-bold text-foreground">
          Nothing saved in "{collectionName}" yet
        </h3>
        <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-5">
          Start building this collection by clicking the heart button on any product you want to remember.
        </p>
        <Button
          variant="contained"
          size="small"
          onClick={() => navigate("/products")}
          startIcon={<ShoppingBagOutlined />}
          sx={{
            textTransform: "none",
            fontWeight: 700,
            borderRadius: "0.75rem",
            px: 3,
          }}
        >
          Discover Products
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-20 h-20 rounded-3xl bg-destructive/10 text-destructive border border-destructive/20 flex items-center justify-center mb-4 shadow-sm">
        <FavoriteBorder sx={{ fontSize: 42 }} />
      </div>
      <h2 className="text-base sm:text-lg font-extrabold text-foreground">
        Your Saved Shopping is waiting for something good
      </h2>
      <p className="text-xs text-muted-foreground max-w-md mt-1.5 mb-6">
        Save products you love from any page. We'll track price drops, restocks, and keep them organized until you're ready to buy.
      </p>
      <Button
        variant="contained"
        color="primary"
        onClick={() => navigate("/products")}
        startIcon={<ShoppingBagOutlined />}
        sx={{
          textTransform: "none",
          fontWeight: 700,
          borderRadius: "0.85rem",
          py: 1.25,
          px: 3.5,
          fontSize: "13px",
        }}
      >
        Explore Products
      </Button>
    </div>
  );
};

export default WishlistEmptyState;
