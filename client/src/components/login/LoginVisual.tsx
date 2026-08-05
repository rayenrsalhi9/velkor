import { useEffect, useRef, useState } from "react";
import { FileText, MessageSquare, Search, Settings, Users } from "lucide-react";
import LogoGlyph from "@/components/LogoGlyph";

/* ------------------------------- dot grid -------------------------------- */

/** Faint 1px dot grid, 24px pitch. */
export function DotGrid() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage:
          "radial-gradient(circle, var(--text-1) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
        opacity: 0.05,
      }}
    />
  );
}

/* -------------------------------- helpers -------------------------------- */

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg,#2563EB,#3B82F6)",
  "linear-gradient(135deg,#22D3EE,#2563EB)",
  "linear-gradient(135deg,#0EA968,#22D3EE)",
  "linear-gradient(135deg,#34D399,#0EA968)",
  "linear-gradient(135deg,#F59E0B,#F97316)",
  "linear-gradient(135deg,#3B82F6,#22D3EE)",
];

function avatarGradient(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length];
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/* ------------------------------ stat ticker ------------------------------ */

const TICKER_ITEMS = [
  "Q3 plan approved",
  "New doc: Brand guidelines",
  "Maya joined #design",
  "Budget v2 uploaded",
  "Policy review completed",
  "12 min avg. review",
] as const;

function TickerRow() {
  return (
    <div className="flex shrink-0 items-center">
      {TICKER_ITEMS.map((it) => (
        <span key={it} className="flex items-center">
          <span className="tnum font-mono text-[12px] whitespace-nowrap text-ink-2">
            {it}
          </span>
          <span
            className="mx-6 h-1 w-1 shrink-0 rounded-full bg-brand"
            aria-hidden="true"
          />
        </span>
      ))}
    </div>
  );
}

/** Horizontally scrolling mono activity strip — 20s linear loop. */
export function Ticker({ className }: { className?: string }) {
  const reduced = useReducedMotion();
  return (
    <div
      className={
        "overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)] " +
        (className ?? "")
      }
    >
      <div className={reduced ? "flex w-max" : "v-marquee flex w-max"}>
        <TickerRow />
        {!reduced && <TickerRow />}
      </div>
    </div>
  );
}

/* ------------------------------ mini app mock ---------------------------- */

function Kpi({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta?: string;
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-md border border-line bg-surface-2/50 p-2">
      <div className="min-w-0">
        <div className="v-label truncate">{label}</div>
        <div className="tnum mt-0.5 truncate text-[15px] leading-5 font-semibold text-ink-1">
          {value}
        </div>
      </div>
      {delta && (
        <span className="tnum text-[10px] font-medium text-success">
          ▲{delta}
        </span>
      )}
    </div>
  );
}

const DOCS = [
  {
    title: "Q3 Strategic Plan",
    meta: "Updated 2m ago · 4.2 MB",
    status: "Approved",
    tone: "bg-[color-mix(in_srgb,var(--success)_12%,transparent)] text-success",
  },
  {
    title: "Onboarding Handbook",
    meta: "Updated 1h ago · 12.8 MB",
    status: "In review",
    tone: "bg-[color-mix(in_srgb,var(--warning)_12%,transparent)] text-warning",
  },
  {
    title: "Security Policy v4",
    meta: "Updated 3h ago · 2.1 MB",
    status: "Draft",
    tone: "bg-surface-2 text-ink-2",
  },
] as const;

function DocRow({
  title,
  meta,
  status,
  tone,
}: {
  title: string;
  meta: string;
  status: string;
  tone: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md px-1.5 py-1">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-brand-soft text-brand">
        <FileText size={13} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[11px] font-medium text-ink-1">
          {title}
        </div>
        <div className="truncate text-[9px] text-ink-3">{meta}</div>
      </div>
      <span
        className={
          "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold " + tone
        }
      >
        {status}
      </span>
    </div>
  );
}

const CHAT_POOL = [
  {
    name: "Sara Mansour",
    text: "Uploaded the new brand guidelines",
    time: "12:04",
  },
  { name: "Adam Bouzid", text: "Approved the Q3 budget doc", time: "12:02" },
  {
    name: "Yasmine Khelifi",
    text: "Can you review the launch deck?",
    time: "11:58",
  },
  { name: "Karim Benali", text: "Meeting moved to 2 PM", time: "11:49" },
] as const;

function ChatBubble({
  m,
  animate,
}: {
  m: (typeof CHAT_POOL)[number];
  animate: boolean;
}) {
  return (
    <div className={"flex items-start gap-2 " + (animate ? "v-msg-in" : "")}>
      <span
        className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[8px] font-semibold text-white"
        style={{ background: avatarGradient(m.name) }}
      >
        {initials(m.name)}
      </span>
      <div className="min-w-0">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[9px] font-medium text-ink-1">{m.name}</span>
          <span className="font-mono text-[8px] text-ink-3">{m.time}</span>
        </div>
        <div className="mt-0.5 w-fit max-w-full rounded-lg rounded-tl-sm bg-surface-2 px-2.5 py-1.5 text-[10px] leading-4 text-ink-1">
          {m.text}
        </div>
      </div>
    </div>
  );
}

