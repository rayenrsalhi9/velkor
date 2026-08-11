import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AccessDenied from "@/components/AccessDenied";
import CategoriesTable from "@/components/categories/CategoriesTable";
import type { CategorySortKey } from "@/components/categories/CategoriesTable";
import CategoryFormDialog from "@/components/categories/CategoryFormDialog";
import DeleteCategoryDialog from "@/components/categories/DeleteCategoryDialog";
import ListPagination from "@/components/ListPagination";
import { listCategories, ApiError } from "@/lib/api";
import type { Category } from "@/lib/api";
import { hasClaim } from "@/lib/navigation";
import { useAuth } from "@/context/auth";

const PAGE_SIZE = 10;

export default function CategoriesPage() {
  const { user } = useAuth();
  const canManage = hasClaim(user?.claims ?? [], "categories:manage");
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Category | null>(null);
  const latestLoadId = useRef(0);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<CategorySortKey>("name");
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
      const data = await listCategories({
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
        setCategories(data.items);
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
            err instanceof Error ? err.message : "Failed to load categories.",
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

  const handleSort = (key: CategorySortKey) => {
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

  const openEdit = (category: Category) => {
    setEditing(category);
    setFormOpen(true);
  };

  if (accessDenied) {
    return <AccessDenied />;
  }

  const searching = search.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-semibold tracking-[-0.01em] text-ink-1">
            Document categories
          </h1>
          <p className="mt-1 text-[13px] text-ink-2">
            Organize documents into groups with a name and description.
          </p>
        </div>
        {canManage && (
          <Button
            onClick={openCreate}
            size="lg"
            className="v-brand-gradient text-white"
          >
            <Plus size={16} />
            New category
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search
            size={14}
            className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-ink-3"
          />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or description"
            aria-label="Search categories"
            className="pl-8"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            void load();
          }}
          aria-label="Refresh categories"
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
      ) : categories.length === 0 ? (
        <div className="v-card flex flex-col items-center gap-3 px-6 py-14 text-center">
          <p className="text-[15px] font-semibold text-ink-1">
            {searching ? "No results" : "No categories yet"}
          </p>
          <p className="text-[13px] text-ink-3">
            {searching
              ? "No categories match your search. Try a different query."
              : "Create your first category to start organizing documents."}
          </p>
          {!searching && canManage && (
            <Button
              onClick={openCreate}
              className="mt-1 v-brand-gradient text-white"
            >
              <Plus size={16} />
              New category
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <CategoriesTable
            categories={categories}
            sortBy={sortBy}
            order={order}
            onSort={handleSort}
            onEdit={canManage ? openEdit : () => {}}
            onDelete={canManage ? setDeleting : () => {}}
          />
          <ListPagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            onPageChange={setPage}
            label="categories"
          />
        </div>
      )}

      {canManage && (
        <>
          <CategoryFormDialog
            open={formOpen}
            onOpenChange={setFormOpen}
            category={editing}
            onSaved={() => void load()}
          />
          <DeleteCategoryDialog
            category={deleting}
            onOpenChange={(open) => {
              if (!open) setDeleting(null);
            }}
            onDeleted={() => void load()}
          />
        </>
      )}
    </div>
  );
}