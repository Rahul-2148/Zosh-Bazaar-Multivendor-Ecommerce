import { lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import RootLayout from "../layouts/RootLayout";
import { SellerLayout } from "../components/layout/SellerLayout";
import ProtectedRoute from "./guards/ProtectedRoute";
import GuestRoute from "./guards/GuestRoute";
import RouteErrorBoundary from "./errors/RouteErrorBoundary";

// Lazy-loaded merchant views for optimal bundle splitting
const Dashboard = lazy(() =>
  import("../pages/Dashboard").then((m) => ({ default: m.Dashboard }))
);
const ProductList = lazy(() =>
  import("../pages/Products/ProductList").then((m) => ({ default: m.ProductList }))
);
const ProductEditor = lazy(() =>
  import("../pages/Products/ProductEditor").then((m) => ({ default: m.ProductEditor }))
);
const InventoryCenter = lazy(() =>
  import("../pages/Inventory/InventoryCenter").then((m) => ({ default: m.InventoryCenter }))
);
const OrderList = lazy(() =>
  import("../pages/Orders/OrderList").then((m) => ({ default: m.OrderList }))
);
const ReturnsCenter = lazy(() =>
  import("../pages/Returns/ReturnsCenter").then((m) => ({ default: m.ReturnsCenter }))
);
const FinancesPage = lazy(() =>
  import("../pages/Finances/FinancesPage").then((m) => ({ default: m.FinancesPage }))
);
const StoreProfile = lazy(() =>
  import("../pages/Store/StoreProfile").then((m) => ({ default: m.StoreProfile }))
);
const AIInsightsCenter = lazy(() =>
  import("../pages/AIInsights/AIInsightsCenter").then((m) => ({ default: m.AIInsightsCenter }))
);
const SellerLogin = lazy(() =>
  import("../pages/Auth/SellerLogin").then((m) => ({ default: m.SellerLogin }))
);
const SellerRegister = lazy(() =>
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
