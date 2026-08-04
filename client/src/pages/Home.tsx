import { Link } from 'react-router'
import BrandMark from '../components/BrandMark'

export default function Home() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 bg-background px-6 text-foreground">
      <BrandMark />
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Velkor</h1>
        <p className="mt-2 text-sm text-muted-foreground">Placeholder home page.</p>
      </div>
      <Link
        to="/login"
        className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
      >
        Go to login
      </Link>
    </main>
  )
}
