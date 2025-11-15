import { Route, Routes } from "react-router-dom";
import Account from "../seller/Account/Account";
import HomePage from "../seller/HomePage/HomePage";
import Orders from "../seller/Orders/Orders";
import Payment from "../seller/Payment/Payment";
import AddProduct from "../seller/Products/AddProduct";
import Products from "../seller/Products/Products";
import Transactions from "../seller/Transactions/Transactions";

const SellerRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/orders" element={<Orders />} />
      <Route path="/products" element={<Products />} />
      <Route path="/add-product" element={<AddProduct />} />
      <Route path="/account" element={<Account />} />
      <Route path="/payment" element={<Payment />} />
      <Route path="/transactions" element={<Transactions />} />
    </Routes>
  );
};

export default SellerRoutes;
