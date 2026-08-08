import { ChevronRight, Menu, PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";
import { Link, useLocation } from "react-router";
import AccountMenu from "./AccountMenu";
import { crumbFor } from "@/lib/navigation";

interface TopBarProps {
  onMenu: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenCommand: () => void;
}

export default function TopBar({
  onMenu,
  collapsed,
  onToggleCollapse,
  onOpenCommand,
}: TopBarProps) {
  const crumbs = crumbFor(useLocation().pathname);
  const isMac = /mac/i.test(navigator.platform);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-line bg-canvas/80 px-3 backdrop-blur-[12px] sm:gap-3 sm:px-4 lg:px-6">
      <button
        type="button"
        onClick={onMenu}
        aria-label="Open menu"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-line bg-surface text-ink-2 hover:bg-surface-2 md:hidden"
      >
        <Menu size={16} />
      </button>

      <button
        type="button"
        onClick={onToggleCollapse}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={
          collapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"
        }
        className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-md border border-line bg-surface text-ink-2 transition-colors duration-150 hover:bg-surface-2 hover:text-ink-1 md:inline-flex"
      >
        {collapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
      </button>

      <nav
        className="flex items-center text-[13px] text-ink-2"
        aria-label="Breadcrumb"
      >
        {crumbs.map((crumb, i) => {
          const last = i === crumbs.length - 1;
          const inner = (
            <>
              {i > 0 && (
                <ChevronRight
                  size={13}
                  className="mx-1.5 hidden text-ink-3 sm:inline"
                />
              )}
              {crumb.label}
            </>
          );
          return last ? (
            <span
              key={`${crumb.label}-${i}`}
              className="font-medium text-ink-1"
            >
              {inner}
            </span>
          ) : (
            <Link
              key={`${crumb.label}-${i}`}
              to={crumb.path ?? ""}
              className="hidden transition-colors duration-150 hover:text-ink-1 sm:inline"
            >
              {inner}
            </Link>
          );
        })}
      </nav>

      <div className="mx-auto hidden w-full max-w-sm flex-1 px-2 sm:block">
        <button
          type="button"
          onClick={onOpenCommand}
          className="flex h-9 w-full items-center gap-2 rounded-pill border border-line bg-surface px-3.5 text-[13px] text-ink-3 transition-colors duration-150 hover:border-line-strong hover:text-ink-2"
        >
          <Search size={14} />
          <span className="flex-1 text-left">Search or jump to…</span>
          <kbd className="rounded-sm border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-ink-2">
            {isMac ? "⌘K" : "Ctrl K"}
          </kbd>
        </button>
      </div>
      <div className="flex-1 sm:hidden" />

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={onOpenCommand}
          aria-label="Search"
          className="grid h-9 w-9 place-items-center rounded-md border border-line bg-surface text-ink-2 transition-colors duration-150 hover:bg-surface-2 hover:text-ink-1 sm:hidden"
        >
          <Search size={16} />
        </button>
        <AccountMenu />
      </div>
    </header>
  );
}
