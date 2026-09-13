import wishlistService from "../services/wishlist.service.js";

class WishlistController {
  async getWishlistOverview(req, res, next) {
    try {
      const user = req.user;
      const data = await wishlistService.getWishlistOverview(user._id, req.query);
      return res.status(200).json({
        ...data,
        error: false,
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  async toggleWishlistProduct(req, res, next) {
    try {
      const user = req.user;
      const { productId } = req.params;
      const result = await wishlistService.toggleWishlistProduct(user._id, productId);
      return res.status(200).json({
        ...result,
        error: false,
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  async saveProductToCollections(req, res, next) {
    try {
      const user = req.user;
      const { productId, collectionIds, variantId, note } = req.body;
      const result = await wishlistService.saveProductToCollections(user._id, {
        productId,
        collectionIds,
        variantId,
        note,
      });
      return res.status(200).json({
        ...result,
        error: false,
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProductSavedStatus(req, res, next) {
    try {
      const user = req.user;
      const { productId } = req.params;
      const result = await wishlistService.getProductSavedStatus(user._id, productId);
      return res.status(200).json({
        ...result,
        error: false,
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  async removeSavedItem(req, res, next) {
    try {
      const user = req.user;
      const itemId = req.params.id || req.body.itemId;
      const result = await wishlistService.removeSavedItem(user._id, itemId);
      return res.status(200).json({
        ...result,
        error: false,
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  async removeProductFromAll(req, res, next) {
    try {
      const user = req.user;
      const { productId } = req.params;
      const result = await wishlistService.removeProductFromAll(user._id, productId);
      return res.status(200).json({
        ...result,
        error: false,
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  async createCollection(req, res, next) {
    try {
      const user = req.user;
      const result = await wishlistService.createCollection(user._id, req.body);
      return res.status(201).json({
        ...result,
        error: false,
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCollection(req, res, next) {
    try {
      const user = req.user;
      const { id } = req.params;
      const result = await wishlistService.updateCollection(user._id, id, req.body);
      return res.status(200).json({
        ...result,
        error: false,
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteCollection(req, res, next) {
    try {
      const user = req.user;
      const { id } = req.params;
      const moveItemsToFavorites = req.query.moveItemsToFavorites !== "false";
      const result = await wishlistService.deleteCollection(user._id, id, moveItemsToFavorites);
      return res.status(200).json({
        ...result,
        error: false,
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  async moveItems(req, res, next) {
    try {
      const user = req.user;
      const { itemIds, targetCollectionId } = req.body;
      const result = await wishlistService.moveItems(user._id, { itemIds, targetCollectionId });
      return res.status(200).json({
        ...result,
        error: false,
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  async bulkDelete(req, res, next) {
    try {
      const user = req.user;
      const { itemIds } = req.body;
      const result = await wishlistService.bulkDelete(user._id, itemIds);
      return res.status(200).json({
        ...result,
        error: false,
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  async saveForLater(req, res, next) {
    try {
      const user = req.user;
      const { cartItemId, productId, variantId } = req.body;
      const result = await wishlistService.saveForLater(user._id, {
        cartItemId,
        productId,
        variantId,
      });
      return res.status(200).json({
        ...result,
        error: false,
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  async moveToCart(req, res, next) {
    try {
      const user = req.user;
      const { itemId, quantity } = req.body;
      const result = await wishlistService.moveToCart(user._id, { itemId, quantity });
      return res.status(200).json({
        ...result,
        error: false,
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  async shareCollection(req, res, next) {
    try {
      const user = req.user;
      const { id } = req.params;
      const result = await wishlistService.shareCollection(user._id, id);
      return res.status(200).json({
        ...result,
        error: false,
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSharedCollection(req, res, next) {
    try {
      const { shareToken } = req.params;
      const result = await wishlistService.getSharedCollection(shareToken);
      return res.status(200).json({
        ...result,
        error: false,
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  async syncGuestItems(req, res, next) {
    try {
      const user = req.user;
      const { guestItems } = req.body;
      const result = await wishlistService.syncGuestItems(user._id, guestItems);
      return res.status(200).json({
        ...result,
        error: false,
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new WishlistController();
