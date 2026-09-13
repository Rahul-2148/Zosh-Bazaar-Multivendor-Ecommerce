import DealCard from "./DealCard";
import { useAppSelector } from "../../../../Redux Toolkit/Store";

const Deal = () => {
  const { homeCategory } = useAppSelector((store) => store);

  const dealsData =
    (homeCategory?.marketplaceFeed?.deals && homeCategory.marketplaceFeed.deals.length > 0)
      ? homeCategory.marketplaceFeed.deals
      : (homeCategory?.homeCategories?.deals && homeCategory.homeCategories.deals.length > 0)
      ? homeCategory.homeCategories.deals
      : [];

  if (!dealsData || dealsData.length === 0) {
    return null;
  }

  return (
    <div className="mx-3 sm:mx-6 lg:mx-16 xl:mx-20 py-2 sm:py-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3.5">
        {dealsData.map((deal: any, index: number) => (
          <DealCard key={deal._id || index} deal={deal} />
        ))}
      </div>
    </div>
  );
};

export default Deal;
