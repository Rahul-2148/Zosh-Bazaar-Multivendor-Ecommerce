import { createBrowserRouter, Navigate } from "react-router-dom";
import { RootLayout } from "../layouts/RootLayout";
import { MobileAppShell } from "../components/layout/MobileAppShell";
import { ProtectedRoute } from "./guards/ProtectedRoute";
import { GuestRoute } from "./guards/GuestRoute";
import { RouteErrorBoundary } from "./errors/RouteErrorBoundary";
import { lazyWithRetry } from "../utils/lazyWithRetry";

// Lazy-loaded routes for code splitting
const PartnerLogin = lazyWithRetry(() =>
  import("../pages/Auth/PartnerLogin").then((m) => ({ default: m.PartnerLogin }))
);
const ShiftDashboard = lazyWithRetry(() =>
  import("../pages/Home/ShiftDashboard").then((m) => ({ default: m.ShiftDashboard }))
);
const RouteStopsList = lazyWithRetry(() =>
  import("../pages/Route/RouteStopsList").then((m) => ({ default: m.RouteStopsList }))
);
const ActiveDeliveryMode = lazyWithRetry(() =>
  import("../pages/ActiveStop/ActiveDeliveryMode").then((m) => ({ default: m.ActiveDeliveryMode }))
);
const QuickPackageScanner = lazyWithRetry(() =>
  import("../pages/Scanner/QuickPackageScanner").then((m) => ({ default: m.QuickPackageScanner }))
);
const EarningsTransparency = lazyWithRetry(() =>
  import("../pages/Earnings/EarningsTransparency").then((m) => ({ default: m.EarningsTransparency }))
);
const DeliveryHistory = lazyWithRetry(() =>
  import("../pages/History/DeliveryHistory").then((m) => ({ default: m.DeliveryHistory }))
);
const SafetySupportHelp = lazyWithRetry(() =>
  import("../pages/Safety/SafetySupportHelp").then((m) => ({ default: m.SafetySupportHelp }))
);
const PartnerProfile = lazyWithRetry(() =>
  import("../pages/Profile/PartnerProfile").then((m) => ({ default: m.PartnerProfile }))
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
            element: <PartnerLogin />,
          },
        ],
      },

      // Protected Delivery Operations Suite
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <MobileAppShell />,
            children: [
              {
                index: true,
                element: <ShiftDashboard />,
              },
              {
                path: "route",
                element: <RouteStopsList />,
              },
              {
                path: "stop/:stopId",
                element: <ActiveDeliveryMode />,
              },
              {
                path: "scanner",
                element: <QuickPackageScanner />,
              },
              {
                path: "earnings",
                element: <EarningsTransparency />,
              },
              {
                path: "history",
                element: <DeliveryHistory />,
              },
              {
                path: "safety",
                element: <SafetySupportHelp />,
              },
              {
                path: "profile",
                element: <PartnerProfile />,
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
