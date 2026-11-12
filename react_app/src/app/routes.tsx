import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ROUTES } from '@/constants'
import { Landing } from '@/pages/Landing'
import { HowItWorks } from '@/pages/HowItWorks'
import { ForClients } from '@/pages/ForClients'
import { ForFreelancers } from '@/pages/ForFreelancers'
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
import { FreelancerPayouts } from '@/pages/dashboard/FreelancerPayouts'
import { Marketplace } from '@/pages/freelancer/Marketplace'
import { ListingDetail } from '@/pages/freelancer/ListingDetail'
import { MyApplications } from '@/pages/freelancer/MyApplications'
import { FreelancerProfile } from '@/pages/freelancer/FreelancerProfile'
import { ClientOperations } from '@/pages/client/ClientOperations'
import { FreelancerOperations } from '@/pages/freelancer/FreelancerOperations'
import { ClientHome } from '@/pages/client/ClientHome'
import { ClientContracts } from '@/pages/client/ClientContracts'
import { ClientApplications } from '@/pages/client/ClientApplications'
import { ClientProfile } from '@/pages/client/ClientProfile'
import { ClientProfilePublic } from '@/pages/client/ClientProfilePublic'
import { ClientPayoutsPage } from '@/pages/client/ClientPayoutsPage'
import { FreelancerWork } from '@/pages/freelancer/FreelancerWork'
import { FreelancerContracts } from '@/pages/freelancer/FreelancerContracts'
import { NotificationsPage } from '@/pages/Notifications'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

// AG Studio is heavy (enterprise grid + charts + AI module), so its routes are code-split.
const ClientStudio = React.lazy(() => import('@/pages/client/ClientStudio'))
const FreelancerStudio = React.lazy(() => import('@/pages/freelancer/FreelancerStudio'))

const StudioFallback: React.FC = () => (
  <div className="flex items-center justify-center h-[60vh]">
    <LoadingSpinner size="lg" text="Loading AG Studio…" />
  </div>
)

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Pages (Light Theme) */}
      <Route path={ROUTES.HOME} element={<Landing />} />
      <Route path={ROUTES.HOW_IT_WORKS} element={<HowItWorks />} />
      <Route path={ROUTES.FOR_CLIENTS} element={<ForClients />} />
      <Route path={ROUTES.FOR_FREELANCERS} element={<ForFreelancers />} />
      <Route path={ROUTES.DEVELOPER_PORTAL} element={<DeveloperPortal />} />
      <Route path={ROUTES.SIGN_IN} element={<SignIn />} />
      <Route path={ROUTES.SIGN_UP} element={<SignUp />} />
      <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
      <Route path={ROUTES.RESET_PASSWORD} element={<ResetPassword />} />
      <Route path={ROUTES.VERIFY_EMAIL} element={<VerifyEmail />} />

      {/* Authenticated Client Workspace Routes */}
      <Route
        path={ROUTES.CLIENT_HOME}
        element={
          <ProtectedRoute>
            <ClientHome />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.CLIENT_CONTRACTS}
        element={
          <ProtectedRoute>
            <ClientContracts />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.CLIENT_NEW_CONTRACT}
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
        path={ROUTES.CONTRACT_APPLICANTS(':id')}
        element={
          <ProtectedRoute>
            <ContractDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.CLIENT_REVIEW(':id')}
        element={
          <ProtectedRoute>
            <DeliveryVerification />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/client/deliveries/:id"
        element={
          <ProtectedRoute>
            <DeliveryVerification />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.CLIENT_APPLICATIONS}
        element={
          <ProtectedRoute>
            <ClientApplications />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.CLIENT_PROFILE}
        element={
          <ProtectedRoute>
            <ClientProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.CLIENT_PROFILE_PUBLIC(':clientId')}
        element={
          <ProtectedRoute>
            <ClientProfilePublic />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.CLIENT_OPERATIONS}
        element={
          <ProtectedRoute>
            <ClientOperations />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.CLIENT_STUDIO}
        element={
          <ProtectedRoute>
            <React.Suspense fallback={<StudioFallback />}>
              <ClientStudio />
            </React.Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.CLIENT_PAYOUTS}
        element={
          <ProtectedRoute>
            <ClientPayoutsPage />
          </ProtectedRoute>
        }
      />

      {/* Authenticated Freelancer Workspace Routes */}
      <Route
        path={ROUTES.FREELANCER_HOME}
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.MARKETPLACE}
        element={
          <ProtectedRoute>
            <Marketplace />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.LISTING_DETAIL(':id')}
        element={
          <ProtectedRoute>
            <ListingDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.FREELANCER_APPLICATIONS}
        element={
          <ProtectedRoute>
            <MyApplications />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.FREELANCER_CONTRACTS}
        element={
          <ProtectedRoute>
            <FreelancerContracts />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.FREELANCER_WORK}
        element={
          <ProtectedRoute>
            <FreelancerWork />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.FREELANCER_DELIVER(':id')}
        element={
          <ProtectedRoute>
            <DeliveryVerification />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.FREELANCER_PAYOUTS}
        element={
          <ProtectedRoute>
            <FreelancerPayouts />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.FREELANCER_PROFILE}
        element={
          <ProtectedRoute>
            <FreelancerProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.FREELANCER_OPERATIONS}
        element={
          <ProtectedRoute>
            <FreelancerOperations />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.FREELANCER_STUDIO}
        element={
          <ProtectedRoute>
            <React.Suspense fallback={<StudioFallback />}>
              <FreelancerStudio />
            </React.Suspense>
          </ProtectedRoute>
        }
      />

      {/* Legacy / Shared Dashboard Routes (backward-compatible) */}
      <Route
        path={ROUTES.DASHBOARD}
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      {/* Legacy dashboard paths — redirect to canonical portals */}
      <Route path="/dashboard/create-project" element={<Navigate to="/app/client/contracts/new" replace />} />
      <Route path="/dashboard/contracts" element={<Navigate to="/app/client/contracts" replace />} />
      <Route path="/dashboard/contracts/:id" element={<Navigate to="/app/client/contracts/:id" replace />} />
      <Route path="/dashboard/deliveries/:id" element={<Navigate to="/app/freelancer/work/:id/deliver" replace />} />
      <Route path="/dashboard/payouts" element={<Navigate to="/app/freelancer/earnings" replace />} />
      <Route path="/dashboard/operations" element={<Navigate to="/app/client/operations" replace />} />
      <Route
        path={ROUTES.NOTIFICATIONS}
        element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/notifications"
        element={<Navigate to={ROUTES.NOTIFICATIONS} replace />}
      />
      <Route
        path={ROUTES.ACTIVITY_HISTORY(':id')}
        element={
          <ProtectedRoute>
            <ActivityHistory />
          </ProtectedRoute>
        }
      />
      {/* Legacy activity path redirect */}
      <Route path="/dashboard/activity/:id" element={<Navigate to="/app/activity/:id" replace />} />

      {/* Backwards Compatibility / Legacy URL Redirects */}
      <Route path="/create-project" element={<Navigate to="/app/client/contracts/new" replace />} />
      <Route path="/contract/:id" element={<Navigate to="/app/client/contracts/:id" replace />} />
      <Route path="/deliver/:id" element={<Navigate to="/app/freelancer/work/:id/deliver" replace />} />

      {/* Catch-all Fallback */}
      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  )
}

export default AppRoutes
