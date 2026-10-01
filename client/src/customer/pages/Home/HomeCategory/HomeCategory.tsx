import { useAppSelector } from "../../../../Redux Toolkit/Store";
import HomeCategoryCard from "./HomeCategoryCard";

const departmentFallback = [
  {
    name: "Fashion & Apparel",
    categoryId: "fashion",
    image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&auto=format&fit=crop&q=80",
    badge: "Up to 70% Off",
    tagline: "Ethnic, Western & Footwear",
    offerText: "Min 40% Off",
  },
  {
    name: "Electronics & Tech",
    categoryId: "electronics",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80",
    badge: "Best Value",
    tagline: "Mobiles, Audio & Laptops",
    offerText: "Top Brands",
  },
  {
    name: "Home & Living",
    categoryId: "home_furniture",
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80",
    badge: "Up to 60% Off",
    tagline: "Decor, Kitchen & Living",
    offerText: "Trending",
  },
  {
    name: "Beauty & Care",
    categoryId: "beauty",
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80",
    badge: "100% Genuine",
    tagline: "Skincare, Makeup & Fragrance",
    offerText: "Top Rated",
  },
  {
    name: "Grocery Essentials",
    categoryId: "grocery",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80",
    badge: "Super Savers",
    tagline: "Daily Staples & Snacks",
    offerText: "Starting ₹49",
  },
  {
    name: "Sports & Fitness",
    categoryId: "sports",
    image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80",
    badge: "Active Gear",
    tagline: "Sportswear & Equipment",
    offerText: "Min 30% Off",
  },
];

const HomeCategory = () => {
  const { homeCategory } = useAppSelector((store) => store);

  const categories =
    homeCategory?.marketplaceFeed?.categories && homeCategory.marketplaceFeed.categories.length > 0
      ? homeCategory.marketplaceFeed.categories.map((c: any) => {
          const fallback = departmentFallback.find(
            (d) => d.categoryId === c.categoryId || d.name.toLowerCase().includes(c.name.toLowerCase())
          );
          return {
            ...fallback,
            ...c,
            image: c.image || fallback?.image || "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=600",
            badge: c.badge || fallback?.badge || "Explore",
            tagline: c.tagline || fallback?.tagline || "Discover top picks & prices",
            offerText: c.offerText || fallback?.offerText || "Shop Now",
          };
        })
      : departmentFallback;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-5">
      {categories.map((item: any, index: number) => (
        <HomeCategoryCard key={item.categoryId || index} item={item} />
      ))}
    </div>
  );
};

export default HomeCategory;
