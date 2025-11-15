// pricingcard.tsx
import { Divider } from "@mui/material";
import { sumCartItemMrpPrice, sumCartItemSellingPrice } from "../../../utils/sumCartItemPrice";
import { useAppSelector } from "../../../Redux Toolkit/Store";

const PricingCard = () => {
  const cartItems = useAppSelector((store) => store.cart?.cart?.cartItems || []);

  return (
    <div>
      <div className="space-y-3 p-5">
        <div className="flex items-center justify-between">
          <span>SubTotal</span>
          <span>₹{sumCartItemMrpPrice(cartItems)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Discount</span>
          <span>-₹{sumCartItemMrpPrice(cartItems) - sumCartItemSellingPrice(cartItems)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Shipping</span>
          <span>+₹79</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Platform Fee</span>
          <span>Free</span>
        </div>
      </div>
      <Divider />
      <div className="font-medium px-5 py-2 flex items-center justify-between">
        <span>Total</span>
        <span>₹{sumCartItemSellingPrice(cartItems) + 79}</span>
      </div>
    </div>
  );
};

export default PricingCard;
