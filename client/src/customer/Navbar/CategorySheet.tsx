import React from "react";
import { Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../Redux Toolkit/Store";
import type { CategoryTreeItem } from "../../Redux Toolkit/features/customer/CategorySlice";

import { electronicsLevelTwo } from "../../data/category/level two/electronicsLevelTwo";
import { furnitureLevelTwo } from "../../data/category/level two/furnitureLevelTwo";
import { fashionLevelTwo } from "../../data/category/level two/fashionLevelTwo";
import { beautyLevelTwo } from "../../data/category/level two/beautyLevelTwo";
import { groceryLevelTwo } from "../../data/category/level two/groceryLevelTwo";
import { sportsLevelTwo } from "../../data/category/level two/sportsLevelTwo";

import { electronicsLevelThree } from "../../data/category/level three/electronicsLevelThree";
import { furnitureLevelThree } from "../../data/category/level three/furnitureLevelThree";
import { fashionLevelThree } from "../../data/category/level three/fashionLevelThree";
import { beautyLevelThree } from "../../data/category/level three/beautyLevelThree";
import { groceryLevelThree } from "../../data/category/level three/groceryLevelThree";
import { sportsLevelThree } from "../../data/category/level three/sportsLevelThree";

const legacyCategoryTwo: { [key: string]: any[] } = {
  fashion: fashionLevelTwo,
  electronics: electronicsLevelTwo,
  home_furniture: furnitureLevelTwo,
  beauty: beautyLevelTwo,
  grocery: groceryLevelTwo,
  sports: sportsLevelTwo,
  men: fashionLevelTwo,
  women: fashionLevelTwo,
};

const legacyCategoryThree: { [key: string]: any[] } = {
  fashion: fashionLevelThree,
  electronics: electronicsLevelThree,
  home_furniture: furnitureLevelThree,
  beauty: beautyLevelThree,
  grocery: groceryLevelThree,
  sports: sportsLevelThree,
  men: fashionLevelThree,
  women: fashionLevelThree,
};

interface CategorySheetProps {
  selectedCategory: string; // slug or ID
  toggleDrawer?: () => void;
  setShowSheet?: (show: boolean) => void;
}

const CategorySheet: React.FC<CategorySheetProps> = ({
  selectedCategory,
  toggleDrawer,
  setShowSheet,
}) => {
  const navigate = useNavigate();
  const { tree } = useAppSelector((state) => (state as any).category || { tree: [] });

  // Check if we have dynamic tree data matching this category
  const dynamicL1: CategoryTreeItem | undefined = tree?.find(
    (c: CategoryTreeItem) =>
      c.categoryId === selectedCategory || c._id === selectedCategory
  );

  const handleNavigate = (catSlug: string) => {
    navigate(`/products/${catSlug}`);
    if (setShowSheet) setShowSheet(false);
    if (toggleDrawer) toggleDrawer();
  };

  // If dynamic tree has sections for this L1
  if (dynamicL1 && dynamicL1.children && dynamicL1.children.length > 0) {
    return (
      <Box
        role="region"
        aria-label={`${dynamicL1.name} categories`}
        className="bg-card text-card-foreground shadow-lg rounded-xl border border-border max-h-[520px] overflow-y-auto z-50 backdrop-blur-md"
      >
        <div className="flex flex-wrap text-sm p-4 lg:p-6 gap-4">
          {dynamicL1.children.map((section) => (
            <div
              key={section._id || section.categoryId}
              className="p-4 rounded-xl w-full sm:w-[calc(50%-8px)] md:w-[calc(33.33%-11px)] lg:w-[calc(25%-12px)] bg-muted/30 border border-border/50 hover:border-primary/40 hover:bg-muted/50 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between mb-2.5 pb-1.5 border-b border-border/60">
                <p className="text-primary font-bold text-xs uppercase tracking-wider">
                  {section.name}
                </p>
                <span className="text-[10px] text-muted-foreground font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  Explore →
                </span>
              </div>

              <ul className="space-y-1 text-xs text-muted-foreground font-medium">
                {section.children && section.children.length > 0 ? (
                  section.children.map((leaf) => (
                    <li
                      key={leaf._id || leaf.categoryId}
                      tabIndex={0}
                      role="link"
                      onClick={() => handleNavigate(leaf.categoryId)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleNavigate(leaf.categoryId);
                        }
                      }}
                      className="cursor-pointer py-1 px-1.5 rounded-md hover:bg-primary/10 hover:text-primary transition-all flex items-center justify-between focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <span>{leaf.name}</span>
                    </li>
                  ))
                ) : (
                  <li
                    tabIndex={0}
                    role="link"
                    onClick={() => handleNavigate(section.categoryId)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleNavigate(section.categoryId);
                      }
                    }}
                    className="cursor-pointer py-1 px-1.5 rounded-md hover:bg-primary/10 hover:text-primary italic text-muted-foreground transition-all focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    View All {section.name}
                  </li>
                )}
              </ul>
            </div>
          ))}
        </div>
      </Box>
    );
  }

  // Fallback to legacy static data if DB categories haven't been seeded yet
  const legacySections = legacyCategoryTwo[selectedCategory] || [];
  const legacyLeaves = legacyCategoryThree[selectedCategory] || [];

  if (legacySections.length === 0) {
    return null;
  }

  return (
    <Box className="bg-card text-card-foreground shadow-lg rounded-xl border border-border max-h-[520px] overflow-y-auto z-50 backdrop-blur-md">
      <div className="flex flex-wrap text-sm p-4 lg:p-6 gap-4">
        {legacySections.map((item: any) => {
          const children = legacyLeaves.filter(
            (child: any) => child.parentCategoryId === item.categoryId
          );
          return (
            <div
              className="p-4 rounded-xl w-full sm:w-[calc(50%-8px)] md:w-[calc(33.33%-11px)] lg:w-[calc(25%-12px)] bg-muted/30 border border-border/50 hover:border-primary/40 hover:bg-muted/50 transition-all duration-200 group"
              key={item.categoryId}
            >
              <div className="flex items-center justify-between mb-2.5 pb-1.5 border-b border-border/60">
                <p className="text-primary font-bold text-xs uppercase tracking-wider">
                  {item.name}
                </p>
                <span className="text-[10px] text-muted-foreground font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  Explore →
                </span>
              </div>

              <ul className="space-y-1 text-xs text-muted-foreground font-medium">
                {children.map((child: any) => (
                  <li
                    key={child.categoryId}
                    onClick={() => handleNavigate(child.categoryId)}
                    className="cursor-pointer py-1 px-1.5 rounded-md hover:bg-primary/10 hover:text-primary transition-all flex items-center justify-between"
                  >
                    <span>{child.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </Box>
  );
};

export default CategorySheet;
