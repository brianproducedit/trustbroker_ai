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
import { Dashboard } from '@/pages/Dashboard'
import { CreateProject } from '@/pages/dashboard/CreateProject'
import { ContractDetail } from '@/pages/ContractDetail'
import { DeliveryVerification } from '@/pages/DeliveryVerification'
import { ActivityHistory } from '@/pages/ActivityHistory'
import { SupplierPayouts } from '@/pages/dashboard/SupplierPayouts'

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Pages (Light Theme) */}
      <Route path={ROUTES.HOME} element={<Landing />} />
      <Route path={ROUTES.HOW_IT_WORKS} element={<HowItWorks />} />
      <Route path={ROUTES.FOR_BUYERS} element={<ForBuyers />} />
      <Route path={ROUTES.FOR_SUPPLIERS} element={<ForSuppliers />} />
      <Route path={ROUTES.DEVELOPER_PORTAL} element={<DeveloperPortal />} />
      <Route path={ROUTES.SIGN_IN} element={<SignIn />} />
      <Route path={ROUTES.SIGN_UP} element={<SignUp />} />

      {/* Authenticated Dashboard Pages (Dark Shell Theme) */}
      <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
      <Route path={ROUTES.NEW_PROJECT} element={<CreateProject />} />
      <Route path={ROUTES.CONTRACT_DETAIL(':id')} element={<ContractDetail />} />
      <Route path={ROUTES.DELIVERY_VERIFICATION(':id')} element={<DeliveryVerification />} />
      <Route path={ROUTES.ACTIVITY_HISTORY(':id')} element={<ActivityHistory />} />
      <Route path={ROUTES.SUPPLIER_PAYOUTS} element={<SupplierPayouts />} />

      {/* Backwards Compatibility / Legacy URL Redirects */}
      <Route path="/create-project" element={<Navigate to={ROUTES.NEW_PROJECT} replace />} />
      <Route path="/contract/:id" element={<ContractDetail />} />
      <Route path="/deliver/:id" element={<DeliveryVerification />} />
      <Route path="/contract/:id/activity" element={<ActivityHistory />} />

      {/* Catch-all Fallback */}
      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  )
}

