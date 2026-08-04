import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate, useLocation } from 'react-router'
import './index.css'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute.tsx'
import Home from './pages/Home.tsx'
import Login from './pages/Login.tsx'
import Dashboard from './pages/Dashboard.tsx'

function LoginRoute() {
  const { user, loading } = useAuth()
  const from = (useLocation().state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/dashboard'
  if (loading) return null
  if (user) return <Navigate to={from} replace />
  return <Login />
}

const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/login', element: <LoginRoute /> },
  {
    path: '/dashboard',
    element: <ProtectedRoute />,
    children: [{ index: true, element: <Dashboard /> }],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
)
