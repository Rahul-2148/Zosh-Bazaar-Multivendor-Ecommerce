import { Route, Routes } from "react-router-dom";
import Coupon from "../admin/Coupon/Coupon";
import SellerTable from "../admin/Seller/SellerTable";
import CouponForm from "../admin/Coupon/CouponForm";
import GridTable from "../admin/HomePage/GridTable";
import ElectronicsTable from "../admin/HomePage/ElectronicsTable";
import ShopByCategoryTable from "../admin/HomePage/ShopByCategoryTable";
import Deal from "../admin/Deal/Deal";

const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<SellerTable />} />
      <Route path="/coupon" element={<Coupon />} />
      <Route path="/add-coupon" element={<CouponForm />} />
      <Route path="/home-grid" element={<GridTable />} />
      <Route path="/electronics-category" element={<ElectronicsTable />} />
      <Route path="/shop-by-category" element={<ShopByCategoryTable />} />
      <Route path="/deals" element={<Deal />} />
    </Routes>
  );
};

export default AdminRoutes;
