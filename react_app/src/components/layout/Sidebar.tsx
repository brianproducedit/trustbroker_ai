import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Logo } from '@/components/common/Logo'
import { ROUTES } from '@/constants'
import { useAuthStore } from '@/hooks/useAuthStore'
import {
  LayoutGrid,
  PlusCircle,
  FileText,
  UserCircle2,
  ArrowLeftRight,
  Wallet,
  LogOut,
  Search,
  Inbox,
  BarChart3,
  Bell,
  Briefcase
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface SidebarProps {
  currentRole: 'client' | 'freelancer'
  onToggleRole: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ currentRole, onToggleRole }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const authSignOut = useAuthStore((state) => state.signOut)
  const user = useAuthStore((state) => state.user)
  const [signOutOpen, setSignOutOpen] = useState(false)

  const handleSignOut = async () => {
    setSignOutOpen(false)
    await authSignOut()
    toast.success('Signed out successfully')
    navigate(ROUTES.HOME)
  }

  const handleRoleToggle = () => {
    onToggleRole()
    const nextRole = currentRole === 'client' ? 'freelancer' : 'client'
    toast.info(`Switched to ${nextRole} workspace`)
    navigate(nextRole === 'client' ? ROUTES.CLIENT_HOME : ROUTES.FREELANCER_HOME)
  }

  // Clear, distinct persona navigation
  const clientNavItems = [
    { label: 'Home', icon: LayoutGrid, path: ROUTES.CLIENT_HOME },
    { label: 'My Contracts', icon: FileText, path: ROUTES.CLIENT_CONTRACTS },
    { label: 'Applications', icon: Inbox, path: ROUTES.CLIENT_APPLICATIONS },
    { label: 'New Contract', icon: PlusCircle, path: ROUTES.NEW_PROJECT },
    { label: 'Operations', icon: BarChart3, path: ROUTES.CLIENT_OPERATIONS },
    { label: 'Notifications', icon: Bell, path: '/app/notifications' },
    { label: 'Profile', icon: UserCircle2, path: ROUTES.CLIENT_PROFILE },
  ]

  const freelancerNavItems = [
    { label: 'Home', icon: LayoutGrid, path: ROUTES.FREELANCER_HOME },
    { label: 'Find Work', icon: Search, path: ROUTES.MARKETPLACE },
    { label: 'Applications', icon: Inbox, path: ROUTES.FREELANCER_APPLICATIONS },
    { label: 'Active Work', icon: Briefcase, path: ROUTES.FREELANCER_WORK },
    { label: 'Operations', icon: BarChart3, path: ROUTES.FREELANCER_OPERATIONS },
    { label: 'Notifications', icon: Bell, path: '/app/notifications' },
    { label: 'Profile', icon: UserCircle2, path: ROUTES.FREELANCER_PROFILE },
    { label: 'Earnings', icon: Wallet, path: ROUTES.FREELANCER_PAYOUTS },
  ]

  const navItems = currentRole === 'client' ? clientNavItems : freelancerNavItems

  const isItemActive = (path: string, label: string) => {
    if (location.pathname === path) return true
    if (label === 'Home' && currentRole === 'client' && (location.pathname === '/app/client' || location.pathname === '/dashboard')) return true
    if (label === 'Home' && currentRole === 'freelancer' && (location.pathname === '/app/freelancer' || location.pathname === '/dashboard')) return true
    return false
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#0B1326] border-r border-[#222A3D] z-50 flex flex-col justify-between select-none">
      {/* Top Header */}
      <div className="flex flex-col">
        <div className="h-16 px-4 flex items-center justify-between border-b border-[#222A3D] bg-[#060E20]">
          <Link to={currentRole === 'client' ? ROUTES.CLIENT_HOME : ROUTES.FREELANCER_HOME} className="flex items-center">
            <Logo isDark hideSubtitle={false} />
          </Link>
        </div>

        {/* Navigation Section */}
        <div className="py-4 px-3">
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold block">
              {currentRole === 'client' ? 'Client Workspace' : 'Freelancer Workspace'}
            </span>
          </div>

          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = isItemActive(item.path, item.label)
              const Icon = item.icon
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs transition-all',
                    isActive
                      ? currentRole === 'client'
                        ? 'bg-blue-600/20 text-blue-400 font-semibold border-l-2 border-blue-500 shadow-xs'
                        : 'bg-emerald-600/20 text-emerald-400 font-semibold border-l-2 border-emerald-500 shadow-xs'
                      : 'text-[#ACB9D2] hover:bg-[#171F33] hover:text-white'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-4 h-4 flex-shrink-0',
                      isActive
                        ? currentRole === 'client' ? 'text-blue-400' : 'text-emerald-400'
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

      {/* Bottom Role Switcher & User Status */}
      <div className="p-3 border-t border-[#222A3D] flex flex-col gap-2.5 bg-[#060E20]">
        {/* Active Role Card */}
        <div
          className={cn(
            'p-3 rounded-lg border flex flex-col gap-1.5 transition-all',
            currentRole === 'client'
              ? 'bg-[#171F33] border-blue-900/40'
              : 'bg-[#132328] border-emerald-900/40'
          )}
        >
          <div className="flex items-center justify-between">
            <span
              className={cn(
                'font-mono text-[10px] uppercase tracking-wider font-semibold',
                currentRole === 'client' ? 'text-blue-400' : 'text-emerald-400'
              )}
            >
              {currentRole === 'client' ? 'Client Mode' : 'Freelancer Mode'}
            </span>
            <button
              onClick={handleRoleToggle}
              type="button"
              className={cn(
                'inline-flex items-center gap-1 font-mono text-[10px] transition-colors uppercase font-medium px-2 py-0.5 rounded border cursor-pointer',
                currentRole === 'client'
                  ? 'bg-blue-950/80 text-blue-300 hover:text-white border-blue-800/60'
                  : 'bg-emerald-950/80 text-emerald-300 hover:text-white border-emerald-800/60'
              )}
              title="Switch workspace"
            >
              <ArrowLeftRight className="w-2.5 h-2.5" />
              <span>Switch workspace</span>
            </button>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <UserCircle2
              className={cn(
                'w-4 h-4 flex-shrink-0',
                currentRole === 'client' ? 'text-blue-400' : 'text-emerald-400'
              )}
            />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-white truncate">
                {user?.name || 'Signed in'}
              </span>
              <span className="text-[10px] text-slate-400 truncate">
                {user?.organization || user?.email || ''}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1 px-2 py-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-mono text-[11px] text-slate-300">PayPal connected</span>
          </div>
        </div>

        {/* Sign Out Action Button */}
        <button
          onClick={() => setSignOutOpen(true)}
          type="button"
          className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-[#171F33] border border-[#222A3D] transition-all cursor-pointer group"
          title="Sign out of current account"
        >
          <LogOut className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-400 transition-colors" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Sign Out Confirmation Dialog */}
      <AlertDialog open={signOutOpen} onOpenChange={setSignOutOpen}>
        <AlertDialogContent className="bg-[#131B2E] border-[#222A3D] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Sign Out Confirmation</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 text-xs">
              Are you sure you want to sign out of TrustBroker AI? You will need to sign in again to access contracts and staged payments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="border-[#2D3449] bg-[#0E1528] text-slate-300 hover:bg-[#171F33] text-xs">
              Stay Signed In
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSignOut}
              className="bg-red-600 hover:bg-red-700 text-white text-xs"
            >
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  )
}

export default Sidebar
