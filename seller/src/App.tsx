import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { SellerAuthProvider } from "./context/SellerAuthContext";
import { SocketProvider } from "./context/SocketContext";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import { SellerLayout } from "./components/layout/SellerLayout";

import { Dashboard } from "./pages/Dashboard";
import { ProductList } from "./pages/Products/ProductList";
import { ProductEditor } from "./pages/Products/ProductEditor";
import { InventoryCenter } from "./pages/Inventory/InventoryCenter";
import { OrderList } from "./pages/Orders/OrderList";
import { ReturnsCenter } from "./pages/Returns/ReturnsCenter";
import { FinancesPage } from "./pages/Finances/FinancesPage";
import { StoreProfile } from "./pages/Store/StoreProfile";
import { AIInsightsCenter } from "./pages/AIInsights/AIInsightsCenter";
import { SellerLogin } from "./pages/Auth/SellerLogin";
import { SellerRegister } from "./pages/Auth/SellerRegister";

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <SellerAuthProvider>
        <SocketProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Authentication */}
              <Route path="/login" element={<SellerLogin />} />
              <Route path="/register" element={<SellerRegister />} />

              {/* Protected Merchant Portal */}
              <Route
                element={
                  <ProtectedRoute>
                    <SellerLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<Dashboard />} />
                <Route path="/ai-insights" element={<AIInsightsCenter />} />
                <Route path="/products" element={<ProductList />} />
                <Route path="/products/new" element={<ProductEditor />} />
                <Route path="/products/:id/edit" element={<ProductEditor />} />
                <Route path="/inventory" element={<InventoryCenter />} />
                <Route path="/orders" element={<OrderList />} />
                <Route path="/returns" element={<ReturnsCenter />} />
                <Route path="/finances" element={<FinancesPage />} />
                <Route path="/store" element={<StoreProfile />} />
              </Route>

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </SocketProvider>
      </SellerAuthProvider>
    </ThemeProvider>
  );
};

export default App;
