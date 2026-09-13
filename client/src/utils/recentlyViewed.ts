// client/src/utils/recentlyViewed.ts

const STORAGE_KEY = "zosh_recently_viewed_products";
const MAX_RECENT_ITEMS = 30;

import type { IRecentlyViewedItem } from "../types/userTypes";

export type { IRecentlyViewedItem };

export const getRecentlyViewedProducts = (): IRecentlyViewedItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveRecentlyViewedProduct = (product: any) => {
  if (typeof window === "undefined" || !product?._id) return;
  try {
    const current = getRecentlyViewedProducts();
    const productId = product._id.toString();

    // Extract first image safely
    let image = "";
    if (Array.isArray(product.images) && product.images.length > 0) {
      const first = product.images[0];
      image = typeof first === "object" ? first.url || "" : first;
    } else if (typeof product.image === "string") {
      image = product.image;
    }

    const newItem: IRecentlyViewedItem = {
      productId,
      title: product.title || "Product",
      image,
      sellingPrice: product.sellingPrice || 0,
      mrpPrice: product.mrpPrice || product.sellingPrice || 0,
      rating: product.rating || 0,
      ratingsCount: product.ratingsCount || 0,
      category: typeof product.category === "object" ? product.category?.name : product.category,
      viewedAt: new Date().toISOString(),
    };

    // Filter out existing occurrence to move to front
    const updated = [newItem, ...current.filter((item) => item.productId !== productId)].slice(
      0,
      MAX_RECENT_ITEMS
    );

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("recentlyViewedUpdated"));
  } catch (err) {
    console.error("Failed to save recently viewed product", err);
  }
};

export const removeRecentlyViewedProduct = (productId: string) => {
  if (typeof window === "undefined") return;
  try {
    const current = getRecentlyViewedProducts();
    const updated = current.filter((item) => item.productId !== productId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("recentlyViewedUpdated"));
  } catch (err) {
    console.error("Failed to remove recently viewed product", err);
  }
};

export const clearRecentlyViewedProducts = () => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent("recentlyViewedUpdated"));
  } catch (err) {
    console.error("Failed to clear recently viewed products", err);
  }
};
