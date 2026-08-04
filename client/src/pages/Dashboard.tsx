import { useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { Logout01Icon } from '@hugeicons/core-free-icons'
import BrandMark from '../components/BrandMark'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-8 bg-background px-6 text-foreground">
      <BrandMark />

      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Welcome, {user?.fullName}
        </h1>
        <p className="mt-2 text-[15px] text-muted-foreground">{user?.email}</p>
      </div>

      <button
        onClick={handleLogout}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-background px-6 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
      >
        <HugeiconsIcon icon={Logout01Icon} className="size-[18px]" />
        Sign out
      </button>
    </main>
  )
}
