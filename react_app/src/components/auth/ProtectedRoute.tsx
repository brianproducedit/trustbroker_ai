import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { ROUTES } from '@/constants'
import { useContractStore } from '@/hooks/useContractStore'

interface ProtectedRouteProps {
  children?: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useContractStore()
  const location = useLocation()

  if (!isAuthenticated) {
    const redirectUrl = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`${ROUTES.SIGN_IN}?redirect=${redirectUrl}`} replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
