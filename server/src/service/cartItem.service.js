import { CartItem } from "../models/cartItem.model.js";

class CartItemService {
  async updateCartItem(userId, cartItemId, cartItemData) {
    const cartItem = await this.findCartItemById(cartItemId);

    if (cartItem.userId.toString() === userId.toString()) {
      const updated = {
        quantity: cartItemData.quantity,
        mrpPrice: cartItemData.quantity * cartItem.product.mrpPrice,
        sellingPrice: cartItemData.quantity * cartItem.product.sellingPrice,
      };

      if (updated.quantity > 0) {
        await CartItem.findByIdAndUpdate(
          { _id: cartItem._id },
          { $set: updated },
          { new: true }
        ).populate("product");

        return cartItem;
      }
    } else {
      throw new Error("You are not authorized to update this cart item");
    }
  }

  async removeCartItem(userId, cartItemId) {
    const cartItem = await this.findCartItemById(cartItemId);

    if (cartItem.userId.toString() === userId.toString()) {
      await cartItem.deleteOne({ _id: cartItem._id });
    } else {
      throw new Error("You are not authorized to delete this cart item");
    }

    return cartItem;
  }

  async findCartItemById(cartItemId) {
    const cartItem = await CartItem.findById(cartItemId).populate("product");

    if (!cartItem) {
      throw new Error("Cart item not found");
    }
    return cartItem;
  }
}

export default new CartItemService();
