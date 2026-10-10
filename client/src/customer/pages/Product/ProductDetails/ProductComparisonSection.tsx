import React, { useState, useEffect } from "react";
import {
  CompareArrowsOutlined,
  CheckCircle,
  LocalShippingOutlined,
  AssignmentReturnOutlined,
  ShieldOutlined,
  Star,
  AddShoppingCartOutlined,
} from "@mui/icons-material";
import { Button, Chip, Skeleton } from "@mui/material";
import { Link } from "react-router-dom";
import { Api } from "../../../../config/Api";
import { useAppDispatch } from "../../../../Redux Toolkit/Store";
import { addItemToCart } from "../../../../Redux Toolkit/features/customer/CartSlice";

interface ProductComparisonSectionProps {
  currentProductId: string;
  similarProductIds?: string[];
}

export const ProductComparisonSection: React.FC<ProductComparisonSectionProps> = ({
  currentProductId,
  similarProductIds = [],
}) => {
  const dispatch = useAppDispatch();
  const [comparisonData, setComparisonData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [addedItemMap, setAddedItemMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let isMounted = true;
    if (!currentProductId) return;

    const fetchComparison = async () => {
      setLoading(true);
      try {
        // Collect current product + up to 3 similar products for comparison
        const pool = [currentProductId, ...(similarProductIds || []).filter((id) => id !== currentProductId)].slice(0, 4);

        if (pool.length < 2) {
          // If not enough similar product IDs provided directly, search for peers in same category
          const peerRes = await Api.get(`/products?pageSize=4`);
          const peerIds = (peerRes.data?.content || peerRes.data?.products || [])
            .map((p: any) => p._id)
            .filter((id: string) => id !== currentProductId)
            .slice(0, 3);
          pool.push(...peerIds);
        }

        const res = await Api.post("/products/compare", { productIds: pool.slice(0, 4) });
        if (isMounted && res.data?.products?.length > 1) {
          setComparisonData(res.data);
        }
      } catch (err: any) {
        if (isMounted) {
          console.warn("[ProductComparison] Could not load comparison matrix:", err.message);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchComparison();

    return () => {
      isMounted = false;
    };
  }, [currentProductId, similarProductIds]);

  const handleAddToCart = async (prod: any) => {
    const jwt = localStorage.getItem("jwt");
    if (!jwt) {
      window.location.href = "/login";
      return;
    }

    try {
      await dispatch(
        addItemToCart({
          jwt,
          productId: prod._id,
          quantity: 1,
        })
      ).unwrap();

      setAddedItemMap((prev) => ({ ...prev, [prod._id]: true }));
      setTimeout(() => {
        setAddedItemMap((prev) => ({ ...prev, [prod._id]: false }));
      }, 2500);
    } catch {
      // ignore
    }
  };

  if (loading) {
    return null;
  }

  if (!comparisonData || !comparisonData.products || comparisonData.products.length < 2) {
    return null;
  }

  const { products, specificationsMatrix, recommendationHighlights } = comparisonData;

  return (
    <div className="mt-10 border border-border/80 rounded-2xl bg-card shadow-sm p-4 sm:p-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border/70">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <CompareArrowsOutlined sx={{ fontSize: 20 }} />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-foreground">
              Compare with Similar Items
            </h3>
            <p className="text-xs text-muted-foreground">
              Side-by-side specification, pricing and policy comparison
            </p>
          </div>
        </div>

        <Chip
          label={`${products.length} Products`}
          size="small"
          variant="outlined"
          sx={{ fontWeight: 600, fontSize: "0.75rem", borderRadius: "0.5rem" }}
        />
      </div>

      {/* Comparison Table / Horizontal Scroll Container */}
      <div className="mt-5 overflow-x-auto pb-2 scrollbar-thin">
        <table className="w-full min-w-[620px] text-xs border-collapse">
          <thead>
            <tr className="border-b border-border/70">
              <th className="w-36 text-left py-3 px-3 text-muted-foreground font-semibold">
                Product
              </th>
              {products.map((p: any) => {
                const isCurrent = p._id === currentProductId;
                const isLowestPrice = recommendationHighlights?.lowestPriceProductId === p._id;
                const isHighestRated = recommendationHighlights?.highestRatedProductId === p._id;

                return (
                  <th key={p._id} className="text-left py-3 px-3 min-w-[160px] align-top font-normal">
                    <div className="flex flex-col h-full justify-between">
                      <div>
                        {/* Image */}
                        <div className="relative w-28 h-28 mx-auto rounded-xl bg-muted/40 p-1 mb-2 border border-border/60 overflow-hidden">
                          <img
                            src={p.image || "https://placehold.co/120x120?text=Product"}
                            alt={p.title}
                            className="w-full h-full object-contain"
                          />
                          {isCurrent && (
                            <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                              This Item
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <p className="font-semibold text-xs text-foreground line-clamp-2 leading-tight">
                          {p.title}
                        </p>

                        {/* Price & Badges */}
                        <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
                          <span className="text-sm font-bold text-foreground">
                            ₹{p.pricing.sellingPrice.toLocaleString("en-IN")}
                          </span>
                          {p.pricing.mrpPrice > p.pricing.sellingPrice && (
                            <span className="text-[11px] text-muted-foreground line-through">
                              ₹{p.pricing.mrpPrice.toLocaleString("en-IN")}
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex items-center gap-1 flex-wrap">
                          {isLowestPrice && (
                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                              Best Price
                            </span>
                          )}
                          {isHighestRated && (
                            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">
                              ★ Top Rated
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Add to Cart button */}
                      <div className="mt-3">
                        <Button
                          fullWidth
                          size="small"
                          variant={isCurrent ? "contained" : "outlined"}
                          color="primary"
                          startIcon={
                            addedItemMap[p._id] ? (
                              <CheckCircle sx={{ fontSize: 14 }} />
                            ) : (
                              <AddShoppingCartOutlined sx={{ fontSize: 14 }} />
                            )
                          }
                          onClick={() => handleAddToCart(p)}
                          disabled={!p.inventory.inStock}
                          sx={{
                            textTransform: "none",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            borderRadius: "0.55rem",
                            py: 0.5,
                          }}
                        >
                          {addedItemMap[p._id]
                            ? "Added!"
                            : !p.inventory.inStock
                            ? "Out of Stock"
                            : "Add to Cart"}
                        </Button>
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-border/60">
            {/* Rating row */}
            <tr>
              <td className="py-2.5 px-3 font-semibold text-muted-foreground">Rating</td>
              {products.map((p: any) => (
                <td key={p._id} className="py-2.5 px-3 font-medium text-foreground">
                  {p.ratings.average > 0 ? (
                    <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                      ★ {p.ratings.average.toFixed(1)}{" "}
                      <span className="text-muted-foreground font-normal">
                        ({p.ratings.count})
                      </span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">No reviews yet</span>
                  )}
                </td>
              ))}
            </tr>

            {/* Brand row */}
            <tr>
              <td className="py-2.5 px-3 font-semibold text-muted-foreground">Brand</td>
              {products.map((p: any) => (
                <td key={p._id} className="py-2.5 px-3 font-medium text-foreground">
                  {p.brand}
                </td>
              ))}
            </tr>

            {/* Seller row */}
            <tr>
              <td className="py-2.5 px-3 font-semibold text-muted-foreground">Sold By</td>
              {products.map((p: any) => (
                <td key={p._id} className="py-2.5 px-3 font-medium text-foreground">
                  {p.seller.businessName}
                  {p.seller.isVerified && (
                    <span className="ml-1 text-[10px] text-emerald-600 font-semibold">
                      (Verified)
                    </span>
                  )}
                </td>
              ))}
            </tr>

            {/* Delivery row */}
            <tr>
              <td className="py-2.5 px-3 font-semibold text-muted-foreground">Delivery</td>
              {products.map((p: any) => (
                <td key={p._id} className="py-2.5 px-3 font-medium text-foreground">
                  {p.shippingDetails.freeShipping ? "Free" : "Standard"} in{" "}
                  {p.shippingDetails.estimatedDeliveryDays} days
                </td>
              ))}
            </tr>

            {/* Return Policy row */}
            <tr>
              <td className="py-2.5 px-3 font-semibold text-muted-foreground">Return Policy</td>
              {products.map((p: any) => (
                <td key={p._id} className="py-2.5 px-3 font-medium text-foreground">
                  {p.returnPolicy.windowDays} Days Replacement
                </td>
              ))}
            </tr>

            {/* Warranty row */}
            <tr>
              <td className="py-2.5 px-3 font-semibold text-muted-foreground">Warranty</td>
              {products.map((p: any) => (
                <td key={p._id} className="py-2.5 px-3 font-medium text-foreground">
                  {p.warranty.summary}
                </td>
              ))}
            </tr>

            {/* Dynamic Specifications Rows */}
            {specificationsMatrix &&
              specificationsMatrix.map((sec: any) =>
                sec.rows.map((row: any) => (
                  <tr key={`${sec.section}_${row.name}`}>
                    <td className="py-2 px-3 font-semibold text-muted-foreground">
                      {row.name}
                    </td>
                    {products.map((p: any) => (
                      <td key={p._id} className="py-2 px-3 text-foreground">
                        {row.values[p._id] || "—"}
                      </td>
                    ))}
                  </tr>
                ))
              )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductComparisonSection;
