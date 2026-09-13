import { lazy, Suspense } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import Footer from "../customer/Footer/Footer";
import Navbar from "../customer/Navbar/Navbar";
import Home from "../customer/pages/Home/Home";
import PageLoader from "../common/PageLoader";
import ProtectedRoute from "../customer/components/RouteGuards/ProtectedRoute";
import { MobileBottomNav } from "../customer/Navbar/MobileBottomNav";

const Products = lazy(() => import("../customer/pages/Product/Products"));
const ProductDetails = lazy(
  () => import("../customer/pages/Product/ProductDetails/ProductDetails")
);
const Cart = lazy(() => import("../customer/pages/Cart/Cart"));
const Checkout = lazy(() => import("../customer/pages/Checkout/Checkout"));
const Profile = lazy(() => import("../customer/pages/Account/Profile"));
const Order = lazy(() => import("../customer/pages/Order/Order"));
const OrderDetails = lazy(() => import("../customer/pages/Order/OrderDetails"));
const Wishlist = lazy(() => import("../customer/pages/Wishlist/Wishlist"));
const SharedCollectionView = lazy(
  () => import("../customer/pages/Wishlist/SharedCollectionView")
);
const SearchResults = lazy(
  () => import("../customer/pages/Search/SearchResults")
);
const PaymentSuccess = lazy(
  () => import("../customer/pages/Payment/PaymentSuccess")
);
const Auth = lazy(() => import("../Auth/Auth"));

const CustomerRoutes = () => {
  return (
    <div className="min-h-screen flex flex-col pb-16 md:pb-0">
      <Navbar />

      <main className="flex-1">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Storefront Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:categoryId" element={<Products />} />
            <Route
              path="/product-details/:categoryId/:name/:productId"
              element={<ProductDetails />}
            />
            <Route path="/cart" element={<Cart />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/signup" element={<Auth />} />

            {/* Authenticated Customer Routes */}
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout/address"
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/account/*"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ai-chat"
              element={<Navigate to="/account/chat" replace />}
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <Order />
                </ProtectedRoute>
              }
            />
            <Route
              path="/order/:orderId"
              element={
                <ProtectedRoute>
                  <OrderDetails />
                </ProtectedRoute>
              }
            />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route
              path="/wishlist/shared/:shareToken"
              element={<SharedCollectionView />}
            />
            <Route
              path="/payment-success/:orderId"
              element={
                <ProtectedRoute>
                  <PaymentSuccess />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default CustomerRoutes;
