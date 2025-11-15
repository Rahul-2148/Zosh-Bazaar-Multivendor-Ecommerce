import { Cart } from "../models/cart.model.js";
import { CartItem } from "../models/cartItem.model.js";
import { calculateDiscountPercentage } from "../utils/calculateDiscountPercentage.js";

class CartService {
  async findUserCart(user) {
    let cart = await Cart.findOne({ user: user._id });

    let totalPrice = 0;
    let totalDiscountedPrice = 0;
    let totalItems = cart.cartItems.length;

    cart.cartItems.forEach((cartItem) => {
      totalPrice += cartItem.mrpPrice;
      totalDiscountedPrice += cartItem.sellingPrice;
    });

    cart.totalMrpPrice = totalPrice;
    cart.totalSellingPrice = totalDiscountedPrice;
    cart.totalItem = totalItems;
    cart.discount = calculateDiscountPercentage(
      totalPrice,
      totalDiscountedPrice
    );

    let cartItems = await CartItem.find({ cart: cart._id })
      .populate({
        path: "product",
        populate: { path: "seller" },
      })
      .populate("userId");

    cart.cartItems = cartItems;

    return cart;
  }

  async addCartItem(user, product, size, ram, weight, capacity, quantity) {
    const cart = await this.findUserCart(user);

    let isPresent = await CartItem.findOne({
      cart: cart._id,
      product: product._id,
      size: size,
      ram: ram,
      weight: weight,
      capacity: capacity,
    }).populate("product").populate("userId");

    if (!isPresent) {
      let cartItem = new CartItem({
        product,
        quantity,
        userId: user._id,
        sellingPrice: quantity * product.sellingPrice,
        mrpPrice: quantity * product.mrpPrice,
        size,
        ram,
        weight,
        capacity,
        cart: cart._id,
      });
      await cartItem.save();
      return cartItem;
    }
    return isPresent;
  }
}

export default new CartService();
