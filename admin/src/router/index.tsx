import { lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import RootLayout from "../layouts/RootLayout";
import { AdminLayout } from "../components/layout/AdminLayout";
import ProtectedRoute from "./guards/ProtectedRoute";
import GuestRoute from "./guards/GuestRoute";
import RouteErrorBoundary from "./errors/RouteErrorBoundary";
import { AdminLogin } from "../pages/Auth/AdminLogin";

// Lazy-loaded operational views
const Dashboard = lazy(() =>
  import("../pages/Dashboard/Dashboard").then((m) => ({ default: m.Dashboard }))
);
const Sellers = lazy(() =>
  import("../pages/Sellers/Sellers").then((m) => ({ default: m.Sellers }))
);
const Orders = lazy(() =>
  import("../pages/Orders/Orders").then((m) => ({ default: m.Orders }))
);
const Products = lazy(() =>
  import("../pages/Products/Products").then((m) => ({ default: m.Products }))
);
const ProductForm = lazy(() =>
  import("../pages/Products/ProductForm").then((m) => ({ default: m.ProductForm }))
);
const CategoryManager = lazy(() =>
  import("../pages/Categories/CategoryManager").then((m) => ({
    default: m.CategoryManager,
  }))
);
const Brands = lazy(() =>
  import("../pages/Brands/Brands").then((m) => ({ default: m.Brands }))
);
const InventoryManager = lazy(() =>
  import("../pages/Inventory/InventoryManager").then((m) => ({
    default: m.InventoryManager,
  }))
);
const ReviewModeration = lazy(() =>
  import("../pages/Reviews/ReviewModeration").then((m) => ({
    default: m.ReviewModeration,
  }))
);
const PlatformSettings = lazy(() =>
  import("../pages/Settings/PlatformSettings").then((m) => ({
    default: m.PlatformSettings,
  }))
);
const Customers = lazy(() =>
  import("../pages/Customers/Customers").then((m) => ({ default: m.Customers }))
);
const Coupons = lazy(() =>
  import("../pages/Coupons/Coupons").then((m) => ({ default: m.Coupons }))
);
const Deals = lazy(() =>
  import("../pages/Deals/Deals").then((m) => ({ default: m.Deals }))
);
const HomeCategories = lazy(() =>
  import("../pages/HomeCategories/HomeCategories").then((m) => ({
    default: m.HomeCategories,
  }))
);
const Transactions = lazy(() =>
  import("../pages/Transactions/Transactions").then((m) => ({
    default: m.Transactions,
  }))
);
const AdminAICenter = lazy(() =>
  import("../pages/AI/AdminAICenter").then((m) => ({
    default: m.AdminAICenter,
  }))
);

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      // Public Guest Auth Route
      {
        path: "login",
        element: (
          <GuestRoute>
            <AdminLogin />
          </GuestRoute>
        ),
      },

      // Protected Operational Control Center
      {
        element: (
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <Dashboard /> },
          { path: "ai", element: <AdminAICenter /> },
          { path: "sellers", element: <Sellers /> },
          { path: "orders", element: <Orders /> },
          { path: "products", element: <Products /> },
          { path: "products/create", element: <ProductForm /> },
          { path: "products/:id/edit", element: <ProductForm /> },
          { path: "categories", element: <CategoryManager /> },
          { path: "brands", element: <Brands /> },
          { path: "inventory", element: <InventoryManager /> },
          { path: "reviews", element: <ReviewModeration /> },
          { path: "customers", element: <Customers /> },
          { path: "coupons", element: <Coupons /> },
          { path: "deals", element: <Deals /> },
          { path: "storefront-banners", element: <HomeCategories /> },
          { path: "transactions", element: <Transactions /> },
          { path: "settings", element: <PlatformSettings /> },
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
