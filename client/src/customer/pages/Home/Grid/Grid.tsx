import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../../../Redux Toolkit/Store";

const defaultGrid = [
  {
    categoryId: "fashion",
    name: "Trending Fashion & Apparel",
    image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&auto=format&fit=crop&q=80",
  },
  {
    categoryId: "electronics_smartwatches",
    name: "Smart Wearables & Tech",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
  },
  {
    categoryId: "footwear",
    name: "Sneakers & Kicks",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80",
  },
  {
    categoryId: "electronics_audio",
    name: "Hi-Res Audio & Sound",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
  },
  {
    categoryId: "women_sarees",
    name: "Royal Banarasi Sarees",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80",
  },
  {
    categoryId: "home_furniture",
    name: "Modern Home & Living",
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80",
  },
];

const HomeGrid = () => {
  const navigate = useNavigate();
  const { homeCategory } = useAppSelector((store) => store);

  const feedCategories = homeCategory?.marketplaceFeed?.categories;
  const gridData =
    feedCategories && feedCategories.length >= 6
      ? feedCategories
      : homeCategory?.homeCategories?.grid &&
        homeCategory.homeCategories.grid.length >= 6
      ? homeCategory.homeCategories.grid
      : defaultGrid;

  const handleNavigate = (categoryId?: string) => {
    if (categoryId) {
      navigate(`/products/${categoryId}`);
    }
  };

  return (
    <div className="px-4 sm:px-8 lg:px-20 my-8">
      {/* Desktop Grid Layout */}
      <div className="hidden lg:grid grid-rows-12 grid-cols-12 gap-4 h-[580px]">
        {/* Item 1 - Tall Left */}
        <div
          onClick={() => handleNavigate(gridData[0]?.categoryId)}
          className="col-span-3 row-span-12 relative overflow-hidden rounded-xl cursor-pointer group shadow-sm hover:shadow-md transition-all"
        >
          <img
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            src={gridData[0]?.image}
            alt={gridData[0]?.name || "Category"}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-5">
            <span className="text-white font-semibold text-lg drop-shadow-sm">
              {gridData[0]?.name}
            </span>
          </div>
        </div>

        {/* Item 2 - Top Row Small */}
        <div
          onClick={() => handleNavigate(gridData[1]?.categoryId)}
          className="col-span-2 row-span-6 relative overflow-hidden rounded-xl cursor-pointer group shadow-sm hover:shadow-md transition-all"
        >
          <img
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            src={gridData[1]?.image}
            alt={gridData[1]?.name || "Category"}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-3">
            <span className="text-white font-semibold text-sm drop-shadow-sm">
              {gridData[1]?.name}
            </span>
          </div>
        </div>

        {/* Item 3 - Top Row Wide */}
        <div
          onClick={() => handleNavigate(gridData[2]?.categoryId)}
          className="col-span-4 row-span-6 relative overflow-hidden rounded-xl cursor-pointer group shadow-sm hover:shadow-md transition-all"
        >
          <img
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            src={gridData[2]?.image}
            alt={gridData[2]?.name || "Category"}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-4">
            <span className="text-white font-semibold text-base drop-shadow-sm">
              {gridData[2]?.name}
            </span>
          </div>
        </div>

        {/* Item 4 - Tall Right */}
        <div
          onClick={() => handleNavigate(gridData[3]?.categoryId)}
          className="col-span-3 row-span-12 relative overflow-hidden rounded-xl cursor-pointer group shadow-sm hover:shadow-md transition-all"
        >
          <img
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            src={gridData[3]?.image}
            alt={gridData[3]?.name || "Category"}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-5">
            <span className="text-white font-semibold text-lg drop-shadow-sm">
              {gridData[3]?.name}
            </span>
          </div>
        </div>

        {/* Item 5 - Bottom Row Wide */}
        <div
          onClick={() => handleNavigate(gridData[4]?.categoryId)}
          className="col-span-4 row-span-6 relative overflow-hidden rounded-xl cursor-pointer group shadow-sm hover:shadow-md transition-all"
        >
          <img
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            src={gridData[4]?.image}
            alt={gridData[4]?.name || "Category"}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-4">
            <span className="text-white font-semibold text-base drop-shadow-sm">
              {gridData[4]?.name}
            </span>
          </div>
        </div>

        {/* Item 6 - Bottom Row Small */}
        <div
          onClick={() => handleNavigate(gridData[5]?.categoryId)}
          className="col-span-2 row-span-6 relative overflow-hidden rounded-xl cursor-pointer group shadow-sm hover:shadow-md transition-all"
        >
          <img
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            src={gridData[5]?.image}
            alt={gridData[5]?.name || "Category"}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-3">
            <span className="text-white font-semibold text-sm drop-shadow-sm">
              {gridData[5]?.name}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile & Tablet Responsive Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 lg:hidden">
        {gridData.slice(0, 6).map((item: any, idx: number) => (
          <div
            key={idx}
            onClick={() => handleNavigate(item.categoryId)}
            className="relative h-[180px] sm:h-[220px] overflow-hidden rounded-xl cursor-pointer group shadow-sm"
          >
            <img
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              src={item.image}
              alt={item.name || "Category"}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent flex items-end p-3">
              <span className="text-white font-medium text-xs sm:text-sm drop-shadow-sm line-clamp-1">
                {item.name}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomeGrid;
