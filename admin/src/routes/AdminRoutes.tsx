import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AdminLayout } from "../components/layout/AdminLayout";
import { useAdminAuth } from "../context/AdminAuthContext";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
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

// RBAC Protected Route Gate
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner message="Verifying administrator credentials..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Route that redirects authenticated admins away from the login page
const PublicAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner message="Verifying credentials..." />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const AdminRoutes = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <LoadingSpinner message="Loading operations module..." />
        </div>
      }
    >
      <Routes>
        <Route
          path="/login"
          element={
            <PublicAdminRoute>
              <AdminLogin />
            </PublicAdminRoute>
          }
        />

        {/* Protected Operational Control Center */}
        <Route
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/sellers" element={<Sellers />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/create" element={<ProductForm />} />
          <Route path="/products/:id/edit" element={<ProductForm />} />
          <Route path="/categories" element={<CategoryManager />} />
          <Route path="/brands" element={<Brands />} />
          <Route path="/inventory" element={<InventoryManager />} />
          <Route path="/reviews" element={<ReviewModeration />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/coupons" element={<Coupons />} />
          <Route path="/deals" element={<Deals />} />
          <Route path="/storefront-banners" element={<HomeCategories />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/settings" element={<PlatformSettings />} />
        </Route>

        {/* Catch-all redirect to dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};
