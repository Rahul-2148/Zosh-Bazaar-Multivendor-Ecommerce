import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { LogisticsLogin } from "./pages/Auth/LogisticsLogin";
import { LogisticsLayout } from "./components/layout/LogisticsLayout";
import { ControlTowerOverview } from "./pages/Overview/ControlTowerOverview";
import { LiveOperationsBoard } from "./pages/Operations/LiveOperationsBoard";
import { LiveMapControlTower } from "./pages/Operations/LiveMapControlTower";
import { PackageScanner } from "./pages/Operations/PackageScanner";
import { ShipmentList } from "./pages/Shipments/ShipmentList";
import { ShipmentDetail } from "./pages/Shipments/ShipmentDetail";
import { HubsManagement } from "./pages/Network/HubsManagement";
import { DeliveryZones } from "./pages/Network/DeliveryZones";
import { ManifestsHub } from "./pages/Network/ManifestsHub";
import { DeliveryAgentsList } from "./pages/Fleet/DeliveryAgentsList";
import { RoutePlanner } from "./pages/Fleet/RoutePlanner";
import { ExceptionsCenter } from "./pages/Exceptions/ExceptionsCenter";
import { SlaCommandCenter } from "./pages/SLA/SlaCommandCenter";
import { ReturnsHub } from "./pages/Returns/ReturnsHub";
import { LogisticsAnalytics } from "./pages/Analytics/LogisticsAnalytics";

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Authentication Route */}
        <Route path="/login" element={<LogisticsLogin />} />

        {/* Protected Control Tower Suite */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <LogisticsLayout />
            </ProtectedRoute>
          }
        >
          {/* Mission Control */}
          <Route index element={<ControlTowerOverview />} />
          <Route path="operations" element={<LiveOperationsBoard />} />
          <Route path="operations/board" element={<Navigate to="/operations" replace />} />
          <Route path="map" element={<LiveMapControlTower />} />
          <Route path="operations/map" element={<Navigate to="/map" replace />} />

          {/* Fulfillment & Parcels */}
          <Route path="shipments" element={<ShipmentList />} />
          <Route path="shipments/:id" element={<ShipmentDetail />} />
          <Route path="scanner" element={<PackageScanner />} />
          <Route path="manifests" element={<ManifestsHub />} />
          <Route path="network/manifests" element={<Navigate to="/manifests" replace />} />

          {/* Network & Fleet */}
          <Route path="hubs" element={<HubsManagement />} />
          <Route path="network/hubs" element={<Navigate to="/hubs" replace />} />
          <Route path="zones" element={<DeliveryZones />} />
          <Route path="network/zones" element={<Navigate to="/zones" replace />} />
          <Route path="agents" element={<DeliveryAgentsList />} />
          <Route path="fleet/agents" element={<Navigate to="/agents" replace />} />
          <Route path="routes" element={<RoutePlanner />} />
          <Route path="fleet/routes" element={<Navigate to="/routes" replace />} />

          {/* Triage, Quality & Analytics */}
          <Route path="exceptions" element={<ExceptionsCenter />} />
          <Route path="sla" element={<SlaCommandCenter />} />
          <Route path="returns" element={<ReturnsHub />} />
          <Route path="analytics" element={<LogisticsAnalytics />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
