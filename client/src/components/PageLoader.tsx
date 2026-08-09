import { Loader2 } from "lucide-react";

export default function PageLoader() {
  return (
    <div
      role="status"
      className="flex min-h-screen items-center justify-center"
    >
      <Loader2 aria-hidden="true" className="size-6 animate-spin text-ink-3" />
      <span className="sr-only">Loading...</span>
    </div>
  );
}
