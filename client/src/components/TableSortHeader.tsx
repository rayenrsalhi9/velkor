import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, ArrowUp01Icon, ArrowUpDownIcon } from "@hugeicons/core-free-icons";

export default function TableSortHeader<K extends string>({
  label,
  sortKey,
  sortBy,
  order,
  onSort,
}: {
  label: string;
  sortKey: K;
  sortBy: K;
  order: "asc" | "desc";
  onSort: (key: K) => void;
}) {
  const active = sortKey === sortBy;
  return (
    <th className="px-5 py-2.5">
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        aria-label={`Sort by ${label}${active ? `, ${order === "asc" ? "ascending" : "descending"}` : ""}`}
        title={`Sort by ${label}`}
        className="inline-flex items-center gap-1 text-[11px] font-medium tracking-[0.04em] text-ink-3 uppercase transition-colors hover:text-ink-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface-2"
      >
        {label}
        {active ? (
          order === "asc" ? (
            <HugeiconsIcon icon={ArrowUp01Icon} size={12} />
          ) : (
            <HugeiconsIcon icon={ArrowDown01Icon} size={12} />
          )
        ) : (
          <HugeiconsIcon icon={ArrowUpDownIcon} size={12} className="opacity-50" />
        )}
      </button>
    </th>
  );
}