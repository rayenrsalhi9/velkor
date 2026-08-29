import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getSurveyAnalytics, ApiError } from "@/lib/api";
import type { Survey, SurveyAnalytics } from "@/lib/api";

interface SurveyAnalyticsDialogProps {
  survey: Survey | null;
  onOpenChange: (open: boolean) => void;
}

export default function SurveyAnalyticsDialog({
  survey,
  onOpenChange,
}: SurveyAnalyticsDialogProps) {
  const [analytics, setAnalytics] = useState<SurveyAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!survey) {
      setAnalytics(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    getSurveyAnalytics(survey.id)
      .then((data) => {
        if (!cancelled) setAnalytics(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Failed to load analytics.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [survey]);

  const maxCount = analytics
    ? Math.max(...analytics.breakdown.map((b) => b.count), 1)
    : 1;

  return (
    <Dialog open={!!survey} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Analytics — {survey?.title}</DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="space-y-3 py-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="v-skeleton h-8 w-full rounded" />
            ))}
          </div>
        )}

        {error && (
          <p className="py-4 text-center text-[13px] font-medium text-danger">
            {error}
          </p>
        )}

        {analytics && !loading && (
          <div className="space-y-4 py-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-ink-1">
                {analytics.totalResponses}
              </span>
              <span className="text-[13px] text-ink-3">responses</span>
              {analytics.averageRating !== undefined && (
                <span className="ml-auto text-[13px] text-ink-3">
                  Avg: <strong className="text-ink-1">{analytics.averageRating}</strong> / 5
                </span>
              )}
            </div>

            <div className="space-y-2">
              {analytics.breakdown.map((item) => (
                <div key={item.option} className="space-y-1">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-ink-1">{item.option}</span>
                    <span className="text-ink-3">{item.count}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-surface-2">
                    <div
                      className="h-2 rounded-full bg-brand transition-all"
                      style={{
                        width: `${(item.count / maxCount) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
              {analytics.breakdown.length === 0 && (
                <p className="py-4 text-center text-[13px] text-ink-3">
                  No responses yet.
                </p>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
