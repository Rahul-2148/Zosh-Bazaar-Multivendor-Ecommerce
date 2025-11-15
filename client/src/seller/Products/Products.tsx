import ProductTable from "./ProductTable";
import { useEffect } from "react";
import { fetchSellerProducts } from "../../Redux Toolkit/features/seller/SellerProductSlice";
import { useAppDispatch, useAppSelector } from "../../Redux Toolkit/Store";

const Products = () => {
  const dispatch = useAppDispatch();
  const { sellerProduct } = useAppSelector((store) => store);

  useEffect(() => {
    const token = localStorage.getItem("jwt");
    if (token) {
      dispatch(fetchSellerProducts(token));
    }
  }, [dispatch]);

  return (
    <>
      <h1 className="pb-5 font-bold text-xl">All Products</h1>
      <ProductTable products={sellerProduct.products} />
    </>
  );
};

export default Products;
