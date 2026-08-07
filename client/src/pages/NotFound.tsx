import { Link } from "react-router";
import { Home, ArrowLeft } from "lucide-react";
import LogoGlyph from "@/components/LogoGlyph";

export default function NotFound() {
  return (
    <main className="relative flex min-h-[100dvh] flex-col items-center justify-center gap-8 bg-canvas px-6 text-ink-1">
      <div className="flex items-center gap-2.5">
        <LogoGlyph className="h-8 w-8" />
        <span className="text-[15px] font-semibold tracking-[-0.01em] text-ink-1">
          Velkor
        </span>
      </div>

      <div className="text-center max-w-[28rem]">
        <h1 className="text-5xl font-semibold tracking-tight text-ink-1 sm:text-6xl">
          404
        </h1>
        <h2 className="mt-4 text-xl font-medium tracking-tight text-ink-1 sm:text-2xl">
          Page not found
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          to="/"
          className="v-brand-gradient inline-flex h-11 items-center justify-center gap-2 rounded-lg px-6 text-sm font-medium text-white shadow-sm transition-colors hover:brightness-110 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-canvas focus-visible:outline-none"
        >
          <Home className="size-5" aria-hidden />
          Go to dashboard
        </Link>
        <button
          onClick={() => window.history.back()}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-line bg-surface px-6 text-sm font-medium text-ink-1 shadow-sm transition-colors hover:bg-surface-2 active:bg-surface-3 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-canvas focus-visible:outline-none"
        >
          <ArrowLeft className="size-5" aria-hidden />
          Go back to previous page
        </button>
      </div>

      <p className="absolute bottom-6 text-center text-xs text-ink-3">
        If you believe this is an error, please contact support.
      </p>
    </main>
  );
}
