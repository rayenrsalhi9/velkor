import { ArrowDown, ArrowUp, ArrowUpDown, Pencil, Trash2 } from "lucide-react";
import { getInitials } from "@/lib/initials";
import type { Category } from "@/lib/api";

export type CategorySortKey = "name" | "createdAt";

interface CategoriesTableProps {
  categories: Category[];
  sortBy: CategorySortKey;
  order: "asc" | "desc";
  onSort: (key: CategorySortKey) => void;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

function SortHeader({
  label,
  sortKey,
  sortBy,
  order,
  onSort,
}: {
  label: string;
  sortKey: CategorySortKey;
  sortBy: CategorySortKey;
  order: "asc" | "desc";
  onSort: (key: CategorySortKey) => void;
}) {
  const active = sortKey === sortBy;
  return (
    <th className="px-5 py-2.5">
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        aria-label={`Sort by ${label}${active ? `, ${order === "asc" ? "ascending" : "descending"}` : ""}`}
        title={`Sort by ${label}`}
        className="inline-flex items-center gap-1 text-[11px] font-medium tracking-[0.04em] text-ink-3 uppercase transition-colors hover:text-ink-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
      >
        {label}
        {active ? (
          order === "asc" ? (
            <ArrowUp size={12} />
          ) : (
            <ArrowDown size={12} />
          )
        ) : (
          <ArrowUpDown size={12} className="opacity-50" />
        )}
      </button>
    </th>
  );
}

export default function CategoriesTable({
  categories,
  sortBy,
  order,
  onSort,
  onEdit,
  onDelete,
}: CategoriesTableProps) {
  return (
    <div className="v-card overflow-hidden" aria-label="Categories">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="border-b border-line">
              <SortHeader
                label="Category"
                sortKey="name"
                sortBy={sortBy}
                order={order}
                onSort={onSort}
              />
              <th className="px-5 py-2.5 text-[11px] font-medium tracking-[0.04em] text-ink-3 uppercase">
                Description
              </th>
              <SortHeader
                label="Created at"
                sortKey="createdAt"
                sortBy={sortBy}
                order={order}
                onSort={onSort}
              />
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr
                key={category.id}
                className="group border-b border-line last:border-0 hover:bg-surface-2"
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="v-brand-gradient grid h-8 w-8 shrink-0 place-items-center rounded-full text-[10px] font-bold text-white">
                      {getInitials(category.name)}
                    </span>
                    <p className="truncate text-[13px] font-medium text-ink-1">
                      {category.name}
                    </p>
                  </div>
                </td>
                <td className="px-5 py-3 text-[12px] text-ink-3">
                  {category.description || "—"}
                </td>
                <td className="px-5 py-3 text-[12px] text-ink-3">
                  {new Date(category.createdAt).toLocaleString()}
                </td>
                <td className="px-3 py-3">
                  <div className="flex justify-end gap-1 opacity-100 transition-opacity duration-150 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                    <button
                      type="button"
                      onClick={() => onEdit(category)}
                      aria-label={`Edit ${category.name}`}
                      title="Edit category"
                      className="grid h-8 w-8 place-items-center rounded-md text-ink-3 transition-colors duration-150 hover:bg-surface-3 hover:text-ink-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(category)}
                      aria-label={`Delete ${category.name}`}
                      title="Delete category"
                      className="grid h-8 w-8 place-items-center rounded-md text-ink-3 transition-colors duration-150 hover:bg-danger/10 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
