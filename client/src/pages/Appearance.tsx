import { HugeiconsIcon } from "@hugeicons/react";
import { CheckIcon, Moon01Icon, Sun01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/cn";
import { useTheme, type Theme } from "@/context/theme";

interface Tokens {
  bg: string;
  surface: string;
  surface2: string;
  border: string;
  ink: string;
  ink3: string;
  brand: string;
}

const LIGHT: Tokens = {
  bg: "#f5f5f7",
  surface: "#ffffff",
  surface2: "#e9e9ec",
  border: "rgba(29, 29, 31, 0.1)",
  ink: "#1d1d1f",
  ink3: "#86868b",
  brand: "#0071e3",
};

const DARK: Tokens = {
  bg: "#161617",
  surface: "#1d1d1f",
  surface2: "#2c2c2e",
  border: "rgba(255, 255, 255, 0.12)",
  ink: "#f5f5f7",
  ink3: "#86868b",
  brand: "#2997ff",
};

const CHART_PATH =
  "M0 18 L15 15 L30 17 L45 10 L60 13 L75 7 L90 9 L105 4 L120 6";

/** Tiny code-drawn workspace preview, painted in the *target* theme's tokens. */
function MiniPreview({ t }: { t: Tokens }) {
  return (
    <div
      className="flex h-full w-full"
      style={{ background: t.bg }}
      aria-hidden="true"
    >
      <div
        className="flex w-[24px] shrink-0 flex-col items-center gap-1.5 border-r py-2"
        style={{ borderColor: t.border, background: t.surface }}
      >
        <span
          className="h-2.5 w-2.5 rounded-[3px]"
          style={{ background: t.brand }}
        />
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-3 rounded-full"
            style={{ background: i === 0 ? t.brand : t.surface2 }}
          />
        ))}
      </div>
      <div className="min-w-0 flex-1 p-2">
        <span
          className="block h-1.5 w-10 rounded-full"
          style={{ background: t.ink3, opacity: 0.55 }}
        />
        <div className="mt-1.5 grid grid-cols-3 gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-[4px] border p-1"
              style={{ background: t.surface, borderColor: t.border }}
            >
              <span
                className="block h-1 w-4 rounded-full"
                style={{ background: t.ink3, opacity: 0.5 }}
              />
              <span
                className="mt-1 block h-1.5 w-5 rounded-full"
                style={{ background: t.ink, opacity: 0.85 }}
              />
            </div>
          ))}
        </div>
        <div
          className="mt-1.5 rounded-[4px] border p-1"
          style={{ background: t.surface, borderColor: t.border }}
        >
          <svg
            viewBox="0 0 120 28"
            className="block h-7 w-full"
            preserveAspectRatio="none"
          >
            <path
              d={`${CHART_PATH} L120 28 L0 28 Z`}
              fill={t.brand}
              opacity={0.14}
              stroke="none"
            />
            <path
              d={CHART_PATH}
              fill="none"
              stroke={t.brand}
              strokeWidth={2}
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

const MODES: ReadonlyArray<{
  id: Theme;
  label: string;
  caption: string;
  icon: typeof Sun01Icon;
}> = [
  { id: "light", label: "Light", caption: "Crisp and bright", icon: Sun01Icon },
  { id: "dark", label: "Dark", caption: "Easy on the eyes", icon: Moon01Icon },
];

function ModeCard({ mode }: { mode: (typeof MODES)[number] }) {
  const { theme, setTheme } = useTheme();
  const selected = theme === mode.id;
  const icon = mode.icon;

  return (
    <button
      type="button"
      onClick={() => setTheme(mode.id)}
      aria-label={mode.label}
      aria-pressed={selected}
      className="group w-[180px] max-w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
    >
      <div
        className={cn(
          "relative h-[110px] overflow-hidden rounded-md border transition-colors duration-150",
          selected
            ? "border-brand shadow-[0_0_0_2px_var(--brand)]"
            : "border-line group-hover:border-line-strong",
        )}
      >
        <MiniPreview t={mode.id === "light" ? LIGHT : DARK} />
        {selected && (
          <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-brand-fill text-white shadow-pop">
            <HugeiconsIcon icon={CheckIcon} size={12} strokeWidth={3} />
          </span>
        )}
      </div>
      <div className="mt-2">
        <div className="flex items-center gap-1.5">
          <HugeiconsIcon
            icon={icon}
            size={14}
            className={selected ? "text-brand" : "text-ink-3"}
          />
          <span
            className={cn(
              "text-[13px] font-medium",
              selected ? "text-ink-1" : "text-ink-2",
            )}
          >
            {mode.label}
          </span>
        </div>
        <div className="mt-0.5 pl-5 text-[11px] text-ink-3">
          {mode.caption}
        </div>
      </div>
    </button>
  );
}

export default function AppearancePage() {
  return (
    <div className="space-y-5">
      <section className="v-card p-5">
        <h2 className="text-[16px] font-semibold leading-6 tracking-[-0.01em] text-ink-1">
          Appearance
        </h2>
        <p className="mt-0.5 text-[12px] leading-4 text-ink-3">
          Choose how Velkor looks. Applies instantly across the workspace.
        </p>

        <div className="mt-4 flex flex-wrap gap-4">
          {MODES.map((mode) => (
            <ModeCard key={mode.id} mode={mode} />
          ))}
        </div>
      </section>
    </div>
  );
}
