import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowForward, AutoAwesome, ChevronLeft, ChevronRight } from "@mui/icons-material";

interface CategoryQuickRailProps {
  categories?: any[];
}

interface QuickCategory {
  id: string;
  name: string;
  categoryId: string;
  image: string;
  bg: string;
  badge?: string;
  tagline?: string;
}

// 12 Comprehensive Top Marketplace Departments with rich curated visuals & pastel gradient backdrops
const CANONICAL_DEPARTMENTS: QuickCategory[] = [
  {
    id: "fashion",
    name: "Fashion",
    categoryId: "fashion",
    image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=300&auto=format&fit=crop&q=80",
    bg: "from-rose-500/15 via-pink-500/10 to-amber-500/10",
    badge: "Trending",
    tagline: "Apparel & Styles",
  },
  {
    id: "electronics",
    name: "Electronics",
    categoryId: "electronics",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&auto=format&fit=crop&q=80",
    bg: "from-blue-500/15 via-cyan-500/10 to-indigo-500/10",
    badge: "Best Deals",
    tagline: "Mobiles & Gadgets",
  },
  {
    id: "home_furniture",
    name: "Home & Kitchen",
    categoryId: "home_furniture",
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&auto=format&fit=crop&q=80",
    bg: "from-amber-500/15 via-yellow-500/10 to-orange-500/10",
    badge: "Best Value",
    tagline: "Decor & Living",
  },
  {
    id: "beauty",
    name: "Beauty & Care",
    categoryId: "beauty",
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=300&auto=format&fit=crop&q=80",
    bg: "from-purple-500/15 via-fuchsia-500/10 to-pink-500/10",
    badge: "100% Genuine",
    tagline: "Skincare & Makeup",
  },
  {
    id: "grocery",
    name: "Groceries",
    categoryId: "grocery",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&auto=format&fit=crop&q=80",
    bg: "from-emerald-500/15 via-green-500/10 to-teal-500/10",
    badge: "Instant",
    tagline: "Pantry & Snacks",
  },
  {
    id: "sports",
    name: "Sports & Fitness",
    categoryId: "sports",
    image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=300&auto=format&fit=crop&q=80",
    bg: "from-teal-500/15 via-sky-500/10 to-blue-500/10",
    badge: "Activewear",
    tagline: "Gear & Training",
  },
  {
    id: "footwear",
    name: "Footwear",
    categoryId: "footwear",
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&auto=format&fit=crop&q=80",
    bg: "from-orange-500/15 via-red-500/10 to-amber-500/10",
    badge: "New Launch",
    tagline: "Sneakers & Formals",
  },
  {
    id: "appliances",
    name: "Appliances",
    categoryId: "appliances",
    image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=300&auto=format&fit=crop&q=80",
    bg: "from-cyan-500/15 via-sky-500/10 to-blue-500/10",
    badge: "Top Rated",
    tagline: "Smart Home Tech",
  },
  {
    id: "watches",
    name: "Watches",
    categoryId: "watches",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&auto=format&fit=crop&q=80",
    bg: "from-violet-500/15 via-purple-500/10 to-pink-500/10",
    badge: "Luxury",
    tagline: "Timepieces & Jewelry",
  },
  {
    id: "bags",
    name: "Bags & Luggage",
    categoryId: "fashion_accessories",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&auto=format&fit=crop&q=80",
    bg: "from-yellow-500/15 via-amber-500/10 to-orange-500/10",
    badge: "Durable",
    tagline: "Travel & Backpacks",
  },
  {
    id: "toys",
    name: "Kids & Toys",
    categoryId: "toys",
    image: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=300&auto=format&fit=crop&q=80",
    bg: "from-pink-500/15 via-rose-500/10 to-fuchsia-500/10",
    badge: "Fun Picks",
    tagline: "Toys & Games",
  },
  {
    id: "books",
    name: "Books & Study",
    categoryId: "stationery",
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&auto=format&fit=crop&q=80",
    bg: "from-indigo-500/15 via-blue-500/10 to-cyan-500/10",
    badge: "Bestsellers",
    tagline: "Novels & Office",
  },
];

// Helper to filter out demographic subcategories (e.g. men, women)
const isDemographicSubcat = (cat: any) => {
  const cid = String(cat.categoryId || cat._id || "").toLowerCase();
  const cname = String(cat.name || "").toLowerCase();
  return (
    cid === "men" ||
    cid === "women" ||
    cname === "men" ||
    cname === "women" ||
    cname.includes("men's fashion") ||
    cname.includes("women's fashion")
  );
};

