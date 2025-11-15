import { useAppSelector } from "../../../../Redux Toolkit/Store";

const HomeGrid = () => {
  const { homeCategory } = useAppSelector((store) => store);

  return (
    <div className="grid grid-rows-12 grid-cols-12 gap-4 lg:h-[600px] px-5 lg:px-20">
      <div className="col-span-3 row-span-12 text-white rounded-md">
        <img
          className="w-full h-full object-cover rounded-md"
          src={homeCategory?.homeCategories?.grid?.[0]?.image}
          alt=""
        />
      </div>
      <div className="col-span-2 row-span-6 text-white rounded-md">
        <img
          className="w-full h-full object-cover rounded-md"
          src={homeCategory?.homeCategories?.grid?.[1]?.image}
          alt=""
        />
      </div>
      <div className="col-span-4 row-span-6 text-white rounded-md">
        <img
          className="w-full h-full object-cover rounded-md"
          src={homeCategory?.homeCategories?.grid?.[2]?.image}
          alt=""
        />
      </div>
      <div className="col-span-3 row-span-12 text-white rounded-md">
        <img
          className="w-full h-full object-cover rounded-md"
          src={homeCategory?.homeCategories?.grid?.[3]?.image}
          alt=""
        />
      </div>
      <div className="col-span-4 row-span-6 text-white rounded-md">
        <img
          className="w-full h-full object-cover rounded-md"
          src={homeCategory?.homeCategories?.grid?.[4]?.image}
          alt=""
        />
      </div>
      <div className="col-span-2 row-span-6 text-white rounded-md">
        <img
          className="w-full h-full object-cover rounded-md"
          src={homeCategory?.homeCategories?.grid?.[5]?.image}
          alt=""
        />
      </div>
    </div>
  );
};

export default HomeGrid;
