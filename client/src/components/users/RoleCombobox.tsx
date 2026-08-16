import { useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ChevronDownIcon, LoadingIcon } from "@hugeicons/core-free-icons";
import { Combobox } from "@base-ui/react/combobox";
import { listRoles } from "@/lib/api";
import type { Role } from "@/lib/api";

interface RoleItem {
  value: string;
  label: string;
  role: Role;
}

interface RoleComboboxProps {
  value: string;
  initialRoleName?: string;
  onChange: (roleId: string) => void;
}

export default function RoleCombobox({
  value,
  initialRoleName,
  onChange,
}: RoleComboboxProps) {
  const [items, setItems] = useState<RoleItem[]>([]);
  const [query, setQuery] = useState(initialRoleName ?? "");
  const [loading, setLoading] = useState(false);
  const [requestState, setRequestState] = useState<
    "idle" | "pending" | "error" | "success"
  >("idle");
  const requestId = useRef(0);
  const autoSelected = useRef(false);

  useEffect(() => {
    const id = ++requestId.current;
    const timer = setTimeout(async () => {
      setLoading(true);
      setRequestState("pending");
      try {
        const res = await listRoles({
          q: query.trim() || undefined,
          sortBy: "name",
          order: "asc",
          pageSize: 10,
        });
        if (id === requestId.current) {
          setItems(
            res.items.map((role) => ({
              value: role.id,
              label: role.name,
              role,
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
    if (value || !initialRoleName || autoSelected.current) return;
    const match = items.find(
      (item) => item.label.toLowerCase() === initialRoleName.toLowerCase(),
    );
    if (match) {
      autoSelected.current = true;
      onChange(match.role.id);
    }
  }, [items, value, initialRoleName, onChange]);

  useEffect(() => {
    if (requestState !== "success") return;
    if (value && !items.some((item) => item.value === value)) {
      onChange("");
    }
  }, [items, value, requestState, onChange]);

  return (
    <Combobox.Root<RoleItem>
      items={items}
      filter={null}
      inputValue={query}
      onInputValueChange={setQuery}
      value={items.find((item) => item.value === value) ?? null}
      onValueChange={(item) => {
        if (item) onChange(item.role.id);
      }}
    >
      <div className="relative">
        <Combobox.Input
          id="user-role"
          placeholder="Search roles…"
          aria-label="Select role"
          className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2 pr-8 text-sm text-ink-1 outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <div className="absolute top-1/2 right-1.5 -translate-y-1/2">
          <Combobox.Trigger
            aria-label="Open role list"
            className="grid h-6 w-6 place-items-center rounded text-ink-3 transition-colors hover:text-ink-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            {loading ? (
              <HugeiconsIcon icon={LoadingIcon} size={14} className="animate-spin" />
            ) : (
              <HugeiconsIcon icon={ChevronDownIcon} size={14} />
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
                  className="flex cursor-pointer flex-col gap-0.5 rounded-md px-2.5 py-1.5 text-left outline-none data-highlighted:bg-surface-2"
                >
                  <span className="text-[13px] font-medium text-ink-1">
                    {item.label}
                  </span>
                  {item.role.description && (
                    <span className="truncate text-[11px] text-ink-3">
                      {item.role.description}
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
