import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ProductCard from "../ProductCard";
import { fetchProductRecommendations } from "../../../../services/aiRecommendationService";
import { aiTracker } from "../../../../services/aiEventTracker";

interface SimilarProductsProps {
  productId?: string;
}

const SimilarProducts: React.FC<SimilarProductsProps> = ({ productId: propProductId }) => {
  const { productId: routeProductId } = useParams<{ productId: string }>();
  const activeProductId = propProductId || routeProductId;

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!activeProductId) return;

    setLoading(true);
    fetchProductRecommendations(activeProductId, "pdp_similar", 6)
      .then((res) => {
        if (res && res.recommendations && res.recommendations.length > 0) {
          const formatted = res.recommendations.map((item) => ({
            _id: item.productId,
            title: item.title,
            brand: item.brand,
            sellingPrice: item.sellingPrice,
            mrpPrice: item.mrpPrice,
            discountPercent: item.discountPercent,
            images: item.images,
            ratings: {
              average: item.ratingAverage || 4.5,
              count: item.ratingCount || 10,
            },
            countInStock: item.inStock ? 10 : 0,
            inStock: item.inStock,
            seller: {
              businessDetails: { businessName: item.sellerName || "Zosh Certified" },
            },
            category: { categoryId: item.categoryId || "all" },
            recommendationContext: {
              recommendationId: `rec_${item.productId}`,
              requestId: res.requestId,
              placement: res.placement,
              modelVersion: res.modelVersion,
            },
          }));
          setProducts(formatted);

          // Track recommendation impressions
          res.recommendations.forEach((it, idx) => {
            aiTracker.trackRecommendationImpression(
              {
                recommendationId: `rec_${it.productId}`,
                requestId: res.requestId,
                placement: res.placement,
                modelVersion: res.modelVersion,
                rankPosition: idx + 1,
              },
              it.productId
            );
          });
        } else {
          setProducts([]);
        }
      })
      .catch(() => {
        setProducts([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [activeProductId]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3.5 animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-64 bg-muted/40 rounded-xl" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3.5">
      {products.map((item) => (
        <ProductCard key={item._id} item={item} />
      ))}
    </div>
  );
};

export default SimilarProducts;
