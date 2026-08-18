import LoginForm from "@/components/login/LoginForm";
import ThemeToggle from "@/components/layout/ThemeToggle";
import LogoGlyph from "@/components/LogoGlyph";

/**
 * Auth gateway: centered form on a single canvas surface.
 * ponytail: diorama/dot-grid/aurora removed — fake live data adds no
 * information to an internal login.
 */
export default function Login() {
  return (
    <main className="flex min-h-[100dvh] flex-col bg-canvas">
      <header className="flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <LogoGlyph className="h-8 w-8" />
          <span className="text-[15px] font-semibold tracking-[-0.01em] text-ink-1">
            Velkor
          </span>
        </div>
        <ThemeToggle />
      </header>

      <div className="flex flex-1 items-center justify-center px-6 py-8">
        <div className="v-rise w-full max-w-[400px]">
          <LoginForm />
        </div>
      </div>

      <footer className="px-6 py-6">
        <p className="font-mono text-[11px] text-center text-ink-3">
          © 2026 Velkor · internal workspace
        </p>
      </footer>
    </main>
  );
}