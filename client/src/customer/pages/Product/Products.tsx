import FilterSection from "./FilterSection";

import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import { useEffect, useState } from "react";
import { Divider, Pagination } from "@mui/material";
import ProductCard from "./ProductCard";
import { useParams, useSearchParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import { getAllProducts } from "../../../Redux Toolkit/features/customer/ProductSlice";

const Products = () => {
  const [sort, setSort] = useState("price_low_to_high");
  const { categoryId } = useParams();
  const [searchParams] = useSearchParams();

  const { product } = useAppSelector((store) => store);

  const dispatch = useAppDispatch();

  console.log("categoryId", categoryId);

  const handleSortProducts = (e: any) => {
    setSort(e.target.value as string);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(getAllProducts({ sort, categoryId, searchParams }));
  }, []);

  return (
    <div className="mt-10">
      <div className="">
        <h1 className="text-3xl text-center font-bold text-gray-700 pb-5 px-9 uppercase space-x-2">
          women sarees
        </h1>
      </div>

      <div className="lg:flex">
        <section className="hidden lg:block w-[20%] min-h-screen border-gray-300">
          <FilterSection />
        </section>

        <section className="w-full lg:w-[80%] space-y-5">
          <div className="flex justify-between items-center px-9 h-[40px]">
            <div></div>
            <FormControl>
              <InputLabel id="sort-label">Sort</InputLabel>
              <Select
                labelId="sort-label"
                id="sort"
                value={sort}
                label="Sort"
                onChange={handleSortProducts}
              >
                <MenuItem value={"price_low_to_high"}>
                  Price - Low to High
                </MenuItem>
                <MenuItem value={"price_high_to_low"}>
                  Price - High to Low
                </MenuItem>
                <MenuItem value={"newest"}>Newest</MenuItem>
              </Select>
            </FormControl>
          </div>

          <Divider />

          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-y-5 px-5 justify-center mt-5">
            {/* Product Cards */}
            {product?.products.map((productItem, index) => (
              <div key={index} className="">
                <ProductCard item={productItem} />
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center justify-center pb-1">
            <Pagination count={product.totalPages} color="primary" />
          </div>
        </section>
      </div>
    </div>
  );
};

export default Products;

// const productImages = {
//   images: [
//     "https://www.tankori.in/cdn/shop/files/IMG_3285.jpg?v=1712813962&width=1200",
//     "https://www.tankori.in/cdn/shop/files/IMG_3286.jpg?v=1712813963&width=1200",
//     "https://www.tankori.in/cdn/shop/files/IMG_3281.jpg?v=1715155472&width=1200",
//     "https://www.tankori.in/cdn/shop/files/IMG_3279.jpg?v=1715155472&width=1200",
//     "https://www.tankori.in/cdn/shop/files/IMG_3270.jpg?v=1715155472&width=1200",
//     "https://www.tankori.in/cdn/shop/files/IMG_3273.jpg?v=1715155472&width=1200",
//     "https://www.tankori.in/cdn/shop/files/IMG_3275.jpg?v=1715155472&width=1200",
//     "https://www.tankori.in/cdn/shop/files/IMG_3277.jpg?v=1715155472&width=1200",
//   ],
//   seller: {
//     businessName: "Pablo Clothing",
//   },
// };
