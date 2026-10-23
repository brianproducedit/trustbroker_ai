import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ROUTES } from '@/constants'
import { Landing } from '@/pages/Landing'
import { SignIn } from '@/pages/SignIn'
import { SignUp } from '@/pages/SignUp'
import { Dashboard } from '@/pages/Dashboard'
import { ContractDetail } from '@/pages/ContractDetail'
import { DeliveryVerification } from '@/pages/DeliveryVerification'
import { ActivityHistory } from '@/pages/ActivityHistory'
import { DeveloperPortal } from '@/pages/DeveloperPortal'

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path={ROUTES.HOME} element={<Landing />} />
      <Route path={ROUTES.SIGN_IN} element={<SignIn />} />
      <Route path={ROUTES.SIGN_UP} element={<SignUp />} />
      <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
      <Route path={ROUTES.NEW_PROJECT} element={<Landing />} />
      <Route path="/contract/:id" element={<ContractDetail />} />
      <Route path="/deliver/:id" element={<DeliveryVerification />} />
      <Route path="/contract/:id/activity" element={<ActivityHistory />} />
      <Route path={ROUTES.DEVELOPER_PORTAL} element={<DeveloperPortal />} />
      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  )
}
