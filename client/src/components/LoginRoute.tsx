import { Navigate, useLocation, type Location } from "react-router";
import { useAuth } from "@/context/auth";
import Login from "@/pages/Login";

export default function LoginRoute() {
  const { user, loading } = useAuth();
  const from =
    (useLocation().state as { from?: Location } | null)?.from ?? "/";
  if (loading) return null;
  if (user) return <Navigate to={from} replace />;
  return <Login />;
}
