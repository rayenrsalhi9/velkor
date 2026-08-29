import PageHeader from "@/components/PageHeader";
import PendingSurveysCard from "@/components/surveys/PendingSurveysCard";
import { useAuth } from "@/context/auth";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${user?.fullName}`}
        description={user?.email}
      />
      <PendingSurveysCard />
    </div>
  );
}
