import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { ROUTES } from '@/constants'
import { useAuthStore } from '@/hooks/useAuthStore'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children?: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, initialized } = useAuthStore()
  const location = useLocation()

  // Wait for auth initialization before redirecting
  if (isLoading || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0C111D]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="text-sm font-medium">Verifying authorization...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    const redirectUrl = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`${ROUTES.SIGN_IN}?redirect=${redirectUrl}`} replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
