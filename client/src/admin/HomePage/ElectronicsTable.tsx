import { useAppSelector } from "../../Redux Toolkit/Store";
import HomeCategoryTable from "./HomeCategoryTable";

// const image =
//   "https://rukminim2.flixcart.com/image/832/832/xif0q/mobile/x/v/y/-original-imah4jz66dmcwhmd.jpeg?q=70&crop=false";

const ElectronicsTable = () => {
  const { homeCategory } = useAppSelector((store) => store);

  return (
    <>
      <HomeCategoryTable
        categories={homeCategory.homeCategories?.electronicsCategories}
      />
    </>
  );
};

export default ElectronicsTable;
