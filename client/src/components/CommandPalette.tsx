import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Search } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { NAV_ITEMS } from "@/lib/navigation";
import { cn } from "@/lib/cn";

export default function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setHighlight(0);
    }
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? NAV_ITEMS.filter((item) =>
          item.label.toLowerCase().includes(q),
        )
      : NAV_ITEMS;
  }, [query]);

  const go = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        aria-label="Search pages"
        initialFocus={inputRef}
        className="max-w-md gap-0 overflow-hidden p-0 sm:max-w-md"
      >
        <div className="flex items-center gap-2.5 border-b border-line px-3.5">
          <Search size={16} className="shrink-0 text-ink-3" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setHighlight(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setHighlight((h) => Math.min(h + 1, results.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setHighlight((h) => Math.max(h - 1, 0));
              } else if (e.key === "Enter") {
                const item = results[highlight];
                if (item) go(item.path);
              }
            }}
            placeholder="Search or jump to…"
            className="h-12 w-full bg-transparent text-[14px] text-ink-1 outline-none placeholder:text-ink-3"
          />
        </div>
        <ul className="max-h-[320px] overflow-y-auto p-2">
          {results.length === 0 && (
            <li className="px-2 py-6 text-center text-[13px] text-ink-3">
              No results found.
            </li>
          )}
          {results.map((item, i) => (
            <li key={item.path}>
              <button
                type="button"
                data-highlighted={i === highlight ? "" : undefined}
                onClick={() => go(item.path)}
                onMouseEnter={() => setHighlight(i)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13.5px] font-medium transition-colors duration-150",
                  i === highlight
                    ? "bg-brand-soft text-brand"
                    : "text-ink-2",
                )}
              >
                <item.icon size={16} className="shrink-0" />
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
