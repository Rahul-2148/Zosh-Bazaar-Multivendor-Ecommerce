import { useAppSelector } from "../../Redux Toolkit/Store";
import HomeCategoryTable from "./HomeCategoryTable";

// const image = "https://apisap.fabindia.com/medias/10551904-01.jpg?context=bWFzdGVyfGltYWdlc3wxMDIwOTh8aW1hZ2UvanBlZ3xhRGcyTDJneFlpODJOVFF5TnpReU1UWTVNVGt6TkM4eE1EVTFNVGt3TkY4d01TNXFjR2N8MWU1ZTJlYzEwMDFhN2U3ODhiOTM1MWRiZjhiMzNlZDM5OTdiYWJiNzIzNjVhMjQ1NDVjNmZlOWY2NWJiYTRkMw";

const ShopByCategoryTable = () => {
  const { homeCategory } = useAppSelector((store) => store);

  return (
    <HomeCategoryTable categories={homeCategory.homeCategories?.shopByCategories} />
  )
}

export default ShopByCategoryTable;