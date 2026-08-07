import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import AccessDenied from "@/components/AccessDenied";
import RolesTable from "@/components/roles/RolesTable";
import RoleFormDrawer from "@/components/roles/RoleFormDrawer";
import DeleteRoleDialog from "@/components/roles/DeleteRoleDialog";
import { listClaims, listRoles, ApiError } from "@/lib/api";
import type { ClaimDefinition, Role } from "@/lib/api";

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [claims, setClaims] = useState<ClaimDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Role | null>(null);
  const latestLoadId = useRef(0);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Role | null>(null);

  const load = useCallback(async () => {
    const loadId = ++latestLoadId.current;
    setLoading(true);

    try {
      const [rolesData, claimsData] = await Promise.all([
        listRoles(),
        listClaims(),
      ]);

      if (loadId === latestLoadId.current) {
        setRoles(rolesData);
        setClaims(claimsData);
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
            err instanceof Error ? err.message : "Failed to load roles.",
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

  const openEdit = (role: Role) => {
    setEditing(role);
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
            Roles &amp; permissions
          </h1>
          <p className="mt-1 text-[13px] text-ink-2">
            Control what each role can do across documents and administration.
          </p>
        </div>
        <Button
          onClick={openCreate}
          size="lg"
          className="v-brand-gradient text-white"
        >
          <Plus size={16} />
          New role
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[12px] text-ink-3">
          {loading
            ? "Loading…"
            : `${roles.length} role${roles.length === 1 ? "" : "s"}`}
        </p>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            void load();
          }}
          aria-label="Refresh roles"
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
      ) : roles.length === 0 ? (
        <div className="v-card flex flex-col items-center gap-3 px-6 py-14 text-center">
          <p className="text-[15px] font-semibold text-ink-1">No roles yet</p>
          <p className="text-[13px] text-ink-3">
            Create your first role to start granting permissions.
          </p>
          <Button
            onClick={openCreate}
            className="mt-1 v-brand-gradient text-white"
          >
            <Plus size={16} />
            New role
          </Button>
        </div>
      ) : (
        <RolesTable
          roles={roles}
          claims={claims}
          onEdit={openEdit}
          onDelete={setDeleting}
        />
      )}

      <RoleFormDrawer
        open={formOpen}
        onOpenChange={setFormOpen}
        role={editing}
        claims={claims}
        onSaved={() => void load()}
      />

      <DeleteRoleDialog
        role={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        onDeleted={() => void load()}
      />
    </div>
  );
}
