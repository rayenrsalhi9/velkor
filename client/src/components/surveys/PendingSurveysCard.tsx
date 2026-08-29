import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { listPendingSurveys } from "@/lib/api";
import type { Survey } from "@/lib/api";
import AnswerSurveyDialog from "./AnswerSurveyDialog";

export default function PendingSurveysCard() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [answering, setAnswering] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listPendingSurveys();
      setSurveys(data.items);
    } catch {
      setSurveys([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading || surveys.length === 0) return null;

  const current = surveys[0];
  const remaining = surveys.length - 1;

  return (
    <section className="v-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] font-semibold text-ink-1 truncate">
              {current.title}
            </h3>
            <span className="shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand">
              {current.type === "NORMAL"
                ? "Yes / No"
                : current.type === "SATISFACTION"
                  ? "Satisfaction"
                  : "Rating 1–5"}
            </span>
          </div>
          {current.description && (
            <p className="text-[13px] text-ink-3 line-clamp-2">
              {current.description}
            </p>
          )}
        </div>
        <Button onClick={() => setAnswering(true)}>Answer</Button>
      </div>
      {remaining > 0 && (
        <p className="mt-3 text-[12px] text-ink-3">
          {remaining} more pending
        </p>
      )}

      <AnswerSurveyDialog
        survey={answering ? current : null}
        onOpenChange={(open) => {
          if (!open) setAnswering(false);
        }}
        onAnswered={() => {
          setAnswering(false);
          setSurveys((prev) => prev.slice(1));
        }}
      />
    </section>
  );
}
