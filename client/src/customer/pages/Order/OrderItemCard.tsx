
const OrderItemCard = ({ item }: { item: any }) => {
  return (
    <div className="flex items-center gap-3 py-2">
      <img
        className="w-[50px] h-[50px] rounded-md object-cover"
        src={item?.product?.images?.[0] || "https://via.placeholder.com/50"}
        alt={item?.product?.title || "Product"}
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate text-foreground">
          {item?.product?.title || "Product"}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {item?.size && <span>Size: {item.size}</span>}
          <span>Qty: {item?.quantity || 1}</span>
        </div>
      </div>
      <p className="text-sm font-semibold whitespace-nowrap text-foreground">
        ₹{item?.sellingPrice || item?.product?.sellingPrice || 0}
      </p>
    </div>
  );
};

export default OrderItemCard;
