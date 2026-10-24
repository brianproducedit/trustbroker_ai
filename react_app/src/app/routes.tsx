import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ROUTES } from '@/constants'
import { Landing } from '@/pages/Landing'
import { HowItWorks } from '@/pages/HowItWorks'
import { ForBuyers } from '@/pages/ForBuyers'
import { ForSuppliers } from '@/pages/ForSuppliers'
import { DeveloperPortal } from '@/pages/DeveloperPortal'
import { SignIn } from '@/pages/SignIn'
import { SignUp } from '@/pages/SignUp'
import { ForgotPassword } from '@/pages/ForgotPassword'
import { ResetPassword } from '@/pages/ResetPassword'
import { VerifyEmail } from '@/pages/VerifyEmail'
import { Dashboard } from '@/pages/Dashboard'
import { CreateProject } from '@/pages/dashboard/CreateProject'
import { ContractDetail } from '@/pages/ContractDetail'
import { DeliveryVerification } from '@/pages/DeliveryVerification'
import { ActivityHistory } from '@/pages/ActivityHistory'
import { SupplierPayouts } from '@/pages/dashboard/SupplierPayouts'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Pages (Light Theme) */}
      <Route path={ROUTES.HOME} element={<Landing />} />
      <Route path={ROUTES.HOW_IT_WORKS} element={<HowItWorks />} />
      <Route path={ROUTES.FOR_CLIENTS} element={<ForBuyers />} />
      <Route path={ROUTES.FOR_FREELANCERS} element={<ForSuppliers />} />
      <Route path={ROUTES.DEVELOPER_PORTAL} element={<DeveloperPortal />} />
      <Route path={ROUTES.SIGN_IN} element={<SignIn />} />
      <Route path={ROUTES.SIGN_UP} element={<SignUp />} />
      <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
      <Route path={ROUTES.RESET_PASSWORD} element={<ResetPassword />} />
      <Route path={ROUTES.VERIFY_EMAIL} element={<VerifyEmail />} />

      {/* Authenticated Dashboard Pages (Protected Dark Shell Theme) */}
      <Route
        path={ROUTES.DASHBOARD}
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.NEW_PROJECT}
        element={
          <ProtectedRoute>
            <CreateProject />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.CONTRACT_DETAIL(':id')}
        element={
          <ProtectedRoute>
            <ContractDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.DELIVERY_VERIFICATION(':id')}
        element={
          <ProtectedRoute>
            <DeliveryVerification />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.ACTIVITY_HISTORY(':id')}
        element={
          <ProtectedRoute>
            <ActivityHistory />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.SUPPLIER_PAYOUTS}
        element={
          <ProtectedRoute>
            <SupplierPayouts />
          </ProtectedRoute>
        }
      />

      {/* Backwards Compatibility / Legacy URL Redirects */}
      <Route path="/create-project" element={<Navigate to={ROUTES.NEW_PROJECT} replace />} />
      <Route path="/contract/:id" element={<Navigate to="/dashboard/contracts/:id" replace />} />
      <Route path="/deliver/:id" element={<Navigate to="/dashboard/deliveries/:id" replace />} />

      {/* Catch-all Fallback */}
      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  )
}

export default AppRoutes
