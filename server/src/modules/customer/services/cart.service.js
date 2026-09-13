import { Cart } from "../../../models/cart.model.js";
import { CartItem } from "../../../models/cartItem.model.js";
import { Product } from "../../../models/product.model.js";
import { calculateDiscountPercentage } from "../../../utils/calculateDiscountPercentage.js";

class CartService {
  async findUserCart(user) {
    const userId = user._id || user;
    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = new Cart({ user: userId });
      await cart.save();
    }

    let cartItems = await CartItem.find({ cart: cart._id })
      .populate({
        path: "product",
        populate: { path: "seller", select: "sellerName businessDetails" },
      })
      .sort({ createdAt: -1 });

    let totalPrice = 0;
    let totalDiscountedPrice = 0;
    let totalItems = 0;

    if (cartItems && cartItems.length > 0) {
      cartItems.forEach((item) => {
        totalItems += item.quantity;
        totalPrice += item.mrpPrice;
        totalDiscountedPrice += item.sellingPrice;
      });
    }

    cart.totalMrpPrice = totalPrice;
    cart.totalSellingPrice = totalDiscountedPrice;
    cart.totalItem = totalItems;
    cart.discount =
      totalPrice > 0
        ? calculateDiscountPercentage(totalPrice, totalDiscountedPrice)
        : 0;
    cart.cartItems = cartItems || [];

    await cart.save();
    return cart;
  }

  async addCartItem(user, productId, variantId = null, quantity = 1, legacyAttrs = {}) {
    const userId = user._id || user;
    const cart = await this.findUserCart(user);

    const product = await Product.findById(productId);
    if (!product) throw new Error("Product not found");

    let unitMrp = product.mrpPrice;
    let unitSelling = product.sellingPrice;
    let availableStock = product.countInStock;
    let selectedVariantSnapshot = {
      sku: "",
      title: "",
      attributes: [],
      image: product.images?.[0] || "",
    };

    let resolvedVariantId = null;

    if (product.hasVariants && product.variants.length > 0) {
      let matchedVariant = null;

      if (variantId) {
        matchedVariant = product.variants.id(variantId);
      }

      // Fallback: match by sku or legacy attributes if variantId not passed
      if (!matchedVariant && legacyAttrs.sku) {
        matchedVariant = product.variants.find((v) => v.sku === legacyAttrs.sku);
      }

      if (!matchedVariant) {
        // Pick first active variant if none specified
        matchedVariant = product.variants.find((v) => v.status === "ACTIVE") || product.variants[0];
      }

      if (!matchedVariant) {
        throw new Error("Selected product variant is unavailable");
      }

      resolvedVariantId = matchedVariant._id;
      unitMrp = matchedVariant.mrpPrice;
      unitSelling = matchedVariant.sellingPrice;
      availableStock = matchedVariant.countInStock;

      selectedVariantSnapshot = {
        sku: matchedVariant.sku,
        title: matchedVariant.title,
        attributes: matchedVariant.attributes || [],
        image:
          matchedVariant.images?.[0] ||
          product.images?.[0] ||
          "",
      };
    }

    const qty = Math.max(1, Number(quantity) || 1);

    if (availableStock < qty) {
      throw new Error(
        availableStock === 0
          ? "This item/variant is currently out of stock."
          : `Only ${availableStock} units available in stock.`
      );
    }

    // Check if item already exists in cart with same product & variant
    const query = {
      cart: cart._id,
      product: product._id,
    };

    if (resolvedVariantId) {
      query.variantId = resolvedVariantId;
    }

    let existingItem = await CartItem.findOne(query);

    if (existingItem) {
      const newQty = existingItem.quantity + qty;
      if (newQty > availableStock) {
        throw new Error(`Cannot add more. Only ${availableStock} units available.`);
      }
      existingItem.quantity = newQty;
      existingItem.mrpPrice = newQty * unitMrp;
      existingItem.sellingPrice = newQty * unitSelling;
      await existingItem.save();
      return existingItem;
    }

    const newCartItem = new CartItem({
      cart: cart._id,
      product: product._id,
      variantId: resolvedVariantId,
      selectedVariant: selectedVariantSnapshot,
      quantity: qty,
      mrpPrice: qty * unitMrp,
      sellingPrice: qty * unitSelling,
      userId: userId.toString(),
      // Legacy compatibility
      size: legacyAttrs.size || "",
      ram: legacyAttrs.ram || "",
      weight: legacyAttrs.weight || "",
      capacity: legacyAttrs.capacity || "",
    });

    await newCartItem.save();
    return newCartItem;
  }

  async updateCartItemQuantity(userId, cartItemId, quantity) {
    const cartItem = await CartItem.findById(cartItemId).populate("product");
    if (!cartItem) throw new Error("Cart item not found");

    if (cartItem.userId.toString() !== userId.toString()) {
      throw new Error("Unauthorized to update this cart item");
    }

    const newQty = Number(quantity);
    if (newQty <= 0) {
      await CartItem.findByIdAndDelete(cartItemId);
      return { message: "Item removed from cart" };
    }

    const product = cartItem.product;
    let unitMrp = product.mrpPrice;
    let unitSelling = product.sellingPrice;
    let stock = product.countInStock;

    if (cartItem.variantId && product.hasVariants) {
      const variant = product.variants.id(cartItem.variantId);
      if (variant) {
        unitMrp = variant.mrpPrice;
        unitSelling = variant.sellingPrice;
        stock = variant.countInStock;
      }
    }

    if (newQty > stock) {
      throw new Error(`Only ${stock} units available in stock.`);
    }

    cartItem.quantity = newQty;
    cartItem.mrpPrice = newQty * unitMrp;
    cartItem.sellingPrice = newQty * unitSelling;
    return await cartItem.save();
  }

  async removeCartItem(userId, cartItemId) {
    const cartItem = await CartItem.findById(cartItemId);
    if (!cartItem) throw new Error("Cart item not found");

    if (cartItem.userId.toString() !== userId.toString()) {
      throw new Error("Unauthorized to remove this cart item");
    }

    await CartItem.findByIdAndDelete(cartItemId);
    return { message: "Item removed successfully" };
  }
}

export default new CartService();
