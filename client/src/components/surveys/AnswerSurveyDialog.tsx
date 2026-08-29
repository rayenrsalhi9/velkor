import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { submitSurveyResponse, ApiError } from "@/lib/api";
import type { Survey } from "@/lib/api";

interface AnswerSurveyDialogProps {
  survey: Survey | null;
  onOpenChange: (open: boolean) => void;
  onAnswered: () => void;
}

export default function AnswerSurveyDialog({
  survey,
  onOpenChange,
  onAnswered,
}: AnswerSurveyDialogProps) {
  const [answer, setAnswer] = useState<string | number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!survey || answer === null) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitSurveyResponse(survey.id, answer);
      onOpenChange(false);
      onAnswered();
      setAnswer(null);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to submit response. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderOptions = () => {
    if (!survey) return null;

    if (survey.type === "NORMAL") {
      return (
        <div className="flex gap-3">
          {["Yes", "No"].map((opt) => (
            <button
              key={opt}
              onClick={() => setAnswer(opt.toLowerCase())}
              className={`flex-1 rounded-md border px-4 py-3 text-[13px] font-medium transition-colors ${
                answer === opt.toLowerCase()
                  ? "border-brand bg-brand/5 text-ink-1"
                  : "border-line text-ink-3 hover:border-ink-3"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      );
    }

    if (survey.type === "SATISFACTION") {
      return (
        <div className="flex gap-3">
          {["Satisfied", "Unsatisfied", "No Opinion"].map((opt) => (
            <button
              key={opt}
              onClick={() => setAnswer(opt.toLowerCase())}
              className={`flex-1 rounded-md border px-4 py-3 text-[13px] font-medium transition-colors ${
                answer === opt.toLowerCase()
                  ? "border-brand bg-brand/5 text-ink-1"
                  : "border-line text-ink-3 hover:border-ink-3"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      );
    }

    if (survey.type === "RATING") {
      return (
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setAnswer(n)}
              className={`flex h-12 w-12 items-center justify-center rounded-md border text-[15px] font-bold transition-colors ${
                answer === n
                  ? "border-brand bg-brand/5 text-ink-1"
                  : "border-line text-ink-3 hover:border-ink-3"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <Dialog open={!!survey} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{survey?.title}</DialogTitle>
          {survey?.description && (
            <DialogDescription>{survey.description}</DialogDescription>
          )}
        </DialogHeader>

        <div className="py-4">{renderOptions()}</div>

        {error && (
          <p className="text-[13px] font-medium text-danger">{error}</p>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || answer === null}
          >
            {submitting ? "Submitting..." : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
