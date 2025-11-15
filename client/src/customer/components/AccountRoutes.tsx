import { Route, Routes } from "react-router-dom";
import Order from "../pages/Order/Order";
import OrderDetails from "../pages/Order/OrderDetails";
import UserDetails from "../pages/Account/UserDetails";

const AccountRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<UserDetails />} />
      <Route path="/orders" element={<Order />} />
      <Route
        path="/orders/:orderId/item/:orderItemId"
        element={<OrderDetails />}
      />
    </Routes>
  );
};

export default AccountRoutes;
