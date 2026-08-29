import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon, ViewIcon as EyeIcon, Tick02Icon as CheckCircleIcon } from "@hugeicons/core-free-icons";
import TableSortHeader from "@/components/TableSortHeader";
import type { Survey } from "@/lib/api";

export type SurveySortKey = "title" | "createdAt";

interface SurveysTableProps {
  surveys: Survey[];
  sortBy: SurveySortKey;
  order: "asc" | "desc";
  onSort: (key: SurveySortKey) => void;
  onAnalytics: (survey: Survey) => void;
  onClose: (survey: Survey) => void;
  onDelete: (survey: Survey) => void;
}

function TypeBadge({ type }: { type: string }) {
  const labels: Record<string, string> = {
    NORMAL: "Yes / No",
    SATISFACTION: "Satisfaction",
    RATING: "Rating",
  };
  return (
    <span className="rounded-pill bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-ink-2">
      {labels[type] ?? type}
    </span>
  );
}

function StatusBadge({ closedAt }: { closedAt: string | null }) {
  return closedAt ? (
    <span className="rounded-pill bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-ink-3">
      Closed
    </span>
  ) : (
    <span className="rounded-pill bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
      Open
    </span>
  );
}

export default function SurveysTable({
  surveys,
  sortBy,
  order,
  onSort,
  onAnalytics,
  onClose,
  onDelete,
}: SurveysTableProps) {
  return (
    <div className="v-card overflow-hidden" aria-label="Surveys">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="bg-surface-2 border-b border-line">
              <TableSortHeader<SurveySortKey> label="Title" sortKey="title" sortBy={sortBy} order={order} onSort={onSort} />
              <th className="px-5 py-2.5 text-[11px] font-medium tracking-[0.04em] text-ink-3 uppercase">
                Type
              </th>
              <th className="px-5 py-2.5 text-[11px] font-medium tracking-[0.04em] text-ink-3 uppercase">
                Status
              </th>
              <th className="px-5 py-2.5 text-[11px] font-medium tracking-[0.04em] text-ink-3 uppercase">
                Created by
              </th>
              <TableSortHeader<SurveySortKey> label="Created at" sortKey="createdAt" sortBy={sortBy} order={order} onSort={onSort} />
              <th scope="col" className="px-3 py-2.5">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {surveys.map((survey) => (
              <tr
                key={survey.id}
                className="group border-b border-line last:border-0 hover:bg-surface-2"
              >
                <td className="px-5 py-3 text-[13px] font-medium text-ink-1">
                  {survey.title}
                </td>
                <td className="px-5 py-3">
                  <TypeBadge type={survey.type} />
                </td>
                <td className="px-5 py-3">
                  <StatusBadge closedAt={survey.closedAt} />
                </td>
                <td className="px-5 py-3 text-[13px] text-ink-3">
                  {survey.createdByName}
                </td>
                <td className="px-5 py-3 text-[12px] text-ink-3">
                  {new Date(survey.createdAt).toLocaleString()}
                </td>
                <td className="px-3 py-3">
                  <div className="flex justify-end gap-1 opacity-100 transition-opacity duration-150 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                    <button
                      type="button"
                      onClick={() => onAnalytics(survey)}
                      aria-label={`View analytics for ${survey.title}`}
                      title="View analytics"
                      className="grid h-8 w-8 place-items-center rounded-md text-ink-3 transition-colors duration-150 hover:bg-surface-3 hover:text-ink-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                    >
                      <HugeiconsIcon icon={EyeIcon} size={14} />
                    </button>
                    {!survey.closedAt && (
                      <button
                        type="button"
                        onClick={() => onClose(survey)}
                        aria-label={`Close ${survey.title}`}
                        title="Close survey"
                        className="grid h-8 w-8 place-items-center rounded-md text-ink-3 transition-colors duration-150 hover:bg-surface-3 hover:text-ink-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                      >
                        <HugeiconsIcon icon={CheckCircleIcon} size={14} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onDelete(survey)}
                      aria-label={`Delete ${survey.title}`}
                      title="Delete survey"
                      className="grid h-8 w-8 place-items-center rounded-md text-ink-3 transition-colors duration-150 hover:bg-danger/10 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                    >
                      <HugeiconsIcon icon={Delete02Icon} size={14} />
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
