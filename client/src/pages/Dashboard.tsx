import { useAuth } from "@/context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight text-ink-1">
        Welcome, {user?.fullName}
      </h2>
      <p className="mt-2 text-[15px] text-ink-2">{user?.email}</p>
    </div>
  );
}
