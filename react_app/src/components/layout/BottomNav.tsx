import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ROUTES } from '@/constants'
import { useContractStore } from '@/hooks/useContractStore'
import { useAuthStore } from '@/hooks/useAuthStore'
import { 
  LayoutGrid, 
  PlusCircle, 
  FileText, 
  History, 
  Search, 
  Inbox, 
  UploadCloud, 
  Wallet 
} from 'lucide-react'
import { cn } from '@/lib/utils'

export const BottomNav: React.FC = () => {
  const location = useLocation()
  const { activeRole } = useAuthStore()
  const { activeContractId } = useContractStore()
  const currentContractKey = activeContractId || 'contract-1'

  const clientTabs = [
    { label: 'Contracts', icon: LayoutGrid, path: ROUTES.CLIENT_CONTRACTS },
    { label: 'New Brief', icon: PlusCircle, path: ROUTES.NEW_PROJECT },
    { label: 'Contract', icon: FileText, path: ROUTES.CONTRACT_DETAIL(currentContractKey) },
    { label: 'Activity', icon: History, path: ROUTES.ACTIVITY_HISTORY(currentContractKey) },
  ]

  const freelancerTabs = [
    { label: 'Home', icon: LayoutGrid, path: ROUTES.FREELANCER_HOME },
    { label: 'Find Work', icon: Search, path: ROUTES.MARKETPLACE },
    { label: 'Apps', icon: Inbox, path: ROUTES.FREELANCER_APPLICATIONS },
    { label: 'Deliver', icon: UploadCloud, path: ROUTES.DELIVERY_VERIFICATION(currentContractKey) },
    { label: 'Earnings', icon: Wallet, path: ROUTES.FREELANCER_PAYOUTS },
  ]

  const tabs = activeRole === 'client' ? clientTabs : freelancerTabs
  const isClient = activeRole === 'client'

  const checkIsActive = (tab: { label: string; path: string }) => {
    const cur = location.pathname
    if (cur === tab.path) return true
    if (tab.label === 'Contracts' && (cur === '/dashboard' || cur === '/app/client' || cur === '/app/client/contracts')) return true
    if (tab.label === 'Home' && (cur === '/dashboard' || cur === '/app/freelancer')) return true
    if (tab.path.includes('/contracts/') && cur.includes('/contracts/')) return true
    if (tab.path.includes('/deliver') && cur.includes('/deliver')) return true
    return false
  }

  return (
    <nav 
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#0B1326]/95 backdrop-blur-md border-t border-[#222A3D] px-2 py-1.5 flex items-center justify-around md:hidden shadow-lg"
    >
      {tabs.map((tab) => {
        const isActive = checkIsActive(tab)
        const Icon = tab.icon

        return (
          <Link
            key={tab.label}
            to={tab.path}
            className={cn(
              'flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors min-w-[56px]',
              isActive
                ? isClient
                  ? 'text-blue-400 font-semibold'
                  : 'text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <Icon className={cn('w-4 h-4 mb-0.5', isActive && (isClient ? 'text-blue-400' : 'text-emerald-400'))} />
            <span className="text-[10px] tracking-tight leading-none">{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export default BottomNav
