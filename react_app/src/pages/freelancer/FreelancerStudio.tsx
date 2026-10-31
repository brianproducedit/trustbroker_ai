import React, { useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useContractStore } from '@/hooks/useContractStore'
import { StudioDashboard } from '@/components/operations/StudioDashboard'
import { AgStudioProvider } from 'ag-studio-react'
import { AgStudioAiModule } from 'ag-studio'
import { AG_STUDIO_LICENSE_KEY } from '@/lib/agLicense'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

export const FreelancerStudio: React.FC = () => {
  const { contracts, fetchContracts, isLoading } = useContractStore()

  useEffect(() => {
    fetchContracts()
  }, [fetchContracts])

  return (
    <AgStudioProvider licenseKey={AG_STUDIO_LICENSE_KEY} modules={[AgStudioAiModule]}>
      <DashboardLayout>
        {isLoading && contracts.length === 0 ? (
          <LoadingSpinner size="lg" text="Loading AG Studio…" />
        ) : (
          <StudioDashboard contracts={contracts} workspace="freelancer" />
        )}
      </DashboardLayout>
    </AgStudioProvider>
  )
}

export default FreelancerStudio
