import React, { useState } from 'react'
import { Sidebar } from './Sidebar'
import { useContractStore } from '@/hooks/useContractStore'
import { useAuthStore } from '@/hooks/useAuthStore'
import { useNotificationStore } from '@/hooks/useNotifications'
import { 
  Search, 
  ChevronDown, 
  Bell, 
  Menu, 
  X,
  UserCheck,
  LogOut,
  ArrowLeftRight,
  ExternalLink
} from 'lucide-react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { ROUTES } from '@/constants'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
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

interface DashboardLayoutProps {
  children: React.ReactNode
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { activeContractId, contracts } = useContractStore()
  const { user, activeRole, toggleActiveRole, signOut: authSignOut } = useAuthStore()
  const { notifications, unreadCount, markAllAsRead, markAsRead } = useNotificationStore()
  
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [notifsOpen, setNotifsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [signOutOpen, setSignOutOpen] = useState(false)

  const activeContract = contracts.find((c) => c.id === activeContractId || c.code === activeContractId) || contracts[0]

  const handleSignOut = async () => {
    setProfileOpen(false)
    setSignOutOpen(false)
    await authSignOut()
    toast.success('Signed out successfully')
    navigate(ROUTES.HOME)
  }

  const handleRoleToggle = () => {
    toggleActiveRole()
    setProfileOpen(false)
    const nextRole = activeRole === 'client' ? 'freelancer' : 'client'
    toast.info(`Switched to ${nextRole} workspace`)
  }

  // Generate breadcrumb text from location
  const getBreadcrumbs = () => {
    const path = location.pathname
    if (path.includes('/dashboard/create-project') || path.includes('/app/client/contracts/new')) {
      return [{ label: 'Dashboard', to: ROUTES.DASHBOARD }, { label: 'New contract' }]
    }
    if (path.includes('/dashboard/contracts')) {
      return [{ label: 'Dashboard', to: ROUTES.DASHBOARD }, { label: `Contract ${activeContract?.code || ''}` }]
    }
    if (path.includes('/dashboard/deliveries')) {
      return [{ label: 'Dashboard', to: ROUTES.DASHBOARD }, { label: 'Submit Delivery' }]
    }
    if (path.includes('/dashboard/payouts')) {
      return [{ label: 'Dashboard', to: ROUTES.DASHBOARD }, { label: 'Earnings & Payouts' }]
    }
    if (path.includes('/dashboard/activity')) {
      return [{ label: 'Dashboard', to: ROUTES.DASHBOARD }, { label: 'Activity Audit Log' }]
    }
    return [{ label: 'Dashboard' }]
  }

  const breadcrumbs = getBreadcrumbs()
  const unreadTotal = unreadCount()

  return (
    <div className="min-h-screen bg-[#0B1326] text-[#DAE2FD] font-sans antialiased flex flex-col">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar currentRole={activeRole} onToggleRole={toggleActiveRole} />
      </div>

      {/* Mobile Drawer Sidebar */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs" 
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative w-64 max-w-full z-10">
            <Sidebar currentRole={activeRole} onToggleRole={toggleActiveRole} />
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute top-4 right-3 p-1 text-slate-400 hover:text-white"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Area */}
      <div className="lg:pl-64 flex flex-col min-h-screen flex-1">
        {/* Top Header */}
        <header className="sticky top-0 z-40 h-16 bg-[#0E172E]/95 backdrop-blur-md border-b border-[#222A3D] px-4 sm:px-6 flex items-center justify-between gap-4">
          {/* Mobile menu trigger & Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 lg:hidden cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Breadcrumb Trail */}
            <nav className="flex items-center gap-1.5 text-xs text-slate-400">
              {breadcrumbs.map((crumb, idx) => {
                const isLast = idx === breadcrumbs.length - 1
                return (
                  <React.Fragment key={idx}>
                    {idx > 0 && <span className="text-slate-600">/</span>}
                    {crumb.to && !isLast ? (
                      <Link to={crumb.to} className="hover:text-white transition-colors">
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className={isLast ? 'text-white font-medium' : ''}>{crumb.label}</span>
                    )}
                  </React.Fragment>
                )
              })}
            </nav>
          </div>

          {/* Center search bar */}
          <div className="hidden md:flex items-center gap-3 flex-1 max-w-sm">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search contracts or milestones..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#131B2E] border border-[#2D3449] pl-8 pr-3 py-1.5 text-xs text-white rounded-lg placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Right actions: Sandbox Indicator, Notifications, Profile */}
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="hidden sm:inline-flex bg-blue-950/40 border-blue-900/60 text-blue-300 text-[11px] gap-1.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              PayPal
            </Badge>

            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotifsOpen(!notifsOpen)
                  setProfileOpen(false)
                }}
                className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                aria-label="Notifications"
                title="View notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadTotal > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-blue-600 text-white font-mono text-[9px] font-bold flex items-center justify-center">
                    {unreadTotal}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {notifsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-[#131B2E] border border-[#222A3D] shadow-2xl p-4 z-50 flex flex-col gap-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#222A3D]">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Notifications
                      </span>
                    </div>
                    {unreadTotal > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-[11px] text-blue-400 hover:text-blue-300 font-medium transition-colors cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 max-h-72 overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="text-xs text-slate-500 text-center py-6">No notifications yet</div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            markAsRead(n.id)
                            if (n.link) {
                              setNotifsOpen(false)
                              navigate(n.link)
                            }
                          }}
                          className={`p-3 rounded-lg border transition-all flex flex-col gap-1 text-left cursor-pointer ${
                            !n.read
                              ? 'bg-[#172038] border-blue-900/60 hover:border-blue-500/60'
                              : 'bg-[#0E1528] border-[#222A3D] hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-white">{n.title}</span>
                            <span className="text-[10px] font-mono text-slate-500">
                              {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-relaxed">
                            {n.description}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="pt-2 border-t border-[#222A3D] text-center">
                    <Link
                      to={ROUTES.ACTIVITY_HISTORY(activeContract?.id || 'contract-1')}
                      onClick={() => setNotifsOpen(false)}
                      className="text-xs text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1"
                    >
                      <span>View audit history</span>
                      <ChevronDown className="w-3 h-3 -rotate-90" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="h-5 w-px bg-slate-800" />

            {/* User profile dropdown button */}
            <div className="relative">
              <button 
                type="button"
                onClick={() => {
                  setProfileOpen(!profileOpen)
                  setNotifsOpen(false)
                }}
                title="Account menu"
                className="flex items-center gap-2.5 pl-1 cursor-pointer group text-left"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ring-2 ring-slate-800 transition-transform group-hover:scale-105 ${
                  activeRole === 'client'
                    ? 'bg-gradient-to-tr from-blue-600 to-indigo-500'
                    : 'bg-gradient-to-tr from-emerald-600 to-teal-500'
                }`}>
                  {user?.name
                    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                    : 'TB'}
                </div>
                <div className="hidden xl:flex flex-col text-left">
                  <span className="text-xs font-semibold text-white group-hover:text-blue-400 transition-colors leading-none flex items-center gap-1.5">
                    <span>{user?.name || 'Account'}</span>
                    <UserCheck className={`w-3 h-3 ${activeRole === 'client' ? 'text-blue-400' : 'text-emerald-400'}`} />
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 uppercase font-mono leading-none">
                    {activeRole === 'client' ? 'Client' : 'Freelancer'}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
              </button>

              {/* Profile Dropdown Menu */}
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#131B2E] border border-[#222A3D] shadow-2xl p-3 z-50 flex flex-col gap-2">
                  <div className="p-2 border-b border-[#222A3D] flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-white">
                      {user?.name || 'Account'}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 truncate">
                      {user?.email || ''}
                    </span>
                    <span className="text-[10px] text-blue-400 font-mono mt-1">
                      Workspace: {activeRole === 'client' ? 'Client' : 'Freelancer'}
                    </span>
                  </div>

                  {/* Switch Persona */}
                  <button
                    onClick={handleRoleToggle}
                    type="button"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-[#172038] transition-colors cursor-pointer"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5 text-blue-400" />
                    <span>Switch to {activeRole === 'client' ? 'freelancer' : 'client'} workspace</span>
                  </button>

                  <div className="h-px bg-[#222A3D] my-1" />

                  {/* Sign Out */}
                  <button
                    onClick={() => {
                      setProfileOpen(false)
                      setSignOutOpen(true)
                    }}
                    type="button"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Sign Out Confirmation AlertDialog */}
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

        {/* Clean Context Status Ribbon */}
        <div className="bg-[#10182E] border-b border-[#222A3D] px-4 sm:px-6 py-2 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-slate-300">
              <span className="text-emerald-400 font-medium mr-1.5">
                {activeRole === 'client' ? 'Client Workspace:' : 'Freelancer Workspace:'}
              </span>
              {activeRole === 'client'
                ? 'Create contracts, fund milestones with PayPal, and review verified work.'
                : 'Apply for work, submit deliverable evidence, and track payouts.'}
            </span>
          </div>
          <div className="hidden md:flex items-center gap-3 font-mono text-[11px] text-slate-400">
            <Link to={ROUTES.HOME} className="text-slate-400 hover:text-white transition-colors flex items-center gap-1">
              <span>Public Site</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
