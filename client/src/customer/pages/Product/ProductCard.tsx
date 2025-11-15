import { useEffect, useState } from "react";
import "../Product/ProductCard.css";
import { useNavigate } from "react-router-dom";

const ProductCard = ({ item }: { item: any }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let interval: any;
    if (isHovered) {
      interval = setInterval(() => {
        setCurrentImage((prev) => (prev + 1) % item.images.length);
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isHovered, item.images.length]);

  return (
    <div
      onClick={() =>
        navigate(`/product-details/${item.category}/${item.title}/${item._id}`)
      }
      className="group px-4 relative"
    >
      <div
        className="relative w-[250px] sm:w-full md:w-full lg:w-full h-[350px] overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {item.images.map((image: string, index: number) => (
          <img
            key={index}
            className="card-media object-top"
            src={image}
            alt="Product"
            style={{
              transform: `translateX(${(index - currentImage) * 100}%)`,
            }}
          />
        ))}
      </div>

      <div className="details pt-3 space-y-1 group-hover-effect rounded-md">
        <div className="name space-y">
          <h1 className="font-semibold text-teal-800">
            {item?.seller?.businessDetails?.businessName}
          </h1>
          <p className="text-gray-600">{item.title}</p>
        </div>

        <div className="price flex items-center gap-2">
          <span className="font-semibold text-[15.5px] text-teal-800">
            ₹{item.sellingPrice}
          </span>
          <span className="text-[13.5px] line-through text-gray-400">
            ₹{item.mrpPrice}
          </span>
          <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-600 font-medium text-xs whitespace-nowrap">
            {item.discountPercent}% Off
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
