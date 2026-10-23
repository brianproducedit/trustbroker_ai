import React, { useState } from 'react'
import { Sidebar } from './Sidebar'
import { SandboxBanner } from '@/components/common/SandboxBanner'
import { 
  Search, 
  ChevronDown, 
  Bell, 
  Menu, 
  X,
  FileCode,
  ShieldCheck
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/constants'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [role, setRole] = useState<'buyer' | 'supplier'>('buyer')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const toggleRole = () => {
    setRole((prev) => (prev === 'buyer' ? 'supplier' : 'buyer'))
  }

  return (
    <div className="min-h-screen bg-[#0B1326] text-[#DAE2FD] font-sans antialiased flex flex-col">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar currentRole={role} onToggleRole={toggleRole} />
      </div>

      {/* Mobile Drawer Sidebar */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs" 
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative w-64 max-w-full z-10">
            <Sidebar currentRole={role} onToggleRole={toggleRole} />
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
              to={ROUTES.CONTRACT_DETAIL('TB-2026-084')}
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

            <button
              type="button"
              className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500" />
            </button>

            <div className="h-5 w-px bg-slate-800" />

            {/* User profile dropdown button */}
            <div className="flex items-center gap-2.5 pl-1 cursor-pointer group">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-slate-800">
                {role === 'buyer' ? 'ER' : 'TM'}
              </div>
              <div className="hidden xl:flex flex-col text-left">
                <span className="text-xs font-semibold text-white group-hover:text-blue-400 transition-colors leading-none">
                  {role === 'buyer' ? 'Elena Rostova' : 'Tariro Moyo'}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 uppercase font-mono leading-none">
                  {role === 'buyer' ? 'Acme Corp (Buyer)' : 'DevStudio (Supplier)'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Global Operational Notice Bar */}
        <div className="bg-[#131B2E] border-b border-[#222A3D] px-4 sm:px-6 py-2 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="text-slate-300">
              <span className="text-emerald-400 font-medium mr-1.5">Live Environment:</span>
              PayPal Sandbox Orders API + Gemini AI Assessment Engine
            </span>
          </div>
          <div className="hidden md:flex items-center gap-3 font-mono text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Contract Status: Active Verification
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
