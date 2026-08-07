import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import AccessDenied from "@/components/AccessDenied";
import UsersTable from "@/components/users/UsersTable";
import UserFormDialog from "@/components/users/UserFormDialog";
import DeleteUserDialog from "@/components/users/DeleteUserDialog";
import { listRoles, listUsers, ApiError } from "@/lib/api";
import type { Role, User } from "@/lib/api";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<User | null>(null);
  const latestLoadId = useRef(0);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<User | null>(null);

  const load = useCallback(async () => {
    const loadId = ++latestLoadId.current;
    setLoading(true);

    try {
      const [usersData, rolesData] = await Promise.all([
        listUsers(),
        listRoles(),
      ]);

      if (loadId === latestLoadId.current) {
        setUsers(usersData);
        setRoles(rolesData);
        setAccessDenied(false);
        setError(null);
      }
    } catch (err) {
      if (loadId === latestLoadId.current) {
        if (err instanceof ApiError && err.status === 403) {
          setAccessDenied(true);
          setError(null);
        } else {
          setAccessDenied(false);
          setError(
            err instanceof Error ? err.message : "Failed to load users.",
          );
        }
      }
    } finally {
      if (loadId === latestLoadId.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (user: User) => {
    setEditing(user);
    setFormOpen(true);
  };

  if (accessDenied) {
    return <AccessDenied />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-semibold tracking-[-0.01em] text-ink-1">
            Users &amp; accounts
          </h1>
          <p className="mt-1 text-[13px] text-ink-2">
            Manage who can access the intranet and what role each person holds.
          </p>
        </div>
        <Button
          onClick={openCreate}
          size="lg"
          className="v-brand-gradient text-white"
        >
          <Plus size={16} />
          New user
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <p role="status" className="text-[12px] text-ink-3">
          {loading
            ? "Loading…"
            : `${users.length} user${users.length === 1 ? "" : "s"}`}
        </p>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            void load();
          }}
          aria-label="Refresh users"
          title="Refresh"
          className="grid h-8 w-8 place-items-center rounded-md border border-line bg-surface text-ink-2 transition-colors duration-150 hover:bg-surface-2 hover:text-ink-1"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {loading ? (
        <div className="v-card space-y-3 p-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="v-skeleton h-8 w-8 rounded-full" />
              <div className="space-y-2">
                <div className="v-skeleton h-3 w-40" />
                <div className="v-skeleton h-3 w-64" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="v-card flex flex-col items-center gap-4 px-6 py-14 text-center">
          <p role="alert" className="text-[13px] font-medium text-danger">
            {error}
          </p>
          <Button onClick={() => void load()} variant="outline">
            Try again
          </Button>
        </div>
      ) : users.length === 0 ? (
        <div className="v-card flex flex-col items-center gap-3 px-6 py-14 text-center">
          <p className="text-[15px] font-semibold text-ink-1">No users yet</p>
          <p className="text-[13px] text-ink-3">
            Create the first account to start granting access.
          </p>
          <Button
            onClick={openCreate}
            className="mt-1 v-brand-gradient text-white"
          >
            <Plus size={16} />
            New user
          </Button>
        </div>
      ) : (
        <UsersTable
          users={users}
          onEdit={openEdit}
          onDelete={setDeleting}
        />
      )}

      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        user={editing}
        roles={roles}
        onSaved={() => void load()}
      />

      <DeleteUserDialog
        user={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        onDeleted={() => void load()}
      />
    </div>
  );
}
