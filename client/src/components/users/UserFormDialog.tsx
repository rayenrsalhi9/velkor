import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import PasswordStrength from "@/components/PasswordStrength";
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
import type { User } from "@/lib/api";
import RoleCombobox from "@/components/users/RoleCombobox";

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSaved: () => void;
}

export default function UserFormDialog({
  open,
  onOpenChange,
  user,
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
          onSaved={onSaved}
          onOpenChange={onOpenChange}
        />
      </DialogContent>
    </Dialog>
  );
}

function UserForm({
  user,
  onSaved,
  onOpenChange,
}: Omit<UserFormDialogProps, "open">) {
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [roleId, setRoleId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const passwordActive = password.length > 0;

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setNameError("Enter the user's full name.");
      return;
    }
    const trimmedEmail = email.trim();
    if (!user) {
      if (!trimmedEmail) {
        setEmailError("Enter the user's company email.");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        setEmailError("Enter a valid email address.");
        return;
      }
    }
    if (password.length > 0 && password.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }
    if (!user && password.length === 0) {
      setPasswordError("Enter a password.");
      return;
    }
    if (passwordActive && password !== confirm) {
      setConfirmError("Passwords don't match.");
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
    setPasswordError(null);
    setConfirmError(null);
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
        <div className="relative">
          <Input
            id="user-password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordError(null);
              setConfirmError(null);
              if (!e.target.value) {
                setConfirm("");
              }
            }}
            placeholder={user ? "Leave blank to keep current" : "At least 8 characters"}
            aria-invalid={!!passwordError}
            className={cn("pr-9", passwordError && "border-danger")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="absolute top-1/2 right-2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded text-ink-3 transition-colors hover:text-ink-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        {passwordError && (
          <p role="alert" className="mt-1.5 text-[12px] text-danger">
            {passwordError}
          </p>
        )}

        {(user ? passwordActive : true) && (
          <>
            <PasswordStrength password={password} />

            <div className="mt-3">
              <Label
                htmlFor="user-password-confirm"
                className="v-label mb-1.5 block"
              >
                Confirm password
              </Label>
              <div className="relative">
                <Input
                  id="user-password-confirm"
                  type={showPassword ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => {
                    setConfirm(e.target.value);
                    setConfirmError(null);
                  }}
                  placeholder="Re-enter the password"
                  aria-invalid={!!confirmError}
                  className={cn("pr-9", confirmError && "border-danger")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute top-1/2 right-2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded text-ink-3 transition-colors hover:text-ink-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {confirmError && (
                <p role="alert" className="mt-1.5 text-[12px] text-danger">
                  {confirmError}
                </p>
              )}
            </div>
          </>
        )}
      </div>

      <div>
        <Label htmlFor="user-role" className="v-label mb-1.5 block">
          Role
        </Label>
        <RoleCombobox
          value={roleId}
          initialRoleName={user?.role}
          onChange={setRoleId}
        />
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
