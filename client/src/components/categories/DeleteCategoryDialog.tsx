import { useState } from "react";
import { Loader2 } from "lucide-react";
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
import { deleteCategory } from "@/lib/api";
import type { Category } from "@/lib/api";

interface DeleteCategoryDialogProps {
  category: Category | null;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export default function DeleteCategoryDialog({
  category,
  onOpenChange,
  onDeleted,
}: DeleteCategoryDialogProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDelete = async () => {
    if (!category) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteCategory(category.id);
      toast.success("Category deleted", { description: category.name });
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
      open={category !== null}
      onOpenChange={(open) => {
        if (!open) {
          setError(null);
          onOpenChange(false);
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {category?.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            Categories still used by documents cannot be deleted.
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
              <Loader2 size={15} className="animate-spin" />
            ) : (
              "Delete category"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}