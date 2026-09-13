import { Route, Routes } from "react-router-dom";
import AccountOverview from "../pages/Account/AccountOverview";
import OrdersView from "../pages/Account/OrdersView";
import ReturnsRefundsView from "../pages/Account/ReturnsRefundsView";
import BuyAgainView from "../pages/Account/BuyAgainView";
import RecentlyViewedView from "../pages/Account/RecentlyViewedView";
import Addresses from "../pages/Account/Addresses";
import PaymentsView from "../pages/Account/PaymentsView";
import CouponsView from "../pages/Account/CouponsView";
import Notifications from "../pages/Account/Notifications";
import NotificationPreferencesView from "../pages/Account/NotificationPreferencesView";
import ProfileView from "../pages/Account/ProfileView";
import SecurityView from "../pages/Account/SecurityView";
import SessionsView from "../pages/Account/SessionsView";
import PrivacyView from "../pages/Account/PrivacyView";
import HelpCenterView from "../pages/Account/HelpCenterView";
import AiAssistantView from "../pages/Account/AiAssistantView";
import OrderDetails from "../pages/Order/OrderDetails";

const AccountRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<AccountOverview />} />
      <Route path="/orders" element={<OrdersView />} />
      <Route path="/returns" element={<ReturnsRefundsView />} />
      <Route path="/buy-again" element={<BuyAgainView />} />
      <Route path="/recently-viewed" element={<RecentlyViewedView />} />
      <Route path="/addresses" element={<Addresses />} />
      <Route path="/payments" element={<PaymentsView />} />
      <Route path="/coupons" element={<CouponsView />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/notification-preferences" element={<NotificationPreferencesView />} />
      <Route path="/profile" element={<ProfileView />} />
      <Route path="/security" element={<SecurityView />} />
      <Route path="/sessions" element={<SessionsView />} />
      <Route path="/devices" element={<SessionsView />} />
      <Route path="/privacy" element={<PrivacyView />} />
      <Route path="/help" element={<HelpCenterView />} />
      <Route path="/chat" element={<AiAssistantView />} />
      <Route path="/ai-chat" element={<AiAssistantView />} />
      <Route
        path="/orders/:orderId/item/:orderItemId"
        element={<OrderDetails />}
      />
    </Routes>
  );
};

export default AccountRoutes;
