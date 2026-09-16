import { lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import RootLayout from "../layouts/RootLayout";
import CustomerLayout from "../layouts/CustomerLayout";
import ProtectedRoute from "./guards/ProtectedRoute";
import PublicOnlyRoute from "./guards/PublicOnlyRoute";
import RouteErrorBoundary from "./errors/RouteErrorBoundary";

// Public Storefront Pages
const Home = lazy(() => import("../customer/pages/Home/Home"));
const Products = lazy(() => import("../customer/pages/Product/Products"));
const ProductDetails = lazy(
  () => import("../customer/pages/Product/ProductDetails/ProductDetails")
);
const Cart = lazy(() => import("../customer/pages/Cart/Cart"));
const SearchResults = lazy(
  () => import("../customer/pages/Search/SearchResults")
);
const Wishlist = lazy(() => import("../customer/pages/Wishlist/Wishlist"));
const SharedCollectionView = lazy(
  () => import("../customer/pages/Wishlist/SharedCollectionView")
);

// Auth & Partner Pages
const Auth = lazy(() => import("../Auth/Auth"));
const BecomeSeller = lazy(() => import("../Auth/Become Seller/BecomeSeller"));

// Protected Customer Checkout & Order Pages
const Checkout = lazy(() => import("../customer/pages/Checkout/Checkout"));
const Order = lazy(() => import("../customer/pages/Order/Order"));
const OrderDetails = lazy(() => import("../customer/pages/Order/OrderDetails"));
const PaymentSuccess = lazy(
  () => import("../customer/pages/Payment/PaymentSuccess")
);

// Protected Customer Account Suite
const Profile = lazy(() => import("../customer/pages/Account/Profile"));
const AccountOverview = lazy(
  () => import("../customer/pages/Account/AccountOverview")
);
const OrdersView = lazy(() => import("../customer/pages/Account/OrdersView"));
const ReturnsRefundsView = lazy(
  () => import("../customer/pages/Account/ReturnsRefundsView")
);
const BuyAgainView = lazy(
  () => import("../customer/pages/Account/BuyAgainView")
);
const RecentlyViewedView = lazy(
  () => import("../customer/pages/Account/RecentlyViewedView")
);
const Addresses = lazy(() => import("../customer/pages/Account/Addresses"));
const PaymentsView = lazy(
  () => import("../customer/pages/Account/PaymentsView")
);
const CouponsView = lazy(() => import("../customer/pages/Account/CouponsView"));
const Notifications = lazy(
  () => import("../customer/pages/Account/Notifications")
);
const NotificationPreferencesView = lazy(
  () => import("../customer/pages/Account/NotificationPreferencesView")
);
const ProfileView = lazy(() => import("../customer/pages/Account/ProfileView"));
const SecurityView = lazy(
  () => import("../customer/pages/Account/SecurityView")
);
const SessionsView = lazy(
  () => import("../customer/pages/Account/SessionsView")
);
const PrivacyView = lazy(() => import("../customer/pages/Account/PrivacyView"));
const HelpCenterView = lazy(
  () => import("../customer/pages/Account/HelpCenterView")
);
const AiAssistantView = lazy(
  () => import("../customer/pages/Account/AiAssistantView")
);

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      // Guest-Only Auth Routes (Login / Signup)
      {
        path: "login",
        element: (
          <PublicOnlyRoute>
            <Auth />
          </PublicOnlyRoute>
        ),
      },
      {
        path: "signup",
        element: (
          <PublicOnlyRoute>
            <Auth />
          </PublicOnlyRoute>
        ),
      },

      // Standalone Public Pages
      {
        path: "become-seller",
        element: <BecomeSeller />,
      },

      // Storefront Shell (Navbar + Content + Footer + MobileBottomNav)
      {
        element: <CustomerLayout />,
        children: [
          // Public Storefront
          { index: true, element: <Home /> },
          { path: "products", element: <Products /> },
          { path: "products/:categoryId", element: <Products /> },
          {
            path: "product-details/:categoryId/:name/:productId",
            element: <ProductDetails />,
          },
          { path: "cart", element: <Cart /> },
          { path: "search", element: <SearchResults /> },
          { path: "wishlist", element: <Wishlist /> },
          {
            path: "wishlist/shared/:shareToken",
            element: <SharedCollectionView />,
          },

          // Authenticated Customer Protected Routes
          {
            element: <ProtectedRoute />,
            children: [
              { path: "checkout", element: <Checkout /> },
              { path: "checkout/address", element: <Checkout /> },
              {
                path: "notifications",
                element: <Navigate to="/account/notifications" replace />,
              },
              { path: "orders", element: <Order /> },
              { path: "order/:orderId", element: <OrderDetails /> },
              {
                path: "payment-success/:orderId",
                element: <PaymentSuccess />,
              },
              {
                path: "ai-chat",
                element: <Navigate to="/account/chat" replace />,
              },

              // Nested Account Hierarchy rendered inside Profile shell Outlet
              {
                path: "account",
                element: <Profile />,
                children: [
                  { index: true, element: <AccountOverview /> },
                  { path: "orders", element: <OrdersView /> },
                  { path: "returns", element: <ReturnsRefundsView /> },
                  { path: "buy-again", element: <BuyAgainView /> },
                  {
                    path: "recently-viewed",
                    element: <RecentlyViewedView />,
                  },
                  { path: "addresses", element: <Addresses /> },
                  { path: "payments", element: <PaymentsView /> },
                  { path: "coupons", element: <CouponsView /> },
                  { path: "notifications", element: <Notifications /> },
                  {
                    path: "notification-preferences",
                    element: <NotificationPreferencesView />,
                  },
                  { path: "profile", element: <ProfileView /> },
                  { path: "security", element: <SecurityView /> },
                  { path: "sessions", element: <SessionsView /> },
                  { path: "devices", element: <SessionsView /> },
                  { path: "privacy", element: <PrivacyView /> },
                  { path: "help", element: <HelpCenterView /> },
                  { path: "chat", element: <AiAssistantView /> },
                  { path: "ai-chat", element: <AiAssistantView /> },
                  {
                    path: "orders/:orderId/item/:orderItemId",
                    element: <OrderDetails />,
                  },
                ],
              },
            ],
          },
        ],
      },

      // Fallback 404 Route
      {
        path: "*",
        element: <RouteErrorBoundary />,
      },
    ],
  },
]);

export default router;
