import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  useLocation,
} from "react-router";
import "./index.css";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import AppShell from "./components/layout/AppShell.tsx";
import Login from "./pages/Login.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import PlaceholderPage from "./pages/Placeholder.tsx";
import NotFound from "./pages/NotFound.tsx";

function LoginRoute() {
  const { user, loading } = useAuth();
  const from =
    (useLocation().state as { from?: { pathname?: string } } | null)?.from
      ?.pathname ?? "/";
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
          {
            path: "users/roles",
            element: <PlaceholderPage title="Roles list" />,
          },
          {
            path: "users/role-users",
            element: <PlaceholderPage title="Roles users" />,
          },
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
