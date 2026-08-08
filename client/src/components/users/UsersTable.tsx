import { Pencil, Trash2 } from "lucide-react";
import { getInitials } from "@/lib/initials";
import type { User } from "@/lib/api";

interface UsersTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

export default function UsersTable({
  users,
  onEdit,
  onDelete,
}: UsersTableProps) {
  return (
    <div className="v-card overflow-hidden" aria-label="Users">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="border-b border-line">
              <th className="px-5 py-2.5 text-[11px] font-medium tracking-[0.04em] text-ink-3 uppercase">
                User
              </th>
              <th className="px-5 py-2.5 text-[11px] font-medium tracking-[0.04em] text-ink-3 uppercase">
                Role
              </th>
              <th className="px-5 py-2.5 text-[11px] font-medium tracking-[0.04em] text-ink-3 uppercase">
                Created at
              </th>
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="group border-b border-line last:border-0 hover:bg-surface-2"
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="v-brand-gradient grid h-8 w-8 shrink-0 place-items-center rounded-full text-[10px] font-bold text-white">
                      {getInitials(user.fullName)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-ink-1">
                        {user.fullName}
                      </p>
                      <p className="truncate text-[12px] text-ink-3">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className="rounded-pill bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-ink-2">
                    {user.role}
                  </span>
                </td>
                <td className="px-5 py-3 text-[12px] text-ink-3">
                  {new Date(user.createdAt).toLocaleString()}
                </td>
                <td className="px-3 py-3">
                  <div className="flex justify-end gap-1 opacity-100 transition-opacity duration-150 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                    <button
                      type="button"
                      onClick={() => onEdit(user)}
                      aria-label={`Edit ${user.fullName}`}
                      title="Edit user"
                      className="grid h-8 w-8 place-items-center rounded-md text-ink-3 transition-colors duration-150 hover:bg-surface-3 hover:text-ink-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(user)}
                      aria-label={`Delete ${user.fullName}`}
                      title="Delete user"
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
