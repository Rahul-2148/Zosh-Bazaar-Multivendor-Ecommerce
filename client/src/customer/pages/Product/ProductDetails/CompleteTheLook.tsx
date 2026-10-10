import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  AutoAwesome,
  CheckCircle,
  AddShoppingCart,
  CheckCircleOutline,
  RadioButtonUnchecked,
} from "@mui/icons-material";
import { CircularProgress } from "@mui/material";
import { useAppDispatch } from "../../../../Redux Toolkit/Store";
import { addItemToCart } from "../../../../Redux Toolkit/features/customer/CartSlice";
import { fetchProductRecommendations, type RecommendationItem } from "../../../../services/aiRecommendationService";
import { aiTracker } from "../../../../services/aiEventTracker";

interface CompleteTheLookProps {
  currentProduct: {
    _id: string;
    title: string;
    sellingPrice: number;
    mrpPrice?: number;
    images?: string[];
    brand?: string;
  };
}

export const CompleteTheLook: React.FC<CompleteTheLookProps> = ({ currentProduct }) => {
  const dispatch = useAppDispatch();
  const [items, setItems] = useState<RecommendationItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(true);
  const [addingToCart, setAddingToCart] = useState<boolean>(false);
  const [addedSuccess, setAddedSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (!currentProduct?._id) return;

    let active = true;
    void Promise.resolve().then(() => {
      if (active) setLoading(true);
    });

    fetchProductRecommendations(currentProduct._id, "pdp_complementary", 3)
      .then((res) => {
        if (!active) return;
        if (res && res.recommendations && res.recommendations.length > 0) {
          setItems(res.recommendations);
          // By default, select all complementary items for the complete outfit
          setSelectedIds(new Set(res.recommendations.map((r) => r.productId)));

          // Track recommendation impressions
          res.recommendations.forEach((it, idx) => {
            aiTracker.trackRecommendationImpression(
              {
                recommendationId: `rec_ctl_${it.productId}`,
                requestId: res.requestId,
                placement: res.placement || "pdp_complementary",
                modelVersion: res.modelVersion || "outfit-v1",
                rankPosition: idx + 1,
              },
              it.productId
            );
          });
        } else {
          setItems([]);
        }
      })
      .catch(() => {
        if (active) setItems([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [currentProduct?._id]);

  const toggleItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Bundle calculations: Base item + selected complementary items
  const bundleCalculation = useMemo(() => {
    const selectedComplementary = items.filter((it) => selectedIds.has(it.productId));
    const baseSelling = currentProduct.sellingPrice || 0;
    const baseMrp = currentProduct.mrpPrice || baseSelling;

    const compSelling = selectedComplementary.reduce((sum, it) => sum + (it.sellingPrice || 0), 0);
    const compMrp = selectedComplementary.reduce((sum, it) => sum + (it.mrpPrice || it.sellingPrice || 0), 0);

    const totalSelling = baseSelling + compSelling;
    const totalMrp = baseMrp + compMrp;
    const totalSavings = Math.max(0, totalMrp - totalSelling);

    return {
      totalSelling,
      totalMrp,
      totalSavings,
      totalCount: 1 + selectedComplementary.length,
      selectedComplementary,
    };
  }, [items, selectedIds, currentProduct]);

  const handleAddBundleToCart = async () => {
    if (addingToCart || bundleCalculation.selectedComplementary.length === 0) return;

    setAddingToCart(true);
    const jwt = localStorage.getItem("jwt") || "";

    try {
      // Dispatch cart add for each selected complementary product
      for (const comp of bundleCalculation.selectedComplementary) {
        await dispatch(
          addItemToCart({
            jwt,
            productId: comp.productId,
            quantity: 1,
          })
        ).unwrap();
      }

      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 3500);
    } catch {
      // Handled via toast / Redux error state
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="mt-8 p-5 rounded-2xl bg-card border border-border/80 animate-pulse space-y-4">
        <div className="h-5 w-48 bg-muted rounded-md" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="h-44 bg-muted/60 rounded-xl" />
          <div className="h-44 bg-muted/60 rounded-xl" />
          <div className="h-44 bg-muted/60 rounded-xl" />
        </div>
      </div>
    );
  }

  // Gracefully hide if no complementary outfit recommendations exist
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="mt-10 p-4 sm:p-6 rounded-2xl bg-linear-to-br from-card via-card to-primary/5 border border-primary/20 shadow-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-border/80">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <AutoAwesome sx={{ fontSize: 18 }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-foreground tracking-tight">
                Complete the Look & Outfit Match
              </h3>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20">
                AI Curated
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Frequently styled together by fashion stylists and customer purchases
            </p>
          </div>
        </div>
      </div>

      {/* Outfit Elements Gallery */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-5 items-center">
        {/* Items List */}
        <div className="lg:col-span-8 flex flex-col sm:flex-row items-center gap-3">
          {/* Main product */}
          <div className="w-full sm:w-44 p-3 rounded-xl bg-card border-2 border-primary/40 shadow-xs relative shrink-0">
            <span className="absolute -top-2 left-3 bg-primary text-primary-foreground text-[9px] font-black uppercase px-1.5 py-0.5 rounded">
              This Item
            </span>
            <div className="aspect-square rounded-lg overflow-hidden bg-muted/40 mb-2">
              <img
                src={currentProduct.images?.[0] || "/placeholder.png"}
                alt={currentProduct.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <p className="text-xs font-bold text-foreground line-clamp-1">
              {currentProduct.title}
            </p>
            <p className="text-xs font-black text-foreground mt-0.5">
              ₹{currentProduct.sellingPrice?.toLocaleString("en-IN")}
            </p>
          </div>

          {/* Plus Sign */}
          <span className="text-muted-foreground font-black text-lg select-none hidden sm:inline">
            +
          </span>

          {/* Complementary Products */}
          <div className="w-full flex-1 flex flex-wrap sm:flex-nowrap gap-3">
            {items.map((item) => {
              const isChecked = selectedIds.has(item.productId);
              return (
                <div
                  key={item.productId}
                  className={`flex-1 min-w-[130px] p-3 rounded-xl border transition-all cursor-pointer relative ${
                    isChecked
                      ? "bg-card border-primary/50 shadow-xs ring-1 ring-primary/20"
                      : "bg-muted/20 border-border/60 opacity-60 hover:opacity-90"
                  }`}
                  onClick={() => toggleItem(item.productId)}
                >
                  <button
                    type="button"
                    aria-label={`Toggle ${item.title}`}
                    className="absolute top-2 right-2 text-primary"
                  >
                    {isChecked ? (
                      <CheckCircle sx={{ fontSize: 18 }} />
                    ) : (
                      <RadioButtonUnchecked sx={{ fontSize: 18 }} className="text-muted-foreground" />
                    )}
                  </button>

                  <div className="aspect-square rounded-lg overflow-hidden bg-muted/40 mb-2">
                    <img
                      src={item.images?.[0] || "/placeholder.png"}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  <p className="text-[11px] font-bold text-foreground line-clamp-1">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs font-black text-foreground">
                      ₹{item.sellingPrice?.toLocaleString("en-IN")}
                    </span>
                    {item.mrpPrice && item.mrpPrice > item.sellingPrice && (
                      <span className="text-[10px] text-muted-foreground line-through">
                        ₹{item.mrpPrice.toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>
                  <Link
                    to={`/product-details/${item.productId}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-[10px] text-primary hover:underline font-semibold block mt-1"
                  >
                    View Details →
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bundle Summary & One-Tap Checkout */}
        <div className="lg:col-span-4 p-4 rounded-xl bg-card border border-border/80 shadow-xs space-y-3">
          <div className="text-xs font-black uppercase tracking-wider text-muted-foreground">
            Complete Outfit Bundle
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-muted-foreground font-medium">
                Bundle Price ({bundleCalculation.totalCount} items):
              </span>
              <span className="text-lg sm:text-xl font-black text-foreground">
                ₹{bundleCalculation.totalSelling.toLocaleString("en-IN")}
              </span>
            </div>

            {bundleCalculation.totalSavings > 0 && (
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-muted-foreground">Total MRP:</span>
                <span className="line-through text-muted-foreground">
                  ₹{bundleCalculation.totalMrp.toLocaleString("en-IN")}
                </span>
              </div>
            )}

            {bundleCalculation.totalSavings > 0 && (
              <div className="text-[11px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-md text-center">
                You save ₹{bundleCalculation.totalSavings.toLocaleString("en-IN")} on this outfit bundle!
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleAddBundleToCart}
            disabled={addingToCart || bundleCalculation.selectedComplementary.length === 0}
            className={`w-full py-2.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              addedSuccess
                ? "bg-emerald-600 text-white"
                : bundleCalculation.selectedComplementary.length === 0
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20 active:scale-98"
            }`}
          >
            {addingToCart ? (
              <CircularProgress size={16} color="inherit" />
            ) : addedSuccess ? (
              <>
                <CheckCircleOutline sx={{ fontSize: 16 }} />
                <span>Outfit Added to Cart!</span>
              </>
            ) : (
              <>
                <AddShoppingCart sx={{ fontSize: 16 }} />
                <span>Add {bundleCalculation.selectedComplementary.length} Complementary to Cart</span>
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
};

export default CompleteTheLook;
