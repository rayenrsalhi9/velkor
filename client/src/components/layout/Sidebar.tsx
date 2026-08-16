import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { CancelIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/cn";
import LogoGlyph from "@/components/LogoGlyph";
import { getInitials } from "@/lib/initials";
import { useAuth } from "@/context/auth";
import { NAV_ITEMS, hasClaim, type NavIcon } from "@/lib/navigation";

export interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function NavLink({
  to,
  icon,
  label,
  collapsed,
  onNavigate,
}: {
  to: string;
  icon: NavIcon;
  label: string;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const { pathname } = useLocation();
  const active = pathname === to;
  return (
    <li>
      <Link
        to={to}
        onClick={onNavigate}
        title={collapsed ? label : undefined}
        aria-current={active ? "page" : undefined}
        className={cn(
          "relative flex h-10 items-center gap-3 rounded-md px-3 text-[13.5px] font-medium transition-colors duration-150",
          collapsed && "justify-center px-0",
          active
            ? "bg-brand-soft text-brand"
            : "text-ink-2 hover:bg-surface-2 hover:text-ink-1",
        )}
      >
        {active && (
          <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand" />
        )}
        <HugeiconsIcon icon={icon} size={18} className="relative z-10 shrink-0" />
        {!collapsed && (
          <span className="relative z-10 truncate">{label}</span>
        )}
      </Link>
    </li>
  );
}

function SidebarBody({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const { user } = useAuth();
  const claims = user?.claims ?? [];
  const dashboard = NAV_ITEMS.find((item) => item.path === "/")!;
  const sections = [
    {
      title: "Documents",
      items: NAV_ITEMS.filter(
        (item) =>
          item.path.startsWith("/documents") && hasClaim(claims, item.claim),
      ),
    },
    {
      title: "Administration",
      items: NAV_ITEMS.filter(
        (item) =>
          (item.path === "/users" || item.path === "/roles") &&
          hasClaim(claims, item.claim),
      ),
    },
  ].filter((section) => section.items.length > 0);

  return (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          "flex h-16 shrink-0 items-center gap-2.5 border-b border-line px-4",
          collapsed && "justify-center px-0",
        )}
      >
        <LogoGlyph className="size-8 shrink-0" />
        {!collapsed && (
          <span className="truncate text-[15px] font-semibold tracking-[-0.01em] text-ink-1">
            Velkor
          </span>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-1">
          <NavLink
            to={dashboard.path}
            icon={dashboard.icon}
            label={dashboard.label}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        </ul>

        {sections.map((section) => (
          <div key={section.title}>
            {collapsed ? (
              <div className="mt-4 border-t border-line" />
            ) : (
              <p className="mb-1.5 mt-6 px-3 text-[10.5px] font-semibold tracking-[0.09em] text-ink-3 uppercase">
                {section.title}
              </p>
            )}
            <ul className="flex flex-col gap-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  icon={item.icon}
                  label={item.label}
                  collapsed={collapsed}
                  onNavigate={onNavigate}
                />
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-line p-3">
        <div
          className={cn(
            "flex items-center gap-2.5 px-1 py-1",
            collapsed && "justify-center px-0",
          )}
        >
          <span className="v-brand-gradient grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold text-white ring-2 ring-brand-soft">
            {getInitials(user?.fullName ?? "")}
          </span>
          {!collapsed && (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium text-ink-1">
                {user?.fullName ?? "Account"}
              </span>
              <span className="block text-[11px] text-ink-3">
                {user?.email}
              </span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({
  collapsed,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const drawerRef = useRef<HTMLElement | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(mobileOpen);
  const [drawerClosing, setDrawerClosing] = useState(false);

  useEffect(() => {
    if (mobileOpen) {
      setDrawerVisible(true);
      setDrawerClosing(false);
      return;
    }
    if (!drawerVisible) return;
    setDrawerClosing(true);
    const timer = window.setTimeout(() => {
      setDrawerVisible(false);
      setDrawerClosing(false);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [mobileOpen, drawerVisible]);

  useEffect(() => {
    if (!mobileOpen || !drawerVisible) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onMobileClose();
        return;
      }
      if (event.key !== "Tab") return;
      const nodes = Array.from(
        drawerRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
      if (nodes.length === 0) {
        event.preventDefault();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      const inDrawer = active && drawerRef.current?.contains(active);
      if (event.shiftKey && (active === first || !inDrawer)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !inDrawer)) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    const previousFocus = document.activeElement as HTMLElement | null;
    drawerRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus();
    };
  }, [mobileOpen, drawerVisible, onMobileClose]);

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden border-r border-line bg-surface transition-[width] duration-[250ms] ease-out md:block",
          collapsed ? "w-[68px]" : "w-[264px]",
        )}
      >
        <SidebarBody collapsed={collapsed} />
      </aside>

      {drawerVisible && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className={cn(
              "absolute inset-0 bg-black/40",
              drawerClosing
                ? "animate-out fade-out animation-duration-200"
                : "animate-in fade-in animation-duration-200",
            )}
            onClick={onMobileClose}
            aria-hidden="true"
          />
          <aside
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            tabIndex={-1}
            className={cn(
              "absolute inset-y-0 left-0 flex w-[264px] max-w-[80vw] flex-col bg-surface shadow-pop",
              drawerClosing
                ? "animate-out slide-out-to-left animation-duration-300"
                : "animate-in slide-in-from-left animation-duration-300",
            )}
          >
            <button
              type="button"
              onClick={onMobileClose}
              aria-label="Close menu"
              className="absolute right-3 top-4 z-10 grid h-8 w-8 place-items-center rounded-md text-ink-3 hover:bg-surface-2 hover:text-ink-1"
            >
              <HugeiconsIcon icon={CancelIcon} size={16} />
            </button>
            <SidebarBody collapsed={false} onNavigate={onMobileClose} />
          </aside>
        </div>
      )}
    </>
  );
}
