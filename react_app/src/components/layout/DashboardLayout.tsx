import React, { useState } from 'react'
import { Sidebar } from './Sidebar'
import { SandboxBanner } from '@/components/common/SandboxBanner'
import { useContractStore } from '@/hooks/useContractStore'
import { 
  Search, 
  ChevronDown, 
  Bell, 
  Menu, 
  X,
  FileCode,
  ShieldCheck,
  UserCheck,
  LogOut,
  ArrowLeftRight,
  Sparkles,
  CreditCard,
  CheckCircle2
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { ROUTES } from '@/constants'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const navigate = useNavigate()
  const { activeRole, toggleActiveRole, signOut } = useContractStore()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [notifsOpen, setNotifsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const [notifications, setNotifications] = useState([
    {
      id: 'n1',
      title: 'Gemini Verification Passed',
      desc: 'Milestone 2 for TB-2026-084 passed all automated criteria (Score: 98/100).',
      time: '12m ago',
      unread: true,
      link: ROUTES.DELIVERY_VERIFICATION('contract-1'),
      type: 'verification',
    },
    {
      id: 'n2',
      title: 'PayPal Sandbox Reserve Staged',
      desc: '$1,400.00 USD pre-authorized for TB-2026-084.',
      time: '1h ago',
      unread: true,
      link: ROUTES.CONTRACT_DETAIL('contract-1'),
      type: 'paypal',
    },
    {
      id: 'n3',
      title: 'Milestone Release Authorized',
      desc: 'Acme Global released $1,400.00 to Tariro Moyo PayPal Sandbox wallet.',
      time: '3h ago',
      unread: false,
      link: ROUTES.SUPPLIER_PAYOUTS,
      type: 'payout',
    },
  ])

  const unreadCount = notifications.filter((n) => n.unread).length

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
  }

  const handleSignOut = () => {
    setProfileOpen(false)
    signOut()
    navigate(ROUTES.SIGN_IN)
  }

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
        <header className="sticky top-0 z-40 h-16 bg-[#0E172E]/90 backdrop-blur-md border-b border-[#222A3D] px-4 sm:px-6 flex items-center justify-between gap-4">
          {/* Mobile menu trigger */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="font-bold text-white text-sm">TrustBroker</span>
          </div>

          {/* Search bar & contract selector */}
          <div className="hidden sm:flex items-center gap-3 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search contract, milestone, hash..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#131B2E] border border-[#2D3449] pl-9 pr-3 py-1.5 text-xs text-white rounded-lg placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <Link
              to={ROUTES.CONTRACT_DETAIL('contract-1')}
              className="inline-flex items-center gap-1.5 bg-[#171F33] hover:bg-[#222A3D] border border-[#2D3449] px-2.5 py-1.5 rounded-lg text-xs font-mono text-slate-300 transition-colors whitespace-nowrap"
            >
              <FileCode className="w-3.5 h-3.5 text-blue-400" />
              <span>TB-2026-084</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </Link>
          </div>

          {/* Right actions: Sandbox disclaimer pill, Notifications, Profile */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex">
              <SandboxBanner isDark compact />
            </div>

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
                title="View platform notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-blue-600 text-white font-mono text-[9px] font-bold flex items-center justify-center">
                    {unreadCount}
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
                        Live Milestone Alerts
                      </span>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-[11px] text-blue-400 hover:text-blue-300 font-medium transition-colors"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 max-h-72 overflow-y-auto custom-scrollbar">
                    {notifications.map((n) => (
                      <Link
                        key={n.id}
                        to={n.link}
                        onClick={() => setNotifsOpen(false)}
                        className={`p-3 rounded-lg border transition-all flex flex-col gap-1 text-left ${
                          n.unread
                            ? 'bg-[#172038] border-blue-900/60 hover:border-blue-500/60'
                            : 'bg-[#0E1528] border-[#222A3D] hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {n.type === 'verification' && <Sparkles className="w-3.5 h-3.5 text-blue-400" />}
                            {n.type === 'paypal' && <CreditCard className="w-3.5 h-3.5 text-emerald-400" />}
                            {n.type === 'payout' && <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />}
                            <span className="text-xs font-semibold text-white">{n.title}</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-500">{n.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed pl-5.5">
                          {n.desc}
                        </p>
                      </Link>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-[#222A3D] text-center">
                    <Link
                      to={ROUTES.ACTIVITY_HISTORY('contract-1')}
                      onClick={() => setNotifsOpen(false)}
                      className="text-xs text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1"
                    >
                      <span>View full audit ledger</span>
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
                  activeRole === 'buyer'
                    ? 'bg-gradient-to-tr from-blue-600 to-indigo-500'
                    : 'bg-gradient-to-tr from-emerald-600 to-teal-500'
                }`}>
                  {activeRole === 'buyer' ? 'ER' : 'TM'}
                </div>
                <div className="hidden xl:flex flex-col text-left">
                  <span className="text-xs font-semibold text-white group-hover:text-blue-400 transition-colors leading-none flex items-center gap-1.5">
                    <span>{activeRole === 'buyer' ? 'Elena Rostova' : 'Tariro Moyo'}</span>
                    <UserCheck className={`w-3 h-3 ${activeRole === 'buyer' ? 'text-blue-400' : 'text-emerald-400'}`} />
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1 uppercase font-mono leading-none">
                    {activeRole === 'buyer' ? 'Acme Global (Buyer)' : 'DevStudio (Supplier)'}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
              </button>

              {/* Profile Dropdown Menu */}
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#131B2E] border border-[#222A3D] shadow-2xl p-3 z-50 flex flex-col gap-2">
                  <div className="p-2 border-b border-[#222A3D] flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-white">
                      {activeRole === 'buyer' ? 'Elena Rostova' : 'Tariro Moyo'}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 truncate">
                      {activeRole === 'buyer' ? 'elena@acmeglobal.com' : 'tariro@devstudio.co.zw'}
                    </span>
                    <span className="text-[10px] text-blue-400 font-mono mt-1">
                      Role: {activeRole === 'buyer' ? 'Hiring Client (Buyer)' : 'Freelance Engineer (Supplier)'}
                    </span>
                  </div>

                  {/* Switch Persona */}
                  <button
                    onClick={() => {
                      toggleActiveRole()
                      setProfileOpen(false)
                    }}
                    type="button"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-[#172038] transition-colors"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5 text-blue-400" />
                    <span>Switch to {activeRole === 'buyer' ? 'Supplier Mode' : 'Buyer Mode'}</span>
                  </button>

                  <div className="h-px bg-[#222A3D] my-1" />

                  {/* Sign Out */}
                  <button
                    onClick={handleSignOut}
                    type="button"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Global Operational Notice Bar */}
        <div className="bg-[#131B2E] border-b border-[#222A3D] px-4 sm:px-6 py-2 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="text-slate-300">
              <span className="text-emerald-400 font-medium mr-1.5">Active Simulation:</span>
              {activeRole === 'buyer' 
                ? 'Client Mode — Authorize PayPal Sandbox Reserves & Review SOW Milestones' 
                : 'Supplier Mode — Accept SOWs, Submit Deliverable Artifacts & Track Payouts'}
            </span>
          </div>
          <div className="hidden md:flex items-center gap-3 font-mono text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              PayPal Sandbox: Connected
            </span>
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
