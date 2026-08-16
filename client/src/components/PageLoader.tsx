import { HugeiconsIcon } from "@hugeicons/react";
import { LoadingIcon } from "@hugeicons/core-free-icons";

export default function PageLoader() {
  return (
    <div
      role="status"
      className="flex min-h-screen items-center justify-center"
    >
      <HugeiconsIcon icon={LoadingIcon} aria-hidden="true" className="size-6 animate-spin text-ink-3" />
      <span className="sr-only">Loading...</span>
    </div>
  );
}