export const CategoryQuickRail: React.FC<CategoryQuickRailProps> = ({ categories }) => {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Combine server categories with canonical departments
  const displayCategories: QuickCategory[] = React.useMemo(() => {
    const map = new Map<string, QuickCategory>();
    CANONICAL_DEPARTMENTS.forEach((dep) => map.set(dep.id, { ...dep }));

    if (categories && Array.isArray(categories)) {
      categories.forEach((cat: any) => {
        if (isDemographicSubcat(cat)) return;
        const key = (cat.categoryId || "").toLowerCase();
        if (key && map.has(key)) {
          const existing = map.get(key)!;
          if (cat.image && typeof cat.image === "string" && cat.image.startsWith("http")) {
            existing.image = cat.image;
          }
        }
      });
    }

    return Array.from(map.values());
  }, [categories]);

  // Update scroll button states
  const checkScrollability = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  useEffect(() => {
    checkScrollability();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScrollability, { passive: true });
      window.addEventListener("resize", checkScrollability);
      return () => {
        el.removeEventListener("scroll", checkScrollability);
        window.removeEventListener("resize", checkScrollability);
      };
    }
  }, [displayCategories]);

  const handleScroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = direction === "left" ? -360 : 360;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  return (
    <section className="mx-3 sm:mx-6 lg:mx-16 xl:mx-20 my-4 sm:my-6 relative group/rail">
      {/* Section Header with Left/Right Scroll Controls */}
      <div className="flex items-center justify-between mb-3 px-0.5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-xl font-black text-foreground tracking-tight">
              Explore by Category
            </h3>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
              <AutoAwesome className="w-3 h-3 text-primary" style={{ fontSize: "12px" }} /> Scroll All Departments
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 hidden sm:block">
            Swipe or scroll across all verified marketplace categories for fast delivery & best offers
          </p>
        </div>

        {/* Action Controls: Scroll buttons + View All */}
        <div className="flex items-center gap-2">
          {/* Scroll Left Button */}
          <button
            type="button"
            aria-label="Scroll left"
            onClick={() => handleScroll("left")}
            disabled={!canScrollLeft}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-border/80 flex items-center justify-center transition-all ${
              canScrollLeft
                ? "bg-card hover:bg-primary/10 text-foreground hover:text-primary hover:border-primary/50 shadow-xs cursor-pointer active:scale-95"
                : "opacity-25 cursor-not-allowed bg-muted/40 text-muted-foreground"
            }`}
          >
            <ChevronLeft style={{ fontSize: "18px" }} />
          </button>

          {/* Scroll Right Button */}
          <button
            type="button"
            aria-label="Scroll right"
            onClick={() => handleScroll("right")}
            disabled={!canScrollRight}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-border/80 flex items-center justify-center transition-all ${
              canScrollRight
                ? "bg-card hover:bg-primary/10 text-foreground hover:text-primary hover:border-primary/50 shadow-xs cursor-pointer active:scale-95"
                : "opacity-25 cursor-not-allowed bg-muted/40 text-muted-foreground"
            }`}
          >
            <ChevronRight style={{ fontSize: "18px" }} />
          </button>

          {/* View All Button */}
          <button
            type="button"
            onClick={() => navigate("/products/fashion")}
            className="text-xs font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-0.5 ml-1 cursor-pointer group"
          >
            <span>View All</span>
            <ArrowForward style={{ fontSize: "14px" }} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Smooth Horizontally Scrollable Rail */}
      <div
        ref={scrollRef}
        className="flex items-start gap-3 sm:gap-4 md:gap-5 overflow-x-auto scrollbar-none scroll-smooth pb-2 pt-1 px-1 -mx-1"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {displayCategories.map((cat) => {
          const targetUrl = `/products/${cat.categoryId}`;

          return (
            <div
              key={cat.id}
              onClick={() => navigate(targetUrl)}
              className="group flex flex-col items-center cursor-pointer shrink-0 w-[90px] sm:w-[108px] md:w-[118px] transition-all duration-300"
            >
              {/* Category Tile with pastel backdrop & smooth hover */}
              <div
                className={`relative w-[80px] h-[80px] sm:w-[96px] sm:h-[96px] md:w-[106px] md:h-[106px] rounded-2xl bg-gradient-to-br ${cat.bg} border border-border/80 group-hover:border-primary/60 group-hover:shadow-lg group-hover:-translate-y-1 transition-all duration-300 p-1.5 flex items-center justify-center overflow-hidden`}
              >
                {/* Micro Badge */}
                {cat.badge && (
                  <span className="absolute top-1 left-1 z-10 px-1.5 py-0.5 rounded-md bg-white/95 dark:bg-black/85 backdrop-blur-xs text-[8.5px] sm:text-[9px] font-black text-primary tracking-tight shadow-xs">
                    {cat.badge}
                  </span>
                )}

                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover rounded-xl group-hover:scale-108 transition-transform duration-500 ease-out"
                  loading="lazy"
                />
              </div>

              {/* Department Name - 2 lines max with uniform height */}
              <span className="text-[11px] sm:text-xs font-bold text-center text-foreground group-hover:text-primary transition-colors line-clamp-2 mt-1.5 leading-tight h-[28px] flex items-center justify-center max-w-[88px] sm:max-w-[104px]">
                {cat.name}
              </span>

              {/* Tagline / Subtitle */}
              {cat.tagline && (
                <span className="text-[9.5px] sm:text-[10px] text-muted-foreground text-center line-clamp-1 max-w-[88px] sm:max-w-[104px] mt-0.5">
                  {cat.tagline}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default CategoryQuickRail;
