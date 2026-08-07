import { Pencil, Trash2 } from "lucide-react";
import { getInitials } from "@/lib/initials";
import type { ClaimDefinition, Role } from "@/lib/api";

const WILDCARD_CLAIM = "*";
const MAX_CHIPS = 4;

interface RolesTableProps {
  roles: Role[];
  claims: ClaimDefinition[];
  onEdit: (role: Role) => void;
  onDelete: (role: Role) => void;
}

export default function RolesTable({
  roles,
  claims,
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
              <th className="px-5 py-2.5 text-[11px] font-medium tracking-[0.04em] text-ink-3 uppercase">
                Role
              </th>
              <th className="px-5 py-2.5 text-[11px] font-medium tracking-[0.04em] text-ink-3 uppercase">
                Permissions
              </th>
              <th className="px-3 py-2.5" />
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
