import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useContractStore } from '@/hooks/useContractStore'
import { useAuthStore } from '@/hooks/useAuthStore'
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
  Check,
  X,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

export const FreelancerWork: React.FC = () => {
  const { contracts, fetchContracts, acceptContract, declineAward } = useContractStore()
  const currentUser = useAuthStore((state) => state.user)

  const [loading, setLoading] = useState(true)
  const [selectedContract, setSelectedContract] = useState<any | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'active' | 'in_verification' | 'pending_acceptance'>('all')

  const [acceptTarget, setAcceptTarget] = useState<any | null>(null)
  const [declineTarget, setDeclineTarget] = useState<any | null>(null)
  const [declineReason, setDeclineReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  /**
   * Acceptance is the freelancer's action. The client already signs at award time, so the
   * Accept/Decline controls must only render for the awarded freelancer.
   */
  const needsMyAcceptance = (contract: any) => {
    const status = String(contract?.status || '')
    if (status !== 'pending_acceptance' && status !== 'awarded') return false
    const myEmail = (currentUser?.email || '').toLowerCase()
    if (!myEmail) return false
    const freelancer = contract?.freelancer || {}
    const assignedEmail = String(freelancer.email || contract?.freelancer_email || '').toLowerCase()
    const assignedId = freelancer.id ? String(freelancer.id) : ''
    const myId = currentUser?.id ? String(currentUser.id) : ''
    const isMe = (assignedEmail && assignedEmail === myEmail) || (assignedId && myId && assignedId === myId)
    return Boolean(isMe) && !freelancer.accepted
  }

  const needsAcceptance = needsMyAcceptance

  const handleAccept = async () => {
    if (!acceptTarget) return
    setIsSubmitting(true)
    try {
      await acceptContract(acceptTarget.id, 'freelancer')
      toast.success(`Award accepted — ${acceptTarget.code} is now active.`)
      setAcceptTarget(null)
      setDialogOpen(false)
      await fetchContracts()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not accept the award.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDecline = async () => {
    if (!declineTarget) return
    setIsSubmitting(true)
    try {
      await declineAward(declineTarget.id, declineReason.trim() || undefined)
      toast.success(`Award declined — ${declineTarget.code} has been released back to the marketplace.`)
      setDeclineTarget(null)
      setDeclineReason('')
      setDialogOpen(false)
      await fetchContracts()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not decline the award.')
    } finally {
      setIsSubmitting(false)
    }
  }

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
  const awaitingAcceptance = contracts.filter((c) => needsAcceptance(c))

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
              Track project milestones, submit verification evidence and unlock PayPal disbursements.
            </p>
          </div>

          <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
            <Link to={ROUTES.MARKETPLACE}>
              <Search className="w-3.5 h-3.5 mr-1.5" /> Find More Contracts
            </Link>
          </Button>
        </div>

        {/* Action Required: awarded contracts awaiting freelancer acceptance */}
        {awaitingAcceptance.length > 0 && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-amber-200">
                  Action required — {awaitingAcceptance.length} contract
                  {awaitingAcceptance.length > 1 ? 's' : ''} awaiting your acceptance
                </h3>
                <p className="text-xs text-amber-200/70 mt-0.5">
                  Review the milestones, then accept to activate the contract and unlock milestone funding.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {awaitingAcceptance.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-amber-500/25 bg-[#0C1916]/80 px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-semibold text-amber-400">{c.code}</span>
                      <Badge className="bg-amber-950 text-amber-300 border-amber-800 text-[9px] uppercase font-mono">
                        Pending acceptance
                      </Badge>
                    </div>
                    <p className="text-xs font-medium text-white truncate">{c.title}</p>
                    <p className="text-[11px] text-slate-400">
                      {formatCurrency(c.totalAmount, c.currency)} · {c.milestones?.length || 0} milestone
                      {(c.milestones?.length || 0) === 1 ? '' : 's'} · Client: {c.client?.name || 'Client'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedContract(c)
                        setDialogOpen(true)
                      }}
                      className="h-7 text-xs border-[#1C3831] text-slate-200 hover:bg-[#122622]"
                    >
                      Review terms
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setAcceptTarget(c)}
                      className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Check className="w-3 h-3 mr-1" /> Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeclineTarget(c)}
                      className="h-7 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40"
                    >
                      <X className="w-3 h-3 mr-1" /> Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${filter === tab.id
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
                            className={`text-[10px] font-mono uppercase ${c.status === 'active'
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
                            {needsAcceptance(c) ? (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => setAcceptTarget(c)}
                                  className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2.5"
                                >
                                  <Check className="w-3 h-3 mr-1" /> Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setDeclineTarget(c)}
                                  className="h-7 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40 px-2"
                                >
                                  <X className="w-3 h-3 mr-1" /> Decline
                                </Button>
                              </>
                            ) : (
                              <Button
                                asChild
                                size="sm"
                                className="h-7 text-xs bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600 hover:text-white border border-emerald-600/40 px-2.5"
                              >
                                <Link to={ROUTES.DELIVERY_VERIFICATION(c.id)}>
                                  <UploadCloud className="w-3 h-3 mr-1" /> Submit Evidence
                                </Link>
                              </Button>
                            )}
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
            <DialogContent className="w-full max-w-2xl sm:max-w-2xl md:max-w-3xl bg-[#0C1916] border-[#1C3831] text-white p-6 sm:p-7 shadow-2xl">
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
                  {needsAcceptance(selectedContract) ? (
                    <>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setDeclineTarget(selectedContract)
                          setDialogOpen(false)
                        }}
                        className="text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40"
                      >
                        <X className="w-3.5 h-3.5 mr-1.5" /> Decline
                      </Button>
                      <Button
                        onClick={() => {
                          setAcceptTarget(selectedContract)
                          setDialogOpen(false)
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                      >
                        <Check className="w-3.5 h-3.5 mr-1.5" /> Accept Terms
                      </Button>
                    </>
                  ) : (
                    <Button
                      asChild
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                    >
                      <Link to={ROUTES.DELIVERY_VERIFICATION(selectedContract.id)}>
                        <UploadCloud className="w-3.5 h-3.5 mr-1.5" /> Submit Delivery Evidence
                      </Link>
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Accept award confirmation */}
        <Dialog open={!!acceptTarget} onOpenChange={(open) => !open && setAcceptTarget(null)}>
          <DialogContent className="w-full max-w-lg bg-[#0C1916] border-[#1C3831] text-white">
            <DialogHeader>
              <DialogTitle className="text-lg text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Accept this award?
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-xs">
                Accepting activates <span className="font-mono text-emerald-300">{acceptTarget?.code}</span> and
                commits you to the agreed milestones. The client will then fund each milestone through PayPal.
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-lg border border-[#1C3831] bg-[#06120E] p-3 text-xs space-y-1">
              <div className="font-semibold text-white">{acceptTarget?.title}</div>
              <div className="text-slate-400">
                {formatCurrency(acceptTarget?.totalAmount || 0, acceptTarget?.currency)} ·{' '}
                {acceptTarget?.milestones?.length || 0} milestone
                {(acceptTarget?.milestones?.length || 0) === 1 ? '' : 's'}
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="ghost"
                onClick={() => setAcceptTarget(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAccept}
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              >
                {isSubmitting ? 'Accepting…' : 'Confirm & Accept'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Decline award dialog */}
        <Dialog
          open={!!declineTarget}
          onOpenChange={(open) => {
            if (!open) {
              setDeclineTarget(null)
              setDeclineReason('')
            }
          }}
        >
          <DialogContent className="w-full max-w-lg bg-[#0C1916] border-[#1C3831] text-white">
            <DialogHeader>
              <DialogTitle className="text-lg text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Decline this award?
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-xs">
                <span className="font-mono text-amber-300">{declineTarget?.code}</span> will be released back to
                the marketplace and the client will be notified. This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="decline-reason" className="text-xs text-slate-300">
                Reason (optional)
              </Label>
              <Textarea
                id="decline-reason"
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="e.g. Timeline no longer works for me"
                className="bg-[#06120E] border-[#1C3831] text-white text-xs min-h-20"
                maxLength={500}
              />
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setDeclineTarget(null)
                  setDeclineReason('')
                }}
                className="text-xs text-slate-400 hover:text-white"
              >
                Keep award
              </Button>
              <Button
                onClick={handleDecline}
                disabled={isSubmitting}
                className="bg-red-600 hover:bg-red-700 text-white text-xs"
              >
                {isSubmitting ? 'Declining…' : 'Confirm & Decline'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}

export default FreelancerWork
