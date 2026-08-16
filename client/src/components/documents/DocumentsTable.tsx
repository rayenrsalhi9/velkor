import { HugeiconsIcon } from "@hugeicons/react";
import { Download01Icon, EyeIcon, File01Icon, Edit02Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import TableSortHeader from "@/components/TableSortHeader";
import type { VelkorDocument } from "@/lib/api";

export type DocumentSortKey = "displayName" | "createdAt";

interface DocumentsTableProps {
  documents: VelkorDocument[];
  sortBy: DocumentSortKey;
  order: "asc" | "desc";
  onSort: (key: DocumentSortKey) => void;
  onPreview: (document: VelkorDocument) => void;
  onDownload: (document: VelkorDocument) => void;
  onEdit?: (document: VelkorDocument) => void;
  onDelete?: (document: VelkorDocument) => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = units[0];
  for (let i = 1; i < units.length && value >= 1024; i++) {
    value /= 1024;
    unit = units[i]!;
  }
  const rounded = value.toFixed(value >= 10 ? 0 : 1);
  return `${rounded.replace(/\.0$/, "")} ${unit}`;
}

export default function DocumentsTable({
  documents,
  sortBy,
  order,
  onSort,
  onPreview,
  onDownload,
  onEdit,
  onDelete,
}: DocumentsTableProps) {
  return (
    <div className="v-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left" aria-label="Documents">
          <thead>
            <tr className="bg-surface-2 border-b border-line">
              <TableSortHeader
                label="Name"
                sortKey="displayName"
                sortBy={sortBy}
                order={order}
                onSort={onSort}
              />
              <th className="px-5 py-2.5 text-[11px] font-medium tracking-[0.04em] text-ink-3 uppercase">
                Category
              </th>
              <th className="px-5 py-2.5 text-[11px] font-medium tracking-[0.04em] text-ink-3 uppercase">
                Uploaded by
              </th>
              <th className="px-5 py-2.5 text-[11px] font-medium tracking-[0.04em] text-ink-3 uppercase">
                Size
              </th>
              <TableSortHeader
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
            {documents.map((doc) => (
              <tr
                key={doc.id}
                className="group border-b border-line last:border-0 hover:bg-surface-2"
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-line bg-surface-2 text-ink-2">
                      <HugeiconsIcon icon={File01Icon} size={14} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-ink-1">
                        {doc.displayName}
                      </p>
                      <p className="truncate text-[11px] text-ink-3">
                        {doc.fileName}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-[12px] text-ink-3">
                  {doc.categoryName || "—"}
                </td>
                <td className="px-5 py-3 text-[12px] text-ink-3">
                  {doc.uploadedByName}
                </td>
                <td className="px-5 py-3 text-[12px] text-ink-3">
                  {formatBytes(doc.sizeBytes)}
                </td>
                <td className="px-5 py-3 text-[12px] text-ink-3">
                  {new Date(doc.createdAt).toLocaleString()}
                </td>
                <td className="px-3 py-3">
                  <div className="flex justify-end gap-1 opacity-100 transition-opacity duration-150 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                    <button
                      type="button"
                      onClick={() => onPreview(doc)}
                      aria-label={`Preview ${doc.displayName}`}
                      title="Preview"
                      className="grid h-8 w-8 place-items-center rounded-md text-ink-3 transition-colors duration-150 hover:bg-surface-3 hover:text-ink-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                    >
                      <HugeiconsIcon icon={EyeIcon} size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDownload(doc)}
                      aria-label={`Download ${doc.displayName}`}
                      title="Download"
                      className="grid h-8 w-8 place-items-center rounded-md text-ink-3 transition-colors duration-150 hover:bg-surface-3 hover:text-ink-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                    >
                      <HugeiconsIcon icon={Download01Icon} size={14} />
                    </button>
                    {onEdit && (
                      <button
                        type="button"
                        onClick={() => onEdit(doc)}
                        aria-label={`Edit ${doc.displayName}`}
                        title="Edit"
                        className="grid h-8 w-8 place-items-center rounded-md text-ink-3 transition-colors duration-150 hover:bg-surface-3 hover:text-ink-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                      >
                        <HugeiconsIcon icon={Edit02Icon} size={14} />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(doc)}
                        aria-label={`Delete ${doc.displayName}`}
                        title="Delete"
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