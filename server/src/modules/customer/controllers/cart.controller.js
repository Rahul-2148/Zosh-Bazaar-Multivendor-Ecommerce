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
      const result = await CartService.mergeGuestCart(user, items, {
        idempotencyKey,
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
      next(error);
    }
  }
}

export default new CartController();
