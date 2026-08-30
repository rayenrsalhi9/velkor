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
import { deleteSurvey, ApiError } from "@/lib/api";
import type { Survey } from "@/lib/api";

interface DeleteSurveyDialogProps {
  survey: Survey | null;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export default function DeleteSurveyDialog({
  survey,
  onOpenChange,
  onDeleted,
}: DeleteSurveyDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!survey) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteSurvey(survey.id);
      onOpenChange(false);
      onDeleted();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to delete survey. Please try again.",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={!!survey} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete survey</DialogTitle>
          <DialogDescription>
            This will permanently delete <strong>{survey?.title}</strong> and
            all its responses. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="text-[13px] font-medium text-danger">{error}</p>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
