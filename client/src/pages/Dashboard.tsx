import PageHeader from "@/components/PageHeader";
import { useAuth } from "@/context/auth";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <PageHeader
      title={`Welcome, ${user?.fullName}`}
      description={user?.email}
    />
  );
}
