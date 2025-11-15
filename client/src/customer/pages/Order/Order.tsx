import { useNavigate } from "react-router-dom";
import OrderItemCard from "./OrderItemCard";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import { useEffect } from "react";
import { fetchUserOrderHistory } from "../../../Redux Toolkit/features/customer/OrderSlice";

const Order = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const order = useAppSelector((store) => store.order);

  useEffect(() => {
    dispatch(fetchUserOrderHistory(localStorage.getItem("jwt") as string));
  }, [dispatch]);

  return (
    <div className="text-sm min-h-screen">
      <div className="pb-5">
        <h1 className="font-semibold">All Orders</h1>
        <p>from anywhere</p>
      </div>
      <div className="space-y-2">
        {order.orders.map((order: any) =>
          order?.orderItems.map((orderItem: any) => (
            <OrderItemCard key={orderItem._id} orderItem={orderItem} order={order} />
          ))
        )}
      </div>
    </div>
  );
};

export default Order;
