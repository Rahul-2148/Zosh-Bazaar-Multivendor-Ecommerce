import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  AddShoppingCart,
  ContentCopy,
  Check,
  WhatsApp,
  Telegram,
  ArrowBack,
} from "@mui/icons-material";
import { Button, CircularProgress, Alert } from "@mui/material";
import { Api } from "../../../config/Api";
import { useAppDispatch } from "../../../Redux Toolkit/Store";
import { addItemToCart } from "../../../Redux Toolkit/features/customer/CartSlice";
import { useSnackbar } from "../../../common/SnackbarProvider";
import SaveButton from "./components/SaveButton";

interface SharedCollectionData {
  collection: {
    _id: string;
    name: string;
    description: string;
    coverImage: string;
    color: string;
    ownerName: string;
    itemCount: number;
    createdAt: string;
  };
  items: any[];
}

export const SharedCollectionView: React.FC = () => {
  const { shareToken } = useParams<{ shareToken: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { showSnackbar } = useSnackbar();

  const [data, setData] = useState<SharedCollectionData | null>(null);
  const [loading, setLoading] = useState(Boolean(shareToken));
  const [error, setError] = useState<string | null>(() => (!shareToken ? "No share token provided" : null));
  const [copied, setCopied] = useState(false);
  const [addingToCartId, setAddingToCartId] = useState<string | null>(null);

  useEffect(() => {
    if (!shareToken) return;

    let active = true;
    Api.get(`/wishlist/shared/${shareToken}`)
      .then((res) => {
        if (active) {
          setData(res.data);
          setError(null);
        }
      })
      .catch((err) => {
        if (active) {
          setError(
            err.response?.data?.message || "Shared collection not found or is private."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [shareToken]);

  const handleCopy = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      showSnackbar("Link copied to clipboard!", "success");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAddToCart = async (prod: any) => {
    const jwt = typeof window !== "undefined" ? localStorage.getItem("jwt") : null;
    if (!jwt) {
      navigate(`/login?returnTo=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    setAddingToCartId(prod._id);
    try {
      await dispatch(
        addItemToCart({
          jwt,
          productId: prod._id,
          quantity: 1,
        })
      ).unwrap();
      showSnackbar(`"${prod.title}" added to your bag!`, "success");
    } catch (err: any) {
      showSnackbar(err.message || "Failed to add to cart", "error");
    } finally {
      setAddingToCartId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <CircularProgress size={36} />
        <p className="text-xs text-muted-foreground font-medium">
          Loading shared collection...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto py-20 px-5 text-center space-y-4">
        <Alert severity="error" sx={{ borderRadius: "1rem" }}>
          {error || "Unable to load collection"}
        </Alert>
        <Button
          variant="contained"
          onClick={() => navigate("/")}
          startIcon={<ArrowBack />}
          sx={{ textTransform: "none", borderRadius: "0.75rem", fontWeight: 700 }}
        >
          Return to Home
        </Button>
      </div>
    );
  }

  const { collection, items } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-8">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span
              className="w-3.5 h-3.5 rounded-full inline-block"
              style={{ backgroundColor: collection.color || "#0d9488" }}
            />
            <span className="text-xs font-bold text-primary uppercase tracking-wider">
              Shared Collection • Curated by {collection.ownerName}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            {collection.name}
          </h1>

          {collection.description && (
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
              {collection.description}
            </p>
          )}

          <p className="text-xs text-muted-foreground font-semibold">
            {collection.itemCount} {collection.itemCount === 1 ? "product" : "products"} shared
          </p>
        </div>

        {/* Share buttons */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <Button
            size="small"
            variant="outlined"
            onClick={handleCopy}
            startIcon={copied ? <Check /> : <ContentCopy />}
            sx={{ textTransform: "none", fontWeight: 700, borderRadius: "0.75rem" }}
          >
            {copied ? "Copied Link" : "Copy Link"}
          </Button>

          <a
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
              `Check out this collection "${collection.name}" on Zosh Bazaar: ${window.location.href}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl border border-border hover:bg-emerald-500/10 hover:border-emerald-500/30 text-emerald-600 transition-colors"
            aria-label="Share via WhatsApp"
          >
            <WhatsApp sx={{ fontSize: 20 }} />
          </a>

          <a
            href={`https://t.me/share/url?url=${encodeURIComponent(
              window.location.href
            )}&text=${encodeURIComponent(collection.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl border border-border hover:bg-sky-500/10 hover:border-sky-500/30 text-sky-500 transition-colors"
            aria-label="Share via Telegram"
          >
            <Telegram sx={{ fontSize: 20 }} />
          </a>
        </div>
      </div>

      {/* Products Grid */}
      {items.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-2xl p-6">
          <p className="text-sm font-semibold text-muted-foreground">
            This collection has no items currently.
          </p>
          <Button
            variant="contained"
            size="small"
            onClick={() => navigate("/products")}
            sx={{ mt: 2, textTransform: "none", borderRadius: "0.75rem" }}
          >
            Browse Store
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {items.map((item: any) => {
            const prod = item.product || {};
            const smart = item.smartState || {};
            const isOutOfStock = smart.stockStatus === "OUT_OF_STOCK" || smart.stockStatus === "UNAVAILABLE";
            const isAdding = addingToCartId === prod._id;

            return (
              <div
                key={item._id}
                onClick={() =>
                  navigate(
                    `/product-details/${prod.category?.categoryId || "all"}/${encodeURIComponent(
                      prod.title || "product"
                    )}/${prod._id}`
                  )
                }
                className="group relative bg-card text-card-foreground rounded-2xl border border-border/80 hover:border-primary/50 overflow-hidden shadow-xs hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between"
              >
                {/* Image & Save Button */}
                <div className="relative aspect-square w-full bg-muted/60 overflow-hidden">
                  <img
                    src={prod.images?.[0]?.url || prod.images?.[0] || item.snapshot?.image || ""}
                    alt={prod.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Save to My Wishlist */}
                  <div className="absolute top-2.5 right-2.5 z-10">
                    <SaveButton product={prod} size="small" />
                  </div>

                  {smart.discountPercent > 0 && (
                    <div className="absolute top-2.5 left-2.5 z-10 bg-destructive text-destructive-foreground text-[10px] font-black px-2 py-0.5 rounded-full shadow-md">
                      {smart.discountPercent}% OFF
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider block truncate">
                      {prod.brand || "Zosh"}
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-foreground line-clamp-2 mt-0.5">
                      {prod.title}
                    </h3>
                  </div>

                  <div className="pt-2 border-t border-border/50 space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="font-black text-base text-foreground">
                        ₹{smart.currentPrice?.toLocaleString("en-IN")}
                      </span>
                      {smart.currentMrp > smart.currentPrice && (
                        <span className="text-xs line-through text-muted-foreground font-medium">
                          ₹{smart.currentMrp?.toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={isOutOfStock || isAdding}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(prod);
                      }}
                      className={`w-full py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                        isOutOfStock
                          ? "bg-muted text-muted-foreground cursor-not-allowed"
                          : "bg-primary hover:bg-primary/90 text-primary-foreground"
                      }`}
                    >
                      {isAdding ? (
                        <CircularProgress size={14} color="inherit" />
                      ) : (
                        <>
                          <AddShoppingCart sx={{ fontSize: 14 }} />
                          <span>{isOutOfStock ? "Sold Out" : "Add to Bag"}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SharedCollectionView;
