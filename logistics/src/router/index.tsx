import { lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { RootLayout } from "../layouts/RootLayout";
import { LogisticsLayout } from "../components/layout/LogisticsLayout";
import { ProtectedRoute } from "./guards/ProtectedRoute";
import { GuestRoute } from "./guards/GuestRoute";
import { RouteErrorBoundary } from "./errors/RouteErrorBoundary";

// Lazy-loaded routes for code splitting
const LogisticsLogin = lazy(() =>
  import("../pages/Auth/LogisticsLogin").then((m) => ({ default: m.LogisticsLogin }))
);
const ControlTowerOverview = lazy(() =>
  import("../pages/Overview/ControlTowerOverview").then((m) => ({ default: m.ControlTowerOverview }))
);
const LiveOperationsBoard = lazy(() =>
  import("../pages/Operations/LiveOperationsBoard").then((m) => ({ default: m.LiveOperationsBoard }))
);
const LiveMapControlTower = lazy(() =>
  import("../pages/Operations/LiveMapControlTower").then((m) => ({ default: m.LiveMapControlTower }))
);
const PackageScanner = lazy(() =>
  import("../pages/Operations/PackageScanner").then((m) => ({ default: m.PackageScanner }))
);
const ShipmentList = lazy(() =>
  import("../pages/Shipments/ShipmentList").then((m) => ({ default: m.ShipmentList }))
);
const ShipmentDetail = lazy(() =>
  import("../pages/Shipments/ShipmentDetail").then((m) => ({ default: m.ShipmentDetail }))
);
const HubsManagement = lazy(() =>
  import("../pages/Network/HubsManagement").then((m) => ({ default: m.HubsManagement }))
);
const DeliveryZones = lazy(() =>
  import("../pages/Network/DeliveryZones").then((m) => ({ default: m.DeliveryZones }))
);
const ManifestsHub = lazy(() =>
  import("../pages/Network/ManifestsHub").then((m) => ({ default: m.ManifestsHub }))
);
const DeliveryAgentsList = lazy(() =>
  import("../pages/Fleet/DeliveryAgentsList").then((m) => ({ default: m.DeliveryAgentsList }))
);
const RoutePlanner = lazy(() =>
  import("../pages/Fleet/RoutePlanner").then((m) => ({ default: m.RoutePlanner }))
);
const ExceptionsCenter = lazy(() =>
  import("../pages/Exceptions/ExceptionsCenter").then((m) => ({ default: m.ExceptionsCenter }))
);
const SlaCommandCenter = lazy(() =>
  import("../pages/SLA/SlaCommandCenter").then((m) => ({ default: m.SlaCommandCenter }))
);
const ReturnsHub = lazy(() =>
  import("../pages/Returns/ReturnsHub").then((m) => ({ default: m.ReturnsHub }))
);
const LogisticsAnalytics = lazy(() =>
  import("../pages/Analytics/LogisticsAnalytics").then((m) => ({ default: m.LogisticsAnalytics }))
);

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      // Guest-Only Route (Login)
      {
        element: <GuestRoute />,
        children: [
          {
            path: "login",
            element: <LogisticsLogin />,
          },
        ],
      },

      // Protected Control Tower Operations Suite
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <LogisticsLayout />,
            children: [
              // Mission Control
              {
                index: true,
                element: <ControlTowerOverview />,
              },
              {
                path: "operations",
                element: <LiveOperationsBoard />,
              },
              {
                path: "operations/board",
                element: <Navigate to="/operations" replace />,
              },
              {
                path: "map",
                element: <LiveMapControlTower />,
              },
              {
                path: "operations/map",
                element: <Navigate to="/map" replace />,
              },

              // Fulfillment & Parcels
              {
                path: "shipments",
                element: <ShipmentList />,
              },
              {
                path: "shipments/:id",
                element: <ShipmentDetail />,
              },
              {
                path: "scanner",
                element: <PackageScanner />,
              },
              {
                path: "manifests",
                element: <ManifestsHub />,
              },
              {
                path: "network/manifests",
                element: <Navigate to="/manifests" replace />,
              },

              // Network & Fleet
              {
                path: "hubs",
                element: <HubsManagement />,
              },
              {
                path: "network/hubs",
                element: <Navigate to="/hubs" replace />,
              },
              {
                path: "zones",
                element: <DeliveryZones />,
              },
              {
                path: "network/zones",
                element: <Navigate to="/zones" replace />,
              },
              {
                path: "agents",
                element: <DeliveryAgentsList />,
              },
              {
                path: "fleet/agents",
                element: <Navigate to="/agents" replace />,
              },
              {
                path: "routes",
                element: <RoutePlanner />,
              },
              {
                path: "fleet/routes",
                element: <Navigate to="/routes" replace />,
              },

              // Triage, Quality & Analytics
              {
                path: "exceptions",
                element: <ExceptionsCenter />,
              },
              {
                path: "sla",
                element: <SlaCommandCenter />,
              },
              {
                path: "returns",
                element: <ReturnsHub />,
              },
              {
                path: "analytics",
                element: <LogisticsAnalytics />,
              },
            ],
          },
        ],
      },

      // Fallback
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);

export default router;
