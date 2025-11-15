import cartService from "../service/cart.service.js";
import ProductService from "../service/product.service.js";
import CartService from "../service/cart.service.js";
import cartItemService from "../service/cartItem.service.js";

class CartController {
  async findUserCartHandler(req, res) {
    try {
      const user = await req.user;
      const cart = await cartService.findUserCart(user)
      return res.status(200).json({
        cart: cart,
        error: false,
        success: true,
      });
    } catch (error) {
      handleErrors(error, res);
    }
  }

  async addItemToCart(req, res) {
    try {
      const user = await req.user;
      const product = await ProductService.findProductById(req.body.productId);
      const cartItem = await CartService.addCartItem(
        user,
        product,
        req.body.size,
        req.body.ram,
        req.body.weight,
        req.body.capacity,
        req.body.quantity
      );
      return res.status(202).json({
        message: "Item added to cart",
        cartItem: cartItem,
        error: false,
        success: true,
      });
    } catch (error) {
      handleErrors(error, res);
    }
  }

  async deleteCartItemHandler(req, res) {
    try {
      const user = await req.user;
      const cartItem = await cartItemService.removeCartItem(
        user._id,
        req.params.cartItemId
      );

      return res.status(202).json({
        message: "Item removed from cart",
        cartItem: cartItem,
        error: false,
        success: true,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateCartItemHandler(req, res) {
    try {
      const cartItemId = req.params.cartItemId;
      const { quantity } = req.body || {};

      const user = await req.user;
      let updatedCartItem;

      if (quantity > 0) {
        updatedCartItem = await cartItemService.updateCartItem(
          user._id,
          cartItemId,
          { quantity }
        );
      } else {
        updatedCartItem = await cartItemService.removeCartItem(
          user._id,
          cartItemId
        );
      }

      return res.status(202).json({
        message: "cart item updated!",
        cartItem: updatedCartItem,
        error: false,
        success: true,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new CartController();

const handleErrors = (err, res) => {
  if (err instanceof Error) {
    return res.status(404).json({ message: err.message });
  }
  return res
    .status(500)
    .json({ message: err.message || "Internal Server Error" });
};
