import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight text-foreground">
        Welcome, {user?.fullName}
      </h2>
      <p className="mt-2 text-[15px] text-muted-foreground">{user?.email}</p>
    </div>
  );
}
