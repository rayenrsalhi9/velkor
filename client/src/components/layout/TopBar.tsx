import { ChevronsLeft, ChevronsRight, Menu } from "lucide-react";
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
  // ponytail: breadcrumb removed until nav links land with a humanized label.

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

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <AccountMenu />
      </div>
    </header>
  );
}
