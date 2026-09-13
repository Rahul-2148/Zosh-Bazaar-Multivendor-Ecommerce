const GUEST_STORAGE_KEY = "zosh_guest_saved_items";

export interface GuestSavedItem {
  productId: string;
  variantId?: string | null;
  addedAt: string;
  product?: any;
}

export const getGuestSavedItems = (): GuestSavedItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(GUEST_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const isGuestProductSaved = (productId: string): boolean => {
  const items = getGuestSavedItems();
  return items.some((item) => item.productId === productId);
};

export const getGuestSavedCount = (): number => {
  return getGuestSavedItems().length;
};

export const toggleGuestSavedItem = (
  product: any,
  variantId?: string | null
): { isSaved: boolean; count: number } => {
  if (typeof window === "undefined") return { isSaved: false, count: 0 };
  try {
    const prodId = product._id || product.id || product;
    const items = getGuestSavedItems();
    const existingIndex = items.findIndex((i) => i.productId === prodId);

    let isSaved = false;
    if (existingIndex > -1) {
      items.splice(existingIndex, 1);
      isSaved = false;
    } else {
      items.unshift({
        productId: prodId,
        variantId: variantId || null,
        addedAt: new Date().toISOString(),
        product: typeof product === "object" ? product : undefined,
      });
      isSaved = true;
    }

    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent("guestWishlistUpdated", { detail: { items, count: items.length } }));
    return { isSaved, count: items.length };
  } catch {
    return { isSaved: false, count: 0 };
  }
};

export const clearGuestSavedItems = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GUEST_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("guestWishlistUpdated", { detail: { items: [], count: 0 } }));
};
