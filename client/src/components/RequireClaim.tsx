import type { ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ShieldIcon } from "@hugeicons/core-free-icons";
import { useAuth } from "@/context/auth";
import { hasClaim } from "@/lib/navigation";

export default function RequireClaim({
  claim,
  children,
}: {
  claim: string | string[];
  children: ReactNode;
}) {
  const { user } = useAuth();
  if (!hasClaim(user?.claims ?? [], claim)) {
    return (
      <div className="v-card flex flex-col items-center gap-4 px-6 py-16 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-muted text-ink-3">
          <HugeiconsIcon icon={ShieldIcon} size={22} />
        </span>
        <div>
          <h1 className="text-lg font-semibold text-ink-1">Access denied</h1>
          <p className="mt-1 text-[13px] text-ink-2">
            You don't have permission to view this page.
          </p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
