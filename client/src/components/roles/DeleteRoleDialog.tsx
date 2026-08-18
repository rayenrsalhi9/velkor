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
import { deleteRole } from "@/lib/api";
import type { Role } from "@/lib/api";

interface DeleteRoleDialogProps {
  role: Role | null;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export default function DeleteRoleDialog({
  role,
  onOpenChange,
  onDeleted,
}: DeleteRoleDialogProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDelete = async () => {
    if (!role) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteRole(role.id);
      toast.success("Role deleted", { description: role.name });
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
      open={role !== null}
      onOpenChange={(open) => {
        if (!open) {
          setError(null);
          onOpenChange(false);
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {role?.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the role and its permissions. Roles
            assigned to users cannot be deleted.
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
              "Delete role"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
