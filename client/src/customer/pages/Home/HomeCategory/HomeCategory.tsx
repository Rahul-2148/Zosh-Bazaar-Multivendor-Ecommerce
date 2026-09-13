import { useAppSelector } from "../../../../Redux Toolkit/Store";
import HomeCategoryCard from "./HomeCategoryCard";

const departmentFallback = [
  {
    name: "Fashion & Apparel",
    categoryId: "fashion",
    image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&auto=format&fit=crop&q=80",
  },
  {
    name: "Electronics & Tech",
    categoryId: "electronics",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&auto=format&fit=crop&q=80",
  },
  {
    name: "Home & Kitchen",
    categoryId: "home_furniture",
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&auto=format&fit=crop&q=80",
  },
  {
    name: "Beauty & Personal Care",
    categoryId: "beauty",
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&auto=format&fit=crop&q=80",
  },
  {
    name: "Grocery & Essentials",
    categoryId: "grocery",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=80",
  },
  {
    name: "Sports & Fitness",
    categoryId: "sports",
    image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&auto=format&fit=crop&q=80",
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
            ...c,
            image: c.image || fallback?.image || "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400",
          };
        })
      : departmentFallback;

  return (
    <div className="px-4 sm:px-8 lg:px-20 py-4 sm:py-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6 justify-items-center">
        {categories.map((item: any, index: number) => (
          <HomeCategoryCard key={item.categoryId || index} item={item} />
        ))}
      </div>
    </div>
  );
};

export default HomeCategory;
