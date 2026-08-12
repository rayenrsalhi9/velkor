import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AccessDenied from "@/components/AccessDenied";
import DocumentsTable from "@/components/documents/DocumentsTable";
import type { DocumentSortKey } from "@/components/documents/DocumentsTable";
import UploadDrawer from "@/components/documents/UploadDrawer";
import DocumentPreviewDialog from "@/components/documents/DocumentPreviewDialog";
import EditDocumentDialog from "@/components/documents/EditDocumentDialog";
import DeleteDocumentDialog from "@/components/documents/DeleteDocumentDialog";
import ListPagination from "@/components/ListPagination";
import { listDocuments, downloadDocumentBlob, ApiError } from "@/lib/api";
import type { VelkorDocument } from "@/lib/api";
import { hasClaim } from "@/lib/navigation";
import { useAuth } from "@/context/auth";

const PAGE_SIZE = 10;

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

interface DocumentsPageProps {
  scope?: "all" | "assigned";
}

export default function DocumentsPage({ scope = "all" }: DocumentsPageProps) {
  const { user } = useAuth();
  const claims = user?.claims ?? [];
  const canUpload = hasClaim(claims, "documents:upload");
  const canEdit = hasClaim(claims, "documents:edit");
  const canDelete = hasClaim(claims, "documents:delete");
  const [documents, setDocuments] = useState<VelkorDocument[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latestLoadId = useRef(0);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<VelkorDocument | null>(null);
  const [editingDoc, setEditingDoc] = useState<VelkorDocument | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<VelkorDocument | null>(null);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<DocumentSortKey>("displayName");
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
      const data = await listDocuments({
        scope,
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
        setDocuments(data.items);
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
            err instanceof Error ? err.message : "Failed to load documents.",
          );
        }
      }
    } finally {
      if (loadId === latestLoadId.current) {
        setLoading(false);
      }
    }
  }, [search, sortBy, order, page, scope]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSort = (key: DocumentSortKey) => {
    if (key === sortBy) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setOrder("asc");
    }
  };

  const handleDownload = async (doc: VelkorDocument) => {
    try {
      triggerDownload(await downloadDocumentBlob(doc.id), doc.fileName);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to download document.",
      );
    }
  };

  if (accessDenied) {
    return <AccessDenied />;
  }

  const searching = search.length > 0;
  const title =
    scope === "assigned" ? "Assigned documents" : "All documents";
  const description =
    scope === "assigned"
      ? "Documents assigned to your role."
      : "Browse documents shared across the agency.";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-semibold tracking-[-0.01em] text-ink-1">
            {title}
          </h1>
          <p className="mt-1 text-[13px] text-ink-2">{description}</p>
        </div>
        {canUpload && (
          <Button
            onClick={() => setUploadOpen(true)}
            size="lg"
            className="v-brand-gradient text-white"
          >
            <Plus size={16} />
            Upload document
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
            placeholder="Search by name or file name"
            aria-label="Search documents"
            className="pl-8"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            void load();
          }}
          aria-label="Refresh documents"
          title="Refresh"
          className="grid h-8 w-8 place-items-center rounded-md border border-line bg-surface text-ink-2 transition-colors duration-150 hover:bg-surface-2 hover:text-ink-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {loading ? (
        <div className="v-card space-y-3 p-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="v-skeleton h-8 w-8 rounded-md" />
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
      ) : documents.length === 0 ? (
        <div className="v-card flex flex-col items-center gap-3 px-6 py-14 text-center">
          <p className="text-[15px] font-semibold text-ink-1">
            {searching ? "No results" : "No documents yet"}
          </p>
          <p className="text-[13px] text-ink-3">
            {searching
              ? "No documents match your search. Try a different query."
              : "Uploaded documents will appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <DocumentsTable
            documents={documents}
            sortBy={sortBy}
            order={order}
            onSort={handleSort}
            onPreview={setPreviewDoc}
            onDownload={handleDownload}
            onEdit={canEdit ? setEditingDoc : undefined}
            onDelete={canDelete ? setDeletingDoc : undefined}
          />
          <ListPagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            onPageChange={setPage}
            label="documents"
          />
        </div>
      )}

      <DocumentPreviewDialog
        document={previewDoc}
        onOpenChange={(open) => {
          if (!open) setPreviewDoc(null);
        }}
      />
      {canEdit && (
        <EditDocumentDialog
          open={editingDoc !== null}
          onOpenChange={(open) => {
            if (!open) setEditingDoc(null);
          }}
          document={editingDoc}
          onSaved={() => void load()}
        />
      )}
      <DeleteDocumentDialog
        document={deletingDoc}
        onOpenChange={(open) => {
          if (!open) setDeletingDoc(null);
        }}
        onDeleted={() => void load()}
      />

      {canUpload && (
        <UploadDrawer
          open={uploadOpen}
          onOpenChange={setUploadOpen}
          onSaved={() => void load()}
        />
      )}
    </div>
  );
}