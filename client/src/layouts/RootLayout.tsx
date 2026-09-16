import React, { Suspense, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../Redux Toolkit/Store";
import { fetchUserProfile } from "../Redux Toolkit/features/customer/UserSlice";
import { fetchUserCart } from "../Redux Toolkit/features/customer/CartSlice";
import { getWishlist } from "../Redux Toolkit/features/customer/WishlistSlice";
import { ThemeProvider } from "../Theme/ThemeContext";
import { SnackbarProvider } from "../common/SnackbarProvider";
import PageLoader from "../common/PageLoader";
import AIAssistantPanel from "../customer/components/AI/AIAssistantPanel";
import AIAssistantTrigger from "../customer/components/AI/AIAssistantTrigger";

export const RootLayout: React.FC = () => {
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
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
        <AIAssistantPanel />
        <AIAssistantTrigger />
      </SnackbarProvider>
    </ThemeProvider>
  );
};

export default RootLayout;
