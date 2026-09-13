import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "./Redux Toolkit/Store";
import { fetchUserProfile } from "./Redux Toolkit/features/customer/UserSlice";
import { ThemeProvider } from "./Theme/ThemeContext";
import { SnackbarProvider } from "./common/SnackbarProvider";
import PageLoader from "./common/PageLoader";
import { fetchUserCart } from "./Redux Toolkit/features/customer/CartSlice";
import { getWishlist } from "./Redux Toolkit/features/customer/WishlistSlice";
import PublicOnlyRoute from "./customer/components/RouteGuards/PublicOnlyRoute";

// Route-level code splitting for ultra-fast startup and small initial bundles
const CustomerRoutes = lazy(() => import("./routes/CustomerRoutes"));
const BecomeSeller = lazy(() => import("./Auth/Become Seller/BecomeSeller"));
const Auth = lazy(() => import("./Auth/Auth"));

function App() {
  const dispatch = useAppDispatch();
  const { auth } = useAppSelector((store) => store);

  // Restore authenticated session on app initialization / page reload
  useEffect(() => {
    const token =
      (typeof window !== "undefined" ? localStorage.getItem("jwt") : null) ||
      auth.jwt;
    if (token && token !== "undefined" && token !== "null" && token.trim() !== "") {
      dispatch(fetchUserProfile(token));
      dispatch(fetchUserCart(token));
      dispatch(getWishlist());
    }
  }, [auth.jwt, dispatch]);

  return (
    <ThemeProvider>
      <SnackbarProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public-Only Auth Route (Redirects away if already signed in) */}
              <Route
                path="/login"
                element={
                  <PublicOnlyRoute>
                    <Auth />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path="/signup"
                element={
                  <PublicOnlyRoute>
                    <Auth />
                  </PublicOnlyRoute>
                }
              />

              {/* Become Seller / Seller Auth */}
              <Route path="/become-seller" element={<BecomeSeller />} />

              {/* Public or Customer Routes */}
              <Route path="/*" element={<CustomerRoutes />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
