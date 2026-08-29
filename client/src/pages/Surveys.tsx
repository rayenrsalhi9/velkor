import { useCallback, useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import ListToolbar from "@/components/ListToolbar";
import AccessDenied from "@/components/AccessDenied";
import ListPagination from "@/components/ListPagination";
import SurveysTable from "@/components/surveys/SurveysTable";
import type { SurveySortKey } from "@/components/surveys/SurveysTable";
import CreateSurveyDialog from "@/components/surveys/CreateSurveyDialog";
import DeleteSurveyDialog from "@/components/surveys/DeleteSurveyDialog";
import CloseSurveyDialog from "@/components/surveys/CloseSurveyDialog";
import SurveyAnalyticsDialog from "@/components/surveys/SurveyAnalyticsDialog";
import { listSurveys, ApiError } from "@/lib/api";
import type { Survey } from "@/lib/api";

const PAGE_SIZE = 10;

export default function SurveysPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latestLoadId = useRef(0);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Survey | null>(null);
  const [closing, setClosing] = useState<Survey | null>(null);
  const [analytics, setAnalytics] = useState<Survey | null>(null);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SurveySortKey>("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
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
      const data = await listSurveys({
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
        setSurveys(data.items);
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
            err instanceof Error ? err.message : "Failed to load surveys.",
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

  const handleSort = (key: SurveySortKey) => {
    if (key === sortBy) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setOrder("asc");
    }
  };

  if (accessDenied) {
    return <AccessDenied />;
  }

  const searching = search.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Surveys"
        description="Create and manage surveys for your teams."
        actions={
          <Button onClick={() => setFormOpen(true)} size="lg">
            <HugeiconsIcon icon={PlusSignIcon} size={16} />
            New survey
          </Button>
        }
      />

      <ListToolbar
        value={q}
        onValueChange={setQ}
        placeholder="Search by title"
        searchLabel="Search surveys"
        refreshLabel="Refresh surveys"
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
      ) : surveys.length === 0 ? (
        <div className="v-card flex flex-col items-center gap-3 px-6 py-14 text-center">
          <p className="text-[15px] font-semibold text-ink-1">
            {searching ? "No results" : "No surveys yet"}
          </p>
          <p className="text-[13px] text-ink-3">
            {searching
              ? "No surveys match your search. Try a different query."
              : "Create your first survey to start collecting feedback."}
          </p>
          {!searching && (
            <Button onClick={() => setFormOpen(true)} size="lg">
              <HugeiconsIcon icon={PlusSignIcon} size={16} />
              New survey
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <SurveysTable
            surveys={surveys}
            sortBy={sortBy}
            order={order}
            onSort={handleSort}
            onAnalytics={setAnalytics}
            onClose={setClosing}
            onDelete={setDeleting}
          />
          <ListPagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            onPageChange={setPage}
            label="surveys"
          />
        </div>
      )}

      <CreateSurveyDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSaved={() => void load()}
      />

      <DeleteSurveyDialog
        survey={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        onDeleted={() => void load()}
      />

      <CloseSurveyDialog
        survey={closing}
        onOpenChange={(open) => {
          if (!open) setClosing(null);
        }}
        onClosed={() => void load()}
      />

      <SurveyAnalyticsDialog
        survey={analytics}
        onOpenChange={(open) => {
          if (!open) setAnalytics(null);
        }}
      />
    </div>
  );
}
