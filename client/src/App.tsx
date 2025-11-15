import { ThemeProvider } from "@mui/material";
import { useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Auth from "./Auth/Auth";
import BecomeSeller from "./Auth/Become Seller/BecomeSeller";
import { useAppDispatch, useAppSelector } from "./Redux Toolkit/Store";
import { fetchUserProfile } from "./Redux Toolkit/features/customer/UserSlice";
import customTheme from "./Theme/customTheme";
import AdminDashboard from "./admin/AdminDashboard/AdminDashboard";
import { SnackbarProvider } from "./common/SnackbarProvider";
import CustomerRoutes from "./routes/CustomerRoutes";
import SellerDashboard from "./seller/SellerDashboard/SellerDashboard";
import { fetchSellerProfile } from "./Redux Toolkit/features/seller/SellerSlice";
import { createHomeCategories } from "./Redux Toolkit/features/customer/HomeCategorySlice";
import { homeCategories } from "./data/homeCategories";


function App() {
  const dispatch = useAppDispatch();
  const { auth } = useAppSelector((store) => store);

  useEffect(() => {
    const jwt = localStorage.getItem("jwt");

    if (jwt) {
      dispatch(fetchUserProfile(jwt));
      dispatch(fetchSellerProfile(jwt));
    } else if (auth.jwt) {
      dispatch(fetchUserProfile(auth.jwt));
    }
  }, [auth.jwt, dispatch]);

  useEffect(() => {
    dispatch(
      createHomeCategories(homeCategories)
    );
  }, [dispatch]);

  return (
    <ThemeProvider theme={customTheme}>
      <SnackbarProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/*" element={<CustomerRoutes />} />
            <Route path="/become-seller" element={<BecomeSeller />} />
            <Route path="/seller/*" element={<SellerDashboard />} />
            <Route path="/admin/*" element={<AdminDashboard />} />
            <Route path="/login" element={<Auth />} />
          </Routes>
        </BrowserRouter>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
