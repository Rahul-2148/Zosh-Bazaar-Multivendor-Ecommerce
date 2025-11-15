import { ElectricBolt } from "@mui/icons-material";
import { Avatar } from "@mui/material";
import { useNavigate } from "react-router-dom";

const OrderItemCard = ({
  orderItem,
  order,
}: {
  orderItem: any;
  order: any;
}) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() =>
        navigate(`/account/orders/${order._id}/item/${orderItem._id}`)
      }
      className="text-sm bg-white p-5 space-y-4 border border-gray-200 rounded-md cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <div>
          <Avatar sizes="sm" sx={{ bgcolor: "#00927c" }}>
            <ElectricBolt />
          </Avatar>
        </div>
        <div className="">
          <h1 className="font-bold text-teal-600">{order.orderStatus}</h1>
          <p>Arriving By {order.deliveryDate}</p>
        </div>
      </div>
      <div className="p-5 bg-teal-50 flex gap-3">
        <div className="">
          <img
            className="w-[70px] rounded-md"
            src={orderItem.product?.images[0]}
            alt=""
          />
        </div>
        <div className="w-full space-y-2">
          <h1 className="font-bold">Pablo Clothing</h1>
          <p>Turquoise Blue Stonework Satin Designer Saree</p>
          <p>
            <strong>Size:</strong> Free
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderItemCard;
