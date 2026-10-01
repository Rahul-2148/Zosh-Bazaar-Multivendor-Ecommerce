import { createBrowserRouter, Navigate } from "react-router-dom";
import RootLayout from "../layouts/RootLayout";
import { SellerLayout } from "../components/layout/SellerLayout";
import ProtectedRoute from "./guards/ProtectedRoute";
import GuestRoute from "./guards/GuestRoute";
import RouteErrorBoundary from "./errors/RouteErrorBoundary";
import { lazyWithRetry } from "../utils/lazyWithRetry";

// Lazy-loaded merchant views for optimal bundle splitting
const Dashboard = lazyWithRetry(() =>
  import("../pages/Dashboard").then((m) => ({ default: m.Dashboard }))
);
const ProductList = lazyWithRetry(() =>
  import("../pages/Products/ProductList").then((m) => ({ default: m.ProductList }))
);
const ProductEditor = lazyWithRetry(() =>
  import("../pages/Products/ProductEditor").then((m) => ({ default: m.ProductEditor }))
);
const InventoryCenter = lazyWithRetry(() =>
  import("../pages/Inventory/InventoryCenter").then((m) => ({ default: m.InventoryCenter }))
);
const OrderList = lazyWithRetry(() =>
  import("../pages/Orders/OrderList").then((m) => ({ default: m.OrderList }))
);
const ReturnsCenter = lazyWithRetry(() =>
  import("../pages/Returns/ReturnsCenter").then((m) => ({ default: m.ReturnsCenter }))
);
const FinancesPage = lazyWithRetry(() =>
  import("../pages/Finances/FinancesPage").then((m) => ({ default: m.FinancesPage }))
);
const StoreProfile = lazyWithRetry(() =>
  import("../pages/Store/StoreProfile").then((m) => ({ default: m.StoreProfile }))
);
const AIInsightsCenter = lazyWithRetry(() =>
  import("../pages/AIInsights/AIInsightsCenter").then((m) => ({ default: m.AIInsightsCenter }))
);
const SellerLogin = lazyWithRetry(() =>
  import("../pages/Auth/SellerLogin").then((m) => ({ default: m.SellerLogin }))
);
const SellerRegister = lazyWithRetry(() =>
  import("../pages/Auth/SellerRegister").then((m) => ({ default: m.SellerRegister }))
);

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      // Public Merchant Authentication Routes
      {
        path: "login",
        element: (
          <GuestRoute>
            <SellerLogin />
          </GuestRoute>
        ),
      },
      {
        path: "register",
        element: (
          <GuestRoute>
            <SellerRegister />
          </GuestRoute>
        ),
      },

      // Protected Merchant Management Portal
      {
        element: (
          <ProtectedRoute>
            <SellerLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <Dashboard /> },
          { path: "ai", element: <AIInsightsCenter /> },
          { path: "ai-insights", element: <AIInsightsCenter /> },
          { path: "products", element: <ProductList /> },
          { path: "products/new", element: <ProductEditor /> },
          { path: "products/:id/edit", element: <ProductEditor /> },
          { path: "inventory", element: <InventoryCenter /> },
          { path: "orders", element: <OrderList /> },
          { path: "returns", element: <ReturnsCenter /> },
          { path: "finances", element: <FinancesPage /> },
          { path: "store", element: <StoreProfile /> },
        ],
      },

      // Fallback Catch-all
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);

export default router;
