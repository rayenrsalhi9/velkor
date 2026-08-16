import { useState, type FormEvent } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { LoadingIcon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import CategoryCombobox from "@/components/documents/CategoryCombobox";
import RoleMultiCombobox from "@/components/documents/RoleMultiCombobox";
import { updateDocument } from "@/lib/api";
import type { VelkorDocument } from "@/lib/api";

interface EditDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: VelkorDocument | null;
  onSaved: () => void;
}

export default function EditDocumentDialog({
  open,
  onOpenChange,
  document,
  onSaved,
}: EditDocumentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit document</DialogTitle>
        </DialogHeader>
        <EditForm
          key={`${document?.id ?? "new"}:${open}`}
          document={document}
          onSaved={onSaved}
          onOpenChange={onOpenChange}
        />
      </DialogContent>
    </Dialog>
  );
}

function EditForm({
  document,
  onSaved,
  onOpenChange,
}: Omit<EditDocumentDialogProps, "open">) {
  const [displayName, setDisplayName] = useState(document?.displayName ?? "");
  const [categoryId, setCategoryId] = useState(document?.categoryId ?? "");
  const [roleIds, setRoleIds] = useState(document?.roleIds ?? []);
  const [assignAllRoles, setAssignAllRoles] = useState(
    document?.assignAllRoles ?? false,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!document) return;
    if (!categoryId) {
      setError("Select a category.");
      return;
    }
    if (roleIds.length === 0 && !assignAllRoles) {
      setError("Assign at least one role, or choose to assign to all roles.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await updateDocument(document.id, {
        displayName: displayName.trim(),
        categoryId,
        roleIds: assignAllRoles ? [] : roleIds,
        assignAllRoles,
      });
      toast.success("Document updated", { description: displayName.trim() });
      onOpenChange(false);
      onSaved();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div>
        <Label htmlFor="edit-displayName" className="v-label mb-1.5 block">
          Display name
        </Label>
        <Input
          id="edit-displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Document name"
        />
      </div>

      <div>
        <Label htmlFor="edit-category" className="v-label mb-1.5 block">
          Category
        </Label>
        <CategoryCombobox
          id="edit-category"
          value={categoryId}
          onChange={setCategoryId}
          initialQuery={document?.categoryName}
        />
      </div>

      <div>
        <label className="flex cursor-pointer items-center gap-3 rounded-md border border-line bg-surface px-3 py-2.5">
          <Checkbox
            checked={assignAllRoles}
            onCheckedChange={() => setAssignAllRoles((v) => !v)}
            aria-label="Assign to all roles"
          />
          <span className="min-w-0">
            <span className="block text-[13px] font-medium text-ink-1">
              Assign to all roles
            </span>
            <span className="block text-[12px] text-ink-3">
              Every current and future role can see this document.
            </span>
          </span>
        </label>
      </div>

      {!assignAllRoles && (
        <div>
          <Label htmlFor="edit-roles" className="v-label mb-1.5 block">
            Assign to roles
          </Label>
          <RoleMultiCombobox
            id="edit-roles"
            value={roleIds}
            onChange={setRoleIds}
          />
        </div>
      )}

      {error && (
        <div role="alert">
          <p className="rounded-md border border-danger/25 bg-danger/5 px-3 py-2 text-[12px] font-medium text-danger">
            {error}
          </p>
        </div>
      )}

      <DialogFooter>
        <DialogClose
          render={
            <Button type="button" variant="outline" disabled={submitting} />
          }
        >
          Cancel
        </DialogClose>
        <Button
          type="submit"
          disabled={submitting}
        >
          {submitting ? (
            <HugeiconsIcon icon={LoadingIcon} size={16} className="animate-spin" />
          ) : (
            "Save changes"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}
