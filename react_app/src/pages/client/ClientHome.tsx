import React, { useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useContractStore } from '@/hooks/useContractStore'
import { ROUTES } from '@/constants'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Users,
  Briefcase,
  Clock,
  PlusCircle,
  ArrowRight,
  Layers,
} from 'lucide-react'

const statusColors: Record<string, string> = {
  draft: 'bg-slate-700 text-slate-300',
  open: 'bg-indigo-900/60 text-indigo-300',
  awarded: 'bg-amber-900/60 text-amber-300',
  active: 'bg-blue-900/60 text-blue-300',
  in_verification: 'bg-purple-900/60 text-purple-300',
  completed: 'bg-emerald-900/60 text-emerald-300',
  cancelled: 'bg-red-900/60 text-red-300',
}

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  open: 'Open',
  awarded: 'Awarded',
  active: 'Active',
  in_verification: 'In Review',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const ClientHome: React.FC = () => {
  const navigate = useNavigate()
  const { contracts, fetchContracts, isLoading } = useContractStore()

  useEffect(() => {
    fetchContracts()
  }, [fetchContracts])

  const totalContracts = contracts.length
  const openCount = contracts.filter((c) => c.status === 'open').length
  const activeCount = contracts.filter((c) => c.status === 'active').length
  const pendingReviewCount = contracts.filter(
    (c) => c.status === 'in_verification' || c.status === 'awarded'
  ).length

  const recentContracts = [...contracts].reverse().slice(0, 3)

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Workspace Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222A3D] pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-blue-400 font-semibold">
                Client Workspace
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Client Hub
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Create contracts, fund milestones, and review verified work.
            </p>
          </div>

          <Button
            onClick={() => navigate(ROUTES.NEW_PROJECT)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 h-9 font-medium shadow-sm cursor-pointer self-start sm:self-auto"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Contract</span>
          </Button>
        </div>

        {/* KPI Stat Cards — 2x2 grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Contracts */}
          <Card className="border-[#222A3D] bg-[#131B2E] text-white shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                  Total Contracts
                </span>
                <div className="text-2xl font-bold font-mono text-blue-400 mt-0.5">
                  {totalContracts}
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  All contracts on record
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Open for Applications */}
          <Card className="border-[#222A3D] bg-[#131B2E] text-white shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                  Open for Applications
                </span>
                <div className="text-2xl font-bold font-mono text-indigo-400 mt-0.5">
                  {openCount}
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Accepting freelancer bids
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Active Contracts */}
          <Card className="border-[#222A3D] bg-[#131B2E] text-white shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                  Active Contracts
                </span>
                <div className="text-2xl font-bold font-mono text-emerald-400 mt-0.5">
                  {activeCount}
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Work in progress
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Briefcase className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Pending Review */}
          <Card className="border-[#222A3D] bg-[#131B2E] text-white shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                  Pending Review
                </span>
                <div className="text-2xl font-bold font-mono text-amber-400 mt-0.5">
                  {pendingReviewCount}
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Awaiting your action
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => navigate(ROUTES.NEW_PROJECT)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 h-9 font-medium shadow-sm cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            + New Contract
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(ROUTES.CLIENT_CONTRACTS)}
            className="border-[#222A3D] bg-transparent text-slate-200 hover:bg-[#131B2E] hover:text-white text-xs h-9 gap-1.5 font-medium cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            View Contracts
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(ROUTES.CLIENT_APPLICATIONS)}
            className="border-[#222A3D] bg-transparent text-slate-200 hover:bg-[#131B2E] hover:text-white text-xs h-9 gap-1.5 font-medium cursor-pointer"
          >
            <Users className="w-3.5 h-3.5" />
            Review Applications
          </Button>
        </div>

        {/* Recent Contracts */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                Recent Contracts
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Your most recently created contracts
              </p>
            </div>
            <Link
              to={ROUTES.CLIENT_CONTRACTS}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-28 rounded-xl border border-dashed border-[#222A3D] bg-[#0E1528]">
              <span className="text-xs text-slate-400 animate-pulse">Loading contracts…</span>
            </div>
          ) : recentContracts.length === 0 ? (
            <div className="p-8 text-center rounded-xl border border-dashed border-[#222A3D] bg-[#0E1528] space-y-3">
              <Layers className="w-8 h-8 text-slate-500 mx-auto" />
              <div>
                <h3 className="text-sm font-semibold text-white">No contracts yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Create your first contract to get started.
                </p>
              </div>
              <Button
                onClick={() => navigate(ROUTES.NEW_PROJECT)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 h-8 font-medium shadow-sm cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Create First Contract
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {recentContracts.map((contract) => (
                <Card
                  key={contract.id}
                  onClick={() => navigate(ROUTES.CONTRACT_DETAIL(contract.id))}
                  className="border-[#222A3D] bg-[#131B2E] hover:border-blue-700/60 transition-all cursor-pointer p-4 space-y-3 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-blue-400 group-hover:text-blue-300 transition-colors">
                      {contract.code}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        statusColors[contract.status] || 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {statusLabels[contract.status] || contract.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-semibold text-sm text-white line-clamp-1 group-hover:text-blue-200 transition-colors">
                      {contract.title}
                    </h3>
                    {(contract as any).category && (
                      <p className="text-xs text-slate-400 mt-0.5 capitalize">{(contract as any).category}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#222A3D] text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Budget</span>
                      <span className="font-mono font-bold text-white text-sm">
                        {formatCurrency(Number(contract.totalAmount ?? (contract as any).budget) || 0, contract.currency)}
                      </span>
                    </div>
                    <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-[10px]">
                      {contract.milestones?.length ?? 0} milestones
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default ClientHome
