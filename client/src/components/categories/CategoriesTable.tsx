import { HugeiconsIcon } from "@hugeicons/react";
import { Edit02Icon, Delete02Icon, FolderTreeIcon } from "@hugeicons/core-free-icons";
import TableSortHeader from "@/components/TableSortHeader";
import type { Category } from "@/lib/api";

export type CategorySortKey = "name" | "createdAt";

interface CategoriesTableProps {
  categories: Category[];
  sortBy: CategorySortKey;
  order: "asc" | "desc";
  onSort: (key: CategorySortKey) => void;
  onEdit?: (category: Category) => void;
  onDelete?: (category: Category) => void;
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
    <div className="v-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left" aria-label="Categories">
          <thead>
            <tr className="bg-surface-2 border-b border-line">
              <TableSortHeader<CategorySortKey>
                label="Category"
                sortKey="name"
                sortBy={sortBy}
                order={order}
                onSort={onSort}
              />
              <th className="px-5 py-2.5 text-[11px] font-medium tracking-[0.04em] text-ink-3 uppercase">
                Description
              </th>
              <TableSortHeader<CategorySortKey>
                label="Created at"
                sortKey="createdAt"
                sortBy={sortBy}
                order={order}
                onSort={onSort}
              />
              <th scope="col" className="px-3 py-2.5">
                <span className="sr-only">Actions</span>
              </th>
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
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-line bg-surface-2 text-ink-2">
                      <HugeiconsIcon icon={FolderTreeIcon} size={14} />
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
                    {onEdit && (
                      <button
                        type="button"
                        onClick={() => onEdit(category)}
                        aria-label={`Edit ${category.name}`}
                        title="Edit category"
                        className="grid h-8 w-8 place-items-center rounded-md text-ink-3 transition-colors duration-150 hover:bg-surface-3 hover:text-ink-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                      >
                        <HugeiconsIcon icon={Edit02Icon} size={14} />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(category)}
                        aria-label={`Delete ${category.name}`}
                        title="Delete category"
                        className="grid h-8 w-8 place-items-center rounded-md text-ink-3 transition-colors duration-150 hover:bg-danger/10 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                      >
                        <HugeiconsIcon icon={Delete02Icon} size={14} />
                      </button>
                    )}
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