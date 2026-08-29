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
import { closeSurvey, ApiError } from "@/lib/api";
import type { Survey } from "@/lib/api";

interface CloseSurveyDialogProps {
  survey: Survey | null;
  onOpenChange: (open: boolean) => void;
  onClosed: () => void;
}

export default function CloseSurveyDialog({
  survey,
  onOpenChange,
  onClosed,
}: CloseSurveyDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);

  const handleClose = async () => {
    if (!survey) return;
    setClosing(true);
    setError(null);
    try {
      await closeSurvey(survey.id);
      onOpenChange(false);
      onClosed();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to close survey. Please try again.",
      );
    } finally {
      setClosing(false);
    }
  };

  return (
    <Dialog open={!!survey} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Close survey</DialogTitle>
          <DialogDescription>
            Close <strong>{survey?.title}</strong>? No new responses will be
            accepted. This cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="text-[13px] font-medium text-danger">{error}</p>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={closing}
          >
            Cancel
          </Button>
          <Button onClick={handleClose} disabled={closing}>
            {closing ? "Closing..." : "Close survey"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
