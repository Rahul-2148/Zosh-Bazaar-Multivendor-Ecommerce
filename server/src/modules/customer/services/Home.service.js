import HomeCategorySection from "../../../domain/HomeCategorySection.js";
import DealService from "../../admin/services/deal.service.js";

class HomeService {
  async createHomePageData(allCategories) {
    const gridCategories = allCategories.filter(
      (category) => category.section === HomeCategorySection.GRID
    );

    const shopByCategories = allCategories.filter(
      (category) => category.section === HomeCategorySection.SHOP_BY_CATEGORIES
    );

    const electronicsCategories = allCategories.filter(
      (category) => category.section === HomeCategorySection.ELECTRONICS_CATEGORIES
    );

    const dealCategories = allCategories.filter(
      (category) => category.section === HomeCategorySection.DEALS
    );

    const deals = await DealService.getDeals();

    const home = {
      grid: gridCategories,
      shopByCategories: shopByCategories,
      electronicsCategories: electronicsCategories,
      deals: deals,
      dealCategories: dealCategories,
    };
    return home;
  }

  async getMarketplaceFeed() {
    const { Product } = await import("../../../models/product.model.js");
    const { Category } = await import("../../../models/category.model.js");
    const { Deal } = await import("../../../models/deal.model.js");

    const [deals, topRated, newArrivals, highDiscount, rootCategories] = await Promise.all([
      Deal.find({}).populate("category").limit(8).lean(),
      Product.find({ status: "PUBLISHED", "ratings.average": { $gte: 4 } })
        .populate("category", "name categoryId")
        .populate("seller", "sellerName businessDetails")
        .sort({ "ratings.average": -1, "ratings.count": -1 })
        .limit(8)
        .lean(),
      Product.find({ status: "PUBLISHED" })
        .populate("category", "name categoryId")
        .populate("seller", "sellerName businessDetails")
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
      Product.find({ status: "PUBLISHED", discountPercent: { $gte: 15 } })
        .populate("category", "name categoryId")
        .populate("seller", "sellerName businessDetails")
        .sort({ discountPercent: -1 })
        .limit(8)
        .lean(),
      Category.find({ level: 1 })
        .select("name categoryId image level")
        .limit(12)
        .lean(),
    ]);

    const heroBanners = [
      {
        id: "banner-1",
        title: "Electronics Mega Carnival",
        subtitle: "Up to 50% Off on Premium Gadgets, Audio & Smart Devices",
        badge: "Mega Sale",
        categorySlug: "electronics",
        ctaText: "Explore Deals",
        gradient: "from-blue-600 to-indigo-950",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80",
      },
      {
        id: "banner-2",
        title: "Exclusive Fashion Fest",
        subtitle: "Trending Apparel, Footwear & Accessories From Verified Merchants",
        badge: "Trending Styles",
        categorySlug: "men_fashion",
        ctaText: "Shop The Look",
        gradient: "from-rose-600 to-amber-950",
        image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80",
      },
      {
        id: "banner-3",
        title: "Home & Kitchen Upgrades",
        subtitle: "Modern Cookware, Smart Decor & Fast Local Dispatch",
        badge: "Fresh Stock",
        categorySlug: "home_furniture",
        ctaText: "Upgrade Now",
        gradient: "from-emerald-600 to-teal-950",
        image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80",
      },
    ];

    return {
      heroBanners,
      deals,
      topRated: topRated.length ? topRated : newArrivals,
      newArrivals,
      flashDeals: highDiscount.length ? highDiscount : newArrivals,
      categories: rootCategories,
    };
  }
}

export default new HomeService();
