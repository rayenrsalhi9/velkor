import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { EyeIcon, EyeOffIcon, LoadingIcon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getInitials } from "@/lib/initials";
import PasswordStrength from "@/components/PasswordStrength";
import { useAuth } from "@/context/auth";
import { updateMe } from "@/lib/api";

export default function ProfilePage() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [nameError, setNameError] = useState<string | null>(null);
  const [savingName, setSavingName] = useState(false);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  const passwordActive = password.length > 0;
  const nameDirty = fullName.trim() !== (user?.fullName ?? "");
  const passwordsMatch = password !== "" && password === confirm;
  const passwordValid = password.length >= 8;

  const saveName = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = fullName.trim();
    if (!trimmed) {
      setNameError("Enter your full name.");
      return;
    }
    setSavingName(true);
    setNameError(null);
    try {
      const profile = await updateMe({ fullName: trimmed });
      setUser(profile);
      toast.success("Profile updated");
    } catch (err) {
      setNameError(
        err instanceof Error ? err.message : "Something went wrong. Try again.",
      );
    } finally {
      setSavingName(false);
    }
  };

  const savePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (!passwordValid) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setConfirmError("Passwords don't match.");
      return;
    }
    setSavingPassword(true);
    setPasswordError(null);
    setConfirmError(null);
    try {
      await updateMe({ password });
      toast.success("Password changed", {
        description: "You'll need to sign in again.",
      });
      logout();
      navigate("/login");
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : "Something went wrong. Try again.",
      );
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="v-card p-5">
          <h2 className="text-[16px] font-semibold leading-6 tracking-[-0.01em] text-ink-1">
            Profile
          </h2>
          <p className="mt-0.5 text-[12px] leading-4 text-ink-3">
            Your personal details across Velkor.
          </p>

          <form onSubmit={saveName} className="mt-4" noValidate>
            <div className="flex items-start gap-4">
              <span
                className="v-brand-gradient grid h-14 w-14 shrink-0 place-items-center rounded-full text-[16px] font-semibold text-white ring-2 ring-brand-soft"
                aria-hidden="true"
              >
                {getInitials(user?.fullName ?? "")}
              </span>
              <div className="grid min-w-0 flex-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="profile-fullName"
                    className="v-label mb-1.5 block"
                  >
                    Full name
                  </label>
                  <Input
                    id="profile-fullName"
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
                  <label
                    htmlFor="profile-email"
                    className="v-label mb-1.5 block"
                  >
                    Email
                  </label>
                  <Input
                    id="profile-email"
                    type="email"
                    value={user?.email ?? ""}
                    disabled
                  />
                  <p className="mt-1.5 text-[12px] text-ink-3">
                    Email can't be changed.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end border-t border-line pt-4">
              <Button
                type="submit"
                disabled={!nameDirty || savingName}
              >
                {savingName ? (
                  <HugeiconsIcon icon={LoadingIcon} size={16} className="animate-spin" />
                ) : (
                  "Save changes"
                )}
              </Button>
            </div>
          </form>
        </section>

        <section className="v-card p-5">
          <h2 className="text-[16px] font-semibold leading-6 tracking-[-0.01em] text-ink-1">
            Password
          </h2>
          <p className="mt-0.5 text-[12px] leading-4 text-ink-3">
            Change the password you use to sign in. You'll be signed out and
            need to log in again.
          </p>

          <form onSubmit={savePassword} className="mt-4" noValidate>
            <div className="max-w-md space-y-4">
              <div>
                <label
                  htmlFor="profile-password"
                  className="v-label mb-1.5 block"
                >
                  New password
                </label>
                <div className="relative">
                  <Input
                    id="profile-password"
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
                    placeholder="At least 8 characters"
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
                    {showPassword ? <HugeiconsIcon icon={EyeOffIcon} size={14} /> : <HugeiconsIcon icon={EyeIcon} size={14} />}
                  </button>
                </div>
                {passwordError && (
                  <p role="alert" className="mt-1.5 text-[12px] text-danger">
                    {passwordError}
                  </p>
                )}
                {passwordActive && <PasswordStrength password={password} />}
              </div>

              <div>
                <label
                  htmlFor="profile-password-confirm"
                  className="v-label mb-1.5 block"
                >
                  Confirm password
                </label>
                <div className="relative">
                  <Input
                    id="profile-password-confirm"
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
                    {showPassword ? <HugeiconsIcon icon={EyeOffIcon} size={14} /> : <HugeiconsIcon icon={EyeIcon} size={14} />}
                  </button>
                </div>
                {confirmError && (
                  <p role="alert" className="mt-1.5 text-[12px] text-danger">
                    {confirmError}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 flex justify-end border-t border-line pt-4">
              <Button
                type="submit"
                disabled={
                  !passwordActive || !passwordsMatch || !passwordValid || savingPassword
                }
              >
                {savingPassword ? (
                  <HugeiconsIcon icon={LoadingIcon} size={16} className="animate-spin" />
                ) : (
                  "Update password"
                )}
              </Button>
            </div>
          </form>
        </section>
      </div>
  );
}
