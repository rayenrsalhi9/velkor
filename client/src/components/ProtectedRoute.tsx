import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-canvas">
        <div className="flex w-72 flex-col gap-3">
          <div className="v-skeleton h-6 w-48" />
          <div className="v-skeleton h-3 w-64" />
          <div className="v-skeleton mt-2 h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
