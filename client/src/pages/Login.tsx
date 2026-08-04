import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { EyeIcon, EyeClosedIcon, Loading01Icon } from '@hugeicons/core-free-icons'
import BrandMark from '../components/BrandMark'
import { useAuth } from '../context/AuthContext'

type Field = 'email' | 'password'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Login() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const validate = () => {
    const next: Partial<Record<Field, string>> = {}
    if (!email.trim()) next.email = 'Enter your email address.'
    else if (!EMAIL_RE.test(email.trim())) next.email = 'Enter a valid email address.'
    if (!password) next.password = 'Enter your password.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    setFormError(null)
    try {
      await login(email.trim(), password)
      navigate('/dashboard')
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to sign in. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (user) return null

  const clearError = (field: Field) =>
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev))

  const inputBase =
    'h-11 w-full rounded-lg border bg-background px-3.5 text-sm text-foreground placeholder:text-muted-foreground/70 transition-colors focus:outline-none focus:ring-2'
  const inputNormal =
    'border-input shadow-sm focus:border-indigo-500 focus:ring-indigo-500/25'
  const inputError =
    'border-red-500 focus:border-red-500 focus:ring-red-500/25'

  return (
    <main className="relative flex min-h-[100dvh] flex-col items-center justify-center px-6 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(42rem_28rem_at_50%_-8%,var(--color-primary),transparent_65%)] opacity-[0.05]"
      />

      <div className="w-full max-w-[26rem]">
        <div className="flex flex-col items-center gap-3">
          <BrandMark />
          <div className="mt-4 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Sign in to Velkor
            </h1>
            <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
              Your team's documents and conversations, in one secure place.
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} noValidate className="mt-9 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                clearError('email')
              }}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
              className={`${inputBase} ${errors.email ? inputError : inputNormal}`}
            />
            {errors.email && (
              <p id="email-error" role="alert" className="text-sm text-red-600">
                {errors.email}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </label>
              <span className="text-xs text-muted-foreground">Trouble signing in? Contact your admin</span>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  clearError('password')
                }}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
                className={`${inputBase} ${errors.password ? inputError : inputNormal} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((show) => !show)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                className="absolute top-1/2 right-3.5 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <HugeiconsIcon icon={showPassword ? EyeClosedIcon : EyeIcon} className="size-5" />
              </button>
            </div>
            {errors.password && (
              <p id="password-error" role="alert" className="text-sm text-red-600">
                {errors.password}
              </p>
            )}
          </div>

          {formError && (
            <p
              role="alert"
              className="flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700"
            >
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 active:bg-primary/85 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <HugeiconsIcon icon={Loading01Icon} className="size-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Accounts are provisioned by your administrator.
        </p>
      </div>
    </main>
  )
}
