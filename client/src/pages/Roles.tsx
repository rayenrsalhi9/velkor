import { useCallback, useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import ListToolbar from "@/components/ListToolbar";
import AccessDenied from "@/components/AccessDenied";
import RolesTable from "@/components/roles/RolesTable";
import type { RoleSortKey } from "@/components/roles/RolesTable";
import RoleFormDrawer from "@/components/roles/RoleFormDrawer";
import DeleteRoleDialog from "@/components/roles/DeleteRoleDialog";
import ListPagination from "@/components/ListPagination";
import { listClaims, listRoles, ApiError } from "@/lib/api";
import type { ClaimDefinition, Role } from "@/lib/api";

const PAGE_SIZE = 10;

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [total, setTotal] = useState(0);
  const [claims, setClaims] = useState<ClaimDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Role | null>(null);
  const latestLoadId = useRef(0);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Role | null>(null);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<RoleSortKey>("name");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(q), 300);
    return () => clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    setPage(1);
  }, [search, sortBy, order]);

  const load = useCallback(async () => {
    const loadId = ++latestLoadId.current;
    setLoading(true);

    try {
      const [rolesData, claimsData] = await Promise.all([
        listRoles({
          q: search || undefined,
          sortBy,
          order,
          page,
          pageSize: PAGE_SIZE,
        }),
        listClaims(),
      ]);

      if (loadId === latestLoadId.current) {
        const lastPage = Math.max(1, Math.ceil(rolesData.total / PAGE_SIZE));
        if (
          rolesData.items.length === 0 &&
          rolesData.total > 0 &&
          page > lastPage
        ) {
          setPage(lastPage);
          return;
        }
        setRoles(rolesData.items);
        setTotal(rolesData.total);
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
  }, [search, sortBy, order, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSort = (key: RoleSortKey) => {
    if (key === sortBy) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setOrder("asc");
    }
  };

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

  const searching = search.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles &amp; permissions"
        description="Control what each role can do across documents and administration."
        actions={
          <Button
            onClick={openCreate}
            size="lg"
          >
            <HugeiconsIcon icon={PlusSignIcon} size={16} />
            New role
          </Button>
        }
      />

      <ListToolbar
        value={q}
        onValueChange={setQ}
        placeholder="Search by name or description"
        searchLabel="Search roles"
        refreshLabel="Refresh roles"
        onRefresh={() => {
          setLoading(true);
          void load();
        }}
      />

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
          <p className="text-[15px] font-semibold text-ink-1">
            {searching ? "No results" : "No roles yet"}
          </p>
          <p className="text-[13px] text-ink-3">
            {searching
              ? "No roles match your search. Try a different query."
              : "Create your first role to start granting permissions."}
          </p>
          {!searching && (
            <Button onClick={openCreate} size="lg">
              <HugeiconsIcon icon={PlusSignIcon} size={16} />
              New role
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <RolesTable
            roles={roles}
            claims={claims}
            sortBy={sortBy}
            order={order}
            onSort={handleSort}
            onEdit={openEdit}
            onDelete={setDeleting}
          />
          <ListPagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            onPageChange={setPage}
            label="roles"
          />
        </div>
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
