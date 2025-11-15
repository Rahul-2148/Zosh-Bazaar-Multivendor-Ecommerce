import { Box, Button, Divider } from "@mui/material";
import OrderStepper from "./OrderStepper";
import { Payment } from "@mui/icons-material";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import { useEffect } from "react";
import {
  fetchOrderById,
  fetchOrderItemById,
} from "../../../Redux Toolkit/features/customer/OrderSlice";
import { useParams } from "react-router-dom";

const OrderDetails = () => {
  const dispatch = useAppDispatch();
  const { orderItemId, orderId } = useParams();
  const { orderItem, currentOrder } = useAppSelector(
    (store) => store.order
  );

  useEffect(() => {
    dispatch(
      fetchOrderItemById({
        jwt: localStorage.getItem("jwt") as string,
        orderItemId: localStorage.getItem("orderItemId") as string,
      })
    );

    dispatch(
      fetchOrderById({
        jwt: localStorage.getItem("jwt") as string,
        orderId: orderId as string,
      })
    );
  }, [dispatch, orderItemId, orderId]);
  return (
    <Box className="space-y-5">
      <section className="flex flex-col gap-5 items-center justify-center">
        <img
          className="w-[100px]"
          src={
            orderItem?.product?.images[0] ||
            "https://www.tankori.in/cdn/shop/files/IMG_3285.jpg?v=1712813962&width=1200"
          }
          alt=""
        />
        <div className="text-sm space-y-1 text-center">
          <h1 className="">{"Pablo Clothing"}</h1>
          <p className="">{orderItem?.product?.title}</p>
          <p className="">{"Size: Free"}</p>
        </div>
      </section>

      <section className="border border-gray-200 p-5">
        <OrderStepper />
      </section>

      <section className="border border-gray-200 p-5">
        <h1 className="font-bold pb-3">Delivery Address</h1>
        <div className="text-sm space-y-2">
          <div className="flex gap-5 font-medium">
            <p>{"Anand Kumar"}</p>
            <Divider orientation="vertical" flexItem />
            <p>{"9876543210"}</p>
          </div>
          <p>
            {currentOrder?.shippingAddress?.address},{" "}
            {currentOrder?.shippingAddress?.locality},{" "}
            {currentOrder?.shippingAddress?.city},{" "}
            {currentOrder?.shippingAddress?.state},{" "}
            {currentOrder?.shippingAddress?.pincode},{" "}
            {currentOrder?.shippingAddress?.country}
          </p>
          <p>
            centurian park terrace home, sector techzone 4 sector 52, greater
            noida 201310, India
          </p>
        </div>
      </section>
      <section className="border border-gray-200 space-y-4">
        <div className="flex justify-between text-sm pt-5 px-5">
          <div className="space-y-1">
            <p className="font-bold">Total Item Price</p>
            <p className="text-green-400">
              You saved{" "}
              <span>
                You saved ₹
                {orderItem?.totalMrpPrice - currentOrder?.totalSellingPrice} on
                this item
              </span>
            </p>
          </div>
          <p className="font-bold">
            {"₹ " + currentOrder?.totalSellingPrice + ".00"}
          </p>
        </div>
        <div className="px-5">
          <div className="bg-teal-50 px-5 py-2 text-xs font-medium flex items-center gap-3">
            <Payment />
            <p className="">Pay on Delivery</p>
          </div>
        </div>

        <Divider />

        <div className="px-5 pt-5">
          <p className="text-xs">
            <strong>Sold By:</strong> Pablo Clothing
          </p>
        </div>

        <div className="p-10">
          <Button variant="outlined" fullWidth>
            Cancel Order
          </Button>
        </div>
      </section>
    </Box>
  );
};

export default OrderDetails;
