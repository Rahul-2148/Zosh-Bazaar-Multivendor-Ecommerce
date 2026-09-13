import { useAppSelector } from "../../../Redux Toolkit/Store";
import { homeCategories } from "../../../data/homeCategories";
import ElectronicCategoryCard from "./ElectronicCategoryCard";

const defaultElectronics = homeCategories.filter(
  (item) => item.section === "ELECTRONICS_CATEGORIES"
);

const ElectronicCategory = () => {
  const { homeCategory } = useAppSelector((store) => store);

  const categories =
    homeCategory.homeCategories?.electronicsCategories?.length > 0
      ? homeCategory.homeCategories.electronicsCategories
      : defaultElectronics;

  return (
    <div className="py-6 px-4 lg:px-20 border-b border-border bg-card">
      <div className="flex items-center justify-between overflow-x-auto no-scrollbar gap-6 sm:gap-8 pb-2">
        {categories.slice(0, 10).map((item: any) => (
          <div key={item.categoryId} className="shrink-0">
            <ElectronicCategoryCard item={item} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ElectronicCategory;
