import { useState, type FormEvent } from "react";
import { useLocation, useNavigate, type Location } from "react-router";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type Field = "email" | "password";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const HEADLINE = [
  "Every",
  "document,",
  "every",
  "conversation,",
  "in",
  "sync.",
];

const inputCls =
  "h-10 w-full rounded-md border border-line-strong bg-surface px-3 text-[13px] text-ink-1 outline-none transition-colors duration-150 placeholder:text-ink-3 focus:border-brand disabled:opacity-50";

/** Left column of /login: headline, form, footer (mimics the Vantage login). */
export default function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { from?: Location } | null;
  const from = state?.from ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const next: Partial<Record<Field, string>> = {};
    if (!email.trim()) next.email = "Enter your email address.";
    else if (!EMAIL_RE.test(email.trim()))
      next.email = "Enter a valid email address.";
    if (!password) next.password = "Enter your password.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Unable to sign in. Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const clearError = (field: Field) =>
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));

  const emailInvalid = !!errors.email || !!formError;
  const passwordInvalid = !!errors.password || !!formError;

  return (
    <div>
      {/* Headline: word-level stagger */}
      <h1 className="text-[32px] leading-[38px] font-bold tracking-[-0.03em] text-ink-1">
        {HEADLINE.map((w, i) => (
          <span
            key={w}
            className="v-word inline-block"
            style={{ animationDelay: `${100 + i * 60}ms` }}
          >
            {w}
            {"\u00A0"}
          </span>
        ))}
      </h1>
      <p
        className="v-rise mt-2 text-[14px] text-ink-2"
        style={{ animationDelay: "400ms" }}
      >
        Sign in to your Velkor workspace. Your documents and conversations,
        all in one secure place.
      </p>

      <form onSubmit={onSubmit} noValidate className="mt-7">
        {/* Email */}
        <div className="v-rise" style={{ animationDelay: "480ms" }}>
          <label className="block">
            <span className="v-label mb-1.5 block">Email</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearError("email");
              }}
              aria-invalid={emailInvalid}
              aria-describedby={[
                errors.email ? "email-error" : "",
                formError ? "form-error" : "",
              ]
                .filter(Boolean)
                .join(" ") || undefined}
              className={inputCls + (emailInvalid ? " border-danger" : "")}
            />
            {errors.email && (
              <p
                id="email-error"
                role="alert"
                className="mt-1.5 text-[12px] text-danger"
              >
                {errors.email}
              </p>
            )}
          </label>
        </div>

        {/* Password */}
        <div className="v-rise mt-4" style={{ animationDelay: "560ms" }}>
          <span className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="v-label">
              Password
            </label>
            <span className="text-[12px] text-ink-3">
              Trouble signing in? Contact your admin
            </span>
          </span>
          <span className="relative block">
            <input
              id="password"
              type={showPw ? "text" : "password"}
              name="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearError("password");
              }}
              aria-invalid={passwordInvalid}
              aria-describedby={[
                errors.password ? "password-error" : "",
                formError ? "form-error" : "",
              ]
                .filter(Boolean)
                .join(" ") || undefined}
              className={
                inputCls + (passwordInvalid ? " border-danger pr-10" : " pr-10")
              }
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? "Hide password" : "Show password"}
              aria-pressed={showPw}
              className="absolute top-1/2 right-2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-sm text-ink-3 transition-colors duration-150 hover:bg-surface-2 hover:text-ink-1"
            >
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </span>
          {errors.password && (
            <p
              id="password-error"
              role="alert"
              className="mt-1.5 text-[12px] text-danger"
            >
              {errors.password}
            </p>
          )}
        </div>

        {formError && (
          <div className="v-rise mt-4" role="alert">
            <p
              id="form-error"
              className="rounded-md border border-danger/25 bg-danger/5 px-3 py-2 text-[12px] font-medium text-danger"
            >
              {formError}
            </p>
          </div>
        )}

        {/* Primary CTA: morphs to a spinner while submitting */}
        <div
          className="v-rise mt-6 flex justify-center"
          style={{ animationDelay: "620ms" }}
        >
          <button
            type="submit"
            disabled={submitting}
            className={
              "v-brand-gradient flex h-11 items-center justify-center gap-2 text-[14px] font-semibold text-white transition-all duration-300 enabled:hover:-translate-y-0.5 enabled:hover:shadow-glow active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 " +
              (submitting ? "w-11 rounded-full" : "w-full rounded-md")
            }
          >
            {submitting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              "Sign in"
            )}
          </button>
        </div>
      </form>

      {/* Footer */}
      <div
        className="v-rise mt-6 text-center"
        style={{ animationDelay: "740ms" }}
      >
        <p className="text-[13px] text-ink-2">
          Accounts are provisioned by your administrator.
        </p>
      </div>
    </div>
  );
}
