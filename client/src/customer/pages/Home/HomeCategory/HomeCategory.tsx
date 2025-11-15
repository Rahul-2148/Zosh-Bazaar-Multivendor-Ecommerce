import { useAppSelector } from "../../../../Redux Toolkit/Store";
import HomeCategoryCard from "./HomeCategoryCard";

const HomeCategory = () => {
  const { homeCategory } = useAppSelector((store) => store);

  return (
    <div className="px-5 py-10">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-7">
        {homeCategory?.homeCategories?.shopByCategories?.map(
          (item: any, index: number) => (
            <HomeCategoryCard key={index} item={item} />
          )
        )}
      </div>
    </div>
  );
};

export default HomeCategory;
