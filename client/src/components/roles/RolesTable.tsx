import { ArrowDown, ArrowUp, ArrowUpDown, Pencil, Trash2 } from "lucide-react";
import { getInitials } from "@/lib/initials";
import type { ClaimDefinition, Role } from "@/lib/api";

const WILDCARD_CLAIM = "*";
const MAX_CHIPS = 4;

export type RoleSortKey = "name" | "createdAt";

interface RolesTableProps {
  roles: Role[];
  claims: ClaimDefinition[];
  sortBy: RoleSortKey;
  order: "asc" | "desc";
  onSort: (key: RoleSortKey) => void;
  onEdit: (role: Role) => void;
  onDelete: (role: Role) => void;
}

function SortHeader({
  label,
  sortKey,
  sortBy,
  order,
  onSort,
}: {
  label: string;
  sortKey: RoleSortKey;
  sortBy: RoleSortKey;
  order: "asc" | "desc";
  onSort: (key: RoleSortKey) => void;
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

export default function RolesTable({
  roles,
  claims,
  sortBy,
  order,
  onSort,
  onEdit,
  onDelete,
}: RolesTableProps) {
  const labelByKey = new Map(
    claims.map((claim) => [claim.key, claim.label]),
  );

  return (
    <div className="v-card overflow-hidden" aria-label="Roles">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="border-b border-line">
              <SortHeader label="Role" sortKey="name" sortBy={sortBy} order={order} onSort={onSort} />
              <th className="px-5 py-2.5 text-[11px] font-medium tracking-[0.04em] text-ink-3 uppercase">
                Permissions
              </th>
              <SortHeader label="Created at" sortKey="createdAt" sortBy={sortBy} order={order} onSort={onSort} />
              <th scope="col" className="px-3 py-2.5">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr
                key={role.id}
                className="group border-b border-line last:border-0 hover:bg-surface-2"
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="v-brand-gradient grid h-8 w-8 shrink-0 place-items-center rounded-full text-[10px] font-bold text-white">
                      {getInitials(role.name)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-ink-1">
                        {role.name}
                      </p>
                      {role.description && (
                        <p className="truncate text-[12px] text-ink-3">
                          {role.description}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  {role.claims.includes(WILDCARD_CLAIM) ? (
                    <span className="rounded-pill bg-brand-soft px-2 py-0.5 text-[11px] font-medium text-brand">
                      Full access
                    </span>
                  ) : role.claims.length === 0 ? (
                    <span className="text-[12px] text-ink-3">No permissions</span>
                  ) : (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {role.claims.slice(0, MAX_CHIPS).map((key) => (
                        <span
                          key={key}
                          className="rounded-pill bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-ink-2"
                        >
                          {labelByKey.get(key) ?? key}
                        </span>
                      ))}
                      {role.claims.length > MAX_CHIPS && (
                        <span className="text-[11px] text-ink-3">
                          +{role.claims.length - MAX_CHIPS} more
                        </span>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-5 py-3 text-[12px] text-ink-3">
                  {new Date(role.createdAt).toLocaleString()}
                </td>
                <td className="px-3 py-3">
                  <div className="flex justify-end gap-1 opacity-100 transition-opacity duration-150 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                    <button
                      type="button"
                      onClick={() => onEdit(role)}
                      aria-label={`Edit ${role.name}`}
                      title="Edit role"
                      className="grid h-8 w-8 place-items-center rounded-md text-ink-3 transition-colors duration-150 hover:bg-surface-3 hover:text-ink-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(role)}
                      aria-label={`Delete ${role.name}`}
                      title="Delete role"
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
