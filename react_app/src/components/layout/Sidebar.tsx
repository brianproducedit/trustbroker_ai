import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Logo } from '@/components/common/Logo'
import { ROUTES } from '@/constants'
import { 
  LayoutGrid, 
  FilePlus, 
  FileText, 
  CheckSquare, 
  History, 
  Code2, 
  UserCircle2, 
  ArrowLeftRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  currentRole: 'buyer' | 'supplier'
  onToggleRole: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ currentRole, onToggleRole }) => {
  const location = useLocation()

  const navItems = [
    { label: 'Dashboard', icon: LayoutGrid, path: ROUTES.DASHBOARD },
    { label: 'New Project', icon: FilePlus, path: ROUTES.NEW_PROJECT },
    { label: 'Contracts & SOWs', icon: FileText, path: ROUTES.CONTRACT_DETAIL('TB-2026-084') },
    { label: 'Deliveries & Evidence', icon: CheckSquare, path: ROUTES.DELIVERY_VERIFICATION('TB-2026-084') },
    { label: 'Activity & Audit Log', icon: History, path: ROUTES.ACTIVITY_HISTORY('TB-2026-084') },
    { label: 'Developer & API', icon: Code2, path: ROUTES.DEVELOPER_PORTAL },
  ]

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#0B1326] border-r border-[#222A3D] z-50 flex flex-col justify-between select-none">
      {/* Top Header */}
      <div className="flex flex-col">
        <div className="h-16 px-4 flex items-center justify-between border-b border-[#222A3D] bg-[#060E20]">
          <Logo isDark hideSubtitle={false} />
        </div>

        {/* Navigation */}
        <nav className="flex flex-col py-3 px-2 gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            const Icon = item.icon
            return (
              <Link
                key={item.label}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 font-semibold border-l-2 border-blue-500 shadow-sm'
                    : 'text-[#ACB9D2] hover:bg-[#171F33] hover:text-white'
                )}
              >
                <Icon className={cn('w-4 h-4', isActive ? 'text-blue-400' : 'text-slate-400')} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Bottom Role & Sandbox Status */}
      <div className="p-3 border-t border-[#222A3D] flex flex-col gap-2.5 bg-[#060E20]">
        {/* Active Role Card */}
        <div className="bg-[#171F33] p-3 rounded-lg border border-[#2D3449] flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">
              Simulated Role
            </span>
            <button
              onClick={onToggleRole}
              type="button"
              className="inline-flex items-center gap-1 font-mono text-[10px] text-blue-400 hover:text-blue-300 transition-colors uppercase font-medium bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-800/40"
              title="Toggle between Buyer and Supplier view"
            >
              <ArrowLeftRight className="w-2.5 h-2.5" />
              <span>Switch</span>
            </button>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <UserCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-white truncate">
                {currentRole === 'buyer' ? 'Elena Rostova (Buyer)' : 'Tariro Moyo (Supplier)'}
              </span>
              <span className="text-[10px] text-slate-400 truncate">
                {currentRole === 'buyer' ? 'Acme Global Ventures' : 'DevStudio Harare'}
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
      </div>
    </aside>
  )
}
