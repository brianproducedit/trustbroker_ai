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
import { ClientContractPage } from '@/pages/client/ClientContractPage'
import { ClientApplications } from '@/pages/client/ClientApplications'
import { ClientProfile } from '@/pages/client/ClientProfile'
import { ClientProfilePublic } from '@/pages/client/ClientProfilePublic'
import { FreelancerWork } from '@/pages/freelancer/FreelancerWork'
import { NotificationsPage } from '@/pages/Notifications'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

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
        path="/app/client"
        element={
          <ProtectedRoute>
            <ClientHome />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/client/contracts"
        element={
          <ProtectedRoute>
            <ClientContracts />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/client/contracts/new"
        element={
          <ProtectedRoute>
            <CreateProject />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/client/contracts/:id"
        element={
          <ProtectedRoute>
            <ClientContractPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/client/contracts/:id/applicants"
        element={
          <ProtectedRoute>
            <ClientContractPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/client/applications"
        element={
          <ProtectedRoute>
            <ClientApplications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/client/profile"
        element={
          <ProtectedRoute>
            <ClientProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/client/profile/:clientId"
        element={
          <ProtectedRoute>
            <ClientProfilePublic />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/client/operations"
        element={
          <ProtectedRoute>
            <ClientOperations />
          </ProtectedRoute>
        }
      />

      {/* Authenticated Freelancer Workspace Routes */}
      <Route
        path="/app/freelancer"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/freelancer/contracts"
        element={
          <ProtectedRoute>
            <Marketplace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/freelancer/contracts/:id"
        element={
          <ProtectedRoute>
            <ListingDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/freelancer/applications"
        element={
          <ProtectedRoute>
            <MyApplications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/freelancer/work"
        element={
          <ProtectedRoute>
            <FreelancerWork />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/freelancer/work/:id/deliver"
        element={
          <ProtectedRoute>
            <DeliveryVerification />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/freelancer/earnings"
        element={
          <ProtectedRoute>
            <FreelancerPayouts />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/freelancer/profile"
        element={
          <ProtectedRoute>
            <FreelancerProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/freelancer/operations"
        element={
          <ProtectedRoute>
            <FreelancerOperations />
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
      <Route
        path="/dashboard/create-project"
        element={
          <ProtectedRoute>
            <CreateProject />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/contracts"
        element={<Navigate to="/app/client/contracts" replace />}
      />
      <Route
        path="/dashboard/contracts/:id"
        element={
          <ProtectedRoute>
            <ContractDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/deliveries/:id"
        element={
          <ProtectedRoute>
            <DeliveryVerification />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/payouts"
        element={
          <ProtectedRoute>
            <FreelancerPayouts />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/operations"
        element={<Navigate to="/app/client/operations" replace />}
      />
      <Route
        path="/app/notifications"
        element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/notifications"
        element={<Navigate to="/app/notifications" replace />}
      />
      <Route
        path={ROUTES.ACTIVITY_HISTORY(':id')}
        element={
          <ProtectedRoute>
            <ActivityHistory />
          </ProtectedRoute>
        }
      />

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
