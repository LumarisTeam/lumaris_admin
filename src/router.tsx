import { createBrowserRouter } from "react-router-dom";
import { AdminLayout } from "@/components/layout/admin-layout";
import { ProtectedRoute } from "@/components/layout/protected-route";
import LoginPage from "@/pages/admin/login";
import DashboardPage from "@/pages/admin/dashboard";
import MapManagementPage from "@/pages/admin/map-management";
import SchoolManagementPage from "@/pages/admin/school-management";
import LogsPage from "@/pages/admin/logs";
import BanLogsPage from "@/pages/admin/ban-logs";
import NotFoundPage from "@/pages/not-found";

export const router = createBrowserRouter([
  {
    index: true,
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: "admin", element: <DashboardPage /> },
          { path: "admin/map", element: <MapManagementPage /> },
          { path: "admin/schools", element: <SchoolManagementPage /> },
          { path: "admin/logs", element: <LogsPage /> },
          { path: "admin/ban-logs", element: <BanLogsPage /> },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