/** The miniature live app — icon rail, KPI strip, documents + chat panes. */
function MockCard() {
  const [messages, setMessages] = useState([...CHAT_POOL].slice(0, 3));
  const nextRef = useRef(3);

  useEffect(() => {
    const id = window.setInterval(() => {
      setMessages((prev) =>
        [CHAT_POOL[nextRef.current % CHAT_POOL.length], ...prev].slice(0, 3),
      );
      nextRef.current += 1;
    }, 4200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      className="v-card shadow-pop flex h-[400px] w-[640px] max-w-full overflow-hidden"
      style={{ borderRadius: 14 }}
    >
      {/* icon rail */}
      <div className="flex w-12 shrink-0 flex-col items-center gap-2.5 border-r border-line bg-surface-2/40 py-3">
        <LogoGlyph className="h-5 w-5" />
        {[FileText, MessageSquare, Users, Search, Settings].map((Icon, i) => (
          <span
            key={i}
            className={
              "grid h-7 w-7 place-items-center rounded-md " +
              (i === 0 ? "bg-brand-soft text-brand" : "text-ink-3")
            }
          >
            <Icon size={13} />
          </span>
        ))}
      </div>

      {/* main */}
      <div className="flex min-w-0 flex-1 flex-col p-4">
        <div className="flex items-center justify-between">
          <div className="text-[13px] font-semibold tracking-[-0.01em] text-ink-1">
            Workspace
          </div>
          <span className="flex items-center gap-1.5 rounded-pill bg-[color-mix(in_srgb,var(--success)_12%,transparent)] px-2 py-0.5 text-[9px] font-semibold tracking-[0.06em] text-success">
            <span className="v-live-dot" style={{ width: 5, height: 5 }} />
            LIVE
          </span>
        </div>

        <div className="mt-3 flex gap-2">
          <Kpi label="Documents" value="2,340" delta="8%" />
          <Kpi label="Online now" value="187" />
          <Kpi label="Messages today" value="412" delta="12%" />
        </div>

        <div className="mt-3 grid min-h-0 flex-1 grid-cols-5 gap-2.5">
          {/* documents */}
          <div className="col-span-3 flex min-h-0 flex-col rounded-md border border-line p-2">
            <div className="flex items-center justify-between px-1 pb-1">
              <span className="v-label">Recent documents</span>
              <span className="text-[9px] text-ink-3">6 open</span>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
              {DOCS.map((d) => (
                <DocRow key={d.title} {...d} />
              ))}
            </div>
          </div>

          {/* chat */}
          <div className="col-span-2 flex min-h-0 flex-col rounded-md border border-line p-2">
            <div className="flex items-center justify-between px-1 pb-1">
              <span className="v-label">Team chat</span>
              <span className="flex items-center gap-1 text-[9px] text-ink-3">
                <span className="v-live-dot" style={{ width: 5, height: 5 }} />
                #intranet
              </span>
            </div>
            <div className="flex min-h-0 flex-1 flex-col justify-end gap-2 overflow-hidden">
              {messages.map((m, i) => (
                <ChatBubble key={m.name + m.time} m={m} animate={i === 0} />
              ))}
              <div className="flex items-center gap-1.5 text-[9px] text-ink-3">
                <span className="v-live-dot" style={{ width: 4, height: 4 }} />
                Sara is typing…
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ login visual ----------------------------- */

/**
 * Live product diorama — the mini workspace card (cursor-parallax tilt +
 * perpetual float), the activity ticker, and the rotating testimonial.
 */
export default function LoginVisual() {
  const reduced = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduced || !wrapRef.current || !cardRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    cardRef.current.style.transform = `perspective(1100px) rotateX(${(-py * 6).toFixed(2)}deg) rotateY(${(px * 6).toFixed(2)}deg) rotate(-1.5deg)`;
  };

  const onPointerLeave = () => {
    if (cardRef.current)
      cardRef.current.style.transform =
        "perspective(1100px) rotateX(0deg) rotateY(0deg) rotate(-1.5deg)";
  };

  return (
    <div className="relative flex w-full flex-1 flex-col items-center justify-center gap-6">
      <div
        ref={wrapRef}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        className="grid w-full place-items-center px-8 py-6"
      >
        <div className="v-rise" style={{ animationDelay: "200ms" }}>
          <div className="v-float">
            <div
              ref={cardRef}
              style={{
                transform:
                  "perspective(1100px) rotateX(0deg) rotateY(0deg) rotate(-1.5deg)",
                transition: "transform 0.35s cubic-bezier(0.16,1,0.3,1)",
              }}
            >
              <MockCard />
            </div>
          </div>
        </div>
      </div>

      <div
        className="v-rise w-[640px] max-w-[85%]"
        style={{ animationDelay: "400ms" }}
      >
        <Ticker />
      </div>
    </div>
  );
}
