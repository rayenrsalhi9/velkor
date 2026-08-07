import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import ClaimPicker from "@/components/roles/ClaimPicker";
import { createRole, updateRole, ApiError } from "@/lib/api";
import type { ClaimDefinition, Role } from "@/lib/api";

interface RoleFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role | null;
  claims: ClaimDefinition[];
  onSaved: () => void;
}

export default function RoleFormDrawer({
  open,
  onOpenChange,
  role,
  claims,
  onSaved,
}: RoleFormDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} swipeDirection="right">
      <DrawerContent className="w-full sm:max-w-lg">
        <DrawerHeader>
          <DrawerTitle>{role ? "Edit role" : "New role"}</DrawerTitle>
          <DrawerDescription>
            {role
              ? "Update the role's name, description, or permissions."
              : "Create a role and grant it permissions."}
          </DrawerDescription>
        </DrawerHeader>
        <RoleForm
          key={`${role?.id ?? "new"}:${open}`}
          role={role}
          claims={claims}
          onSaved={onSaved}
          onOpenChange={onOpenChange}
        />
      </DrawerContent>
    </Drawer>
  );
}

function RoleForm({
  role,
  claims,
  onSaved,
  onOpenChange,
}: Omit<RoleFormDrawerProps, "open">) {
  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set((role?.claims ?? []).filter((c) => c !== "*")),
  );
  const [fullAccess, setFullAccess] = useState(
    () => role?.claims.includes("*") ?? false,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  const toggleClaim = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError("Enter a name for the role.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setNameError(null);
    try {
      const input = {
        name: trimmedName,
        description: description.trim() || null,
        claims: fullAccess ? ["*"] : [...selected],
      };
      if (role) await updateRole(role.id, input);
      else await createRole(input);
      toast.success(role ? "Role updated" : "Role created", {
        description: input.name,
      });
      onOpenChange(false);
      onSaved();
    } catch (err) {
      if (
        err instanceof ApiError &&
        err.status === 409 &&
        err.message.includes("name")
      ) {
        setNameError(err.message);
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong. Try again.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
        <div>
          <Label htmlFor="role-name" className="v-label mb-1.5 block">
            Role name
          </Label>
          <Input
            id="role-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setNameError(null);
            }}
            placeholder="e.g. Editor"
            aria-invalid={!!nameError}
            className={nameError ? "border-danger" : ""}
          />
          {nameError && (
            <p role="alert" className="mt-1.5 text-[12px] text-danger">
              {nameError}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="role-description" className="v-label mb-1.5 block">
            Description
          </Label>
          <Textarea
            id="role-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this role for?"
            rows={2}
          />
        </div>

        <div>
          <label className="flex cursor-pointer items-center gap-3 rounded-md border border-line bg-surface px-3 py-2.5">
            <Checkbox
              checked={fullAccess}
              onCheckedChange={() => setFullAccess((v) => !v)}
            />
            <span className="min-w-0">
              <span className="block text-[13px] font-medium text-ink-1">
                Full access
              </span>
              <span className="block text-[12px] text-ink-3">
                Grants every permission, current and future.
              </span>
            </span>
          </label>
        </div>

        {!fullAccess && (
          <ClaimPicker
            claims={claims}
            selected={selected}
            onToggle={toggleClaim}
          />
        )}

        {error && (
          <div role="alert">
            <p className="rounded-md border border-danger/25 bg-danger/5 px-3 py-2 text-[12px] font-medium text-danger">
              {error}
            </p>
          </div>
        )}
      </div>

      <DrawerFooter className="flex-row justify-end">
        <DrawerClose
          render={
            <Button type="button" variant="outline" disabled={submitting} />
          }
        >
          Cancel
        </DrawerClose>
        <Button
          type="submit"
          disabled={submitting}
          className="v-brand-gradient text-white"
        >
          {submitting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : role ? (
            "Save changes"
          ) : (
            "Create role"
          )}
        </Button>
      </DrawerFooter>
    </form>
  );
}
