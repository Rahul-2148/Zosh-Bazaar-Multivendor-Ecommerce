import { useNavigate } from "react-router-dom";

const HomeCategoryCard = ({ item }: { item: any }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/products/${item.categoryId}`)}
      className="flex flex-col gap-3 items-center justify-center group cursor-pointer"
    >
      <div className="w-[120px] h-[120px] sm:w-[150px] sm:h-[150px] md:w-[170px] md:h-[170px] lg:w-[190px] lg:h-[190px] rounded-full p-1 bg-gradient-to-tr from-primary to-emerald-400 shadow-sm group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
        <div className="w-full h-full rounded-full overflow-hidden bg-card">
          <img
            className="group-hover:scale-108 transition-transform duration-500 object-cover object-top h-full w-full rounded-full"
            src={item.image}
            alt={item.name || "Category"}
          />
        </div>
      </div>
      <h3 className="font-bold text-xs sm:text-sm text-center text-foreground group-hover:text-primary transition-colors line-clamp-1 max-w-[160px] tracking-tight">
        {item.name}
      </h3>
    </div>
  );
};

export default HomeCategoryCard;