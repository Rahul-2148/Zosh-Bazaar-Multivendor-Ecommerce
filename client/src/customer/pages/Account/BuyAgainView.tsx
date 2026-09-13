import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import { fetchBuyAgainProducts } from "../../../Redux Toolkit/features/customer/UserSlice";
import { addItemToCart } from "../../../Redux Toolkit/features/customer/CartSlice";
import SaveButton from "../Wishlist/components/SaveButton";
import {
  RepeatOutlined,
  AddShoppingCart,
  CheckCircle,
  RefreshOutlined,
  Star,
} from "@mui/icons-material";
import { Button, CircularProgress } from "@mui/material";

export const BuyAgainView: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { buyAgain } = useAppSelector((store) => store.user);
  const jwt = localStorage.getItem("jwt") || "";

  const [loading, setLoading] = useState(false);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);

  useEffect(() => {
    if (jwt) {
      setLoading(true);
      dispatch(fetchBuyAgainProducts()).finally(() => setLoading(false));
    }
  }, [dispatch, jwt]);

  const handleAddToCart = (product: any) => {
    if (!product?._id) return;
    dispatch(
      addItemToCart({
        jwt,
        productId: product._id,
        size: "",
        quantity: 1,
      })
    );
    setAddedProductId(product._id);
    setTimeout(() => setAddedProductId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div>
          <h2 className="text-xl font-bold text-foreground">Buy Again</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quickly re-order products you have purchased in past deliveries with live catalog pricing
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <CircularProgress size={30} />
          <p className="text-xs text-muted-foreground font-medium">Loading previous purchases...</p>
        </div>
      ) : (buyAgain || []).length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 flex flex-col items-center justify-center text-center gap-3">
          <div className="p-4 rounded-full bg-muted/60 text-muted-foreground">
            <RefreshOutlined sx={{ fontSize: 32 }} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">No previous purchases found</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              When you purchase products on ZoshBazaar, they will appear here so you can easily re-order them in one click.
            </p>
          </div>
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => navigate("/products")}
            sx={{ textTransform: "none", fontSize: "12px", fontWeight: 700, borderRadius: "0.65rem", mt: 1 }}
          >
            Start Shopping
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(buyAgain || []).map((item: any) => {
            const prod = item.product;
            if (!prod) return null;

            const img =
              typeof prod.images?.[0] === "object" ? prod.images[0].url : prod.images?.[0] || "";
            const isOutOfStock = prod.countInStock <= 0 || prod.inStock === false;
            const isAdded = addedProductId === prod._id;

            return (
              <div
                key={prod._id}
                className="group rounded-2xl border border-border/80 bg-card overflow-hidden hover:border-primary/50 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Image container */}
                  <div className="relative h-48 w-full bg-muted overflow-hidden">
                    <img
                      src={img || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400"}
                      alt={prod.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2.5 right-2.5">
                      <SaveButton product={prod} size="small" />
                    </div>
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-background/70 backdrop-blur-xs flex items-center justify-center">
                        <span className="text-xs font-bold text-destructive bg-destructive/15 px-3 py-1 rounded-full border border-destructive/30">
                          Currently Unavailable
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Purchased {new Date(item.lastPurchasedDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
                      {prod.rating > 0 && (
                        <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                          <Star sx={{ fontSize: 13 }} /> {prod.rating}
                        </span>
                      )}
                    </div>

                    <h4
                      onClick={() => navigate(`/product-details/${prod.category || 'item'}/${prod.title}/${prod._id}`)}
                      className="text-xs font-bold text-foreground hover:text-primary transition-colors cursor-pointer line-clamp-2"
                    >
                      {prod.title}
                    </h4>

                    {/* Price */}
                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-black text-foreground">
                        ₹{prod.sellingPrice?.toLocaleString("en-IN")}
                      </span>
                      {prod.mrpPrice > prod.sellingPrice && (
                        <span className="text-xs text-muted-foreground line-through">
                          ₹{prod.mrpPrice?.toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="p-3 pt-0">
                  <Button
                    fullWidth
                    variant={isAdded ? "contained" : "outlined"}
                    color={isAdded ? "success" : "primary"}
                    disabled={isOutOfStock}
                    size="small"
                    onClick={() => handleAddToCart(prod)}
                    startIcon={isAdded ? <CheckCircle /> : <AddShoppingCart />}
                    sx={{ textTransform: "none", fontSize: "12px", fontWeight: 700, borderRadius: "0.65rem" }}
                  >
                    {isAdded ? "Added to Cart" : isOutOfStock ? "Out of Stock" : "Add to Cart"}
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

export default BuyAgainView;
