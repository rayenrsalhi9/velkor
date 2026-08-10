import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/theme";

/**
 * Sun/moon swap toggle. Keyed remount drives the `.v-theme-swap` spin-in,
 * so no animation library is needed.
 */
export default function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className={
        "grid h-9 w-9 shrink-0 place-items-center rounded-md border border-line bg-surface text-ink-2 transition-colors duration-150 hover:bg-surface-2 hover:text-ink-1 " +
        (className ?? "")
      }
    >
      <span
        key={dark ? "moon" : "sun"}
        className="v-theme-swap grid place-items-center"
      >
        {dark ? <Moon size={16} /> : <Sun size={16} />}
      </span>
    </button>
  );
}
