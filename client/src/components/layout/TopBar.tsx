import { useLocation } from "react-router";
import {
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Menu,
} from "lucide-react";
import AccountMenu from "./AccountMenu";

interface TopBarProps {
  onMenu: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function TopBar({
  onMenu,
  collapsed,
  onToggleCollapse,
}: TopBarProps) {
  const { pathname } = useLocation();
  const crumb = pathname === "/" ? "Dashboard" : pathname;

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
        {collapsed ? <ChevronsRight size={14} /> : <ChevronsLeft size={14} />}
      </button>

      <nav
        className="flex items-center gap-1.5 text-[13px] text-ink-2"
        aria-label="Breadcrumb"
      >
        <span className="hidden sm:inline">Velkor</span>
        <ChevronRight size={13} className="hidden text-ink-3 sm:inline" />
        <span className="truncate font-medium text-ink-1">{crumb}</span>
      </nav>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <AccountMenu />
      </div>
    </header>
  );
}
