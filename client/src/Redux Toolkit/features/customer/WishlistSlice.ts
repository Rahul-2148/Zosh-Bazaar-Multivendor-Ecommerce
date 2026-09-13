import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { Api } from "../../../config/Api";
import type {
  WishlistState,
  WishlistFilters,
  ICollection,
} from "../../../types/wishlistTypes";

const initialState: WishlistState = {
  items: [],
  collections: [],
  activeCollection: null,
  savedProductIds: [],
  totalSavedCount: 0,
  pagination: {
    total: 0,
    page: 1,
    totalPages: 1,
    hasMore: false,
  },
  filters: {
    availability: "all",
    sort: "recently_added",
    page: 1,
    limit: 30,
  },
  loading: false,
  collectionsLoading: false,
  error: null,
  message: null,
  wishlist: null,
};

const API_URL = "/wishlist";

// 1. Fetch Saved Items Overview (Collections + Items with Smart State)
export const getWishlist = createAsyncThunk(
  "wishlist/getWishlist",
  async (filters: WishlistFilters | undefined, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (filters?.collectionId) params.set("collectionId", filters.collectionId);
      if (filters?.slug) params.set("slug", filters.slug);
      if (filters?.search) params.set("search", filters.search);
      if (filters?.availability && filters.availability !== "all") {
        params.set("availability", filters.availability);
      }
      if (filters?.sort) params.set("sort", filters.sort);
      if (filters?.page) params.set("page", String(filters.page));
      if (filters?.limit) params.set("limit", String(filters.limit));

      const queryStr = params.toString() ? `?${params.toString()}` : "";
      const response = await Api.get(`${API_URL}${queryStr}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: error.message || "Failed to fetch wishlist" }
      );
    }
  }
);

// 2. Toggle Product in Default "Favorites" Collection (Optimistic 1-Click)
export const toggleWishlist = createAsyncThunk(
  "wishlist/toggleWishlist",
  async (productId: string, { rejectWithValue }) => {
    try {
      const response = await Api.post(`${API_URL}/toggle/${productId}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: error.message || "Failed to update wishlist" }
      );
    }
  }
);

// 3. Save Product to Specific Collections (Advanced Save)
export const saveProductToCollections = createAsyncThunk(
  "wishlist/saveProductToCollections",
  async (
    payload: {
      productId: string;
      collectionIds?: string[];
      variantId?: string;
      note?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await Api.post(`${API_URL}/save`, payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: error.message || "Failed to save product" }
      );
    }
  }
);

// 4. Create New Collection
export const createCollection = createAsyncThunk(
  "wishlist/createCollection",
  async (
    data: {
      name: string;
      description?: string;
      coverImage?: string;
      visibility?: "PRIVATE" | "SHARED" | "PUBLIC";
      color?: string;
      icon?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await Api.post(`${API_URL}/collections`, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: error.message || "Failed to create collection" }
      );
    }
  }
);

// 5. Update Collection
export const updateCollection = createAsyncThunk(
  "wishlist/updateCollection",
  async (
    { id, data }: { id: string; data: Partial<ICollection> },
    { rejectWithValue }
  ) => {
    try {
      const response = await Api.patch(`${API_URL}/collections/${id}`, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: error.message || "Failed to update collection" }
      );
    }
  }
);

// 6. Delete Collection
export const deleteCollection = createAsyncThunk(
  "wishlist/deleteCollection",
  async (
    { id, moveItemsToFavorites = true }: { id: string; moveItemsToFavorites?: boolean },
    { rejectWithValue }
  ) => {
    try {
      const response = await Api.delete(
        `${API_URL}/collections/${id}?moveItemsToFavorites=${moveItemsToFavorites}`
      );
      return { id, ...response.data };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: error.message || "Failed to delete collection" }
      );
    }
  }
);

// 7. Move Items Between Collections
export const moveSavedItems = createAsyncThunk(
  "wishlist/moveSavedItems",
  async (
    payload: { itemIds: string[]; targetCollectionId: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await Api.post(`${API_URL}/items/move`, payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: error.message || "Failed to move items" }
      );
    }
  }
);

// 8. Remove Single Saved Item
export const removeSavedItem = createAsyncThunk(
  "wishlist/removeSavedItem",
  async (itemId: string, { rejectWithValue }) => {
    try {
      const response = await Api.delete(`${API_URL}/items/${itemId}`);
      return { itemId, ...response.data };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: error.message || "Failed to remove item" }
      );
    }
  }
);

