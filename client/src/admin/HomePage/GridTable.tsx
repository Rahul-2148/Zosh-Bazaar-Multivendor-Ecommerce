import { useAppSelector } from "../../Redux Toolkit/Store";
import HomeCategoryTable from "./HomeCategoryTable";

// const image =
//   "https://i.pinimg.com/originals/dc/65/a1/dc65a15dfdfcc8571c0f961c57e3c599.jpg";

const GridTable = () => {
  const { homeCategory } = useAppSelector((store) => store);

  return (
    <>
      <HomeCategoryTable categories = {homeCategory.homeCategories?.grid} />
    </>
  );
};

export default GridTable;
