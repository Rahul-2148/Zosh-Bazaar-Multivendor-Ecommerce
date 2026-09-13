import mongoose from "mongoose";
import { Wishlist } from "../../../models/wishlist.model.js";
import { Collection, generateShareToken, sanitizeCollectionSlug } from "../../../models/collection.model.js";
import { SavedItem } from "../../../models/savedItem.model.js";
import { Product } from "../../../models/product.model.js";
import { Cart } from "../../../models/cart.model.js";
import { CartItem } from "../../../models/cartItem.model.js";

class WishlistService {
  /**
   * Ensures default "Favorites" and "Buy Later" collections exist for a user.
   * Also auto-migrates any legacy Wishlist products into "Favorites".
   */
  async getOrCreateDefaultCollections(userId) {
    let favorites = await Collection.findOne({ user: userId, isDefault: true });

    if (!favorites) {
      favorites = await Collection.create({
        user: userId,
        name: "Favorites",
        slug: "favorites",
        description: "Your default saved items",
        isDefault: true,
        isSystem: true,
        color: "#ef4444",
        icon: "favorite",
        sortOrder: 0,
      });
    }

    let buyLater = await Collection.findOne({ user: userId, slug: "buy-later" });
    if (!buyLater) {
      buyLater = await Collection.create({
        user: userId,
        name: "Buy Later",
        slug: "buy-later",
        description: "Items saved for later from your shopping bag",
        isDefault: false,
        isSystem: true,
        color: "#f59e0b",
        icon: "access_time",
        sortOrder: 1,
      });
    }

    // Automatic migration from legacy Wishlist model
    try {
      const legacyWishlist = await Wishlist.findOne({ user: userId });
      if (legacyWishlist && Array.isArray(legacyWishlist.products) && legacyWishlist.products.length > 0) {
        for (const prodId of legacyWishlist.products) {
          if (!prodId) continue;
          const exists = await SavedItem.findOne({
            user: userId,
            collectionId: favorites._id,
            product: prodId,
          });

          if (!exists) {
            const product = await Product.findById(prodId);
            if (product) {
              await SavedItem.create({
                user: userId,
                collectionId: favorites._id,
                product: product._id,
                savedPrice: product.sellingPrice || 0,
                savedMrp: product.mrpPrice || product.sellingPrice || 0,
                snapshot: {
                  title: product.title || "",
                  image: product.images?.[0] || "",
                  brand: product.brand || "",
                  category: product.category?.toString() || "",
                },
              });
            }
          }
        }
      }
    } catch (migErr) {
      console.error("[Wishlist Migration Error]:", migErr.message);
    }

    return { favorites, buyLater };
  }