// 9. Bulk Delete Items
export const bulkDeleteItems = createAsyncThunk(
  "wishlist/bulkDeleteItems",
  async (itemIds: string[], { rejectWithValue }) => {
    try {
      const response = await Api.post(`${API_URL}/bulk-delete`, { itemIds });
      return { itemIds, ...response.data };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: error.message || "Failed to delete items" }
      );
    }
  }
);

// 10. Save for Later (from Cart to "Buy Later")
export const saveForLater = createAsyncThunk(
  "wishlist/saveForLater",
  async (
    payload: { cartItemId: string; productId: string; variantId?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await Api.post(`${API_URL}/save-for-later`, payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: error.message || "Failed to save item for later" }
      );
    }
  }
);

// 11. Move Item from Saved to Cart
export const moveItemToCart = createAsyncThunk(
  "wishlist/moveItemToCart",
  async (
    payload: { itemId: string; quantity?: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await Api.post(`${API_URL}/move-to-cart`, payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: error.message || "Failed to move to cart" }
      );
    }
  }
);

// 12. Share Collection
export const shareCollection = createAsyncThunk(
  "wishlist/shareCollection",
  async (collectionId: string, { rejectWithValue }) => {
    try {
      const response = await Api.post(`${API_URL}/collections/${collectionId}/share`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: error.message || "Failed to share collection" }
      );
    }
  }
);

