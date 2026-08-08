import { Loader2 } from "lucide-react";

export default function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="size-6 animate-spin text-ink-3" />
    </div>
  );
}
