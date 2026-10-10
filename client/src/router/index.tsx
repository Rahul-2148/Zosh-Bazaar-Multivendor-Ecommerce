import { useEffect } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import RootLayout from "../layouts/RootLayout";
import CustomerLayout from "../layouts/CustomerLayout";
import ProtectedRoute from "./guards/ProtectedRoute";
import PublicOnlyRoute from "./guards/PublicOnlyRoute";
import RouteErrorBoundary from "./errors/RouteErrorBoundary";
import { lazyWithRetry } from "../utils/lazyWithRetry";

// Public Storefront Pages
const Home = lazyWithRetry(() => import("../customer/pages/Home/Home"));
const Products = lazyWithRetry(() => import("../customer/pages/Product/Products"));
const ProductDetails = lazyWithRetry(
  () => import("../customer/pages/Product/ProductDetails/ProductDetails")
);
const Cart = lazyWithRetry(() => import("../customer/pages/Cart/Cart"));
const SearchResults = lazyWithRetry(
  () => import("../customer/pages/Search/SearchResults")
);
const Wishlist = lazyWithRetry(() => import("../customer/pages/Wishlist/Wishlist"));
const SharedCollectionView = lazyWithRetry(
  () => import("../customer/pages/Wishlist/SharedCollectionView")
);

// Auth & Partner Pages
const Auth = lazyWithRetry(() => import("../Auth/Auth"));
const BecomeSeller = lazyWithRetry(() => import("../Auth/Become Seller/BecomeSeller"));

// Protected Customer Checkout & Order Pages
const Checkout = lazyWithRetry(() => import("../customer/pages/Checkout/Checkout"));
const Order = lazyWithRetry(() => import("../customer/pages/Order/Order"));
const OrderDetails = lazyWithRetry(() => import("../customer/pages/Order/OrderDetails"));
const PaymentSuccess = lazyWithRetry(
  () => import("../customer/pages/Payment/PaymentSuccess")
);

// Protected Customer Account Suite
const Profile = lazyWithRetry(() => import("../customer/pages/Account/Profile"));
const AccountOverview = lazyWithRetry(
  () => import("../customer/pages/Account/AccountOverview")
);
const OrdersView = lazyWithRetry(() => import("../customer/pages/Account/OrdersView"));
const ReturnsRefundsView = lazyWithRetry(
  () => import("../customer/pages/Account/ReturnsRefundsView")
);
const BuyAgainView = lazyWithRetry(
  () => import("../customer/pages/Account/BuyAgainView")
);
const RecentlyViewedView = lazyWithRetry(
  () => import("../customer/pages/Account/RecentlyViewedView")
);
const Addresses = lazyWithRetry(() => import("../customer/pages/Account/Addresses"));
const PaymentsView = lazyWithRetry(
  () => import("../customer/pages/Account/PaymentsView")
);
const CouponsView = lazyWithRetry(() => import("../customer/pages/Account/CouponsView"));
const Notifications = lazyWithRetry(
  () => import("../customer/pages/Account/Notifications")
);
const NotificationPreferencesView = lazyWithRetry(
  () => import("../customer/pages/Account/NotificationPreferencesView")
);
const ProfileView = lazyWithRetry(() => import("../customer/pages/Account/ProfileView"));
const SecurityView = lazyWithRetry(
  () => import("../customer/pages/Account/SecurityView")
);
const SessionsView = lazyWithRetry(
  () => import("../customer/pages/Account/SessionsView")
);
const PrivacyView = lazyWithRetry(() => import("../customer/pages/Account/PrivacyView"));
const HelpCenterView = lazyWithRetry(
  () => import("../customer/pages/Account/HelpCenterView")
);
const AiAssistantView = lazyWithRetry(
  () => import("../customer/pages/Account/AiAssistantView")
);

const DocsRedirect = ({ to }: { to: string }) => {
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.location.href = to;
    }
  }, [to]);

  return (
    <div style={{ padding: "40px", textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
      <h2>Redirecting to Zosh Bazaar Documentation...</h2>
      <p style={{ marginTop: "12px", color: "#64748b" }}>
        If you are not redirected automatically,{" "}
        <a href={to} style={{ color: "#2563eb", textDecoration: "underline" }}>
          click here to open {to}
        </a>
        .
      </p>
    </div>
  );
};

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      // Direct Documentation Redirects
      {
        path: "docs",
        element: <DocsRedirect to="http://localhost:5000/docs" />,
      },
      {
        path: "api-docs",
        element: <DocsRedirect to="http://localhost:5000/api-docs" />,
      },
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
          {
            path: "product-details/:categoryId/:productId",
            element: <ProductDetails />,
          },
          {
            path: "product-details/:productId",
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
