import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  useLocation,
  type Location,
} from "react-router";
import "./index.css";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import RolesPage from "@/pages/Roles";
import PlaceholderPage from "@/pages/Placeholder";
import NotFound from "@/pages/NotFound";

function LoginRoute() {
  const { user, loading } = useAuth();
  const from =
    (useLocation().state as { from?: Location } | null)?.from ?? "/";
  if (loading) return null;
  if (user) return <Navigate to={from} replace />;
  return <Login />;
}

const router = createBrowserRouter([
  { path: "/login", element: <LoginRoute /> },
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Dashboard /> },
          {
            path: "documents",
            element: <PlaceholderPage title="All documents" />,
          },
          {
            path: "documents/assigned",
            element: <PlaceholderPage title="Assigned documents" />,
          },
          {
            path: "documents/categories",
            element: <PlaceholderPage title="Document categories" />,
          },
          { path: "users", element: <PlaceholderPage title="Users list" /> },
          { path: "roles", element: <RolesPage /> },
          { path: "chat", element: <PlaceholderPage title="Chat" /> },
        ],
      },
    ],
  },
  { path: "/dashboard/*", element: <Navigate to="/" replace /> },
  { path: "*", element: <NotFound /> },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
);
