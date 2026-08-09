/* oxlint-disable react/only-export-components -- entry point, never fast-refreshes */
import { lazy, Suspense, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router";
import "./index.css";
import { AuthProvider } from "@/context/AuthContext";
import LoginRoute from "@/components/LoginRoute";
import ProtectedRoute from "@/components/ProtectedRoute";
import RequireClaim from "@/components/RequireClaim";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/PageLoader";

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const RolesPage = lazy(() => import("@/pages/Roles"));
const UsersPage = lazy(() => import("@/pages/Users"));
const ProfilePage = lazy(() => import("@/pages/Profile"));
const SettingsPage = lazy(() => import("@/pages/Settings"));
const PlaceholderPage = lazy(() => import("@/pages/Placeholder"));
const NotFound = lazy(() => import("@/pages/NotFound"));

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
            element: (
              <RequireClaim claim="documents:view-list">
                <PlaceholderPage title="All documents" />
              </RequireClaim>
            ),
          },
          {
            path: "documents/assigned",
            element: (
              <RequireClaim claim="documents:view-assigned">
                <PlaceholderPage title="Assigned documents" />
              </RequireClaim>
            ),
          },
          {
            path: "documents/categories",
            element: (
              <RequireClaim claim="documents:view-categories">
                <PlaceholderPage title="Document categories" />
              </RequireClaim>
            ),
          },
          {
            path: "users",
            element: (
              <RequireClaim claim="users:manage">
                <UsersPage />
              </RequireClaim>
            ),
          },
          {
            path: "settings",
            element: <SettingsPage />,
            children: [
              { index: true, element: <Navigate to="profile" replace /> },
              { path: "profile", element: <ProfilePage /> },
              {
                path: "appearance",
                element: <PlaceholderPage title="Appearance" />,
              },
              {
                path: "notifications",
                element: <PlaceholderPage title="Notifications" />,
              },
            ],
          },
          {
            path: "roles",
            element: (
              <RequireClaim claim="roles:manage">
                <RolesPage />
              </RequireClaim>
            ),
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
      <Suspense fallback={<PageLoader />}>
        <RouterProvider router={router} />
      </Suspense>
    </AuthProvider>
  </StrictMode>,
);
