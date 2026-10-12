import CartService from "../services/cart.service.js";

class CartController {
  async findUserCartHandler(req, res, next) {
    try {
      const user = req.user;
      const cart = await CartService.findUserCart(user);
      return res.status(200).json({
        cart,
        error: false,
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  async addItemToCart(req, res, next) {
    try {
      const user = req.user;
      const {
        productId,
        variantId,
        quantity,
        size,
        ram,
        weight,
        capacity,
        sku,
      } = req.body;

      const cartItem = await CartService.addCartItem(
        user,
        productId,
        variantId,
        quantity,
        { size, ram, weight, capacity, sku }
      );

      return res.status(201).json({
        message: "Item added to cart",
        cartItem,
        error: false,
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteCartItemHandler(req, res, next) {
    try {
      const user = req.user;
      const result = await CartService.removeCartItem(
        user._id,
        req.params.cartItemId
      );

      return res.status(200).json({
        message: "Item removed from cart",
        ...result,
        error: false,
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCartItemHandler(req, res, next) {
    try {
      const user = req.user;
      const { quantity } = req.body || {};
      const updatedCartItem = await CartService.updateCartItemQuantity(
        user._id,
        req.params.cartItemId,
        quantity
      );

      return res.status(200).json({
        message: "Cart item updated successfully",
        cartItem: updatedCartItem,
        error: false,
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  async mergeCartHandler(req, res, next) {
    try {
      const user = req.user;
      const items = req.body?.items || req.body?.guestItems || [];
      const idempotencyKey =
        req.body?.idempotencyKey || req.headers["x-idempotency-key"] || null;
      const isRetry = Boolean(
        req.body?.isRetry ||
        req.body?.retryFailed ||
        req.query?.isRetry === "true" ||
        req.body?.retryMode === "FAILED_ITEMS"
      );
      const retryMode =
        req.body?.retryMode || (isRetry ? "FAILED_ITEMS" : "NONE");
      const attempt = Number(req.body?.attempt) || 1;

      const result = await CartService.mergeGuestCart(user, items, {
        idempotencyKey,
        isRetry,
        retryFailed: isRetry,
        retryMode,
        attempt,
      });
      return res.status(200).json({
        message: result.message,
        cart: result.cart,
        mergedItems: result.mergedItems,
        failedItems: result.failedItems,
        totalProcessed: result.totalProcessed,
        isIdempotentReplay: result.isIdempotentReplay || false,
        error: false,
        success: true,
      });
    } catch (error) {
      if (error.statusCode === 409 || error.code === "MERGE_IN_PROGRESS") {
        return res.status(409).json({
          message: error.message,
          error: true,
          success: false,
          code: "MERGE_IN_PROGRESS",
        });
      }
      next(error);
    }
  }
}

export default new CartController();
