import { HugeiconsIcon } from "@hugeicons/react";
import { SearchIcon, RefreshIcon } from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";

interface ListToolbarProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  searchLabel: string;
  refreshLabel: string;
  onRefresh: () => void;
}

export default function ListToolbar({
  value,
  onValueChange,
  placeholder,
  searchLabel,
  refreshLabel,
  onRefresh,
}: ListToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="relative w-full max-w-xs">
        <HugeiconsIcon
          icon={SearchIcon}
          size={14}
          className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-ink-3"
        />
        <Input
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={placeholder}
          aria-label={searchLabel}
          className="pl-8"
        />
      </div>
      <button
        type="button"
        onClick={onRefresh}
        aria-label={refreshLabel}
        title="Refresh"
        className="grid h-8 w-8 place-items-center rounded-md border border-line bg-surface text-ink-2 transition-colors duration-150 hover:bg-surface-2 hover:text-ink-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
      >
        <HugeiconsIcon icon={RefreshIcon} size={14} />
      </button>
    </div>
  );
}