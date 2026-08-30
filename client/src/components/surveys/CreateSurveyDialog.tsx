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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import RoleMultiCombobox from "@/components/documents/RoleMultiCombobox";
import { createSurvey, ApiError } from "@/lib/api";
import type { SurveyType } from "@/lib/api";

interface CreateSurveyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

const TYPE_OPTIONS = [
  { value: "NORMAL" as const, label: "Yes / No" },
  { value: "SATISFACTION" as const, label: "Satisfaction" },
  { value: "RATING" as const, label: "Rating (1–5)" },
] as const;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div>
            <Label htmlFor="survey-title" className="mb-1.5">
              Title
            </Label>
            <Input
              id="survey-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Survey title"
            />
          </div>

          <div>
            <Label htmlFor="survey-description" className="mb-1.5">
              Description
            </Label>
            <Textarea
              id="survey-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={2}
            />
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-ink-1">Type</legend>
            <div className="flex gap-3">
              {TYPE_OPTIONS.map((opt) => (
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
          </fieldset>

          <label className="flex cursor-pointer items-center gap-3 rounded-md border border-line bg-surface px-3 py-2.5">
            <Checkbox
              checked={assignAllRoles}
              onCheckedChange={(checked) => setAssignAllRoles(!!checked)}
            />
            <span className="min-w-0">
              <span className="block text-[13px] font-medium text-ink-1">
                Assign to all roles
              </span>
              <span className="block text-[12px] text-ink-3">
                Every current and future role can see this survey.
              </span>
            </span>
          </label>

          {!assignAllRoles && (
            <div>
              <Label htmlFor="survey-roles" className="mb-1.5">
                Roles
              </Label>
              <RoleMultiCombobox
                value={roleIds}
                onChange={setRoleIds}
              />
            </div>
          )}

          {error && (
            <p role="alert" className="text-[13px] font-medium text-danger">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Creating..." : "Create survey"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
