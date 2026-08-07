import { Link } from "react-router";
import { Home, ShieldX } from "lucide-react";

export default function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center gap-5 px-6 py-20 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-danger/10 text-danger">
        <ShieldX className="size-6" aria-hidden />
      </span>
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-ink-1">
          You don't have access
        </h2>
        <p className="mx-auto mt-1 max-w-sm text-[13px] leading-5 text-ink-2">
          Your role doesn't include the permission to manage roles. Ask your
          administrator for access.
        </p>
      </div>
      <Link
        to="/"
        className="inline-flex h-9 items-center gap-2 rounded-md border border-line bg-surface px-4 text-[13px] font-medium text-ink-1 shadow-card transition-colors duration-150 hover:bg-surface-2"
      >
        <Home className="size-4" aria-hidden />
        Back to dashboard
      </Link>
    </div>
  );
}