  /**
   * Main dashboard fetch: returns collections, items, filters, live intelligence state,
   * pagination, and backwards compatibility payload.
   */
  async getWishlistOverview(userId, query = {}) {
    const { favorites } = await this.getOrCreateDefaultCollections(userId);

    const {
      collectionId,
      slug,
      search,
      availability = "all",
      sort = "recently_added",
      page = 1,
      limit = 30,
    } = query;

    // 1. Fetch all collections for user with item count & first 4 preview images
    const collections = await Collection.find({ user: userId }).sort({ sortOrder: 1, createdAt: 1 }).lean();

    const countsAggregation = await SavedItem.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: "$collectionId", count: { $sum: 1 } } },
    ]);

    const countMap = new Map();
    countsAggregation.forEach((c) => countMap.set(c._id.toString(), c.count));

    // Get preview images for collections
    const collectionsWithStats = await Promise.all(
      collections.map(async (col) => {
        const previewItems = await SavedItem.find({ collectionId: col._id })
          .sort({ createdAt: -1 })
          .limit(4)
          .populate("product", "images")
          .lean();

        const previewImages = previewItems
          .map((i) => (i.selectedVariant?.image || i.product?.images?.[0] || i.snapshot?.image))
          .filter(Boolean);

        return {
          ...col,
          itemCount: countMap.get(col._id.toString()) || 0,
          previewImages,
        };
      })
    );

    // 2. Determine target collection
    let targetCollection = favorites;
    if (collectionId && collectionId !== "all") {
      const found = collectionsWithStats.find((c) => c._id.toString() === collectionId.toString());
      if (found) targetCollection = found;
    } else if (slug && slug !== "all") {
      const found = collectionsWithStats.find((c) => c.slug === slug);
      if (found) targetCollection = found;
    }

    // 3. Build query for items
    const itemFilter = { user: userId };
    if (collectionId !== "all" && slug !== "all") {
      itemFilter.collectionId = targetCollection._id;
    }

    // Query items and populate product
    let rawItems = await SavedItem.find(itemFilter)
      .sort({ createdAt: -1 })
      .populate({
        path: "product",
        populate: [
          { path: "seller", select: "sellerName businessDetails email" },
          { path: "category", select: "name categoryId level" },
        ],
      })
      .lean();

    // 4. Calculate live intelligence state for each item
    let enrichedItems = rawItems.map((item) => {
      const prod = item.product;
      const isProductArchived = !prod || prod.status === "ARCHIVED";

      const currentPrice = prod ? prod.sellingPrice : item.savedPrice;
      const currentMrp = prod ? prod.mrpPrice : item.savedMrp;
      const savedPrice = item.savedPrice;
      const savedMrp = item.savedMrp;

      const priceDrop = prod && prod.sellingPrice < savedPrice ? savedPrice - prod.sellingPrice : 0;
      const priceIncrease = prod && prod.sellingPrice > savedPrice ? prod.sellingPrice - savedPrice : 0;

      let stockStatus = "IN_STOCK";
      if (isProductArchived) {
        stockStatus = "UNAVAILABLE";
      } else if (prod.countInStock <= 0 || !prod.inStock) {
        stockStatus = "OUT_OF_STOCK";
      } else if (prod.countInStock <= 5) {
        stockStatus = "LOW_STOCK";
      }

      const discountPercent =
        prod && currentMrp > currentPrice
          ? Math.round(((currentMrp - currentPrice) / currentMrp) * 100)
          : 0;

      return {
        ...item,
        smartState: {
          currentPrice,
          currentMrp,
          savedPrice,
          savedMrp,
          priceDrop,
          isPriceDropped: priceDrop > 0,
          priceIncrease,
          isPriceIncreased: priceIncrease > 0,
          discountPercent,
          stockStatus,
          countInStock: prod ? prod.countInStock : 0,
          isAvailable: !isProductArchived && prod?.countInStock > 0,
          isArchived: isProductArchived,
        },
      };
    });

    // 5. Apply search filter
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      enrichedItems = enrichedItems.filter((i) => {
        const title = (i.product?.title || i.snapshot?.title || "").toLowerCase();
        const brand = (i.product?.brand || i.snapshot?.brand || "").toLowerCase();
        const note = (i.note || "").toLowerCase();
        return title.includes(q) || brand.includes(q) || note.includes(q);
      });
    }

    // 6. Apply availability / deal filters
    if (availability === "in_stock") {
      enrichedItems = enrichedItems.filter(
        (i) => i.smartState.stockStatus === "IN_STOCK" || i.smartState.stockStatus === "LOW_STOCK"
      );
    } else if (availability === "out_of_stock") {
      enrichedItems = enrichedItems.filter(
        (i) => i.smartState.stockStatus === "OUT_OF_STOCK" || i.smartState.stockStatus === "UNAVAILABLE"
      );
    } else if (availability === "price_dropped") {
      enrichedItems = enrichedItems.filter((i) => i.smartState.isPriceDropped);
    } else if (availability === "on_sale") {
      enrichedItems = enrichedItems.filter((i) => i.smartState.discountPercent > 0);
    }

    // 7. Apply sorting
    if (sort === "price_low_high") {
      enrichedItems.sort((a, b) => a.smartState.currentPrice - b.smartState.currentPrice);
    } else if (sort === "price_high_low") {
      enrichedItems.sort((a, b) => b.smartState.currentPrice - a.smartState.currentPrice);
    } else if (sort === "biggest_discount") {
      enrichedItems.sort((a, b) => b.smartState.discountPercent - a.smartState.discountPercent);
    } else if (sort === "title_asc") {
      enrichedItems.sort((a, b) =>
        (a.product?.title || "").localeCompare(b.product?.title || "")
      );
    } // default is recently_added (already sorted by createdAt: -1)

    // 8. Pagination
    const totalItems = enrichedItems.length;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const startIndex = (pageNum - 1) * limitNum;
    const paginatedItems = enrichedItems.slice(startIndex, startIndex + limitNum);

    // 9. Collect all unique saved product IDs for the user (for instant heart button states everywhere)
    const allUserSavedItems = await SavedItem.find({ user: userId }).select("product").lean();
    const savedProductIds = Array.from(
      new Set(allUserSavedItems.map((i) => i.product.toString()))
    );

    // 10. Backward compatibility payload
    const legacyProducts = paginatedItems.map((i) => i.product).filter(Boolean);
    const legacyWishlist = {
      _id: targetCollection._id,
      user: userId,
      products: legacyProducts,
    };

    return {
      items: paginatedItems,
      activeCollection: targetCollection,
      collections: collectionsWithStats,
      totalSavedCount: savedProductIds.length,
      savedProductIds,
      pagination: {
        total: totalItems,
        page: pageNum,
        totalPages: Math.ceil(totalItems / limitNum) || 1,
        hasMore: startIndex + limitNum < totalItems,
      },
      wishlist: legacyWishlist,
    };
  }

  /**
   * 1-Click Quick Toggle Save (to default "Favorites" collection).
   * Fully backwards compatible with legacy toggle endpoint.
   */
  async toggleWishlistProduct(userId, productId) {
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error("Product not found");
    }

    const { favorites } = await this.getOrCreateDefaultCollections(userId);

    const existingItem = await SavedItem.findOne({
      user: userId,
      collectionId: favorites._id,
      product: productId,
    });

    let message = "";
    let isSaved = false;

    if (existingItem) {
      await SavedItem.findByIdAndDelete(existingItem._id);
      message = "Product removed from Favorites";
      isSaved = false;
    } else {
      await SavedItem.create({
        user: userId,
        collectionId: favorites._id,
        product: productId,
        savedPrice: product.sellingPrice || 0,
        savedMrp: product.mrpPrice || product.sellingPrice || 0,
        snapshot: {
          title: product.title || "",
          image: product.images?.[0] || "",
          brand: product.brand || "",
          category: product.category?.toString() || "",
        },
      });
      message = "Product saved to Favorites";
      isSaved = true;
    }

    // Keep legacy Wishlist in sync
    try {
      let legacyWishlist = await Wishlist.findOne({ user: userId });
      if (!legacyWishlist) {
        legacyWishlist = await Wishlist.create({ user: userId, products: [] });
      }
      const prodIdx = legacyWishlist.products.findIndex(
        (p) => p.toString() === productId.toString()
      );
      if (isSaved && prodIdx === -1) {
        legacyWishlist.products.push(productId);
      } else if (!isSaved && prodIdx > -1) {
        legacyWishlist.products.splice(prodIdx, 1);
      }
      await legacyWishlist.save();
    } catch {
      // ignore non-critical legacy sync errors
    }

    // Return updated overview for client
    const overview = await this.getWishlistOverview(userId);
    return {
      message,
      isSaved,
      savedProductIds: overview.savedProductIds,
      collections: overview.collections,
      wishlist: overview.wishlist,
    };
  }

  /**
   * Advanced Save: Save product into specified collections with optional variant info and note.
   */
  async saveProductToCollections(userId, { productId, collectionIds, variantId, note }) {
    const product = await Product.findById(productId);
    if (!product) throw new Error("Product not found");

    const { favorites } = await this.getOrCreateDefaultCollections(userId);
    const targetCollectionIds = Array.isArray(collectionIds) && collectionIds.length > 0
      ? collectionIds
      : [favorites._id.toString()];

    // Verify user owns all specified collections
    const userCollections = await Collection.find({
      user: userId,
      _id: { $in: targetCollectionIds },
    });

    if (userCollections.length !== targetCollectionIds.length) {
      throw new Error("One or more collections not found or unauthorized");
    }

    let selectedVariantData = null;
    let effectiveSellingPrice = product.sellingPrice;
    let effectiveMrp = product.mrpPrice;

    if (variantId && product.variants && product.variants.length > 0) {
      const match = product.variants.find((v) => v._id.toString() === variantId.toString());
      if (match) {
        selectedVariantData = {
          sku: match.sku,
          title: match.title,
          attributes: match.attributes,
          image: match.images?.[0] || product.images?.[0] || "",
        };
        effectiveSellingPrice = match.sellingPrice;
        effectiveMrp = match.mrpPrice;
      }
    }

    for (const col of userCollections) {
      const existing = await SavedItem.findOne({
        user: userId,
        collectionId: col._id,
        product: productId,
      });

      if (!existing) {
        await SavedItem.create({
          user: userId,
          collectionId: col._id,
          product: productId,
          variantId: variantId || null,
          selectedVariant: selectedVariantData || undefined,
          savedPrice: effectiveSellingPrice,
          savedMrp: effectiveMrp,
          snapshot: {
            title: product.title || "",
            image: selectedVariantData?.image || product.images?.[0] || "",
            brand: product.brand || "",
            category: product.category?.toString() || "",
          },
          note: note || "",
        });
      } else if (note || variantId) {
        if (note) existing.note = note;
        if (variantId) {
          existing.variantId = variantId;
          if (selectedVariantData) existing.selectedVariant = selectedVariantData;
        }
        await existing.save();
      }
    }

    const overview = await this.getWishlistOverview(userId);
    return {
      success: true,
      message: "Product saved to selected collections",
      savedProductIds: overview.savedProductIds,
      collections: overview.collections,
    };
  }

  /**
   * Check which collections currently hold a product.
   */
  async getProductSavedStatus(userId, productId) {
    const savedItems = await SavedItem.find({ user: userId, product: productId }).select("collectionId");
    const collectionIds = savedItems.map((i) => i.collectionId.toString());
    return {
      isSaved: collectionIds.length > 0,
      collectionIds,
    };
  }

  /**
   * Remove a single saved item by itemId.
   */
  async removeSavedItem(userId, itemId) {
    const item = await SavedItem.findOne({ _id: itemId, user: userId });
    if (!item) throw new Error("Saved item not found or unauthorized");

    await SavedItem.findByIdAndDelete(itemId);

    const overview = await this.getWishlistOverview(userId);
    return {
      success: true,
      message: "Item removed from collection",
      savedProductIds: overview.savedProductIds,
      collections: overview.collections,
    };
  }

  /**
   * Remove a product completely from all user collections.
   */
  async removeProductFromAll(userId, productId) {
    await SavedItem.deleteMany({ user: userId, product: productId });

    // Sync legacy wishlist
    try {
      const legacyWishlist = await Wishlist.findOne({ user: userId });
      if (legacyWishlist) {
        legacyWishlist.products = legacyWishlist.products.filter(
          (p) => p.toString() !== productId.toString()
        );
        await legacyWishlist.save();
      }
    } catch {
      // ignore
    }

    const overview = await this.getWishlistOverview(userId);
    return {
      success: true,
      message: "Product removed from all collections",
      savedProductIds: overview.savedProductIds,
      collections: overview.collections,
    };
  }

  /**
   * Collections Management: Create, Update, Delete, Share.
   */
  async createCollection(userId, data) {
    if (!data.name || !data.name.trim()) {
      throw new Error("Collection name is required");
    }

    const name = data.name.trim();
    const slug = sanitizeCollectionSlug(name);

    const existing = await Collection.findOne({ user: userId, name });
    if (existing) {
      throw new Error("A collection with this name already exists");
    }

    const collectionCount = await Collection.countDocuments({ user: userId });

    const newCollection = await Collection.create({
      user: userId,
      name,
      slug,
      description: data.description?.trim() || "",
      coverImage: data.coverImage || "",
      visibility: data.visibility || "PRIVATE",
      color: data.color || "#0d9488",
      icon: data.icon || "folder",
      sortOrder: collectionCount,
    });

    return {
      success: true,
      message: "Collection created successfully",
      collection: newCollection,
    };
  }

  async updateCollection(userId, collectionId, data) {
    const collection = await Collection.findOne({ _id: collectionId, user: userId });
    if (!collection) throw new Error("Collection not found or unauthorized");

    if (data.name && data.name.trim()) {
      const name = data.name.trim();
      if (collection.isSystem && name !== collection.name) {
        throw new Error("System collections cannot be renamed");
      }
      collection.name = name;
      collection.slug = sanitizeCollectionSlug(name);
    }

    if (data.description !== undefined) collection.description = data.description.trim();
    if (data.coverImage !== undefined) collection.coverImage = data.coverImage;
    if (data.visibility !== undefined) collection.visibility = data.visibility;
    if (data.color !== undefined) collection.color = data.color;
    if (data.icon !== undefined) collection.icon = data.icon;
    if (data.sortOrder !== undefined) collection.sortOrder = Number(data.sortOrder);

    await collection.save();
    return {
      success: true,
      message: "Collection updated successfully",
      collection,
    };
  }

  async deleteCollection(userId, collectionId, moveItemsToFavorites = true) {
    const collection = await Collection.findOne({ _id: collectionId, user: userId });
    if (!collection) throw new Error("Collection not found or unauthorized");

    if (collection.isDefault || collection.isSystem) {
      throw new Error("System and default collections cannot be deleted");
    }

    if (moveItemsToFavorites) {
      const { favorites } = await this.getOrCreateDefaultCollections(userId);
      const itemsToMove = await SavedItem.find({ collectionId: collection._id, user: userId });

      for (const item of itemsToMove) {
        const alreadyInFavorites = await SavedItem.findOne({
          user: userId,
          collectionId: favorites._id,
          product: item.product,
        });

        if (!alreadyInFavorites) {
          item.collectionId = favorites._id;
          await item.save();
        } else {
          await SavedItem.findByIdAndDelete(item._id);
        }
      }
    } else {
      await SavedItem.deleteMany({ collectionId: collection._id, user: userId });
    }

    await Collection.findByIdAndDelete(collectionId);

    const overview = await this.getWishlistOverview(userId);
    return {
      success: true,
      message: "Collection deleted successfully",
      collections: overview.collections,
    };
  }

  /**
   * Move items between collections atomically.
   */
  async moveItems(userId, { itemIds, targetCollectionId }) {
    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      throw new Error("No items specified to move");
    }

    const targetCollection = await Collection.findOne({ _id: targetCollectionId, user: userId });
    if (!targetCollection) throw new Error("Target collection not found or unauthorized");

    const items = await SavedItem.find({ _id: { $in: itemIds }, user: userId });
    let movedCount = 0;

    for (const item of items) {
      const existsInTarget = await SavedItem.findOne({
        user: userId,
        collectionId: targetCollection._id,
        product: item.product,
      });

      if (!existsInTarget) {
        item.collectionId = targetCollection._id;
        await item.save();
        movedCount++;
      } else {
        // Avoid duplicate in target: remove source
        await SavedItem.findByIdAndDelete(item._id);
        movedCount++;
      }
    }

    return {
      success: true,
      message: `Moved ${movedCount} item${movedCount === 1 ? "" : "s"} to ${targetCollection.name}`,
    };
  }

  /**
   * Bulk delete items.
   */
  async bulkDelete(userId, itemIds) {
    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      throw new Error("No items specified");
    }

    const result = await SavedItem.deleteMany({ _id: { $in: itemIds }, user: userId });
    const overview = await this.getWishlistOverview(userId);
    return {
      success: true,
      message: `Deleted ${result.deletedCount} items`,
      savedProductIds: overview.savedProductIds,
      collections: overview.collections,
    };
  }

  /**
   * Save for later from Cart.
   */
  async saveForLater(userId, { cartItemId, productId, variantId }) {
    const { buyLater } = await this.getOrCreateDefaultCollections(userId);

    const product = await Product.findById(productId);
    if (!product) throw new Error("Product not found");

    let variantData = undefined;
    let effectiveSellingPrice = product.sellingPrice;
    let effectiveMrp = product.mrpPrice;

    // 1. Remove from active cart if cartItemId provided
    if (cartItemId) {
      const cartItem = await CartItem.findOne({ _id: cartItemId, userId: userId.toString() });
      if (cartItem) {
        variantData = cartItem.selectedVariant;
        effectiveSellingPrice = cartItem.sellingPrice || effectiveSellingPrice;
        effectiveMrp = cartItem.mrpPrice || effectiveMrp;

        await CartItem.findByIdAndDelete(cartItemId);

        // Update cart totals
        const userCart = await Cart.findOne({ user: userId });
        if (userCart) {
          userCart.cartItems = userCart.cartItems.filter(
            (id) => id.toString() !== cartItemId.toString()
          );
          userCart.totalItem = Math.max(0, userCart.totalItem - 1);
          await userCart.save();
        }
      }
    }

    // 2. Add to Buy Later collection
    const exists = await SavedItem.findOne({
      user: userId,
      collectionId: buyLater._id,
      product: productId,
    });

    if (!exists) {
      await SavedItem.create({
        user: userId,
        collectionId: buyLater._id,
        product: productId,
        variantId: variantId || null,
        selectedVariant: variantData,
        savedPrice: effectiveSellingPrice,
        savedMrp: effectiveMrp,
        snapshot: {
          title: product.title || "",
          image: variantData?.image || product.images?.[0] || "",
          brand: product.brand || "",
          category: product.category?.toString() || "",
        },
        note: "Saved from cart",
      });
    }

    const overview = await this.getWishlistOverview(userId);
    return {
      success: true,
      message: `"${product.title}" moved to Buy Later`,
      savedProductIds: overview.savedProductIds,
      collections: overview.collections,
    };
  }

  /**
   * Move from Saved Items into Cart.
   */
  async moveToCart(userId, { itemId, quantity = 1 }) {
    const item = await SavedItem.findOne({ _id: itemId, user: userId }).populate("product");
    if (!item) throw new Error("Saved item not found");

    const product = item.product;
    if (!product || product.status === "ARCHIVED") {
      throw new Error("Product is no longer available");
    }

    if (product.countInStock <= 0 || !product.inStock) {
      throw new Error(`"${product.title}" is currently out of stock`);
    }

    // Find or create cart for user
    let userCart = await Cart.findOne({ user: userId });
    if (!userCart) {
      userCart = await Cart.create({
        user: userId,
        cartItems: [],
        totalMrpPrice: 0,
        totalSellingPrice: 0,
        totalItem: 0,
      });
    }

    // Check if item with this product & variant already in cart
    const existingCartItem = await CartItem.findOne({
      cart: userCart._id,
      product: product._id,
      variantId: item.variantId || null,
    });

    const qtyToAdd = Math.max(1, parseInt(quantity, 10));

    if (existingCartItem) {
      existingCartItem.quantity += qtyToAdd;
      await existingCartItem.save();
    } else {
      const newCartItem = await CartItem.create({
        cart: userCart._id,
        product: product._id,
        variantId: item.variantId || null,
        selectedVariant: item.selectedVariant,
        quantity: qtyToAdd,
        mrpPrice: product.mrpPrice,
        sellingPrice: product.sellingPrice,
        userId: userId.toString(),
      });
      userCart.cartItems.push(newCartItem._id);
    }

    // Recalculate totals
    const allCartItems = await CartItem.find({ cart: userCart._id });
    userCart.totalMrpPrice = allCartItems.reduce((acc, ci) => acc + ci.mrpPrice * ci.quantity, 0);
    userCart.totalSellingPrice = allCartItems.reduce((acc, ci) => acc + ci.sellingPrice * ci.quantity, 0);
    userCart.totalItem = allCartItems.reduce((acc, ci) => acc + ci.quantity, 0);
    userCart.discount = Math.max(0, userCart.totalMrpPrice - userCart.totalSellingPrice);
    await userCart.save();

    return {
      success: true,
      message: `"${product.title}" added to your bag`,
    };
  }

  /**
   * Share Collection: Generates or returns a secure share token and sets visibility to SHARED.
   */
  async shareCollection(userId, collectionId) {
    const collection = await Collection.findOne({ _id: collectionId, user: userId });
    if (!collection) throw new Error("Collection not found or unauthorized");

    if (!collection.shareToken) {
      collection.shareToken = generateShareToken();
    }
    collection.visibility = "SHARED";
    await collection.save();

    return {
      success: true,
      shareToken: collection.shareToken,
      collection,
    };
  }

  /**
   * Public View: Retrieves a shared collection without exposing private user data.
   */
  async getSharedCollection(shareToken) {
    if (!shareToken) throw new Error("Share token required");

    const collection = await Collection.findOne({
      shareToken,
      visibility: { $in: ["SHARED", "PUBLIC"] },
    })
      .populate("user", "fullName")
      .lean();

    if (!collection) {
      throw new Error("Shared collection not found or is set to private");
    }

    const items = await SavedItem.find({ collectionId: collection._id })
      .sort({ createdAt: -1 })
      .populate({
        path: "product",
        populate: [
          { path: "seller", select: "sellerName businessDetails" },
          { path: "category", select: "name categoryId" },
        ],
      })
      .lean();

    const enrichedItems = items.map((item) => {
      const prod = item.product;
      const isAvailable = prod && prod.status !== "ARCHIVED" && prod.countInStock > 0;
      return {
        ...item,
        smartState: {
          currentPrice: prod ? prod.sellingPrice : item.savedPrice,
          currentMrp: prod ? prod.mrpPrice : item.savedMrp,
          discountPercent:
            prod && prod.mrpPrice > prod.sellingPrice
              ? Math.round(((prod.mrpPrice - prod.sellingPrice) / prod.mrpPrice) * 100)
              : 0,
          stockStatus: !prod || prod.status === "ARCHIVED" ? "UNAVAILABLE" : prod.countInStock <= 0 ? "OUT_OF_STOCK" : "IN_STOCK",
          isAvailable,
        },
      };
    });

    // Strip private user information: show only first name
    const ownerName = collection.user?.fullName
      ? collection.user.fullName.split(" ")[0]
      : "A Shopper";

    return {
      collection: {
        _id: collection._id,
        name: collection.name,
        description: collection.description,
        coverImage: collection.coverImage,
        color: collection.color,
        icon: collection.icon,
        createdAt: collection.createdAt,
        updatedAt: collection.updatedAt,
        ownerName,
        itemCount: enrichedItems.length,
      },
      items: enrichedItems,
    };
  }

  /**
   * Merge Guest Wishlist Items into user's account upon login.
   */
  async syncGuestItems(userId, guestItems = []) {
    if (!Array.isArray(guestItems) || guestItems.length === 0) {
      return { success: true, syncedCount: 0 };
    }

    const { favorites } = await this.getOrCreateDefaultCollections(userId);
    let syncedCount = 0;

    for (const item of guestItems) {
      const prodId = item.productId || item._id;
      if (!prodId) continue;

      const product = await Product.findById(prodId);
      if (!product) continue;

      const exists = await SavedItem.findOne({
        user: userId,
        collectionId: favorites._id,
        product: product._id,
      });

      if (!exists) {
        await SavedItem.create({
          user: userId,
          collectionId: favorites._id,
          product: product._id,
          variantId: item.variantId || null,
          savedPrice: product.sellingPrice || 0,
          savedMrp: product.mrpPrice || product.sellingPrice || 0,
          snapshot: {
            title: product.title || "",
            image: product.images?.[0] || "",
            brand: product.brand || "",
            category: product.category?.toString() || "",
          },
        });
        syncedCount++;
      }
    }

    const overview = await this.getWishlistOverview(userId);
    return {
      success: true,
      syncedCount,
      savedProductIds: overview.savedProductIds,
      collections: overview.collections,
    };
  }
}

export default new WishlistService();
