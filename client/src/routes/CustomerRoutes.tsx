import { Route, Routes } from "react-router-dom";
import Footer from "../customer/Footer/Footer";
import Navbar from "../customer/Navbar/Navbar";
import Cart from "../customer/pages/Cart/Cart";
import Checkout from "../customer/pages/Checkout/Checkout";
import Home from "../customer/pages/Home/Home";
import Profile from "../customer/pages/Account/Profile";
import ProductDetails from "../customer/pages/Product/ProductDetails/ProductDetails";
import Products from "../customer/pages/Product/Products";

const CustomerRoutes = () => {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products/:categoryId" element={<Products />} />
        <Route
          path="/product-details/:categoryId/:name/:productId"
          element={<ProductDetails />}
        />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout/address" element={<Checkout />} />
        <Route path="/account/*" element={<Profile />} />
      </Routes>

      <Footer />
    </>
  );
};

export default CustomerRoutes;
