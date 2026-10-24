import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Logo } from '@/components/common/Logo'
import { ROUTES } from '@/constants'
import { useContractStore } from '@/hooks/useContractStore'
import { 
  LayoutGrid, 
  FilePlus, 
  FileText, 
  CheckSquare, 
  History, 
  Code2, 
  UserCircle2, 
  ArrowLeftRight,
  UploadCloud,
  Wallet,
  LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  currentRole: 'buyer' | 'supplier'
  onToggleRole: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ currentRole, onToggleRole }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { signOut } = useContractStore()

  const handleSignOut = () => {
    signOut()
    navigate(ROUTES.SIGN_IN)
  }

  // Distinct nav configurations tailored to the persona
  const buyerNavItems = [
    { label: 'Active Procurements', icon: LayoutGrid, path: ROUTES.DASHBOARD },
    { label: 'Create SOW & Hire', icon: FilePlus, path: ROUTES.NEW_PROJECT },
    { label: 'Contracts & Escrow Reserves', icon: FileText, path: ROUTES.CONTRACT_DETAIL('contract-1') },
    { label: 'Inspect Deliverables & Gate', icon: CheckSquare, path: ROUTES.DELIVERY_VERIFICATION('contract-1') },
    { label: 'Audit Activity Log', icon: History, path: ROUTES.ACTIVITY_HISTORY('contract-1') },
    { label: 'Developer & API', icon: Code2, path: ROUTES.DEVELOPER_PORTAL },
  ]

  const supplierNavItems = [
    { label: 'Active Client Jobs', icon: LayoutGrid, path: ROUTES.DASHBOARD },
    { label: 'Incoming SOWs to Accept', icon: FileText, path: ROUTES.CONTRACT_DETAIL('contract-1') },
    { label: 'Submit Deliverable Evidence', icon: UploadCloud, path: ROUTES.DELIVERY_VERIFICATION('contract-1') },
    { label: 'PayPal Payouts & Earnings', icon: Wallet, path: ROUTES.SUPPLIER_PAYOUTS },
    { label: 'Audit Activity Log', icon: History, path: ROUTES.ACTIVITY_HISTORY('contract-1') },
    { label: 'Developer & API', icon: Code2, path: ROUTES.DEVELOPER_PORTAL },
  ]

  const navItems = currentRole === 'buyer' ? buyerNavItems : supplierNavItems

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#0B1326] border-r border-[#222A3D] z-50 flex flex-col justify-between select-none">
      {/* Top Header */}
      <div className="flex flex-col">
        <div className="h-16 px-4 flex items-center justify-between border-b border-[#222A3D] bg-[#060E20]">
          <Logo isDark hideSubtitle={false} />
        </div>

        {/* Navigation Section */}
        <div className="py-3 px-3">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold px-2 mb-2 block">
            {currentRole === 'buyer' ? 'Client Procurement Portal' : 'Supplier Delivery Portal'}
          </span>
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              const Icon = item.icon
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs transition-all',
                    isActive
                      ? currentRole === 'buyer'
                        ? 'bg-blue-600/20 text-blue-400 font-semibold border-l-2 border-blue-500 shadow-sm'
                        : 'bg-emerald-600/20 text-emerald-400 font-semibold border-l-2 border-emerald-500 shadow-sm'
                      : 'text-[#ACB9D2] hover:bg-[#171F33] hover:text-white'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-4 h-4 flex-shrink-0',
                      isActive 
                        ? currentRole === 'buyer' ? 'text-blue-400' : 'text-emerald-400'
                        : 'text-slate-400'
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Role & Sandbox Status */}
      <div className="p-3 border-t border-[#222A3D] flex flex-col gap-2.5 bg-[#060E20]">
        {/* Active Role Card */}
        <div
          className={cn(
            'p-3 rounded-lg border flex flex-col gap-1.5 transition-all',
            currentRole === 'buyer'
              ? 'bg-[#171F33] border-blue-900/40'
              : 'bg-[#132328] border-emerald-900/40'
          )}
        >
          <div className="flex items-center justify-between">
            <span
              className={cn(
                'font-mono text-[10px] uppercase tracking-wider font-semibold',
                currentRole === 'buyer' ? 'text-blue-400' : 'text-emerald-400'
              )}
            >
              {currentRole === 'buyer' ? 'Buyer Mode' : 'Supplier Mode'}
            </span>
            <button
              onClick={onToggleRole}
              type="button"
              className={cn(
                'inline-flex items-center gap-1 font-mono text-[10px] transition-colors uppercase font-medium px-2 py-0.5 rounded border',
                currentRole === 'buyer'
                  ? 'bg-blue-950/80 text-blue-300 hover:text-white border-blue-800/60'
                  : 'bg-emerald-950/80 text-emerald-300 hover:text-white border-emerald-800/60'
              )}
              title="Toggle between Buyer and Supplier portal views"
            >
              <ArrowLeftRight className="w-2.5 h-2.5" />
              <span>Switch Persona</span>
            </button>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <UserCircle2
              className={cn(
                'w-4 h-4 flex-shrink-0',
                currentRole === 'buyer' ? 'text-blue-400' : 'text-emerald-400'
              )}
            />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-white truncate">
                {currentRole === 'buyer' ? 'Elena Rostova (Client)' : 'Tariro Moyo (Freelancer)'}
              </span>
              <span className="text-[10px] text-slate-400 truncate">
                {currentRole === 'buyer' ? 'Acme Global Org (USA)' : 'DevStudio Harare (ZW)'}
              </span>
            </div>
          </div>
        </div>

        {/* PayPal Sandbox Status */}
        <div className="flex items-center justify-between px-2 py-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px] text-slate-300">PayPal Sandbox</span>
          </div>
          <span className="font-mono text-[10px] font-semibold text-emerald-400 uppercase tracking-wide">
            Connected
          </span>
        </div>

        {/* Sign Out Action Button */}
        <button
          onClick={handleSignOut}
          type="button"
          className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-[#171F33] border border-[#222A3D] transition-all group"
          title="Sign out of current account"
        >
          <LogOut className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-400 transition-colors" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
