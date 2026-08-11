import { useEffect, useRef, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { Combobox } from "@base-ui/react/combobox";
import { listCategories } from "@/lib/api";
import type { Category } from "@/lib/api";

interface CategoryItem {
  value: string;
  label: string;
  category: Category;
}

interface CategoryComboboxProps {
  value: string;
  onChange: (categoryId: string) => void;
}

export default function CategoryCombobox({
  value,
  onChange,
}: CategoryComboboxProps) {
  const [items, setItems] = useState<CategoryItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [requestState, setRequestState] = useState<
    "idle" | "pending" | "error" | "success"
  >("idle");
  const requestId = useRef(0);

  useEffect(() => {
    const id = ++requestId.current;
    const timer = setTimeout(async () => {
      setLoading(true);
      setRequestState("pending");
      try {
        const res = await listCategories({
          q: query.trim() || undefined,
          sortBy: "name",
          order: "asc",
          pageSize: 10,
        });
        if (id === requestId.current) {
          setItems(
            res.items.map((category) => ({
              value: category.id,
              label: category.name,
              category,
            })),
          );
          setRequestState("success");
        }
      } catch {
        if (id === requestId.current) {
          setItems([]);
          setRequestState("error");
        }
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (requestState !== "success") return;
    if (value && !items.some((item) => item.value === value)) {
      onChange("");
    }
  }, [items, value, requestState, onChange]);

  return (
    <Combobox.Root<CategoryItem>
      items={items}
      filter={null}
      inputValue={query}
      onInputValueChange={setQuery}
      value={items.find((item) => item.value === value) ?? null}
      onValueChange={(item) => {
        if (item) onChange(item.category.id);
      }}
    >
      <div className="relative">
        <Combobox.Input
          aria-label="Select category"
          placeholder="Search categories…"
          className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2 pr-8 text-sm text-ink-1 outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <div className="absolute top-1/2 right-1.5 -translate-y-1/2">
          <Combobox.Trigger
            aria-label="Open category list"
            className="grid h-6 w-6 place-items-center rounded text-ink-3 transition-colors hover:text-ink-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <ChevronDown size={14} />
            )}
          </Combobox.Trigger>
        </div>
      </div>

      <Combobox.Portal>
        <Combobox.Positioner sideOffset={4} className="z-50 outline-none">
          <Combobox.Popup className="max-h-60 w-[var(--anchor-width)] overflow-y-auto rounded-lg border border-line bg-surface p-1 shadow-lg">
            <Combobox.Empty>
              <p className="px-2.5 py-2 text-[12px] text-ink-3">
                No matching categories
              </p>
            </Combobox.Empty>
            <Combobox.List className="flex flex-col gap-0.5 outline-none">
              {(item: CategoryItem) => (
                <Combobox.Item
                  key={item.value}
                  value={item}
                  className="flex cursor-pointer flex-col gap-0.5 rounded-md px-2.5 py-1.5 text-left outline-none data-highlighted:bg-surface-2"
                >
                  <span className="text-[13px] font-medium text-ink-1">
                    {item.label}
                  </span>
                  {item.category.description && (
                    <span className="truncate text-[11px] text-ink-3">
                      {item.category.description}
                    </span>
                  )}
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}