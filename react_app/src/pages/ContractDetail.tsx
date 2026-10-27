import React, { useState, useEffect } from 'react'
import { useParams, Link, useSearchParams, useLocation } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { StatusBadge } from '@/components/common/StatusBadge'
import { PayPalCheckout } from '@/components/payments/PayPalCheckout'
import { useContractStore } from '@/hooks/useContractStore'
import { useNotificationStore } from '@/hooks/useNotifications'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ROUTES } from '@/constants'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import type { Milestone } from '@/types/contract'
import { 
  CheckCircle2, 
  CreditCard, 
  History, 
  Sparkles,
  AlertCircle,
  UploadCloud,
  DollarSign,
  RotateCcw,
  Plus,
  Trash2,
  ArrowLeft,
  Calendar,
  Clock,
  X,
  Copy,
  Check,
  ExternalLink,
  FileText,
  ShieldCheck,
  Lock,
  Share2,
  Download,
  FileCode,
  Users
} from 'lucide-react'
import { toast } from 'sonner'

export const ContractDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const { 
    contracts, 
    activeRole, 
    acceptContract, 
    releasePayment, 
    requestRevision,
    stagePayment,
    addMilestone,
    removeMilestone,
    fetchContractById
  } = useContractStore()
  const { addNotification } = useNotificationStore()

  useEffect(() => {
    if (id) {
      fetchContractById(id)
    }
  }, [id, fetchContractById])

  const contract = contracts.find((c) => c.id === id || c.code === id) || contracts[0]

  // View States
  const [activeTab, setActiveTab] = useState<'contract' | 'sow' | 'payments' | 'activity' | 'applicants'>(
    searchParams.get('tab') === 'applicants' ? 'applicants' : 'contract'
  )
  const [applications, setApplications] = useState<any[]>([])
  const [appsLoading, setAppsLoading] = useState(false)
  const [awardTarget, setAwardTarget] = useState<any>(null)
  const [expandedApp, setExpandedApp] = useState<string | null>(null)
  const [paymentAttempts, setPaymentAttempts] = useState<any[]>([])
  const [payouts, setPayouts] = useState<any[]>([])

  useEffect(() => {
    if (searchParams.get('tab') === 'applicants' || location.pathname.endsWith('/applicants')) {
      setActiveTab('applicants')
    }
  }, [searchParams, location.pathname])

  useEffect(() => {
    if (activeTab !== 'applicants' || !id) return
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    if (!isUuid) {
      setApplications([])
      return
    }
    setAppsLoading(true)
    api.contracts
      .listApplications(id)
      .then((res) => setApplications(res.applications || []))
      .catch(() => setApplications([]))
      .finally(() => setAppsLoading(false))
  }, [id, activeTab])

  useEffect(() => {
    if (activeTab !== 'payments' || !id) return
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    if (!isUuid) return
    api.payments.getHistory(id).then(setPaymentAttempts).catch(() => setPaymentAttempts([]))
    api.payments.payouts(id).then(setPayouts).catch(() => setPayouts([]))
  }, [id, activeTab, stagedAmount, releasedAmount])

  const [milestoneFilter, setMilestoneFilter] = useState<'all' | 'in_progress' | 'review' | 'settled'>('all')
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedHash, setCopiedHash] = useState(false)

  // Dialog States
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false)
  const [revisionDialogOpen, setRevisionDialogOpen] = useState(false)
  const [addMilestoneOpen, setAddMilestoneOpen] = useState(false)
  const [releaseDialogOpen, setReleaseDialogOpen] = useState(false)
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null)
  const [revisionNotes, setRevisionNotes] = useState('')
  const [activityFilter, setActivityFilter] = useState<'all' | 'contract' | 'payment' | 'verification'>('all')

  // Add Milestone Form State (Client Only)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newAmount, setNewAmount] = useState<string>('600')
  const [newDeadline, setNewDeadline] = useState('')
  const [newCriteria, setNewCriteria] = useState<string[]>([
    'Deliverable meets all technical specifications',
    'Automated tests and quality checks pass'
  ])

  if (!contract) {
    return (
      <DashboardLayout>
        <div className="text-center py-20 space-y-4">
          <h2 className="text-xl font-bold text-white">Contract not found</h2>
          <Button asChild variant="outline" className="border-slate-700 text-slate-300">
            <Link to={ROUTES.DASHBOARD}>Return to Dashboard</Link>
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  // Safe Party Access
  const clientParty = contract.client || {
    id: 'client-default',
    name: 'Client',
    email: '',
    role: 'client' as const,
    accepted: false,
  }

  const freelancerParty = contract.freelancer || {
    id: 'freelancer-default',
    name: 'Freelancer',
    email: '',
    role: 'freelancer' as const,
    accepted: false,
  }

  const isClient = activeRole === 'client'
  const isFreelancer = activeRole === 'freelancer'
  const isUserAccepted = isClient ? clientParty.accepted : freelancerParty.accepted

  // Financial Metrics
  const totalAmount = contract.totalAmount || 1
  const stagedAmount = contract.stagedAmount || 0
  const releasedAmount = contract.releasedAmount || 0
  const completionPercentage = Math.min(100, Math.round((releasedAmount / totalAmount) * 100))
  const isBothAccepted = Boolean(clientParty.accepted && freelancerParty.accepted)
  const isEscrowStaged = stagedAmount > 0
  const isWorkVerified = contract.milestones.some((m) => m.status === 'verified' || m.status === 'settled')
  const isSettled = releasedAmount > 0 && releasedAmount >= totalAmount

  // Find next milestone needing work
  const nextWorkMilestone = contract.milestones.find(
    (m) => m.status === 'in_progress' || m.status === 'pending' || m.status === 'revision_requested'
  )

  // Find milestone pending release approval
  const pendingReleaseMilestone = contract.milestones.find(
    (m) => m.status === 'verified' && m.paymentStatus !== 'released'
  )

  const nextFundMilestone = contract.milestones.find(
    (m) => !['staged_in_sandbox', 'release_authorized', 'released'].includes(m.paymentStatus)
  )

  // Lifecycle Progression Steps
  const lifecycleSteps = [
    {
      id: 1,
      title: 'SOW Created',
      desc: 'Scope locked',
      status: 'completed',
      icon: FileText,
    },
    {
      id: 2,
      title: 'Dual Acceptance',
      desc: isBothAccepted ? 'Both signed' : 'Pending',
      status: isBothAccepted ? 'completed' : 'current',
      icon: CheckCircle2,
    },
    {
      id: 3,
      title: 'Milestone funded',
      desc: isEscrowStaged ? 'PayPal captured' : 'Unfunded',
      status: isEscrowStaged ? 'completed' : isBothAccepted ? 'current' : 'upcoming',
      icon: ShieldCheck,
    },
    {
      id: 4,
      title: 'AI Verification',
      desc: isWorkVerified ? 'Criteria met' : 'In review',
      status: isWorkVerified ? 'completed' : isEscrowStaged ? 'current' : 'upcoming',
      icon: Sparkles,
    },
    {
      id: 5,
      title: 'Disbursement',
      desc: isSettled ? '100% released' : `${formatCurrency(releasedAmount)} paid`,
      status: isSettled ? 'completed' : isWorkVerified ? 'current' : 'upcoming',
      icon: DollarSign,
    },
  ]

  // Handlers
  const handleCopyCode = () => {
    navigator.clipboard.writeText(contract.code)
    setCopiedCode(true)
    toast.success(`Copied contract code ${contract.code}`)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const handleCopyHash = () => {
    const hash = `sha256-tb2026-${contract.id.slice(-8)}-${contract.version}a9f`
    navigator.clipboard.writeText(hash)
    setCopiedHash(true)
    toast.success('Copied SOW SHA-256 fingerprint')
    setTimeout(() => setCopiedHash(false), 2000)
  }

  const handleShareLink = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Contract link copied to clipboard!')
  }

  const handleExportSOW = () => {
    const exportData = {
      contractCode: contract.code,
      title: contract.title,
      description: contract.description,
      version: contract.version,
      status: contract.status,
      currency: contract.currency || 'USD',
      financials: {
        totalAmount: contract.totalAmount,
        stagedAmount: contract.stagedAmount,
        releasedAmount: contract.releasedAmount,
      },
      client: clientParty,
      freelancer: freelancerParty,
      milestones: contract.milestones.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        amount: m.amount,
        deadline: m.deadline,
        status: m.status,
        paymentStatus: m.paymentStatus,
        criteria: m.acceptanceCriteria.map((c) => ({
          title: c.title,
          status: c.status,
        })),
        assessment: m.assessment ? { score: m.assessment.overallScore, summary: m.assessment.summaryAnalysis } : null,
      })),
      cryptographicFingerprint: `sha256-tb2026-${contract.id.slice(-8)}-${contract.version}a9f`,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${contract.code}-SOW-Spec.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('SOW Specification exported successfully!')
  }

  const handleConfirmAcceptTerms = () => {
    acceptContract(contract.id, activeRole)
    setAcceptDialogOpen(false)
    const roleName = isClient ? 'Client' : 'Freelancer'
    toast.success(`You have accepted the terms as ${roleName}!`)
    addNotification({
      title: 'Contract Terms Accepted',
      description: `${roleName} digitally confirmed the contract specifications.`,
      type: 'contract',
      link: `/dashboard/contracts/${contract.id}`,
    })
  }

  const handlePaymentSuccess = (details: any) => {
    const fundedAmount = Number(details?.amount ?? nextFundMilestone?.amount ?? 0)
    if (id) fetchContractById(id)
    toast.success(`Milestone funded: ${formatCurrency(fundedAmount)} USD via PayPal.`)
    addNotification({
      title: 'Milestone funded via PayPal',
      description: `${formatCurrency(fundedAmount)} USD captured for ${contract.code}. Order ${details?.id || details?.paypal_order_id || ''}.`,
      type: 'payment',
      link: `/dashboard/contracts/${contract.id}`,
    })
  }

  const handleOpenReleaseModal = (m: Milestone) => {
    setSelectedMilestone(m)
    setReleaseDialogOpen(true)
  }

  const handleConfirmRelease = async () => {
    if (!selectedMilestone) return
    try {
      const result = await api.payments.releasePayout({
        contract_id: contract.id,
        milestone_id: selectedMilestone.id,
      })
      if (id) fetchContractById(id)
      setReleaseDialogOpen(false)
      toast.success(
        `PayPal payout ${result?.paypal_batch_id || result?.status}: ${formatCurrency(selectedMilestone.amount)} USD`
      )
      addNotification({
        title: 'PayPal payout sent',
        description: `${formatCurrency(selectedMilestone.amount)} USD · batch ${result?.paypal_batch_id || 'pending'}.`,
        type: 'payment',
        link: `/dashboard/contracts/${contract.id}`,
      })
    } catch (err: any) {
      toast.error(err?.detail || 'PayPal payout failed. No duplicate send was assumed.')
    }
  }

  const handleOpenRevision = (milestone: Milestone) => {
    setSelectedMilestone(milestone)
    setRevisionNotes('')
    setRevisionDialogOpen(true)
  }

  const handleConfirmRevision = () => {
    if (!selectedMilestone || !revisionNotes.trim()) return
    requestRevision(contract.id, selectedMilestone.id, revisionNotes.trim())
    setRevisionDialogOpen(false)
    toast.info('Revision requested from freelancer')
    addNotification({
      title: 'Revision Requested',
      description: `Client requested adjustments for milestone "${selectedMilestone.title}".`,
      type: 'revision',
      link: `/dashboard/contracts/${contract.id}`,
    })
  }

  const handleApplyPreset = (preset: { title: string; amount: string; criteria: string[] }) => {
    setNewTitle(preset.title)
    setNewAmount(preset.amount)
    setNewCriteria(preset.criteria)
    toast.info(`Preset applied: ${preset.title}`)
  }

  const handleAddCriterionInput = () => {
    setNewCriteria([...newCriteria, ''])
  }

  const handleRemoveCriterionInput = (index: number) => {
    if (newCriteria.length <= 1) return
    setNewCriteria(newCriteria.filter((_, i) => i !== index))
  }

  const handleUpdateCriterionInput = (index: number, val: string) => {
    const updated = [...newCriteria]
    updated[index] = val
    setNewCriteria(updated)
  }

  const handleCreateMilestone = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) {
      toast.error('Please enter a milestone title')
      return
    }
    const parsedAmount = parseFloat(newAmount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid milestone amount')
      return
    }

    const validCriteria = newCriteria.map((c) => c.trim()).filter(Boolean)
    if (validCriteria.length === 0) {
      toast.error('Please specify at least one acceptance criterion')
      return
    }

    const milestoneObj: Milestone = {
      id: `m-${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim() || 'Deliverables and technical specifications defined in SOW phase.',
      amount: parsedAmount,
      currency: contract.currency || 'USD',
      deadline: newDeadline || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      status: 'pending',
      paymentStatus: 'not_started',
      acceptanceCriteria: validCriteria.map((title, i) => ({
        id: `crit-${Date.now()}-${i}`,
        title,
        description: `Verification standard: ${title}`,
        status: 'pending' as const,
      })),
    }

    addMilestone(contract.id, milestoneObj)
    toast.success(`Milestone "${milestoneObj.title}" added successfully!`)
    addNotification({
      title: 'Milestone Added',
      description: `New milestone "${milestoneObj.title}" ($${milestoneObj.amount}) added to contract.`,
      type: 'contract',
      link: `/dashboard/contracts/${contract.id}`,
    })

    // Reset Form
    setNewTitle('')
    setNewDesc('')
    setNewAmount('600')
    setNewDeadline('')
    setNewCriteria([
      'Deliverable meets all technical specifications',
      'Automated tests and quality checks pass'
    ])
    setAddMilestoneOpen(false)
  }

  const handleDeleteMilestone = (milestoneId: string, title: string) => {
    if (contract.milestones.length <= 1) {
      toast.error('Contract must have at least one milestone.')
      return
    }
    removeMilestone(contract.id, milestoneId)
    toast.info(`Milestone "${title}" removed`)
  }

  // Filtered Milestones
  const filteredMilestones = contract.milestones.filter((m) => {
    if (milestoneFilter === 'all') return true
    if (milestoneFilter === 'in_progress') return m.status === 'in_progress' || m.status === 'pending'
    if (milestoneFilter === 'review') return m.status === 'submitted' || m.status === 'verifying' || m.status === 'revision_requested'
    if (milestoneFilter === 'settled') return m.status === 'verified' || m.status === 'settled'
    return true
  })

  // Filter audit logs
  const filteredLogs = (contract.auditLogs || []).filter((log) => {
    if (activityFilter === 'all') return true
    if (activityFilter === 'contract') return log.action.includes('CONTRACT') || log.action.includes('ACCEPTED')
    if (activityFilter === 'payment') return log.action.includes('PAYMENT') || log.action.includes('RESERVED')
    if (activityFilter === 'verification') return log.action.includes('VERIF') || log.action.includes('EVIDENCE')
    return true
  })

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Breadcrumb & Metadata Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-[#222A3D]">
          <div className="flex items-center gap-2 text-xs">
            <Link
              to={ROUTES.DASHBOARD}
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Contracts</span>
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-blue-400 font-mono font-medium">{contract.code}</span>
            <span className="text-slate-600">&bull;</span>
            <StatusBadge status={contract.status} />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleCopyCode}
              className="group inline-flex items-center gap-1.5 font-mono text-xs font-bold text-blue-400 bg-[#0E1528] hover:bg-blue-950/40 px-2.5 py-1 rounded border border-[#222A3D] transition-colors"
              title="Click to copy contract code"
            >
              <span>{contract.code}</span>
              {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500 group-hover:text-blue-400" />}
            </button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleShareLink}
              className="border-[#222A3D] bg-[#0E1528] text-slate-300 hover:text-white text-xs h-7 gap-1"
            >
              <Share2 className="w-3 h-3" />
              <span>Share</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportSOW}
              className="border-[#222A3D] bg-[#0E1528] text-slate-300 hover:text-white text-xs h-7 gap-1"
            >
              <Download className="w-3 h-3" />
              <span>Export</span>
            </Button>

            {/* ONLY Clients can add milestones */}
            {isClient && (
              <Button
                size="sm"
                onClick={() => setAddMilestoneOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-7 gap-1 shadow-sm font-medium"
              >
                <Plus className="w-3 h-3" />
                <span>Add Milestone</span>
              </Button>
            )}
          </div>
        </div>

        {/* COMPACT LIFECYCLE PROGRESSION STRIP */}
        <div className="p-3.5 rounded-xl bg-[#0E1528] border border-[#222A3D]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              Contract Lifecycle &amp; Settlement Pipeline
            </span>
            <span className="text-slate-400 font-mono text-[11px]">
              Viewing as: <strong className="text-blue-400 capitalize">{activeRole}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {lifecycleSteps.map((step) => {
              const isCompleted = step.status === 'completed'
              const isCurrent = step.status === 'current'
              const Icon = step.icon

              return (
                <div
                  key={step.id}
                  className={`p-2.5 rounded-lg border text-xs transition-all ${
                    isCompleted
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                      : isCurrent
                      ? 'bg-blue-950/30 border-blue-500/60 text-white ring-1 ring-blue-500/20 shadow-sm'
                      : 'bg-[#0B1326] border-[#222A3D] text-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                      isCompleted ? 'bg-emerald-500/20 text-emerald-400' : isCurrent ? 'bg-blue-500/30 text-blue-400' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {step.id}
                    </span>
                    <Icon className={`w-3.5 h-3.5 ${
                      isCompleted ? 'text-emerald-400' : isCurrent ? 'text-blue-400' : 'text-slate-600'
                    }`} />
                  </div>
                  <div className="font-semibold text-[11px] truncate leading-tight">{step.title}</div>
                  <div className="text-[10px] text-slate-400 truncate">{step.desc}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ASYMMETRIC 70/30 MASTER WORKSPACE LAYOUT (Deel & Stripe Benchmark) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* MAIN WORKSPACE CANVAS (Left 70% / 8 columns) */}
          <div className="lg:col-span-8 space-y-6">

            {/* Contract Title & Description Card */}
            <Card className="border-[#222A3D] bg-[#131B2E] text-white p-5 shadow-lg">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant="outline" className="text-slate-300 border-slate-700 bg-slate-800/60 font-mono text-[10px]">
                    v{contract.version}.0 SOW
                  </Badge>
                  <span className="text-slate-400 text-xs">
                    Created {formatDate(contract.createdAt)} &bull; Currency: <strong className="text-white">{contract.currency || 'USD'}</strong>
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {contract.title}
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
                  {contract.description}
                </p>
              </div>

              {/* Pending Digital Acceptance Callout */}
              {!isUserAccepted && contract.status !== 'draft' && contract.status !== 'open' && (
                <div className="mt-4 p-3.5 rounded-xl bg-blue-950/40 border border-blue-900/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-400 shrink-0" />
                    <span className="text-slate-200">
                      You have not yet signed this contract version as <strong className="text-white capitalize">{activeRole}</strong>.
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setAcceptDialogOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 shrink-0"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Accept Terms
                  </Button>
                </div>
              )}
            </Card>

            {/* Main Tabs Navigation */}
            <Tabs
              defaultValue="contract"
              value={activeTab}
              onValueChange={(v) => {
                setActiveTab(v as any)
                if (v === 'applicants') {
                  setSearchParams({ tab: 'applicants' })
                } else {
                  setSearchParams({})
                }
              }}
              className="space-y-4 w-full"
            >
              <TabsList className="bg-[#101726] border border-[#222A3D] p-1 h-auto flex flex-wrap gap-1">
                {isClient && (
                  <TabsTrigger
                    value="applicants"
                    className="text-xs font-medium text-slate-400 data-[state=active]:text-white data-[state=active]:bg-[#1F2942] py-2 px-3.5"
                  >
                    <Users className="w-3.5 h-3.5 mr-1.5 inline" />
                    Applicants ({applications.length})
                  </TabsTrigger>
                )}
                <TabsTrigger 
                  value="contract" 
                  className="text-xs font-medium text-slate-400 data-[state=active]:text-white data-[state=active]:bg-[#1F2942] py-2 px-3.5"
                >
                  Milestones &amp; Deliverables ({contract.milestones.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="sow" 
                  className="text-xs font-medium text-slate-400 data-[state=active]:text-white data-[state=active]:bg-[#1F2942] py-2 px-3.5"
                >
                  Legal SOW &amp; Terms
                </TabsTrigger>
                {contract.status !== 'draft' && contract.status !== 'open' && (
                <TabsTrigger 
                  value="payments" 
                  className="text-xs font-medium text-slate-400 data-[state=active]:text-white data-[state=active]:bg-[#1F2942] py-2 px-3.5"
                >
                  PayPal
                </TabsTrigger>
                )}
                <TabsTrigger 
                  value="activity" 
                  className="text-xs font-medium text-slate-400 data-[state=active]:text-white data-[state=active]:bg-[#1F2942] py-2 px-3.5"
                >
                  Audit Activity Trail ({(contract.auditLogs || []).length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="applicants" className="space-y-4 outline-none">
                {appsLoading ? (
                  <div className="text-center py-16 text-sm text-slate-400">Loading applicants...</div>
                ) : applications.length === 0 ? (
                  <Card className="border-[#222A3D] bg-[#131B2E] text-white">
                    <CardContent className="py-16 text-center space-y-3">
                      <Users className="w-10 h-10 text-slate-500 mx-auto" />
                      <h3 className="text-lg font-semibold">Waiting for applications</h3>
                      <p className="text-xs text-slate-400 max-w-md mx-auto">
                        This listing is open. Freelancers can apply from the marketplace. You will see ranked
                        applicants here — no payout or delivery steps until you award someone.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {applications.map((app) => {
                      const rec = String(app.vetting?.recommendation || '')
                      const badge =
                        rec === 'new_talent'
                          ? { label: 'New talent', className: 'bg-emerald-950 text-emerald-300 border-emerald-800' }
                          : rec === 'strong_fit'
                            ? { label: 'Strong fit', className: 'bg-blue-950 text-blue-300 border-blue-800' }
                            : rec === 'insufficient_evidence'
                              ? { label: 'Needs profile', className: 'bg-amber-950 text-amber-300 border-amber-800' }
                              : rec
                                ? { label: rec.replace(/_/g, ' '), className: 'bg-[#171F33] text-slate-300 border-[#2D3449]' }
                                : null
                      const reasons = app.vetting?.reasons || {}
                      return (
                      <Card key={app.id} className="border-[#222A3D] bg-[#131B2E] text-white">
                        <CardContent className="py-4 space-y-3">
                          <div className="flex justify-between gap-3">
                            <div>
                              <p className="font-semibold text-sm">
                                {app.freelancer?.full_name || 'Freelancer'}
                              </p>
                              <p className="text-xs text-slate-400">{app.freelancer?.headline || app.status}</p>
                              {badge && (
                                <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded border ${badge.className}`}>
                                  {badge.label}
                                </span>
                              )}
                            </div>
                            {app.vetting && (
                              <div className="text-right text-xs">
                                <p className="font-mono text-emerald-400">{app.vetting.score}/100</p>
                                <p className="text-slate-400">{app.status}</p>
                              </div>
                            )}
                          </div>
                          {app.cover_note && (
                            <p className="text-xs text-slate-300">{app.cover_note}</p>
                          )}
                          <button
                            type="button"
                            className="text-[11px] text-blue-400"
                            onClick={() => setExpandedApp(expandedApp === app.id ? null : app.id)}
                          >
                            {expandedApp === app.id ? 'Hide rationale' : 'Show AI rationale'}
                          </button>
                          {expandedApp === app.id && (
                            <div className="text-[11px] text-slate-400 bg-[#0B1326] border border-[#222A3D] rounded-lg p-3 space-y-1">
                              <p>{reasons.rationale || 'No rationale stored.'}</p>
                              {reasons.dimension_scores && (
                                <p>
                                  Skills {reasons.dimension_scores.skills_match} · Portfolio {reasons.dimension_scores.portfolio_relevance} · Past {String(reasons.dimension_scores.past_delivery)}
                                </p>
                              )}
                              {reasons.newcomer && <p>Newcomer: past delivery is insufficient evidence, not zero.</p>}
                              {reasons.trial_milestone_suggestion && (
                                <p className="text-emerald-300">
                                  Trial milestone suggestion: {formatCurrency(Number(reasons.trial_milestone_suggestion.amount) || 0)} — {reasons.trial_milestone_suggestion.reason}
                                </p>
                              )}
                            </div>
                          )}
                          {contract.status === 'open' && app.status !== 'rejected' && app.status !== 'awarded' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-[#2D3449] text-slate-200 text-xs h-7"
                                onClick={async () => {
                                  try {
                                    const updated = await api.applications.shortlist(app.id)
                                    setApplications((prev) => prev.map((a) => (a.id === app.id ? { ...a, ...updated } : a)))
                                    toast.success('Shortlisted')
                                  } catch (err: any) {
                                    toast.error(err?.detail || 'Shortlist failed')
                                  }
                                }}
                              >
                                Shortlist
                              </Button>
                              <Button
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-7"
                                onClick={() => setAwardTarget(app)}
                              >
                                Award
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                      )
                    })}
                    <Dialog open={Boolean(awardTarget)} onOpenChange={(o) => !o && setAwardTarget(null)}>
                      <DialogContent className="bg-[#131B2E] border-[#222A3D] text-white">
                        <DialogHeader>
                          <DialogTitle>Award this freelancer?</DialogTitle>
                          <DialogDescription className="text-xs text-slate-400">
                            This cannot be undone. Other applicants will be marked not selected and notified.
                          </DialogDescription>
                        </DialogHeader>
                        <p className="text-sm">{awardTarget?.freelancer?.full_name}</p>
                        <DialogFooter>
                          <Button variant="outline" size="sm" onClick={() => setAwardTarget(null)} className="border-[#2D3449] text-xs">
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            className="bg-blue-600 text-white text-xs"
                            onClick={async () => {
                              try {
                                await api.applications.award(awardTarget.id)
                                toast.success('Contract awarded. Other applicants were notified.')
                                setAwardTarget(null)
                                if (id) {
                                  fetchContractById(id)
                                  const res = await api.contracts.listApplications(id)
                                  setApplications(res.applications || [])
                                }
                              } catch (err: any) {
                                toast.error(err?.detail || 'Award failed')
                              }
                            }}
                          >
                            Confirm award
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </TabsContent>

              {/* TAB 1: MILESTONES & DELIVERABLES */}
              <TabsContent value="contract" className="space-y-4 outline-none">
                {/* Filter Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#101726] p-2.5 rounded-xl border border-[#222A3D]">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs text-slate-400 mr-1.5 font-medium">Filter:</span>
                    {[
                      { key: 'all', label: `All (${contract.milestones.length})` },
                      { key: 'in_progress', label: 'In Progress' },
                      { key: 'review', label: 'Under Review' },
                      { key: 'settled', label: 'Verified & Settled' },
                    ].map((f) => (
                      <button
                        key={f.key}
                        onClick={() => setMilestoneFilter(f.key as any)}
                        className={`px-2.5 py-1 rounded text-xs transition-colors ${
                          milestoneFilter === f.key
                            ? 'bg-blue-600 text-white font-medium shadow-sm'
                            : 'bg-[#0B1326] text-slate-400 hover:text-white border border-[#222A3D]'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {/* ONLY Clients can add milestones */}
                  {isClient && (
                    <Button
                      size="sm"
                      onClick={() => setAddMilestoneOpen(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1 h-7 font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Milestone</span>
                    </Button>
                  )}
                </div>

                {/* Milestone Cards List */}
                {filteredMilestones.length === 0 ? (
                  <Card className="border-[#222A3D] bg-[#131B2E] text-white p-8 text-center space-y-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
                      <FileCode className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-white">No Milestones Match Filter</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Select another filter chip above to view all contract milestones.
                    </p>
                    <Button
                      onClick={() => setMilestoneFilter('all')}
                      variant="outline"
                      size="sm"
                      className="border-[#222A3D] text-slate-300 text-xs"
                    >
                      View All Milestones
                    </Button>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {filteredMilestones.map((m, idx) => {
                      const isVerified = m.status === 'verified' || m.status === 'settled'
                      const isReleased = m.paymentStatus === 'released' || m.paymentStatus === 'release_authorized'
                      const isStaged = m.paymentStatus === 'staged_in_sandbox' || (m.paymentStatus as string) === 'staged'

                      return (
                        <Card key={m.id} className="border-[#222A3D] bg-[#131B2E] text-white overflow-hidden shadow-sm hover:border-slate-700 transition-colors">
                          {/* Card Header */}
                          <CardHeader className="pb-3 border-b border-[#222A3D] bg-[#0E1528]">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <span className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 text-xs font-bold flex items-center justify-center border border-blue-500/30 shrink-0">
                                  M{idx + 1}
                                </span>
                                <div>
                                  <CardTitle className="text-sm sm:text-base font-bold text-white leading-tight">
                                    {m.title}
                                  </CardTitle>
                                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-400">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3 text-slate-400" />
                                      Target: {formatDate(m.deadline)}
                                    </span>
                                    <span>&bull;</span>
                                    <span className="text-emerald-400 font-semibold font-mono">
                                      {formatCurrency(m.amount, contract.currency)}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 self-start sm:self-auto">
                                <StatusBadge status={m.status} />
                                <span className="text-xs font-mono font-bold text-emerald-400 bg-[#0B1326] px-2.5 py-1 rounded border border-[#2D3449]">
                                  {formatCurrency(m.amount, contract.currency)}
                                </span>
                                {/* Client-only Milestone Delete */}
                                {isClient && contract.milestones.length > 1 && (m.status === 'pending' || contract.status === 'draft' || contract.status === 'pending_acceptance') && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteMilestone(m.id, m.title)}
                                    className="h-8 w-8 p-0 text-slate-500 hover:text-rose-400 hover:bg-rose-950/20"
                                    title="Delete Milestone"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardHeader>

                          {/* Card Content */}
                          <CardContent className="p-4 sm:p-5 space-y-4">
                            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                              {m.description}
                            </p>

                            {/* Acceptance Criteria 2-Column Matrix */}
                            <div className="space-y-2 pt-1">
                              <div className="flex items-center justify-between text-xs text-slate-400">
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                  Acceptance Criteria Matrix ({m.acceptanceCriteria.length})
                                </span>
                                <span className="text-[11px] font-mono text-slate-400">
                                  {m.acceptanceCriteria.filter((c) => c.status === 'pass').length}/{m.acceptanceCriteria.length} Satisfied
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                {m.acceptanceCriteria.map((c) => {
                                  const isPass = c.status === 'pass'
                                  const isFail = c.status === 'fail'
                                  return (
                                    <div
                                      key={c.id}
                                      className="p-2.5 rounded-lg bg-[#0B1326] border border-[#222A3D] flex items-center justify-between gap-3 text-xs"
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        {isPass ? (
                                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                        ) : isFail ? (
                                          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                                        ) : (
                                          <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                                        )}
                                        <span className="text-slate-200 truncate font-medium">
                                          {c.title}
                                        </span>
                                      </div>
                                      <Badge
                                        variant="outline"
                                        className={`text-[10px] font-mono uppercase px-2 py-0.5 shrink-0 ${
                                          isPass
                                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                            : isFail
                                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                            : 'bg-slate-800 text-slate-400 border-slate-700'
                                        }`}
                                      >
                                        {c.status || 'pending'}
                                      </Badge>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>

                            {/* Submitted Evidence preview */}
                            {(m.status === 'submitted' || m.status === 'verified' || m.status === 'settled') && (
                              <div className="p-3 rounded-xl bg-[#0B1326] border border-[#222A3D] space-y-2 text-xs">
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                                    <FileCode className="w-3.5 h-3.5 text-blue-400" />
                                    Submitted Deliverable Evidence
                                  </span>
                                  <Badge variant="outline" className="text-[10px] text-blue-400 border-blue-500/30">
                                    v1.0 Submission
                                  </Badge>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                                  <a
                                    href="https://github.com/elena/trustbroker-deliverable"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#131B2E] border border-slate-700 text-blue-400 hover:text-blue-300 text-[11px] font-mono"
                                  >
                                    <span>github.com/trustbroker/deliverable</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                  <a
                                    href="https://trustbroker-demo.vercel.app"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#131B2E] border border-slate-700 text-emerald-400 hover:text-emerald-300 text-[11px] font-mono"
                                  >
                                    <span>trustbroker-demo.vercel.app</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                              </div>
                            )}

                            {/* AI Verification Assessment */}
                            {m.assessment && (
                              <div className="p-3.5 rounded-lg bg-blue-950/20 border border-blue-900/40 space-y-2 text-xs">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <span className="font-semibold text-blue-300 flex items-center gap-1.5">
                                    <Sparkles className="w-4 h-4 text-blue-400" />
                                    AI Work Verification Assessment
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs text-blue-200 font-bold bg-blue-900/60 px-2 py-0.5 rounded border border-blue-700/50">
                                      Score: {m.assessment.overallScore}/100
                                    </span>
                                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">
                                      Verified Pass
                                    </Badge>
                                  </div>
                                </div>
                                <p className="text-slate-300 text-xs leading-relaxed">
                                  {m.assessment.summaryAnalysis}
                                </p>
                              </div>
                            )}
                          </CardContent>

                          {/* Milestone Footer */}
                          <CardFooter className="bg-[#0E1528] border-t border-[#222A3D] p-3.5 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-slate-400">Escrow:</span>
                              <Badge
                                variant="outline"
                                className={`text-[11px] font-mono capitalize ${
                                  isReleased
                                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                    : isStaged
                                    ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                                    : 'bg-slate-800 text-slate-400 border-slate-700'
                                }`}
                              >
                                {isReleased 
                                  ? 'Disbursed to Freelancer' 
                                  : isStaged 
                                  ? 'Staged in Escrow' 
                                  : 'Pending Funding'}
                              </Badge>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              {/* FREELANCER: Submit Work Action */}
                              {isFreelancer && (m.status === 'in_progress' || m.status === 'pending' || m.status === 'revision_requested') && (
                                <Button
                                  size="sm"
                                  asChild
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 h-8 font-semibold shadow-sm"
                                >
                                  <Link to={ROUTES.DELIVERY_VERIFICATION(contract.id)}>
                                    <UploadCloud className="w-3.5 h-3.5" />
                                    Submit Work Evidence
                                  </Link>
                                </Button>
                              )}

                              {/* CLIENT: Approve Release */}
                              {isClient && isVerified && !isReleased && (
                                <Button
                                  size="sm"
                                  onClick={() => handleOpenReleaseModal(m)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 h-8 font-semibold shadow-sm"
                                >
                                  <DollarSign className="w-3.5 h-3.5" />
                                  Approve Release ({formatCurrency(m.amount, contract.currency)})
                                </Button>
                              )}

                              {/* CLIENT: Request Revision */}
                              {isClient && (m.status === 'submitted' || m.status === 'verified') && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenRevision(m)}
                                  className="border-amber-500/30 text-amber-400 hover:text-white hover:bg-amber-950/40 text-xs gap-1.5 h-8"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  Request Revision
                                </Button>
                              )}

                              {/* Delivery Details Link */}
                              <Button
                                size="sm"
                                variant="outline"
                                asChild
                                className="border-[#2D3449] text-slate-300 hover:text-white hover:bg-[#171F33] text-xs h-8"
                              >
                                <Link to={ROUTES.DELIVERY_VERIFICATION(contract.id)}>
                                  Delivery Details
                                </Link>
                              </Button>
                            </div>
                          </CardFooter>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </TabsContent>

              {/* TAB 2: LEGAL SOW & TERMS */}
              <TabsContent value="sow" className="space-y-4 outline-none">
                <Card className="border-[#222A3D] bg-[#131B2E] text-white p-5 space-y-5 text-xs text-slate-300">
                  <div className="flex items-center justify-between pb-3 border-b border-[#222A3D]">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-400" />
                        Statement of Work (SOW) Specification
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Governed agreement version {contract.version}.0 for {contract.code}
                      </p>
                    </div>

                    <button
                      onClick={handleCopyHash}
                      className="inline-flex items-center gap-1.5 font-mono text-[10px] text-slate-400 hover:text-white bg-[#0B1326] px-2 py-1 rounded border border-[#222A3D]"
                    >
                      <span>sha256-tb2026-{contract.id.slice(-8)}</span>
                      {copiedHash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold text-white uppercase text-[10px] tracking-wider mb-1">
                        1. Scope of Digital Services
                      </h4>
                      <p className="leading-relaxed">
                        The Freelancer agrees to execute all milestone deliverables according to agreed technical acceptance criteria. Total agreed budget: <strong>{formatCurrency(totalAmount, contract.currency)} USD</strong>.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold text-white uppercase text-[10px] tracking-wider mb-1">
                        2. Exclusions &amp; Scope Boundaries
                      </h4>
                      <p className="leading-relaxed">
                        Third-party API subscriptions, production domain hosting, and out-of-scope features are excluded. Material amendments require a version increment.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold text-white uppercase text-[10px] tracking-wider mb-1">
                        3. Revisions &amp; Payout Release
                      </h4>
                      <p className="leading-relaxed">
                        Up to two (2) revision cycles per deliverable based on objective acceptance criteria. Once verified by automated AI assessment and approved by Client, funds are released to the Freelancer.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold text-white uppercase text-[10px] tracking-wider mb-1">
                        4. Intellectual Property
                      </h4>
                      <p className="leading-relaxed">
                        All source code, design assets, and deliverables transfer irrevocably to Client upon final payout release.
                      </p>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="payments" className="space-y-4 outline-none">
                <Card className="border-[#222A3D] bg-[#131B2E] text-white p-5 space-y-4">
                  <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold">
                    <CreditCard className="w-4 h-4" />
                    <span>PayPal Orders v2</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Fund the next milestone</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      The client funds the next unfunded milestone through PayPal. The payout is sent after verification.
                    </p>
                  </div>

                  {isClient && contract.status === 'active' && nextFundMilestone ? (
                    <PayPalCheckout
                      contractId={contract.id}
                      contractCode={contract.code}
                      milestoneId={nextFundMilestone.id}
                      amount={nextFundMilestone.amount}
                      currency={contract.currency}
                      onPaymentSuccess={handlePaymentSuccess}
                    />
                  ) : (
                    <p className="text-xs text-slate-400">
                      {contract.status !== 'active'
                        ? 'Funding is available after the awarded freelancer accepts the contract.'
                        : 'Every milestone is already funded or paid.'}
                    </p>
                  )}
                </Card>

                <Card className="border-[#222A3D] bg-[#131B2E] text-white p-5 space-y-3">
                  <h3 className="text-sm font-bold">PayPal ids</h3>
                  {paymentAttempts.length === 0 && payouts.length === 0 && (
                    <p className="text-xs text-slate-400">No PayPal orders or payouts yet.</p>
                  )}
                  {paymentAttempts.map((a) => (
                    <div key={a.id} className="text-xs font-mono bg-[#0B1326] border border-[#222A3D] rounded-lg p-3 space-y-1">
                      <p>Order {a.paypal_order_id || '—'} · Capture {a.paypal_capture_id || '—'} · {a.status}</p>
                      <p className="text-slate-400">{formatCurrency(Number(a.amount) || 0)} {a.currency}</p>
                    </div>
                  ))}
                  {payouts.map((p) => (
                    <div key={p.id} className="text-xs font-mono bg-[#0B1326] border border-[#222A3D] rounded-lg p-3 space-y-1">
                      <p>Payout batch {p.paypal_batch_id || '—'} · Item {p.paypal_item_id || '—'} · {p.status}</p>
                      <p className="text-slate-400">{formatCurrency(Number(p.amount) || 0)} {p.currency}</p>
                    </div>
                  ))}
                </Card>
              </TabsContent>

              {/* TAB 4: AUDIT ACTIVITY STREAM */}
              <TabsContent value="activity" className="space-y-4 outline-none">
                <Card className="border-[#222A3D] bg-[#131B2E] text-white p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#222A3D]">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <History className="w-4 h-4 text-blue-400" />
                        Audit Activity Trail
                      </h3>
                      <p className="text-xs text-slate-400">
                        Ordered immutable events recorded for this contract.
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(['all', 'contract', 'payment', 'verification'] as const).map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setActivityFilter(filter)}
                          className={`px-2 py-0.5 rounded text-xs capitalize transition-colors ${
                            activityFilter === filter
                              ? 'bg-blue-600 text-white font-medium'
                              : 'bg-[#0B1326] text-slate-400 hover:text-white border border-[#222A3D]'
                          }`}
                        >
                          {filter}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {filteredLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 rounded-lg bg-[#0B1326] border border-[#222A3D] space-y-1 text-xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-semibold text-blue-400 font-mono text-[11px]">
                            {log.action}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-slate-300 text-[11px] leading-relaxed">
                          {log.details}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                          <span>Actor: {log.actor}</span>
                          <span className="font-mono">hash: 9f8a...{log.id.slice(-4)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* ACTION & CONTEXT SIDEBAR (Right 30% / 4 columns) */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* 1. Next Required Action Card (Dynamic CTA) */}
            <Card className="border-blue-500/40 bg-[#131B2E] text-white p-4 shadow-md space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400 font-mono flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  Next Required Step
                </span>
                <span className="text-[10px] text-slate-400 capitalize">{activeRole} Mode</span>
              </div>

              {/* FREELANCER NEXT ACTION */}
              {isFreelancer && (
                <div className="space-y-2">
                  <div className="text-sm font-bold text-white">
                    {nextWorkMilestone ? `Submit Work for ${nextWorkMilestone.title}` : 'All Deliverables Submitted'}
                  </div>
                  <p className="text-xs text-slate-300">
                    {nextWorkMilestone 
                      ? 'Upload repository links or deployment evidence for AI automated verification.'
                      : 'All milestones have been delivered and are currently in review or completed.'}
                  </p>
                  {nextWorkMilestone && (
                    <Button
                      asChild
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 gap-1.5 shadow-sm"
                    >
                      <Link to={ROUTES.DELIVERY_VERIFICATION(contract.id)}>
                        <UploadCloud className="w-4 h-4" />
                        <span>Submit Work Evidence</span>
                      </Link>
                    </Button>
                  )}
                </div>
              )}

              {/* CLIENT NEXT ACTION */}
              {isClient && (
                <div className="space-y-2">
                  {!isUserAccepted ? (
                    <>
                      <div className="text-sm font-bold text-white">Sign Contract Agreement</div>
                      <p className="text-xs text-slate-300">Review terms and provide your digital signature.</p>
                      <Button
                        onClick={() => setAcceptDialogOpen(true)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Sign Contract</span>
                      </Button>
                    </>
                  ) : pendingReleaseMilestone ? (
                    <>
                      <div className="text-sm font-bold text-white">Approve Verified Payout</div>
                      <p className="text-xs text-slate-300">
                        {pendingReleaseMilestone.title} passed verification ({formatCurrency(pendingReleaseMilestone.amount)}).
                      </p>
                      <Button
                        onClick={() => handleOpenReleaseModal(pendingReleaseMilestone)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 gap-1.5"
                      >
                        <DollarSign className="w-4 h-4" />
                        <span>Disburse Payout</span>
                      </Button>
                    </>
                  ) : stagedAmount < totalAmount ? (
                    <>
                      <div className="text-sm font-bold text-white">Fund next milestone</div>
                      <p className="text-xs text-slate-300">
                        Remaining unfunded: {formatCurrency(totalAmount - stagedAmount)} USD.
                      </p>
                      <Button
                        onClick={() => setActiveTab('payments')}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 gap-1.5"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Fund with PayPal</span>
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="text-sm font-bold text-white">Milestones funded</div>
                      <p className="text-xs text-slate-300">Freelancer is working on active deliverables.</p>
                    </>
                  )}
                </div>
              )}
            </Card>

            {/* 2. Financial Escrow Summary Card */}
            <Card className="border-[#222A3D] bg-[#131B2E] text-white p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold uppercase tracking-wider text-[10px]">Escrow Financials</span>
                <Lock className="w-3.5 h-3.5 text-blue-400" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Total SOW Value:</span>
                  <span className="font-bold text-white font-mono text-sm">{formatCurrency(totalAmount, contract.currency)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-blue-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    Staged in Escrow:
                  </span>
                  <span className="font-bold text-blue-400 font-mono text-sm">{formatCurrency(stagedAmount, contract.currency)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Released Payouts:
                  </span>
                  <span className="font-bold text-emerald-400 font-mono text-sm">{formatCurrency(releasedAmount, contract.currency)}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#222A3D] space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Settlement:</span>
                  <span className="font-mono text-white">{completionPercentage}%</span>
                </div>
                <Progress value={completionPercentage} className="h-1.5 bg-[#0B1326]" />
              </div>
            </Card>

            {/* 3. Stakeholders & Counterparties Card */}
            <Card className="border-[#222A3D] bg-[#131B2E] text-white p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold uppercase tracking-wider text-[10px]">Stakeholders</span>
                <span className="text-[10px] text-slate-500 font-mono">2 Parties</span>
              </div>

              {/* Client Profile */}
              <div className="p-2.5 rounded-lg bg-[#0B1326] border border-[#222A3D] flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-blue-600/20 text-blue-400 font-bold text-[10px] flex items-center justify-center border border-blue-500/30 shrink-0">
                    CL
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-white truncate text-[11px]">{clientParty.name}</div>
                    <div className="text-slate-400 text-[10px] truncate">{clientParty.email}</div>
                  </div>
                </div>
                <Badge className={`text-[9px] px-1.5 py-0 ${clientParty.accepted ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/10 text-amber-300'}`}>
                  {clientParty.accepted ? 'Signed' : 'Pending'}
                </Badge>
              </div>

              {/* Freelancer Profile */}
              <div className="p-2.5 rounded-lg bg-[#0B1326] border border-[#222A3D] flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-emerald-600/20 text-emerald-400 font-bold text-[10px] flex items-center justify-center border border-emerald-500/30 shrink-0">
                    FR
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-white truncate text-[11px]">{freelancerParty.name}</div>
                    <div className="text-slate-400 text-[10px] truncate">{freelancerParty.email}</div>
                  </div>
                </div>
                <Badge className={`text-[9px] px-1.5 py-0 ${freelancerParty.accepted ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/10 text-amber-300'}`}>
                  {freelancerParty.accepted ? 'Signed' : 'Pending'}
                </Badge>
              </div>
            </Card>

            {/* 4. Quick Actions / Tools Card */}
            <Card className="border-[#222A3D] bg-[#131B2E] text-white p-4 space-y-2.5 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-400 block">
                Contract Actions
              </span>

              {isClient && (
                <Button
                  onClick={() => setAddMilestoneOpen(true)}
                  variant="outline"
                  size="sm"
                  className="w-full border-[#222A3D] bg-[#0B1326] text-slate-200 hover:text-white justify-start text-xs h-8 gap-2"
                >
                  <Plus className="w-3.5 h-3.5 text-blue-400" />
                  <span>Add New Milestone</span>
                </Button>
              )}

              <Button
                asChild
                variant="outline"
                size="sm"
                className="w-full border-[#222A3D] bg-[#0B1326] text-slate-200 hover:text-white justify-start text-xs h-8 gap-2"
              >
                <Link to={ROUTES.DELIVERY_VERIFICATION(contract.id)}>
                  <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Work Verification Center</span>
                </Link>
              </Button>

              <Button
                onClick={handleExportSOW}
                variant="outline"
                size="sm"
                className="w-full border-[#222A3D] bg-[#0B1326] text-slate-200 hover:text-white justify-start text-xs h-8 gap-2"
              >
                <Download className="w-3.5 h-3.5 text-purple-400" />
                <span>Export SOW Spec (JSON)</span>
              </Button>
            </Card>

          </div>
        </div>

        {/* DIALOG 1: ADD MILESTONE (CLIENT ONLY) */}
        <Dialog open={addMilestoneOpen} onOpenChange={setAddMilestoneOpen}>
          <DialogContent className="bg-[#131B2E] border-[#222A3D] text-white max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white text-base">Add Milestone Deliverable</DialogTitle>
              <DialogDescription className="text-slate-400 text-xs">
                Specify deliverable scope, budget allocation, and measurable acceptance criteria.
              </DialogDescription>
            </DialogHeader>

            {/* Quick Template Presets */}
            <div className="space-y-1.5 py-1">
              <span className="text-[11px] text-slate-400 uppercase font-semibold block">Quick Presets:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  {
                    title: 'UI/UX Wireframes & Component Specs',
                    amount: '600',
                    criteria: ['Figma design system tokens verified', 'Mobile responsive wireframes completed'],
                  },
                  {
                    title: 'Frontend React & API Integration',
                    amount: '1100',
                    criteria: ['TypeScript builds with zero errors', 'Live API endpoints authenticated and tested'],
                  },
                  {
                    title: 'QA Automated Testing & Production Deploy',
                    amount: '500',
                    criteria: ['Lighthouse performance score >= 90', 'All integration tests pass in CI/CD pipeline'],
                  },
                ].map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="text-[11px] px-2 py-0.5 rounded bg-[#0B1326] border border-blue-900/60 hover:bg-blue-950/40 text-blue-300 transition-colors"
                  >
                    + {p.title.split('&')[0]} (${p.amount})
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreateMilestone} className="space-y-4 py-2 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="milestone-title" className="text-xs text-slate-300">
                  Milestone Title *
                </Label>
                <Input
                  id="milestone-title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Phase 3: QA Testing & Production Deployment"
                  className="bg-[#0B1326] border-[#2D3449] text-white text-xs placeholder:text-slate-500 h-9"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="milestone-desc" className="text-xs text-slate-300">
                  Scope &amp; Deliverables
                </Label>
                <Textarea
                  id="milestone-desc"
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Summary of what the freelancer will deliver in this phase..."
                  className="bg-[#0B1326] border-[#2D3449] text-white text-xs placeholder:text-slate-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="milestone-amount" className="text-xs text-slate-300">
                    Amount ({contract.currency || 'USD'}) *
                  </Label>
                  <Input
                    id="milestone-amount"
                    type="number"
                    min="1"
                    step="any"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="600"
                    className="bg-[#0B1326] border-[#2D3449] text-white text-xs h-9 font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="milestone-deadline" className="text-xs text-slate-300">
                    Target Deadline
                  </Label>
                  <Input
                    id="milestone-deadline"
                    type="date"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="bg-[#0B1326] border-[#2D3449] text-white text-xs h-9"
                  />
                </div>
              </div>

              {/* Dynamic Acceptance Criteria */}
              <div className="space-y-2 pt-2 border-t border-[#222A3D]">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-slate-300">
                    Acceptance Criteria *
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleAddCriterionInput}
                    className="text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-950/30 h-7 px-2"
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add Criterion
                  </Button>
                </div>

                <div className="space-y-2">
                  {newCriteria.map((criterion, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        value={criterion}
                        onChange={(e) => handleUpdateCriterionInput(idx, e.target.value)}
                        placeholder={`Criterion #${idx + 1}`}
                        className="bg-[#0B1326] border-[#2D3449] text-white text-xs h-8 flex-1"
                      />
                      {newCriteria.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveCriterionInput(idx)}
                          className="h-8 w-8 p-0 text-slate-500 hover:text-rose-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter className="gap-2 pt-3 border-t border-[#222A3D]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAddMilestoneOpen(false)}
                  className="border-[#2D3449] text-slate-400 hover:text-white hover:bg-[#171F33] text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Milestone
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* DIALOG 2: DIGITAL ACCEPTANCE */}
        <Dialog open={acceptDialogOpen} onOpenChange={setAcceptDialogOpen}>
          <DialogContent className="bg-[#131B2E] border-[#222A3D] text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Accept Digital Contract Terms</DialogTitle>
              <DialogDescription className="text-slate-400 text-xs">
                By accepting, you agree to the milestone deliverables, deadlines, and payment terms for agreement {contract.code}.
              </DialogDescription>
            </DialogHeader>

            <div className="py-2 space-y-3 text-xs text-slate-300">
              <div className="p-3.5 rounded-lg bg-[#0B1326] border border-[#222A3D] space-y-1.5">
                <div className="font-semibold text-white">{contract.title}</div>
                <div className="text-slate-400">Total Budget: {formatCurrency(totalAmount)} USD</div>
                <div className="text-[11px] font-mono text-blue-400">Version: {contract.version}.0 Immutable SOW</div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAcceptDialogOpen(false)}
                className="border-[#2D3449] text-slate-400 hover:text-white hover:bg-[#171F33] text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmAcceptTerms}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Confirm Digital Signature
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DIALOG 3: REQUEST REVISION */}
        <Dialog open={revisionDialogOpen} onOpenChange={setRevisionDialogOpen}>
          <DialogContent className="bg-[#131B2E] border-[#222A3D] text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Request Milestone Revision</DialogTitle>
              <DialogDescription className="text-slate-400 text-xs">
                Specify what needs adjustment before this milestone can be verified and released.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 py-2">
              <Label htmlFor="rev-notes" className="text-xs text-slate-300">
                Revision Instructions
              </Label>
              <Textarea
                id="rev-notes"
                rows={3}
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                placeholder="e.g. Please update mobile navigation spacing and verify Lighthouse performance test pass..."
                className="bg-[#0B1326] border-[#2D3449] text-white text-xs placeholder:text-slate-500"
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRevisionDialogOpen(false)}
                className="border-[#2D3449] text-slate-400 hover:text-white hover:bg-[#171F33] text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!revisionNotes.trim()}
                onClick={handleConfirmRevision}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Submit Revision Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DIALOG 4: APPROVE RELEASE CONFIRMATION */}
        <Dialog open={releaseDialogOpen} onOpenChange={setReleaseDialogOpen}>
          <DialogContent className="bg-[#131B2E] border-[#222A3D] text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Approve Escrow Disbursement</DialogTitle>
              <DialogDescription className="text-slate-400 text-xs">
                Confirm release of staged funds to the freelancer's PayPal account.
              </DialogDescription>
            </DialogHeader>

            {selectedMilestone && (
              <div className="py-2 space-y-3 text-xs text-slate-300">
                <div className="p-3.5 rounded-lg bg-[#0B1326] border border-[#222A3D] space-y-1.5">
                  <div className="font-semibold text-white">{selectedMilestone.title}</div>
                  <div className="text-emerald-400 font-mono text-base font-bold">
                    {formatCurrency(selectedMilestone.amount, contract.currency)} USD
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Recipient: {freelancerParty.name} ({freelancerParty.email})
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReleaseDialogOpen(false)}
                className="border-[#2D3449] text-slate-400 hover:text-white hover:bg-[#171F33] text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmRelease}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
              >
                <DollarSign className="w-3.5 h-3.5" />
                Confirm &amp; Disburse
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}

export default ContractDetail
