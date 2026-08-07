import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createUser, updateUser, ApiError } from "@/lib/api";
import type { Role, User } from "@/lib/api";

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  roles: Role[];
  onSaved: () => void;
}

export default function UserFormDialog({
  open,
  onOpenChange,
  user,
  roles,
  onSaved,
}: UserFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{user ? "Edit user" : "New user"}</DialogTitle>
          <DialogDescription>
            {user
              ? "Update the user's name, role, or password."
              : "Create a user account with a company email."}
          </DialogDescription>
        </DialogHeader>
        <UserForm
          key={`${user?.id ?? "new"}:${open}`}
          user={user}
          roles={roles}
          onSaved={onSaved}
          onOpenChange={onOpenChange}
        />
      </DialogContent>
    </Dialog>
  );
}

function UserForm({
  user,
  roles,
  onSaved,
  onOpenChange,
}: Omit<UserFormDialogProps, "open">) {
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState(
    () => roles.find((role) => role.name === user?.role)?.id ?? "",
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setNameError("Enter the user's full name.");
      return;
    }
    if (!user && !email.trim()) {
      setEmailError("Enter the user's company email.");
      return;
    }
    if (!roleId) {
      setError("Select a role for this user.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setNameError(null);
    setEmailError(null);
    try {
      if (user) {
        await updateUser(user.id, {
          fullName: trimmedName,
          roleId,
          ...(password ? { password } : {}),
        });
      } else {
        await createUser({
          fullName: trimmedName,
          email: email.trim(),
          password,
          roleId,
        });
      }
      toast.success(user ? "User updated" : "User created", {
        description: trimmedName,
      });
      onOpenChange(false);
      onSaved();
    } catch (err) {
      if (
        err instanceof ApiError &&
        err.status === 409 &&
        err.message.toLowerCase().includes("email")
      ) {
        setEmailError(err.message);
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
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <div>
        <Label htmlFor="user-fullName" className="v-label mb-1.5 block">
          Full name
        </Label>
        <Input
          id="user-fullName"
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
            setNameError(null);
          }}
          placeholder="e.g. Jane Doe"
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
        <Label htmlFor="user-email" className="v-label mb-1.5 block">
          Email
        </Label>
        <Input
          id="user-email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setEmailError(null);
          }}
          placeholder="name@velkor.local"
          disabled={!!user}
          aria-invalid={!!emailError}
          className={emailError ? "border-danger" : ""}
        />
        {user ? (
          <p className="mt-1.5 text-[12px] text-ink-3">
            Email can't be changed.
          </p>
        ) : (
          emailError && (
            <p role="alert" className="mt-1.5 text-[12px] text-danger">
              {emailError}
            </p>
          )
        )}
      </div>

      <div>
        <Label htmlFor="user-password" className="v-label mb-1.5 block">
          {user ? "New password" : "Password"}
        </Label>
        <Input
          id="user-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={user ? "Leave blank to keep current" : "At least 8 characters"}
        />
      </div>

      <div>
        <Label htmlFor="user-role" className="v-label mb-1.5 block">
          Role
        </Label>
        <select
          id="user-role"
          value={roleId}
          onChange={(e) => setRoleId(e.target.value)}
          className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2 text-sm text-ink-1 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="" disabled>
            Select a role
          </option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div role="alert">
          <p className="rounded-md border border-danger/25 bg-danger/5 px-3 py-2 text-[12px] font-medium text-danger">
            {error}
          </p>
        </div>
      )}

      <DialogFooter>
        <DialogClose
          render={<Button type="button" variant="outline" disabled={submitting} />}
        >
          Cancel
        </DialogClose>
        <Button
          type="submit"
          disabled={submitting}
          className="v-brand-gradient text-white"
        >
          {submitting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : user ? (
            "Save changes"
          ) : (
            "Create user"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}
