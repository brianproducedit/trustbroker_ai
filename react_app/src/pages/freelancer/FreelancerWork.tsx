import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useContractStore } from '@/hooks/useContractStore'
import { ROUTES } from '@/constants'
import { formatCurrency } from '@/lib/utils'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Briefcase,
  Clock,
  CheckCircle2,
  ExternalLink,
  UploadCloud,
  Search,
} from 'lucide-react'

export const FreelancerWork: React.FC = () => {
  const { contracts, fetchContracts } = useContractStore()

  const [loading, setLoading] = useState(true)
  const [selectedContract, setSelectedContract] = useState<any | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'active' | 'in_verification' | 'pending_acceptance'>('all')

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      try {
        await fetchContracts()
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [fetchContracts])

  // Filter contracts relevant to the freelancer's active deliverables
  const activeWorkContracts = useMemo(() => {
    return contracts.filter((c) => {
      const isCandidateStatus = [
        'active',
        'in_verification',
        'pending_acceptance',
        'awarded',
      ].includes(c.status)
      if (!isCandidateStatus) return false

      if (filter === 'all') return true
      return c.status === filter
    })
  }, [contracts, filter])

  // Calculated metrics
  const activeCount = contracts.filter((c) => c.status === 'active').length
  const verifyingCount = contracts.filter((c) => c.status === 'in_verification').length
  const totalEarned = contracts.reduce((sum, c) => sum + (c.releasedAmount || 0), 0)

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-16">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded border border-emerald-900/50 font-semibold">
                Freelancer Workspace
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
              Active Work & Deliverables
            </h1>
            <p className="text-slate-400 text-xs">
              Track project milestones, submit verification evidence, and unlock PayPal disbursements.
            </p>
          </div>

          <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
            <Link to={ROUTES.MARKETPLACE}>
              <Search className="w-3.5 h-3.5 mr-1.5" /> Find More Contracts
            </Link>
          </Button>
        </div>

        {/* KPI Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-[#0C1916] border border-[#1C3831] text-white p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Active Contracts in Progress</span>
              <Briefcase className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white mt-2">
              {activeCount}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">Work currently underway</span>
          </Card>

          <Card className="bg-[#0C1916] border border-[#1C3831] text-white p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Under AI Verification</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-amber-300 mt-2">
              {verifyingCount}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">Evidence undergoing inspection</span>
          </Card>

          <Card className="bg-[#0C1916] border border-[#1C3831] text-white p-4">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Total Disbursed Earnings</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-300 mt-2">
              {formatCurrency(totalEarned, 'USD')}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">Disbursed to PayPal account</span>
          </Card>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 border-b border-[#1C3831] pb-3 text-xs">
          {[
            { id: 'all', label: 'All Active Work' },
            { id: 'active', label: 'In Progress' },
            { id: 'in_verification', label: 'Under Verification' },
            { id: 'pending_acceptance', label: 'Pending Acceptance' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                filter === tab.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-[#122622]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Active Work Table */}
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-slate-400 text-xs">Loading active projects...</p>
          </div>
        ) : activeWorkContracts.length === 0 ? (
          <div className="bg-[#0C1916] border border-[#1C3831] rounded-xl p-12 text-center space-y-3">
            <Briefcase className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-semibold text-white">No Active Work Contracts</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You don't have any ongoing contracts right now. Browse open listings in the marketplace and apply with your verified skills.
            </p>
            <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs mt-2">
              <Link to={ROUTES.MARKETPLACE}>Browse Marketplace</Link>
            </Button>
          </div>
        ) : (
          <div className="bg-[#0C1916] border border-[#1C3831] rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#1C3831] bg-[#122622] text-slate-400 font-mono uppercase text-[11px]">
                    <th className="py-3.5 px-4 w-28">Ref Code</th>
                    <th className="py-3.5 px-4">Contract Title</th>
                    <th className="py-3.5 px-4">Client</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Budget</th>
                    <th className="py-3.5 px-4">Progress</th>
                    <th className="py-3.5 px-4 text-center">Next Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#172E28]">
                  {activeWorkContracts.map((c) => {
                    const milestones = c.milestones || []
                    const settledCount = milestones.filter(
                      (m) => m.status === 'verified' || m.status === 'settled'
                    ).length
                    const totalMilestones = milestones.length
                    const pct =
                      totalMilestones > 0
                        ? Math.round((settledCount / totalMilestones) * 100)
                        : 0

                    return (
                      <tr
                        key={c.id}
                        onClick={() => {
                          setSelectedContract(c)
                          setDialogOpen(true)
                        }}
                        className="hover:bg-[#122622] cursor-pointer transition-colors group"
                      >
                        <td className="py-4 px-4 font-mono font-semibold text-emerald-400">
                          {c.code}
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-semibold text-white group-hover:text-emerald-300 transition-colors">
                            {c.title}
                          </div>
                          <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                            {c.description}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-slate-300">
                          {c.client?.name || 'Client Org'}
                        </td>
                        <td className="py-4 px-4">
                          <Badge
                            className={`text-[10px] font-mono uppercase ${
                              c.status === 'active'
                                ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                                : c.status === 'in_verification'
                                ? 'bg-amber-950 text-amber-400 border-amber-800 animate-pulse'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {c.status.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-right font-mono font-bold text-white">
                          {formatCurrency(c.totalAmount ?? (c as any).budget ?? 0, c.currency)}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-[#06120E] rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-emerald-500 h-full rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-mono text-slate-400">
                              {settledCount}/{totalMilestones}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              asChild
                              size="sm"
                              className="h-7 text-xs bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600 hover:text-white border border-emerald-600/40 px-2.5"
                            >
                              <Link to={ROUTES.DELIVERY_VERIFICATION(c.id)}>
                                <UploadCloud className="w-3 h-3 mr-1" /> Submit Evidence
                              </Link>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Work Contract Overview Dialog */}
        {selectedContract && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="max-w-2xl bg-[#0C1916] border-[#1C3831] text-white">
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-emerald-400 font-semibold">
                    {selectedContract.code}
                  </span>
                  <Badge className="bg-emerald-950 text-emerald-400 border-emerald-800 text-[10px]">
                    {selectedContract.status}
                  </Badge>
                </div>
                <DialogTitle className="text-lg text-white">
                  {selectedContract.title}
                </DialogTitle>
                <DialogDescription className="text-slate-400 text-xs">
                  {selectedContract.description || 'Active milestone deliverable contract'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[#06120E] p-3 rounded-lg border border-[#1C3831]">
                    <span className="text-[10px] text-slate-500 uppercase">Total SOW</span>
                    <div className="font-mono font-bold text-base text-white mt-0.5">
                      {formatCurrency(
                        selectedContract.totalAmount ?? (selectedContract as any).budget ?? 0,
                        selectedContract.currency
                      )}
                    </div>
                  </div>
                  <div className="bg-[#06120E] p-3 rounded-lg border border-amber-900/40">
                    <span className="text-[10px] text-amber-500 uppercase">Staged Escrow</span>
                    <div className="font-mono font-bold text-base text-amber-300 mt-0.5">
                      {formatCurrency(selectedContract.stagedAmount || 0, selectedContract.currency)}
                    </div>
                  </div>
                  <div className="bg-[#06120E] p-3 rounded-lg border border-emerald-900/40">
                    <span className="text-[10px] text-emerald-500 uppercase">Released Payouts</span>
                    <div className="font-mono font-bold text-base text-emerald-300 mt-0.5">
                      {formatCurrency(selectedContract.releasedAmount || 0, selectedContract.currency)}
                    </div>
                  </div>
                </div>

                {/* Milestones list */}
                <div>
                  <h4 className="text-xs font-mono uppercase text-slate-400 font-semibold mb-2">
                    Contract Milestones ({selectedContract.milestones?.length || 0})
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {(selectedContract.milestones || []).map((m: any, idx: number) => (
                      <div
                        key={m.id || idx}
                        className="bg-[#06120E] p-2.5 rounded-lg border border-[#1C3831] flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-500">M{idx + 1}</span>
                          <span className="font-medium text-white">{m.title}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-slate-300">
                            {formatCurrency(m.amount || 0, selectedContract.currency)}
                          </span>
                          <Badge className="text-[9px] bg-slate-800 text-slate-400">
                            {m.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="ghost"
                  onClick={() => setDialogOpen(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Close
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    asChild
                    variant="outline"
                    className="border-[#1C3831] text-slate-200 hover:bg-[#122622] text-xs"
                  >
                    <Link to={ROUTES.CONTRACT_DETAIL(selectedContract.id)}>
                      Full Contract View <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                  >
                    <Link to={ROUTES.DELIVERY_VERIFICATION(selectedContract.id)}>
                      <UploadCloud className="w-3.5 h-3.5 mr-1.5" /> Submit Delivery Evidence
                    </Link>
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  )
}

export default FreelancerWork
