import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Loader2, X } from "lucide-react";
import { Combobox } from "@base-ui/react/combobox";
import { listRoles } from "@/lib/api";
import type { Role } from "@/lib/api";

interface RoleItem {
  value: string;
  label: string;
  role: Role;
}

interface RoleMultiComboboxProps {
  value: string[];
  onChange: (roleIds: string[]) => void;
  id?: string;
}

function mergeRoles(prev: RoleItem[], next: RoleItem[]): RoleItem[] {
  const merged = new Map(prev.map((item) => [item.value, item]));
  for (const item of next) merged.set(item.value, item);
  return [...merged.values()];
}

export default function RoleMultiCombobox({
  value,
  onChange,
  id,
}: RoleMultiComboboxProps) {
  const [items, setItems] = useState<RoleItem[]>([]);
  const [library, setLibrary] = useState<RoleItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const requestId = useRef(0);
  const libraryRef = useRef<RoleItem[]>([]);
  const attemptedIds = useRef(new Set<string>());

  const mergeRolesIntoLibrary = useCallback((next: RoleItem[]) => {
    libraryRef.current = mergeRoles(libraryRef.current, next);
    setLibrary(libraryRef.current);
  }, []);

  useEffect(() => {
    const id = ++requestId.current;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await listRoles({
          q: query.trim() || undefined,
          sortBy: "name",
          order: "asc",
          pageSize: 100,
        });
        if (id === requestId.current) {
          const next = res.items.map((role) => ({
            value: role.id,
            label: role.name,
            role,
          }));
          setItems(next);
          mergeRolesIntoLibrary(next);
        }
      } catch {
        if (id === requestId.current) setItems([]);
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, mergeRolesIntoLibrary]);

  useEffect(() => {
    const missing = value.filter(
      (id) =>
        !libraryRef.current.some((item) => item.value === id) &&
        !attemptedIds.current.has(id),
    );
    if (missing.length === 0) return;
    for (const id of missing) attemptedIds.current.add(id);
    let cancelled = false;
    void (async () => {
      let remaining = missing;
      try {
        for (let page = 2; remaining.length > 0; page++) {
          if (cancelled) return;
          const res = await listRoles({
            sortBy: "name",
            order: "asc",
            page,
            pageSize: 100,
          });
          const mapped = res.items.map((role) => ({
            value: role.id,
            label: role.name,
            role,
          }));
          mergeRolesIntoLibrary(mapped);
          remaining = remaining.filter(
            (id) => !libraryRef.current.some((item) => item.value === id),
          );
        }
      } catch {
        return;
      } finally {
        for (const id of missing) {
          if (!libraryRef.current.some((item) => item.value === id)) {
            attemptedIds.current.delete(id);
          }
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [value, mergeRolesIntoLibrary]);

  const resolvedValue = value
    .map((id) => library.find((item) => item.value === id))
    .filter((item): item is RoleItem => item !== undefined);

  return (
    <Combobox.Root<RoleItem, true>
      items={items}
      multiple
      filter={null}
      inputValue={query}
      onInputValueChange={setQuery}
      isItemEqualToValue={(a, b) => a.value === b.value}
      value={resolvedValue}
      onValueChange={(next) => {
        onChange(next.map((item) => item.value));
      }}
    >
      <div className="relative">
        <Combobox.Chips className="flex min-h-8 w-full flex-wrap items-center gap-1 rounded-lg border border-input bg-transparent px-1 py-1 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
          <Combobox.Value>
            {(selectedValues: RoleItem[]) =>
              selectedValues.map((item) => (
                <Combobox.Chip
                  key={item.value}
                  className="flex items-center gap-1 rounded-md bg-surface-2 px-2 py-0.5 text-[12px] font-medium text-ink-1"
                >
                  {item.label}
                  <Combobox.ChipRemove
                    aria-label={`Remove ${item.label}`}
                    className="grid h-4 w-4 place-items-center rounded text-ink-3 hover:bg-surface-3 hover:text-ink-1"
                  >
                    <X size={12} />
                  </Combobox.ChipRemove>
                </Combobox.Chip>
              ))
            }
          </Combobox.Value>
          <Combobox.Input
            id={id}
            aria-label={id === undefined ? "Select roles" : undefined}
            placeholder={value.length === 0 ? "Search roles…" : ""}
            className="h-6 min-w-0 flex-1 rounded bg-transparent px-1 text-sm text-ink-1 outline-none placeholder:text-muted-foreground"
          />
        </Combobox.Chips>
        <div className="absolute top-1/2 right-1.5 -translate-y-1/2">
            <Combobox.Trigger
              aria-label="Open role list"
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
                No matching roles
              </p>
            </Combobox.Empty>
            <Combobox.List className="flex flex-col gap-0.5 outline-none">
              {(item: RoleItem) => (
                <Combobox.Item
                  key={item.value}
                  value={item}
                  className="group flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left outline-none data-highlighted:bg-surface-2"
                >
                  <span className="grid h-4 w-4 shrink-0 place-items-center rounded border border-line text-ink-1 group-data-[selected]:border-brand group-data-[selected]:bg-brand group-data-[selected]:text-white">
                    <Check size={12} className="opacity-0 group-data-[selected]:opacity-100" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium text-ink-1">
                      {item.label}
                    </span>
                    {item.role.description && (
                      <span className="block truncate text-[11px] text-ink-3">
                        {item.role.description}
                      </span>
                    )}
                  </span>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}