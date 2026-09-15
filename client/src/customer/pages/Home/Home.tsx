import { useEffect, useState } from "react";
import { Storefront } from "@mui/icons-material";
import { Button, CircularProgress } from "@mui/material";
import HeroBannerCarousel from "./HeroBannerCarousel";
import CategoryQuickRail from "./CategoryQuickRail";
import TrustStrip from "./TrustStrip";
import FlashDealsSection from "./FlashDealsSection";
import ProductRail from "./ProductRail";
import HomeGrid from "./Grid/Grid";
import Deal from "./Deal/Deal";
import HomeCategory from "./HomeCategory/HomeCategory";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import { fetchMarketplaceFeed } from "../../../Redux Toolkit/features/customer/HomeCategorySlice";
import { fetchHomeRecommendations } from "../../../services/aiRecommendationService";
import { aiTracker } from "../../../services/aiEventTracker";
import sellerBannerImage from "../../../assets/seller_banner_image.jpg";

const Home = () => {
  const dispatch = useAppDispatch();
  const { marketplaceFeed, loading } = useAppSelector((store) => store.homeCategory);

  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
  const [aiSubtitle, setAiSubtitle] = useState<string>("Personalized picks powered by Zosh AI");

  const [recentlyViewed] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem("zosh_recently_viewed");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    dispatch(fetchMarketplaceFeed());

    // Fetch dynamic multi-stage AI recommendations for customer homepage
    fetchHomeRecommendations(6, "home_for_you").then((res) => {
      if (res && res.recommendations && res.recommendations.length > 0) {
        // Normalize product objects to match ProductRail props
        const normalized = res.recommendations.map((item) => ({
          _id: item.productId,
          title: item.title,
          brand: item.brand,
          sellingPrice: item.sellingPrice,
          mrpPrice: item.mrpPrice,
          discountPercent: item.discountPercent,
          images: item.images,
          ratings: { average: item.ratingAverage || 4.5, count: item.ratingCount || 15 },
          countInStock: item.inStock ? 10 : 0,
          category: { categoryId: item.categoryId || "all" },
          recommendationContext: {
            recommendationId: `rec_${item.productId}`,
            requestId: res.requestId,
            placement: res.placement,
            modelVersion: res.modelVersion,
          },
        }));
        setAiRecommendations(normalized);

        const firstExplanation = res.recommendations[0]?.explanationText;
        if (firstExplanation) {
          setAiSubtitle(firstExplanation);
        }

        // Track recommendation impression batch
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
      }
    });
  }, [dispatch]);

  if (loading && !marketplaceFeed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <CircularProgress size={36} color="primary" />
        <p className="text-xs text-muted-foreground font-medium">
          Loading Zosh Bazaar Marketplace...
        </p>
      </div>
    );
  }

  const feed = marketplaceFeed || {
    heroBanners: [],
    deals: [],
    topRated: [],
    newArrivals: [],
    flashDeals: [],
    categories: [],
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-16">
      {/* 1. Dynamic Hero Promotional Banners */}
      {feed.heroBanners && feed.heroBanners.length > 0 && (
        <HeroBannerCarousel banners={feed.heroBanners} />
      )}

      {/* 2. Visual Category Quick Navigation */}
      <CategoryQuickRail categories={feed.categories} />

      {/* 3. Marketplace Trust Guarantees */}
      <TrustStrip />

      {/* 4. Live Flash Deals Section with Countdown */}
      {feed.flashDeals && feed.flashDeals.length > 0 && (
        <FlashDealsSection deals={feed.flashDeals} />
      )}

      {/* 4.5. AI Personalized Recommender Rail */}
      {aiRecommendations.length > 0 && (
        <ProductRail
          title="Recommended For You"
          subtitle={aiSubtitle}
          products={aiRecommendations}
          badge="AI Powered"
          viewAllUrl="/products"
        />
      )}

      {/* 5. Top Rated Products Carousel */}
      {feed.topRated && feed.topRated.length > 0 && (
        <ProductRail
          title="Top Rated by Customers"
          subtitle="Highest customer ratings & verified reviews"
          products={feed.topRated}
          badge="Verified Choice"
          viewAllUrl="/products?sort=rating"
        />
      )}

      {/* 5.5. Recently Viewed Products (Personalization) */}
      {recentlyViewed.length > 0 && (
        <ProductRail
          title="Recently Viewed Products"
          subtitle="Pick up right where you left off"
          products={recentlyViewed}
          badge="Browsing History"
          viewAllUrl="/products"
        />
      )}

      {/* 6. Trending Collections Showcase */}
      <section>
        <div className="mx-3 sm:mx-6 lg:mx-16 xl:mx-20 mb-3">
          <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            Trending Collections
          </h2>
          <p className="text-xs text-muted-foreground">
            Handpicked styles & top picks for you
          </p>
        </div>
        <HomeGrid />
      </section>

      {/* 7. New Arrivals Carousel */}
      {feed.newArrivals && feed.newArrivals.length > 0 && (
        <ProductRail
          title="Fresh New Arrivals"
          subtitle="Newly listed inventory from verified marketplace sellers"
          products={feed.newArrivals}
          badge="Just Added"
          viewAllUrl="/products?sort=newest"
        />
      )}

      {/* 8. Featured Category Steals & Super Savers */}
      <section className="bg-gradient-to-b from-primary/5 to-transparent py-4 sm:py-5">
        <div className="mx-3 sm:mx-6 lg:mx-16 xl:mx-20 mb-2 sm:mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-xl font-black text-foreground tracking-tight">
              Featured Category Deals & Super Savers
            </h2>
            <p className="text-[11px] sm:text-xs text-muted-foreground">
              Deep promotional discounts across verified marketplace departments
            </p>
          </div>
        </div>
        <Deal />
      </section>

      {/* 9. Shop By Full Category Catalog */}
      <section>
        <div className="mx-3 sm:mx-6 lg:mx-16 xl:mx-20 mb-2">
          <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight text-center sm:text-left">
            Shop By Department
          </h2>
          <p className="text-xs text-muted-foreground text-center sm:text-left">
            Explore curated collections across our marketplace
          </p>
        </div>
        <HomeCategory />
      </section>

      {/* 10. Multi-Vendor Seller Hub Onboarding Banner */}
      <section className="mx-3 sm:mx-6 lg:mx-16 xl:mx-20">
        <div className="relative rounded-3xl overflow-hidden shadow-sm h-[240px] sm:h-[320px] lg:h-[380px]">
          <img
            src={sellerBannerImage}
            alt="Become a Seller"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-transparent flex items-center p-6 sm:p-12 lg:p-16">
            <div className="text-white space-y-3 max-w-md">
              <span className="inline-block px-3 py-1 rounded-full bg-teal-500/90 text-white font-bold text-xs uppercase tracking-wider shadow-sm">
                Seller Hub
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
                Grow Your Business on Zosh Bazaar
              </h2>
              <p className="text-xs sm:text-sm text-gray-200">
                Reach millions of customers nationwide. Fast onboarding, automated inventory, and dedicated logistics support.
              </p>
              <div className="pt-2">
                <Button
                  onClick={() => {
                    const sellerBase = (
                      import.meta.env.VITE_SELLER_PORTAL_URL || "http://localhost:5175"
                    ).replace(/\/+$/, "");
                    window.open(
                      `${sellerBase}/register`,
                      "_blank",
                      "noopener,noreferrer"
                    );
                  }}
                  startIcon={<Storefront />}
                  variant="contained"
                  color="primary"
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    px: 3,
                    py: 1.2,
                    borderRadius: "0.85rem",
                    boxShadow: "0 4px 14px rgba(13, 148, 136, 0.4)",
                  }}
                >
                  Start Selling Today →
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
