import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { PartnerAuthProvider, usePartnerAuth } from "./context/PartnerAuthContext";
import { ActiveRouteProvider } from "./context/ActiveRouteContext";
import { PartnerSocketProvider } from "./context/PartnerSocketContext";
import { MobileAppShell } from "./components/layout/MobileAppShell";

import { PartnerLogin } from "./pages/Auth/PartnerLogin";
import { ShiftDashboard } from "./pages/Home/ShiftDashboard";
import { RouteStopsList } from "./pages/Route/RouteStopsList";
import { ActiveDeliveryMode } from "./pages/ActiveStop/ActiveDeliveryMode";
import { QuickPackageScanner } from "./pages/Scanner/QuickPackageScanner";
import { EarningsTransparency } from "./pages/Earnings/EarningsTransparency";
import { DeliveryHistory } from "./pages/History/DeliveryHistory";
import { SafetySupportHelp } from "./pages/Safety/SafetySupportHelp";
import { PartnerProfile } from "./pages/Profile/PartnerProfile";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, loading } = usePartnerAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-card text-foreground">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <PartnerAuthProvider>
        <ActiveRouteProvider>
          <PartnerSocketProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Auth Route */}
                <Route path="/login" element={<PartnerLogin />} />

                {/* Protected Delivery Operations Routes */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <MobileAppShell />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<ShiftDashboard />} />
                  <Route path="route" element={<RouteStopsList />} />
                  <Route path="stop/:stopId" element={<ActiveDeliveryMode />} />
                  <Route path="scanner" element={<QuickPackageScanner />} />
                  <Route path="earnings" element={<EarningsTransparency />} />
                  <Route path="history" element={<DeliveryHistory />} />
                  <Route path="safety" element={<SafetySupportHelp />} />
                  <Route path="profile" element={<PartnerProfile />} />
                </Route>

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </PartnerSocketProvider>
        </ActiveRouteProvider>
      </PartnerAuthProvider>
    </ThemeProvider>
  );
};

export default App;
