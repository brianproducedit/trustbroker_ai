import React, { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useContractStore } from '@/hooks/useContractStore'
import { useAuthStore } from '@/hooks/useAuthStore'
import { api } from '@/lib/api'
import { ROUTES } from '@/constants'
import { formatCurrency, formatDate } from '@/lib/utils'
import { MilestoneDetailDialog } from '@/components/dialogs/MilestoneDetailDialog'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import {
  ArrowLeft,
  Plus,
  User,
  Award,
  AlertCircle,
  Sparkles,
  ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'

export const ClientContractPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { contracts, fetchContracts, addMilestone } = useContractStore()
  const user = useAuthStore((state) => state.user)

  const [loading, setLoading] = useState(true)
  const [selectedMilestone, setSelectedMilestone] = useState<any | null>(null)
  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('milestones')

  // Add milestone state
  const [isAddingMilestone, setIsAddingMilestone] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [newDeadline, setNewDeadline] = useState('')
  const [isSubmittingMilestone, setIsSubmittingMilestone] = useState(false)

  // Applications
  const [applications, setApplications] = useState<any[]>([])
  const [loadingApps, setLoadingApps] = useState(false)
  const [selectedApplicant, setSelectedApplicant] = useState<any | null>(null)
  const [awardDialogOpen, setAwardDialogOpen] = useState(false)
  const [isAwarding, setIsAwarding] = useState(false)

  // Find contract by ID or Code
  const contract = useMemo(() => {
    if (!id) return null
    return (
      contracts.find(
        (c) => c.id === id || c.code.toLowerCase() === id.toLowerCase()
      ) || null
    )
  }, [contracts, id])

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

  // Load applications for this contract
  useEffect(() => {
    if (!contract?.id) return
    const loadApps = async () => {
      setLoadingApps(true)
      try {
        const res = await api.contracts.listApplications(contract.id)
        setApplications(res?.applications || [])
      } catch (err) {
        console.warn('Failed to load applications:', err)
      } finally {
        setLoadingApps(false)
      }
    }
    loadApps()
  }, [contract?.id])

  const canEditMilestones = useMemo(() => {
    if (!contract) return false
    const editableStatuses = ['draft', 'open', 'pending_acceptance']
    return editableStatuses.includes(contract.status)
  }, [contract])

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contract) return
    if (!newTitle.trim() || !newAmount) {
      toast.error('Title and Amount are required.')
      return
    }

    setIsSubmittingMilestone(true)
    try {
      await addMilestone(contract.id, {
        id: `m-${Date.now()}`,
        title: newTitle.trim(),
        description: newDescription.trim(),
        amount: parseFloat(newAmount),
        currency: contract.currency || 'USD',
        deadline: newDeadline || new Date(Date.now() + 14 * 86400000).toISOString(),
        status: 'pending',
        acceptanceCriteria: [],
        paymentStatus: 'not_started',
      } as any)
      toast.success('Milestone added successfully.')
      setIsAddingMilestone(false)
      setNewTitle('')
      setNewDescription('')
      setNewAmount('')
      setNewDeadline('')
      await fetchContracts()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add milestone.')
    } finally {
      setIsSubmittingMilestone(false)
    }
  }

  const handleAward = async () => {
    if (!selectedApplicant) return
    setIsAwarding(true)
    try {
      await api.applications.award(selectedApplicant.id)
      toast.success(`Contract awarded to ${selectedApplicant.freelancer?.name || 'freelancer'}!`)
      setAwardDialogOpen(false)
      setSelectedApplicant(null)
      await fetchContracts()
      if (contract?.id) {
        const res = await api.contracts.listApplications(contract.id)
        setApplications(res?.applications || [])
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to award contract.')
    } finally {
      setIsAwarding(false)
    }
  }

  const handleShortlist = async (appId: string) => {
    try {
      await api.applications.shortlist(appId)
      toast.success('Applicant marked as shortlisted.')
      if (contract?.id) {
        const res = await api.contracts.listApplications(contract.id)
        setApplications(res?.applications || [])
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to shortlist applicant.')
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading contract specification...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (!contract) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto py-12 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Contract Not Found</h2>
          <p className="text-slate-400 text-sm">
            The contract with identifier <span className="font-mono text-white">{id}</span> could not be found or you do not have permission to view it.
          </p>
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white mt-4">
            <Link to={ROUTES.CLIENT_CONTRACTS}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to My Contracts
            </Link>
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  const totalAmount = contract.totalAmount ?? (contract as any).budget ?? 0
  const stagedAmount = contract.stagedAmount ?? 0
  const releasedAmount = contract.releasedAmount ?? 0

  // 5-step pipeline progression
  const pipelineSteps = [
    { num: 1, label: 'SOW Created', active: true, done: true },
    {
      num: 2,
      label: 'Dual Acceptance',
      active: contract.status === 'pending_acceptance',
      done: ['active', 'in_verification', 'completed'].includes(contract.status),
    },
    {
      num: 3,
      label: 'Milestone Funded',
      active: stagedAmount > 0 && stagedAmount < totalAmount,
      done: stagedAmount >= totalAmount || releasedAmount > 0,
    },
    {
      num: 4,
      label: 'AI Verification',
      active: contract.status === 'in_verification',
      done: contract.status === 'completed',
    },
    {
      num: 5,
      label: 'Disbursement',
      active: releasedAmount > 0 && releasedAmount < totalAmount,
      done: contract.status === 'completed' && releasedAmount >= totalAmount,
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-16">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white hover:bg-[#171F33] -ml-2"
            >
              <Link to={ROUTES.CLIENT_CONTRACTS}>
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Contracts
              </Link>
            </Button>
            <span className="text-slate-600">/</span>
            <span className="font-mono text-xs font-semibold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-900/60">
              {contract.code}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-xs uppercase font-mono tracking-wider bg-[#131B2E] border-[#222A3D] text-slate-300"
            >
              Status: <span className="ml-1 text-white font-semibold">{contract.status.replace('_', ' ')}</span>
            </Badge>
          </div>
        </div>

        {/* Contract Header Banner */}
        <div className="bg-[#131B2E] border border-[#222A3D] rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400">Version v{contract.version || '1.0'}</span>
                <span className="text-slate-600">•</span>
                <span className="text-xs text-slate-400">
                  Created {formatDate(contract.createdAt)}
                </span>
                {(contract as any).category && (
                  <>
                    <span className="text-slate-600">•</span>
                    <Badge className="bg-slate-800 text-slate-300 border-slate-700 text-[10px]">
                      {(contract as any).category}
                    </Badge>
                  </>
                )}
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {contract.title}
              </h1>
              <p className="text-slate-400 text-sm line-clamp-2 leading-relaxed">
                {contract.description || 'Smart contract binding milestone deliverables to PayPal escrow disbursements.'}
              </p>
            </div>

            {/* Financial Highlights */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="bg-[#0B1120] border border-[#222A3D] rounded-lg p-3 text-right min-w-[120px]">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total SOW</div>
                <div className="text-lg font-bold font-mono text-white mt-0.5">
                  {formatCurrency(totalAmount, contract.currency)}
                </div>
              </div>
              <div className="bg-[#0B1120] border border-amber-900/30 rounded-lg p-3 text-right min-w-[120px]">
                <div className="text-[10px] text-amber-400 uppercase tracking-wider font-semibold">Staged Escrow</div>
                <div className="text-lg font-bold font-mono text-amber-300 mt-0.5">
                  {formatCurrency(stagedAmount, contract.currency)}
                </div>
              </div>
              <div className="bg-[#0B1120] border border-emerald-900/30 rounded-lg p-3 text-right min-w-[120px]">
                <div className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold">Released</div>
                <div className="text-lg font-bold font-mono text-emerald-300 mt-0.5">
                  {formatCurrency(releasedAmount, contract.currency)}
                </div>
              </div>
            </div>
          </div>

          {/* Lifecycle Stepper */}
          <div className="mt-8 pt-6 border-t border-[#222A3D]">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-3">
              Settlement Pipeline Status
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {pipelineSteps.map((step) => (
                <div
                  key={step.num}
                  className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 transition-all ${
                    step.done
                      ? 'bg-blue-950/40 border-blue-800/60 text-blue-200'
                      : step.active
                      ? 'bg-blue-600/20 border-blue-500 text-white ring-1 ring-blue-500/50'
                      : 'bg-[#0E1528] border-[#222A3D] text-slate-500'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      step.done
                        ? 'bg-blue-600 text-white'
                        : step.active
                        ? 'bg-blue-500 text-white animate-pulse'
                        : 'bg-[#1C263B] text-slate-400'
                    }`}
                  >
                    {step.done ? '✓' : step.num}
                  </div>
                  <span className="font-medium truncate">{step.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabbed Contract Sections */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-[#131B2E] border border-[#222A3D] p-1 h-auto text-slate-400">
            <TabsTrigger
              value="milestones"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs px-4 py-2"
            >
              Milestones & Deliverables ({contract.milestones?.length || 0})
            </TabsTrigger>
            <TabsTrigger
              value="applicants"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs px-4 py-2"
            >
              Applicants ({applications.length})
            </TabsTrigger>
            <TabsTrigger
              value="sow"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs px-4 py-2"
            >
              Legal SOW & Terms
            </TabsTrigger>
            <TabsTrigger
              value="payments"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs px-4 py-2"
            >
              PayPal Escrow Ledger
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: MILESTONES */}
          <TabsContent value="milestones" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">Milestone Matrix</h3>
                <p className="text-xs text-slate-400">
                  Click on any milestone row to view acceptance criteria, fund with PayPal, or release verified payouts.
                </p>
              </div>

              {canEditMilestones && (
                <Button
                  onClick={() => setIsAddingMilestone((prev) => !prev)}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  {isAddingMilestone ? 'Cancel' : 'Add Milestone'}
                </Button>
              )}
            </div>

            {/* Inline Add Milestone Form */}
            {isAddingMilestone && (
              <Card className="bg-[#131B2E] border-blue-600/40 text-white p-4">
                <form onSubmit={handleAddMilestone} className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#222A3D] pb-2">
                    <span className="text-sm font-semibold text-blue-400 flex items-center gap-1.5">
                      <Plus className="w-4 h-4" /> Define New Milestone Scope
                    </span>
                    <span className="text-xs text-slate-400">Editable before contract acceptance</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-300 font-medium">Milestone Title *</label>
                      <Input
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="e.g. Backend Authentication & API Routing"
                        className="bg-[#0B1120] border-[#222A3D] text-white text-xs"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-300 font-medium">Amount (USD) *</label>
                        <Input
                          type="number"
                          value={newAmount}
                          onChange={(e) => setNewAmount(e.target.value)}
                          placeholder="500"
                          min="1"
                          step="0.01"
                          className="bg-[#0B1120] border-[#222A3D] text-white text-xs"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-300 font-medium">Target Deadline</label>
                        <Input
                          type="date"
                          value={newDeadline}
                          onChange={(e) => setNewDeadline(e.target.value)}
                          className="bg-[#0B1120] border-[#222A3D] text-white text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-300 font-medium">Deliverable Specification</label>
                    <Textarea
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="Outline expected code artifacts, test suites, or deployment endpoints for AI verification."
                      rows={2}
                      className="bg-[#0B1120] border-[#222A3D] text-white text-xs"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsAddingMilestone(false)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmittingMilestone}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                    >
                      {isSubmittingMilestone ? 'Adding...' : 'Save Milestone'}
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Clickable Milestones Table */}
            <div className="bg-[#0E1528] border border-[#222A3D] rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#222A3D] bg-[#131B2E] text-slate-400 font-mono uppercase text-[11px]">
                      <th className="py-3 px-4 w-12 text-center">#</th>
                      <th className="py-3 px-4">Milestone Title & Scope</th>
                      <th className="py-3 px-4">Delivery Status</th>
                      <th className="py-3 px-4 text-right">Target Amount</th>
                      <th className="py-3 px-4">Deadline</th>
                      <th className="py-3 px-4">PayPal Escrow</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1D263B]">
                    {(contract.milestones || []).length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500">
                          No milestones added to this contract yet. Click "Add Milestone" to define the project phases.
                        </td>
                      </tr>
                    ) : (
                      (contract.milestones || []).map((m: any, idx: number) => {
                        const isVerified = m.status === 'verified' || m.status === 'settled'
                        const isStaged = m.paymentStatus === 'staged_in_sandbox'
                        const isReleased = m.paymentStatus === 'released'

                        return (
                          <tr
                            key={m.id || idx}
                            onClick={() => {
                              setSelectedMilestone(m)
                              setMilestoneDialogOpen(true)
                            }}
                            className="hover:bg-[#152037] cursor-pointer transition-colors group"
                          >
                            <td className="py-3.5 px-4 font-mono text-center text-slate-400 font-semibold">
                              M{idx + 1}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-white group-hover:text-blue-300 transition-colors">
                                {m.title}
                              </div>
                              {m.description && (
                                <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                                  {m.description}
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-medium inline-flex items-center gap-1 ${
                                  isVerified
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : m.status === 'in_progress'
                                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                    : m.status === 'in_verification' || m.status === 'submitted'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                                    : 'bg-slate-700/50 text-slate-300 border border-slate-600/40'
                                }`}
                              >
                                {m.status || 'pending'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                              {formatCurrency(m.amount || 0, contract.currency)}
                            </td>
                            <td className="py-3.5 px-4 text-slate-400">
                              {m.deadline ? formatDate(m.deadline) : 'Flexible'}
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                                  isReleased
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                    : isStaged
                                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                                }`}
                              >
                                {isReleased ? 'Released' : isStaged ? 'Staged' : 'Unfunded'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs text-blue-400 group-hover:text-blue-300 hover:bg-blue-900/30 px-2"
                              >
                                Details <ChevronRight className="w-3.5 h-3.5 ml-1" />
                              </Button>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: APPLICANTS */}
          <TabsContent value="applicants" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">Freelancer Proposals</h3>
                <p className="text-xs text-slate-400">
                  AI evaluates proposals against required skills and criteria to rank applicants automatically.
                </p>
              </div>
            </div>

            {loadingApps ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Scanning applicants and AI telemetry...
              </div>
            ) : applications.length === 0 ? (
              <div className="bg-[#131B2E] border border-[#222A3D] rounded-xl p-8 text-center space-y-3">
                <User className="w-10 h-10 text-slate-500 mx-auto" />
                <h4 className="text-sm font-semibold text-white">No Applications Received Yet</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  When freelancers apply to this contract, their proposals and AI vetting reports will appear here for review and awarding.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {applications.map((app) => {
                  const vetting = app.vettingReport || {}
                  const score = vetting.score ?? 85
                  const rec = vetting.recommendation ?? 'CONSIDER'

                  return (
                    <Card
                      key={app.id}
                      className="bg-[#131B2E] border-[#222A3D] text-white p-5 hover:border-blue-500/50 transition-all"
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-base">
                              {app.freelancer?.name || 'Applicant'}
                            </span>
                            <span className="text-xs text-slate-400">
                              ({app.freelancer?.email || 'verified'})
                            </span>
                            <Badge
                              className={`text-[10px] uppercase font-mono ${
                                app.status === 'awarded'
                                  ? 'bg-emerald-600 text-white'
                                  : app.status === 'shortlisted'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {app.status}
                            </Badge>
                          </div>

                          <p className="text-xs text-slate-300 bg-[#0B1120] p-3 rounded-lg border border-[#222A3D] italic">
                            "{app.coverNote || 'Looking forward to delivering this project with verified milestone quality.'}"
                          </p>

                          {/* AI Vetting Snapshot */}
                          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                            <div className="flex items-center gap-1.5 text-blue-400 font-mono">
                              <Sparkles className="w-3.5 h-3.5" /> AI Score: <span className="font-bold">{score}/100</span>
                            </div>
                            <span className="text-slate-600">•</span>
                            <span
                              className={`font-semibold text-[11px] ${
                                rec === 'HIRE'
                                  ? 'text-emerald-400'
                                  : rec === 'CONSIDER'
                                  ? 'text-amber-400'
                                  : 'text-red-400'
                              }`}
                            >
                              Recommendation: {rec}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center md:flex-col gap-2 shrink-0">
                          {app.status !== 'awarded' && (
                            <Button
                              onClick={() => {
                                setSelectedApplicant(app)
                                setAwardDialogOpen(true)
                              }}
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs w-full"
                            >
                              <Award className="w-3.5 h-3.5 mr-1.5" /> Award Contract
                            </Button>
                          )}
                          {app.status === 'submitted' && (
                            <Button
                              onClick={() => handleShortlist(app.id)}
                              variant="outline"
                              size="sm"
                              className="border-[#222A3D] text-slate-300 hover:bg-[#1E293B] text-xs w-full"
                            >
                              Shortlist
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* TAB 3: LEGAL SOW & TERMS */}
          <TabsContent value="sow" className="space-y-4">
            <Card className="bg-[#131B2E] border-[#222A3D] text-white p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Statement of Work (SOW)</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  This legally binding smart contract governance agreement specifies dual cryptographic acceptance, milestone evidence submission standards, automated AI verification thresholds, and PayPal sandbox escrow release triggers.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#0B1120] border border-[#222A3D] rounded-lg p-4 space-y-2">
                  <div className="text-xs font-mono text-blue-400 uppercase font-semibold">Client Party</div>
                  <div className="font-semibold text-white text-sm">
                    {contract.client?.name || user?.name || 'Elena Rostova'}
                  </div>
                  <div className="text-xs text-slate-400">
                    {contract.client?.email || user?.email || 'client@trustbroker.ai'}
                  </div>
                  <div className="text-[11px] text-emerald-400 font-mono mt-2">
                    ✓ Identity Verified & Signed
                  </div>
                </div>

                <div className="bg-[#0B1120] border border-[#222A3D] rounded-lg p-4 space-y-2">
                  <div className="text-xs font-mono text-emerald-400 uppercase font-semibold">Freelancer Party</div>
                  <div className="font-semibold text-white text-sm">
                    {contract.freelancer?.name || 'Awaiting Award / Acceptance'}
                  </div>
                  <div className="text-xs text-slate-400">
                    {contract.freelancer?.email || 'Open for proposals'}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-2">
                    {contract.freelancer ? '✓ Dual Signature Recorded' : 'Pending selection'}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-300">Scope of Work Brief</div>
                <div className="bg-[#0B1120] border border-[#222A3D] rounded-lg p-4 text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {contract.description || 'Full-stack application deliverable with complete test coverage and AI verification conformance.'}
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* TAB 4: PAYMENTS & ESCROW */}
          <TabsContent value="payments" className="space-y-4">
            <Card className="bg-[#131B2E] border-[#222A3D] text-white p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">PayPal Escrow Ledger</h3>
                  <p className="text-xs text-slate-400">
                    Live escrow reconciliation synchronized with PayPal Sandbox Orders and Payouts.
                  </p>
                </div>
                <Badge className="bg-emerald-950 text-emerald-400 border-emerald-800 font-mono text-xs">
                  Sandbox Active
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#0B1120] border border-[#222A3D] rounded-xl p-4">
                  <span className="text-xs text-slate-400">Total Commitment</span>
                  <div className="text-2xl font-bold font-mono text-white mt-1">
                    {formatCurrency(totalAmount, contract.currency)}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Contract Target Budget</span>
                </div>

                <div className="bg-[#0B1120] border border-amber-900/40 rounded-xl p-4">
                  <span className="text-xs text-amber-400">Staged in Escrow</span>
                  <div className="text-2xl font-bold font-mono text-amber-300 mt-1">
                    {formatCurrency(stagedAmount, contract.currency)}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Pre-funded by Client</span>
                </div>

                <div className="bg-[#0B1120] border border-emerald-900/40 rounded-xl p-4">
                  <span className="text-xs text-emerald-400">Disbursed Payouts</span>
                  <div className="text-2xl font-bold font-mono text-emerald-300 mt-1">
                    {formatCurrency(releasedAmount, contract.currency)}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Transferred to Freelancer PayPal</span>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Milestone Detail Dialog Popup */}
        {selectedMilestone && (
          <MilestoneDetailDialog
            milestone={selectedMilestone}
            contract={contract}
            open={milestoneDialogOpen}
            onOpenChange={setMilestoneDialogOpen}
            onMilestoneUpdated={async () => {
              await fetchContracts()
            }}
          />
        )}

        {/* Award Confirmation Dialog */}
        <AlertDialog open={awardDialogOpen} onOpenChange={setAwardDialogOpen}>
          <AlertDialogContent className="bg-[#131B2E] border-[#222A3D] text-white">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Award Contract</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-400 text-xs">
                Are you sure you want to award this contract to{' '}
                <span className="text-white font-semibold">
                  {selectedApplicant?.freelancer?.name || 'this freelancer'}
                </span>
                ? This will assign them as the designated contractor and enable dual acceptance.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-[#0E1528] border-[#222A3D] text-slate-300 hover:bg-[#1A253C] text-xs">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleAward}
                disabled={isAwarding}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              >
                {isAwarding ? 'Awarding...' : 'Confirm Award'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  )
}

export default ClientContractPage
