import { useNavigate } from "react-router-dom";

const ElectronicCategoryCard = ({ item }: { item: any }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/products/${item.categoryId}`)}
      className="flex flex-col items-center gap-2 cursor-pointer group w-18 sm:w-20 transition-transform active:scale-95"
    >
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-card p-2 flex items-center justify-center border-2 border-border/80 group-hover:border-primary group-hover:shadow-md group-hover:scale-105 transition-all duration-300">
        <img
          className="object-contain w-full h-full group-hover:scale-110 transition-transform duration-300"
          src={item.image}
          alt={item.name}
        />
      </div>
      <span className="font-bold text-xs sm:text-[13px] text-foreground text-center truncate w-full group-hover:text-primary transition-colors tracking-tight">
        {item.name}
      </span>
    </div>
  );
};

export default ElectronicCategoryCard;