// 13. Sync Guest Items into Account upon Login
export const syncGuestWishlist = createAsyncThunk(
  "wishlist/syncGuestWishlist",
  async (guestItems: any[], { rejectWithValue }) => {
    try {
      const response = await Api.post(`${API_URL}/sync-guest`, { guestItems });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || { message: error.message || "Failed to sync guest items" }
      );
    }
  }
);

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    setFilter: (state, action: PayloadAction<Partial<WishlistFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setActiveCollection: (state, action: PayloadAction<ICollection | null>) => {
      state.activeCollection = action.payload;
    },
    resetWishlistState: (state) => {
      state.items = [];
      state.collections = [];
      state.activeCollection = null;
      state.savedProductIds = [];
      state.totalSavedCount = 0;
      state.loading = false;
      state.error = null;
      state.message = null;
      state.wishlist = null;
    },
    clearWishlistMessage: (state) => {
      state.message = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // 1. getWishlist
    builder.addCase(getWishlist.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getWishlist.fulfilled, (state, action) => {
      state.loading = false;
      state.items = action.payload.items || [];
      state.collections = action.payload.collections || [];
      state.activeCollection = action.payload.activeCollection || null;
      state.savedProductIds = action.payload.savedProductIds || [];
      state.totalSavedCount = action.payload.totalSavedCount || (action.payload.savedProductIds?.length ?? 0);
      state.pagination = action.payload.pagination || state.pagination;
      state.wishlist = action.payload.wishlist || null;
      state.error = null;
    });
    builder.addCase(getWishlist.rejected, (state, action: PayloadAction<any>) => {
      state.loading = false;
      state.error = action.payload?.message || "Failed to fetch wishlist";
    });

    // 2. toggleWishlist (Optimistic updates!)
    builder.addCase(toggleWishlist.pending, (state, action) => {
      const prodId = action.meta.arg;
      const idx = state.savedProductIds.indexOf(prodId);
      if (idx > -1) {
        // Optimistically remove
        state.savedProductIds.splice(idx, 1);
        state.totalSavedCount = Math.max(0, state.totalSavedCount - 1);
        state.items = state.items.filter(
          (i) => (i.product?._id || i.product) !== prodId
        );
      } else {
        // Optimistically add
        state.savedProductIds.push(prodId);
        state.totalSavedCount += 1;
      }
      state.error = null;
    });
    builder.addCase(toggleWishlist.fulfilled, (state, action) => {
      if (action.payload.savedProductIds) {
        state.savedProductIds = action.payload.savedProductIds;
      }
      if (action.payload.collections) {
        state.collections = action.payload.collections;
      }
      if (action.payload.wishlist) {
        state.wishlist = action.payload.wishlist;
      }
      state.message = action.payload.message;
      state.error = null;
    });
    builder.addCase(toggleWishlist.rejected, (state, action: any) => {
      // Revert optimistic toggle
      const prodId = action.meta?.arg;
      const idx = state.savedProductIds.indexOf(prodId);
      if (idx > -1) {
        state.savedProductIds.splice(idx, 1);
        state.totalSavedCount = Math.max(0, state.totalSavedCount - 1);
      } else {
        state.savedProductIds.push(prodId);
        state.totalSavedCount += 1;
      }
      state.error = action.payload?.message || "Failed to update wishlist";
    });

    // 3. saveProductToCollections
    builder.addCase(saveProductToCollections.fulfilled, (state, action) => {
      if (action.payload.savedProductIds) {
        state.savedProductIds = action.payload.savedProductIds;
        state.totalSavedCount = action.payload.savedProductIds.length;
      }
      if (action.payload.collections) {
        state.collections = action.payload.collections;
      }
      state.message = action.payload.message || "Updated saved shopping lists";
    });

    // 4. createCollection
    builder.addCase(createCollection.fulfilled, (state, action) => {
      if (action.payload.collection) {
        state.collections.push({
          ...action.payload.collection,
          itemCount: 0,
          previewImages: [],
        });
      }
      state.message = action.payload.message || "Collection created";
    });

    // 5. updateCollection
    builder.addCase(updateCollection.fulfilled, (state, action) => {
      const updated = action.payload.collection;
      if (updated) {
        state.collections = state.collections.map((c) =>
          c._id === updated._id ? { ...c, ...updated } : c
        );
        if (state.activeCollection?._id === updated._id) {
          state.activeCollection = { ...state.activeCollection, ...updated };
        }
      }
      state.message = "Collection updated";
    });

    // 6. deleteCollection
    builder.addCase(deleteCollection.fulfilled, (state, action) => {
      const deletedId = action.payload.id;
      state.collections = state.collections.filter((c) => c._id !== deletedId);
      if (state.activeCollection?._id === deletedId) {
        state.activeCollection =
          state.collections.find((c) => c.isDefault) || state.collections[0] || null;
      }
      state.message = action.payload.message || "Collection deleted";
    });

    // 7. removeSavedItem (Optimistic)
    builder.addCase(removeSavedItem.pending, (state, action: any) => {
      const itemId = action.meta?.arg;
      const removed = state.items.find((i) => i._id === itemId);
      state.items = state.items.filter((i) => i._id !== itemId);
      if (removed) {
        const prodId = removed.product?._id || removed.product;
        // Check if prod still exists in other displayed items
        const remaining = state.items.some((i) => (i.product?._id || i.product) === prodId);
        if (!remaining) {
          state.savedProductIds = state.savedProductIds.filter((p) => p !== prodId);
          state.totalSavedCount = Math.max(0, state.totalSavedCount - 1);
        }
      }
    });
    builder.addCase(removeSavedItem.fulfilled, (state, action) => {
      if (action.payload.savedProductIds) {
        state.savedProductIds = action.payload.savedProductIds;
        state.totalSavedCount = action.payload.savedProductIds.length;
      }
      if (action.payload.collections) {
        state.collections = action.payload.collections;
      }
    });

    // 8. bulkDeleteItems
    builder.addCase(bulkDeleteItems.fulfilled, (state, action) => {
      const deletedIds = new Set(action.payload.itemIds);
      state.items = state.items.filter((i) => !deletedIds.has(i._id));
      if (action.payload.savedProductIds) {
        state.savedProductIds = action.payload.savedProductIds;
        state.totalSavedCount = action.payload.savedProductIds.length;
      }
      if (action.payload.collections) {
        state.collections = action.payload.collections;
      }
      state.message = action.payload.message;
    });

    // 9. saveForLater
    builder.addCase(saveForLater.fulfilled, (state, action) => {
      if (action.payload.savedProductIds) {
        state.savedProductIds = action.payload.savedProductIds;
        state.totalSavedCount = action.payload.savedProductIds.length;
      }
      if (action.payload.collections) {
        state.collections = action.payload.collections;
      }
      state.message = action.payload.message || "Moved to Buy Later";
    });

    // 10. syncGuestWishlist
    builder.addCase(syncGuestWishlist.fulfilled, (state, action) => {
      if (action.payload.savedProductIds) {
        state.savedProductIds = action.payload.savedProductIds;
        state.totalSavedCount = action.payload.savedProductIds.length;
      }
      if (action.payload.collections) {
        state.collections = action.payload.collections;
      }
    });
  },
});

export const {
  setFilter,
  setActiveCollection,
  resetWishlistState,
  clearWishlistMessage,
} = wishlistSlice.actions;

export default wishlistSlice.reducer;
