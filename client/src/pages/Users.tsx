import { useCallback, useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import ListToolbar from "@/components/ListToolbar";
import AccessDenied from "@/components/AccessDenied";
import UsersTable from "@/components/users/UsersTable";
import type { UserSortKey } from "@/components/users/UsersTable";
import UserFormDialog from "@/components/users/UserFormDialog";
import DeleteUserDialog from "@/components/users/DeleteUserDialog";
import ListPagination from "@/components/ListPagination";
import { listUsers, ApiError } from "@/lib/api";
import type { User } from "@/lib/api";

const PAGE_SIZE = 10;

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<User | null>(null);
  const latestLoadId = useRef(0);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<User | null>(null);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<UserSortKey>("fullName");
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
      const data = await listUsers({
        q: search || undefined,
        sortBy,
        order,
        page,
        pageSize: PAGE_SIZE,
      });

      if (loadId === latestLoadId.current) {
        const lastPage = Math.max(1, Math.ceil(data.total / PAGE_SIZE));
        if (data.items.length === 0 && data.total > 0 && page > lastPage) {
          setPage(lastPage);
          return;
        }
        setUsers(data.items);
        setTotal(data.total);
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
  }, [search, sortBy, order, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSort = (key: UserSortKey) => {
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

  const openEdit = (user: User) => {
    setEditing(user);
    setFormOpen(true);
  };

  if (accessDenied) {
    return <AccessDenied />;
  }

  const searching = search.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users &amp; accounts"
        description="Manage who can access the intranet and what role each person holds."
        actions={
          <Button
            onClick={openCreate}
            size="lg"
          >
            <HugeiconsIcon icon={PlusSignIcon} size={16} />
            New user
          </Button>
        }
      />

      <ListToolbar
        value={q}
        onValueChange={setQ}
        placeholder="Search name, email, or role"
        searchLabel="Search users"
        refreshLabel="Refresh users"
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
      ) : users.length === 0 ? (
        <div className="v-card flex flex-col items-center gap-3 px-6 py-14 text-center">
          <p className="text-[15px] font-semibold text-ink-1">
            {searching ? "No results" : "No users yet"}
          </p>
          <p className="text-[13px] text-ink-3">
            {searching
              ? "No users match your search. Try a different query."
              : "Create the first account to start granting access."}
          </p>
          {!searching && (
            <Button onClick={openCreate} size="lg">
              <HugeiconsIcon icon={PlusSignIcon} size={16} />
              New user
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <UsersTable
            users={users}
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
            label="users"
          />
        </div>
      )}

      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        user={editing}
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
