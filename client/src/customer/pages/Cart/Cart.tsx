import { Favorite, LocalOffer } from "@mui/icons-material";
import CartItemCard from "./CartItemCard";
import { Button, TextField } from "@mui/material";
import PricingCard from "./PricingCard";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import { useEffect } from "react";
import { fetchUserCart } from "../../../Redux Toolkit/features/customer/CartSlice";
import { useNavigate } from "react-router-dom";

const Cart = () => {
  const { cart } = useAppSelector((store) => store);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchUserCart(localStorage.getItem("jwt") as string));
  }, [dispatch]);

  return (
    <div className="pt-10 px-5 sm:px-10 md:px-50 min-h-screen">
      {cart?.cart?.cartItems && cart.cart.cartItems.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-3">
            {cart?.cart?.cartItems.map((cartItem) => (
              <CartItemCard key={cartItem._id} item={cartItem} />
            ))}
          </div>

          <div className="col-span-1 text-sm space-y-3">
            <div className="border border-gray-300 rounded-md px-5 py-3 space-y-5">
              <div className="">
                <div className="flex items-center gap-3 text-sm">
                  <LocalOffer color="primary" sx={{ fontSize: "17px" }} />
                  <span className="">Apply Coupons</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <TextField size="small" placeholder="Enter coupon code" />
                <Button color="primary" size="small">
                  Apply
                </Button>
              </div>
            </div>

            <section className="border border-gray-300 rounded-md">
              <PricingCard />
              <div className="p-5">
                <Button
                  onClick={() => navigate("/checkout/address")}
                  sx={{ py: "11px" }}
                  variant="contained"
                  fullWidth
                >
                  Buy Now
                </Button>
              </div>
            </section>
            <div className="border border-gray-300 rounded-md px-5 py-4 flex items-center justify-between cursor-pointer">
              <span className="">Add From Wishlist</span>
              <Favorite color="primary" />
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-10 space-y-4">
          <h1 className="text-2xl font-bold">Your Cart is Empty</h1>
          <p className="text-sm">Add items to it now</p>
          <Button
            onClick={() => navigate(`/products/*`)}
            color="primary"
            variant="contained"
          >
            Shop Now
          </Button>
        </div>
      )}
    </div>
  );
};

export default Cart;
