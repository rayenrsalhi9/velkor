import LoginForm from "@/components/login/LoginForm";
import LoginVisual, { DotGrid } from "@/components/login/LoginVisual";
import ThemeToggle from "@/components/layout/ThemeToggle";
import LogoGlyph from "@/components/LogoGlyph";

/**
 * Split-screen auth gateway: form left (44%), live product diorama right
 * (56%). Mobile (<1024px): the diorama is hidden, form only.
 */
export default function Login() {
  return (
    <main className="flex min-h-[100dvh] flex-col bg-canvas lg:flex-row">
      {/* Left: form (44%) */}
      <section className="relative flex w-full flex-1 flex-col px-6 py-6 sm:px-10 lg:w-[44%] lg:flex-none lg:py-8">
        <div className="v-rise flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <LogoGlyph className="h-8 w-8" />
            <span className="text-[15px] font-semibold tracking-[-0.01em] text-ink-1">
              Velkor
            </span>
          </div>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center py-8 lg:py-4">
          <div className="mx-auto w-full max-w-[400px]">
            <LoginForm />
          </div>
        </div>

        <p className="font-mono text-[11px] text-center text-ink-3 lg:text-left">
          © 2026 Velkor · internal workspace
        </p>
      </section>

      {/* Right: live diorama (56%) */}
      <aside
        aria-hidden="true"
        className="v-aurora relative hidden w-[56%] overflow-hidden border-l border-line lg:flex lg:flex-col lg:items-center lg:justify-center"
      >
        <div className="absolute inset-0">
          <DotGrid />
        </div>
        <div className="relative flex w-full flex-1 flex-col">
          <LoginVisual />
        </div>
      </aside>
    </main>
  );
}
