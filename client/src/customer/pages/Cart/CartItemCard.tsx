import { Add, Close, Remove } from "@mui/icons-material";
import { Button, Divider, IconButton } from "@mui/material";
import { useAppDispatch } from "../../../Redux Toolkit/Store";
import {
  deleteCartItem,
  updateCartItem,
} from "../../../Redux Toolkit/features/customer/CartSlice";
import { useState } from "react";
import { useSnackbar } from "../../../common/SnackbarProvider";

const CartItemCard = ({ item }: { item: any }) => {
  const dispatch = useAppDispatch();
  const { showSnackbar } = useSnackbar();
  const [localQuantity, setLocalQuantity] = useState(item.quantity);

  const handleUpdateQuantity = async (quantity: number) => {
    setLocalQuantity(quantity); // instant UI update

    try {
      const result = await dispatch(
        updateCartItem({
          jwt: localStorage.getItem("jwt") as string,
          cartItemId: item._id,
          quantity,
        })
      ).unwrap();

      showSnackbar(result.message || "Cart updated!", "success");
    } catch (err: any) {
      showSnackbar(err.message || "Failed to update cart", "error");
      setLocalQuantity(item.quantity); // revert UI if failed
    }
  };

  const handleRemoveCartItem = async () => {
    try {
      const result = await dispatch(
        deleteCartItem({
          jwt: localStorage.getItem("jwt") as string,
          cartItemId: item._id,
        })
      ).unwrap();

      showSnackbar(result.message || "Item removed from cart", "success");
    } catch (err: any) {
      showSnackbar(err.message || "Failed to remove item", "error");
    }
  };

  return (
    <div className="border border-gray-300 rounded-md relative">
      {/* Product Info */}
      <div className="p-5 flex gap-3">
        <div>
          <img
            className="w-[90px] rounded-md"
            src={item?.product?.images?.[0]}
            alt={item?.product?.title || "Product"}
          />
        </div>
        <div className="space-y-2">
          <h1 className="title text-lg font-semibold">
            {item?.product?.title}
          </h1>
          <p className="description text-teal-600 font-medium text-sm">
            {item?.product?.brand}
          </p>
          <p className="text-gray-600 text-xs">
            <strong>Sold by:</strong> {item?.product?.seller?.sellerName}
          </p>
          <p className="text-xs">
            <strong>7 days replacement</strong> available
          </p>
        </div>
      </div>

      <Divider />

      {/* Quantity & Price */}
      <div className="px-5 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 w-[140px] justify-between">
          <Button
            disabled={localQuantity <= 1}
            onClick={() => handleUpdateQuantity(localQuantity - 1)}
          >
            <Remove />
          </Button>
          <span className="px-3 font-semibold">{localQuantity}</span>
          <Button onClick={() => handleUpdateQuantity(localQuantity + 1)}>
            <Add />
          </Button>
        </div>
        <div>
          <p className="text-gray-700 font-semibold">
            ₹ {item?.product?.sellingPrice * localQuantity}
          </p>
        </div>
      </div>

      {/* Remove Button */}
      <div className="absolute top-1 right-1">
        <IconButton onClick={handleRemoveCartItem} color="primary">
          <Close />
        </IconButton>
      </div>
    </div>
  );
};

export default CartItemCard;
