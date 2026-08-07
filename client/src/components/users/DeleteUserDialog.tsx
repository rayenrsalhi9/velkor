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
import { deleteUser } from "@/lib/api";
import type { User } from "@/lib/api";

interface DeleteUserDialogProps {
  user: User | null;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export default function DeleteUserDialog({
  user,
  onOpenChange,
  onDeleted,
}: DeleteUserDialogProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDelete = async () => {
    if (!user) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteUser(user.id);
      toast.success("User deleted", { description: user.fullName });
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
      open={user !== null}
      onOpenChange={(open) => {
        if (!open) {
          setError(null);
          onOpenChange(false);
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {user?.fullName}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the account and its access. You cannot
            delete your own account.
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
              "Delete user"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
