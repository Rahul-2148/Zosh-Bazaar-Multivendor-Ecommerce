import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getRecentlyViewedProducts,
  clearRecentlyViewedProducts,
  removeRecentlyViewedProduct,
} from "../../../utils/recentlyViewed";
import type { IRecentlyViewedItem } from "../../../types/userTypes";
import { useAppDispatch } from "../../../Redux Toolkit/Store";
import { addItemToCart } from "../../../Redux Toolkit/features/customer/CartSlice";
import {
  HistoryOutlined,
  DeleteOutline,
  Close,
  AddShoppingCart,
  CheckCircle,
} from "@mui/icons-material";
import { Button } from "@mui/material";

export const RecentlyViewedView: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const jwt = localStorage.getItem("jwt") || "";

  const [items, setItems] = useState<IRecentlyViewedItem[]>(() => getRecentlyViewedProducts());
  const [addedId, setAddedId] = useState<string | null>(null);

  useEffect(() => {
    const handleUpdate = () => setItems(getRecentlyViewedProducts());
    window.addEventListener("recentlyViewedUpdated", handleUpdate);
    return () => window.removeEventListener("recentlyViewedUpdated", handleUpdate);
  }, []);

  const handleClear = () => {
    clearRecentlyViewedProducts();
    setItems([]);
  };

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeRecentlyViewedProduct(id);
    setItems(getRecentlyViewedProducts());
  };

  const handleAddToCart = (item: IRecentlyViewedItem, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(
      addItemToCart({
        jwt,
        productId: item.productId,
        size: "",
        quantity: 1,
      })
    );
    setAddedId(item.productId);
    setTimeout(() => setAddedId(null), 2000);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div>
          <h2 className="text-xl font-bold text-foreground">Recently Viewed</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Products you have browsed on this device. Quickly resume your shopping journey.
          </p>
        </div>

        {items.length > 0 && (
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<DeleteOutline sx={{ fontSize: 15 }} />}
            onClick={handleClear}
            sx={{ textTransform: "none", fontSize: "12px", fontWeight: 600, borderRadius: "0.65rem" }}
          >
            Clear Browsing History
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 flex flex-col items-center justify-center text-center gap-3">
          <div className="p-4 rounded-full bg-muted/60 text-muted-foreground">
            <HistoryOutlined sx={{ fontSize: 32 }} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Your browsing history is empty</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              As you browse items on ZoshBazaar, we will remember them here so you can easily return to what caught your eye.
            </p>
          </div>
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => navigate("/products")}
            sx={{ textTransform: "none", fontSize: "12px", fontWeight: 700, borderRadius: "0.65rem", mt: 1 }}
          >
            Explore Categories
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => {
            const isAdded = addedId === item.productId;

            return (
              <div
                key={item.productId}
                onClick={() => navigate(`/product-details/${item.category || 'item'}/${item.title}/${item.productId}`)}
                className="group relative rounded-2xl border border-border/80 bg-card overflow-hidden hover:border-primary/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-40 w-full bg-muted overflow-hidden">
                    <img
                      src={item.image || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300"}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <button
                      onClick={(e) => handleRemove(item.productId, e)}
                      aria-label="Remove item from history"
                      className="absolute top-2 right-2 p-1 rounded-full bg-background/80 hover:bg-background text-muted-foreground hover:text-foreground shadow-xs transition-colors"
                    >
                      <Close sx={{ fontSize: 14 }} />
                    </button>
                  </div>

                  <div className="p-3 space-y-1">
                    <h4 className="text-xs font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                      {item.title}
                    </h4>

                    <div className="flex items-baseline gap-1.5 pt-1">
                      <span className="text-sm font-black text-foreground">
                        ₹{item.sellingPrice?.toLocaleString("en-IN")}
                      </span>
                      {item.mrpPrice > item.sellingPrice && (
                        <span className="text-[11px] text-muted-foreground line-through">
                          ₹{item.mrpPrice?.toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-2.5 pt-0">
                  <Button
                    fullWidth
                    variant={isAdded ? "contained" : "outlined"}
                    color={isAdded ? "success" : "primary"}
                    size="small"
                    onClick={(e) => handleAddToCart(item, e)}
                    startIcon={isAdded ? <CheckCircle /> : <AddShoppingCart />}
                    sx={{ textTransform: "none", fontSize: "11px", fontWeight: 700, borderRadius: "0.5rem", py: 0.6 }}
                  >
                    {isAdded ? "Added" : "Add to Cart"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecentlyViewedView;
