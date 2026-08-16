import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { LoadingIcon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { softDeleteDocument } from "@/lib/api";
import type { VelkorDocument } from "@/lib/api";

interface DeleteDocumentDialogProps {
  document: VelkorDocument | null;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export default function DeleteDocumentDialog({
  document,
  onOpenChange,
  onDeleted,
}: DeleteDocumentDialogProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDelete = async () => {
    if (!document) return;
    setDeleting(true);
    setError(null);
    try {
      await softDeleteDocument(document.id);
      toast.success("Document deleted", { description: document.displayName });
      onOpenChange(false);
      onDeleted();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Try again.",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AlertDialog
      open={document !== null}
      onOpenChange={(open) => {
        if (!open) {
          setError(null);
          onOpenChange(false);
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {document?.displayName}?</AlertDialogTitle>
          <AlertDialogDescription>
            The document will be archived and hidden from document lists. This
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <div role="alert">
            <p className="rounded-md border border-danger/25 bg-danger/5 px-3 py-2 text-[12px] font-medium text-danger">
              {error}
            </p>
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleting}
            onClick={(event) => {
              event.preventDefault();
              void onDelete();
            }}
          >
            {deleting ? (
              <HugeiconsIcon icon={LoadingIcon} size={15} className="animate-spin" />
            ) : (
              "Delete document"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}