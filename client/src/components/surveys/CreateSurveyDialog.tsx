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
import RoleMultiCombobox from "@/components/documents/RoleMultiCombobox";
import { createSurvey, ApiError } from "@/lib/api";
import type { SurveyType } from "@/lib/api";

interface CreateSurveyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export default function CreateSurveyDialog({
  open,
  onOpenChange,
  onSaved,
}: CreateSurveyDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<SurveyType>("NORMAL");
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [assignAllRoles, setAssignAllRoles] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (roleIds.length === 0 && !assignAllRoles) {
      setError("Assign at least one role, or choose to assign to all roles.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await createSurvey({
        title: title.trim(),
        description: description.trim() || null,
        type,
        roleIds: assignAllRoles ? [] : roleIds,
        assignAllRoles,
      });
      onOpenChange(false);
      onSaved();
      setTitle("");
      setDescription("");
      setType("NORMAL");
      setRoleIds([]);
      setAssignAllRoles(false);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to create survey. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create survey</DialogTitle>
          <DialogDescription>
            Choose a type and assign roles that can respond.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-ink-1">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Survey title"
              className="input"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-ink-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={2}
              className="input"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-medium text-ink-1">Type</label>
            <div className="flex gap-3">
              {[
                { value: "NORMAL" as const, label: "Yes / No" },
                { value: "SATISFACTION" as const, label: "Satisfaction" },
                { value: "RATING" as const, label: "Rating (1–5)" },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-[13px] transition-colors ${
                    type === opt.value
                      ? "border-brand bg-brand/5 text-ink-1"
                      : "border-line text-ink-3 hover:border-ink-3"
                  }`}
                >
                  <input
                    type="radio"
                    name="survey-type"
                    value={opt.value}
                    checked={type === opt.value}
                    onChange={() => setType(opt.value)}
                    className="sr-only"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-medium text-ink-1">
              Assign to all roles
            </label>
            <label className="flex items-center gap-2 text-[13px] text-ink-2">
              <input
                type="checkbox"
                checked={assignAllRoles}
                onChange={(e) => setAssignAllRoles(e.target.checked)}
                className="h-4 w-4 rounded border-line accent-brand"
              />
              Every current and future role can see this survey.
            </label>
          </div>

          {!assignAllRoles && (
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-ink-1">
                Roles
              </label>
              <RoleMultiCombobox
                value={roleIds}
                onChange={setRoleIds}
              />
            </div>
          )}

          {error && (
            <p className="text-[13px] font-medium text-danger">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Creating..." : "Create survey"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
