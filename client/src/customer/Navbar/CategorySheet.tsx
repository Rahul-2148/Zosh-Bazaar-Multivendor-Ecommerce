import { Box } from "@mui/material";
import { electronicsLevelTwo } from "../../data/category/level two/electronicsLevelTwo";
import { furnitureLevelTwo } from "../../data/category/level two/furnitureLevelTwo";
import { menLevelTwo } from "../../data/category/level two/menLevelTwo";
import { womenLevelTwo } from "../../data/category/level two/womenLevelTwo";

import { electronicsLevelThree } from "../../data/category/level three/electronicsLevelThree";
import { furnitureLevelThree } from "../../data/category/level three/furnitureLevelThree";
import { menLevelThree } from "../../data/category/level three/menLevelThree";
import { womenLevelThree } from "../../data/category/level three/womenLevelThree";
import { useNavigate } from "react-router-dom";

const categoryTwo: { [key: string]: any[] } = {
  men: menLevelTwo,
  women: womenLevelTwo,
  electronics: electronicsLevelTwo,
  home_furniture: furnitureLevelTwo,
};

const categoryThree: { [key: string]: any[] } = {
  men: menLevelThree,
  women: womenLevelThree,
  electronics: electronicsLevelThree,
  home_furniture: furnitureLevelThree,
};

const CategorySheet = ({
  selectedCategory,
  toggleDrawer,
  setShowSheet,
}: any) => {
  const navigate = useNavigate();
  const childCategory = (category: any, parentCategoryId: any) => {
    return category.filter(
      (child: any) => child.parentCategoryId === parentCategoryId
    );
  };

  return (
    <Box className="bg-white shadow-lg lg:h-[500px] overflow-auto z-50">
      <div className="flex flex-wrap text-sm">
        {categoryTwo[selectedCategory]?.map((item: any, index) => (
          <div
            className={`p-8 lg:w-[20%] ${
              index % 2 === 0 ? "bg-slate-50" : "bg-gray-100"
            }`}
            key={item.categoryId}
          >
            <p className="text-[#00927c] mb-5 font-semibold">{item.name}</p>

            <ul className="space-y-3 text-gray-600">
              {childCategory(
                categoryThree[selectedCategory],
                item.categoryId
              ).map((item: any) => (
                <div key={item.categoryId}>
                  <li
                    onClick={() => navigate(`/products/${item.categoryId}`)}
                    className="cursor-pointer"
                  >
                    {item.name}
                  </li>
                </div>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Box>
  );
};

export default CategorySheet;
