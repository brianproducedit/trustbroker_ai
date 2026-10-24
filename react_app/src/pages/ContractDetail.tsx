import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { StatusBadge } from '@/components/common/StatusBadge'
import { PayPalCheckout } from '@/components/payments/PayPalCheckout'
import { useContractStore } from '@/hooks/useContractStore'
import { useNotificationStore } from '@/hooks/useNotifications'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ROUTES } from '@/constants'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
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
  Layers,
  Award,
  FileCode,
  Info
} from 'lucide-react'
import { toast } from 'sonner'

export const ContractDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { 
    contracts, 
    activeRole, 
    acceptContract, 
    releasePayment, 
    requestRevision,
    stagePayment,
    addMilestone,
    removeMilestone
  } = useContractStore()
  const { addNotification } = useNotificationStore()

  const contract = contracts.find((c) => c.id === id || c.code === id) || contracts[0]

  // View States
  const [activeTab, setActiveTab] = useState<'contract' | 'sow' | 'payments' | 'activity'>('contract')
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

  // Add Milestone Form State
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
  const clientParty = contract.client || (contract as any).buyer || {
    id: 'client-default',
    name: 'Elena Rostova',
    email: 'elena@acmeglobal.com',
    role: 'client',
    accepted: true,
    acceptedAt: contract.createdAt,
  }

  const freelancerParty = contract.freelancer || (contract as any).supplier || {
    id: 'freelancer-default',
    name: 'Tariro Moyo',
    email: 'tariro@devstudio.co.zw',
    role: 'freelancer',
    accepted: false,
  }

  const isClient = activeRole === 'client' || (activeRole as string) === 'buyer'
  const isFreelancer = activeRole === 'freelancer' || (activeRole as string) === 'supplier'
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

  // Lifecycle Progression Steps
  const lifecycleSteps = [
    {
      id: 1,
      title: 'SOW Drafted',
      desc: 'Scope & milestones locked',
      status: 'completed',
      icon: FileText,
    },
    {
      id: 2,
      title: 'Dual Acceptance',
      desc: isBothAccepted ? 'Both parties signed' : 'Pending signature',
      status: isBothAccepted ? 'completed' : 'current',
      icon: CheckCircle2,
    },
    {
      id: 3,
      title: 'Escrow Staged',
      desc: isEscrowStaged ? `${formatCurrency(stagedAmount)} in sandbox` : 'Awaiting client funding',
      status: isEscrowStaged ? 'completed' : isBothAccepted ? 'current' : 'upcoming',
      icon: ShieldCheck,
    },
    {
      id: 4,
      title: 'Work & AI Verification',
      desc: isWorkVerified ? 'Criteria verified' : 'In review / progress',
      status: isWorkVerified ? 'completed' : isEscrowStaged ? 'current' : 'upcoming',
      icon: Sparkles,
    },
    {
      id: 5,
      title: 'Disbursement',
      desc: isSettled ? '100% disbursed' : `${formatCurrency(releasedAmount)} released`,
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
    stagePayment(contract.id, contract.totalAmount, details.id || 'PAYPAL-MOCK-ORDER')
    toast.success(`Payment staged: ${formatCurrency(contract.totalAmount)} USD in PayPal Sandbox!`)
    addNotification({
      title: 'Payment Staged via PayPal',
      description: `${formatCurrency(contract.totalAmount)} USD reserved for ${contract.code}.`,
      type: 'payment',
      link: `/dashboard/contracts/${contract.id}`,
    })
  }

  const handleOpenReleaseModal = (m: Milestone) => {
    setSelectedMilestone(m)
    setReleaseDialogOpen(true)
  }

  const handleConfirmRelease = () => {
    if (!selectedMilestone) return
    releasePayment(contract.id, selectedMilestone.id)
    setReleaseDialogOpen(false)
    toast.success(`Payment released: ${formatCurrency(selectedMilestone.amount)} USD sent to freelancer!`)
    addNotification({
      title: 'Milestone Payout Disbursed',
      description: `${formatCurrency(selectedMilestone.amount)} USD released for verified milestone.`,
      type: 'payment',
      link: `/dashboard/contracts/${contract.id}`,
    })
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

  // Preset Template loader for Milestone Dialog
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

  // Contextual Primary Action Button
  const primaryAction = (() => {
    if (!isUserAccepted) {
      return {
        label: 'Accept Contract Terms',
        icon: CheckCircle2,
        onClick: () => setAcceptDialogOpen(true),
        badge: 'Action Required',
      }
    }
    if (isClient && stagedAmount < totalAmount) {
      return {
        label: `Stage Escrow (${formatCurrency(totalAmount - stagedAmount)})`,
        icon: CreditCard,
        onClick: () => setActiveTab('payments'),
        badge: 'PayPal Sandbox',
      }
    }
    const pendingRelease = contract.milestones.find(
      (m) => m.status === 'verified' && m.paymentStatus !== 'released'
    )
    if (isClient && pendingRelease) {
      return {
        label: `Approve Release (${formatCurrency(pendingRelease.amount)})`,
        icon: DollarSign,
        onClick: () => handleOpenReleaseModal(pendingRelease),
        badge: 'Verified Pass',
      }
    }
    const activeDeliverable = contract.milestones.find(
      (m) => m.status === 'in_progress' || m.status === 'pending' || m.status === 'revision_requested'
    )
    if (isFreelancer && activeDeliverable) {
      return {
        label: 'Submit Deliverable Evidence',
        icon: UploadCloud,
        onClick: () => (window.location.href = ROUTES.DELIVERY_VERIFICATION(contract.id)),
        badge: 'Work in Progress',
      }
    }
    return null
  })()

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Top Breadcrumb & Metadata Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
          <div className="flex items-center gap-2 text-xs">
            <Link
              to={ROUTES.DASHBOARD}
              className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Contracts</span>
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-blue-400 font-mono font-medium">{contract.code}</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareLink}
              className="border-[#222A3D] bg-[#101726] text-slate-300 hover:text-white text-xs h-8 gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportSOW}
              className="border-[#222A3D] bg-[#101726] text-slate-300 hover:text-white text-xs h-8 gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export SOW (JSON)</span>
            </Button>
            <Button
              size="sm"
              onClick={() => setAddMilestoneOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Milestone</span>
            </Button>
          </div>
        </div>

        {/* 1. ENTERPRISE HERO & COUNTERPARTY HEADER */}
        <Card className="border-[#222A3D] bg-[#131B2E] text-white shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

          <CardContent className="p-6 space-y-6 relative">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-6 border-b border-[#222A3D]">
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={handleCopyCode}
                    className="group inline-flex items-center gap-1.5 font-mono text-xs font-bold text-blue-400 bg-blue-950/70 hover:bg-blue-900/60 px-2.5 py-1 rounded border border-blue-800/60 transition-colors"
                    title="Click to copy contract code"
                  >
                    <span>{contract.code}</span>
                    {copiedCode ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3 text-blue-400 opacity-60 group-hover:opacity-100" />
                    )}
                  </button>

                  <StatusBadge status={contract.status} />

                  <Badge variant="outline" className="text-slate-300 border-slate-700 bg-slate-800/50 text-[11px]">
                    v{contract.version}.0 SOW
                  </Badge>

                  <span className="text-xs text-slate-400">
                    Created {formatDate(contract.createdAt)}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {contract.title}
                </h1>

                <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
                  {contract.description}
                </p>
              </div>

              {/* Primary Contextual Action Hero */}
              {primaryAction && (
                <div className="bg-[#0B1326] p-4 rounded-xl border border-blue-500/30 flex flex-col items-stretch sm:items-end gap-2.5 shrink-0 min-w-[240px]">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-blue-400">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <span>{primaryAction.badge}</span>
                  </div>
                  <Button
                    onClick={primaryAction.onClick}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 gap-1.5 shadow-md w-full sm:w-auto"
                  >
                    <primaryAction.icon className="w-3.5 h-3.5" />
                    <span>{primaryAction.label}</span>
                  </Button>
                </div>
              )}
            </div>

            {/* Counterparty Duality Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Client Card */}
              <div className="p-4 rounded-xl bg-[#0B1326] border border-[#222A3D] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 font-bold text-xs flex items-center justify-center border border-blue-500/30 shrink-0">
                    {clientParty.name.split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-xs truncate">
                        {clientParty.name}
                      </span>
                      <Badge className="bg-blue-500/10 text-blue-300 border-blue-500/30 text-[9px] px-1.5 py-0 uppercase">
                        Client
                      </Badge>
                    </div>
                    <div className="text-slate-400 text-[11px] truncate">
                      {clientParty.email}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  {clientParty.accepted ? (
                    <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-[10px] gap-1 py-0.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>Accepted Terms</span>
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-amber-400 border-amber-400/40 text-[10px] py-0.5">
                      Pending Signature
                    </Badge>
                  )}
                </div>
              </div>

              {/* Freelancer Card */}
              <div className="p-4 rounded-xl bg-[#0B1326] border border-[#222A3D] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-emerald-600/20 text-emerald-400 font-bold text-xs flex items-center justify-center border border-emerald-500/30 shrink-0">
                    {freelancerParty.name.split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-xs truncate">
                        {freelancerParty.name}
                      </span>
                      <Badge className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30 text-[9px] px-1.5 py-0 uppercase">
                        Freelancer
                      </Badge>
                    </div>
                    <div className="text-slate-400 text-[11px] truncate">
                      {freelancerParty.email}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  {freelancerParty.accepted ? (
                    <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-[10px] gap-1 py-0.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>Accepted Terms</span>
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-amber-400 border-amber-400/40 text-[10px] py-0.5">
                      Pending Signature
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Pending Acceptance Callout */}
            {!isUserAccepted && (
              <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-900/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="text-slate-200">
                    You have not yet signed this contract version as <strong className="text-white capitalize">{activeRole}</strong>. Review deliverables and confirm digital acceptance.
                  </span>
                </div>
                <Button
                  size="sm"
                  onClick={() => setAcceptDialogOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 shrink-0"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Accept Contract Terms
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 2. VISUAL 5-STAGE CONTRACT LIFECYCLE STEPPER */}
        <Card className="border-[#222A3D] bg-[#131B2E] text-white p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                Contract Lifecycle &amp; Settlement Pipeline
              </span>
              <span className="text-slate-400 font-mono text-[11px]">
                Status: <strong className="text-emerald-400 uppercase">{contract.status.replace('_', ' ')}</strong>
              </span>
            </div>

            {/* Responsive Stepper Row */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1">
              {lifecycleSteps.map((step) => {
                const isCompleted = step.status === 'completed'
                const isCurrent = step.status === 'current'
                const Icon = step.icon

                return (
                  <div
                    key={step.id}
                    className={`p-3 rounded-xl border transition-all text-xs relative ${
                      isCompleted
                        ? 'bg-emerald-950/15 border-emerald-500/30 text-emerald-200'
                        : isCurrent
                        ? 'bg-blue-950/30 border-blue-500/60 text-white shadow-sm ring-1 ring-blue-500/20'
                        : 'bg-[#0B1326] border-[#222A3D] text-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isCompleted
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : isCurrent
                          ? 'bg-blue-500/30 text-blue-400 animate-pulse'
                          : 'bg-slate-800 text-slate-500'
                      }`}>
                        {step.id}
                      </span>
                      <Icon className={`w-3.5 h-3.5 ${
                        isCompleted ? 'text-emerald-400' : isCurrent ? 'text-blue-400' : 'text-slate-600'
                      }`} />
                    </div>

                    <div className="font-semibold text-xs leading-tight">
                      {step.title}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 truncate" title={step.desc}>
                      {step.desc}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </Card>

        {/* 3. HIGH-TRUST FINANCIAL ESCROW BENTO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tile 1: Total Agreed Budget */}
          <Card className="border-[#222A3D] bg-[#131B2E] text-white p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="uppercase tracking-wider font-semibold text-[10px]">Total Contract Value</span>
              <DollarSign className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-2xl font-black font-mono text-white">
              {formatCurrency(totalAmount, contract.currency)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Agreed across {contract.milestones.length} milestones
            </p>
          </Card>

          {/* Tile 2: Staged in Escrow */}
          <Card className="border-blue-500/30 bg-[#131B2E] text-white p-4 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-blue-400 mb-1">
              <span className="uppercase tracking-wider font-semibold text-[10px] flex items-center gap-1">
                <Lock className="w-3 h-3 text-blue-400" />
                Staged in Escrow
              </span>
              <span className="text-[10px] font-mono text-blue-300">Sandbox</span>
            </div>
            <div className="text-2xl font-black font-mono text-blue-400">
              {formatCurrency(stagedAmount, contract.currency)}
            </div>
            <p className="text-[11px] text-slate-300 mt-1">
              {stagedAmount >= totalAmount ? '100% Fully Funded' : `Awaiting ${formatCurrency(totalAmount - stagedAmount)}`}
            </p>
          </Card>

          {/* Tile 3: Released to Freelancer */}
          <Card className="border-emerald-500/30 bg-[#131B2E] text-white p-4">
            <div className="flex items-center justify-between text-xs text-emerald-400 mb-1">
              <span className="uppercase tracking-wider font-semibold text-[10px] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Released to Freelancer
              </span>
              <span className="text-[10px] font-mono text-emerald-300">{completionPercentage}%</span>
            </div>
            <div className="text-2xl font-black font-mono text-emerald-400">
              {formatCurrency(releasedAmount, contract.currency)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Disbursed upon verified deliverables
            </p>
          </Card>

          {/* Tile 4: Settlement Progress */}
          <Card className="border-[#222A3D] bg-[#131B2E] text-white p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="uppercase tracking-wider font-semibold text-[10px]">Settlement Progress</span>
                <Award className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div className="text-xl font-black font-mono text-slate-200">
                {completionPercentage}% Complete
              </div>
            </div>
            <div className="space-y-1 mt-2">
              <Progress value={completionPercentage} className="h-1.5 bg-[#0B1326]" />
              <div className="text-[10px] text-slate-400 text-right">
                {contract.milestones.filter(m => m.status === 'verified' || m.status === 'settled').length} of {contract.milestones.length} milestones cleared
              </div>
            </div>
          </Card>
        </div>

        {/* 4. WORKSPACE TABS */}
        <Tabs defaultValue="contract" value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6 w-full">
          <TabsList className="bg-[#131B2E] border border-[#222A3D] p-1 h-auto flex flex-wrap gap-1">
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
            <TabsTrigger 
              value="payments" 
              className="text-xs font-medium text-slate-400 data-[state=active]:text-white data-[state=active]:bg-[#1F2942] py-2 px-3.5"
            >
              PayPal Escrow &amp; Staging
            </TabsTrigger>
            <TabsTrigger 
              value="activity" 
              className="text-xs font-medium text-slate-400 data-[state=active]:text-white data-[state=active]:bg-[#1F2942] py-2 px-3.5"
            >
              Audit Activity Trail ({(contract.auditLogs || []).length})
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: MILESTONES WORKSTATION */}
          <TabsContent value="contract" className="space-y-4 outline-none">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#101726] p-3 rounded-xl border border-[#222A3D]">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-slate-400 mr-2 font-medium">Filter Milestones:</span>
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

              <Button
                size="sm"
                onClick={() => setAddMilestoneOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 h-8 shrink-0 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Milestone</span>
              </Button>
            </div>

            {/* Milestones List */}
            {filteredMilestones.length === 0 ? (
              <Card className="border-[#222A3D] bg-[#131B2E] text-white p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-white">No Milestones Match This Filter</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Select another filter above or add a new milestone deliverable.
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
                      {/* Milestone Header */}
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
                            {/* Delete Button for pending milestones */}
                            {contract.milestones.length > 1 && (m.status === 'pending' || contract.status === 'draft' || contract.status === 'pending_acceptance') && (
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

                      {/* Milestone Body */}
                      <CardContent className="p-4 sm:p-5 space-y-4">
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                          {m.description}
                        </p>

                        {/* Acceptance Criteria 2-Column Grid */}
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

                        {/* Evidence Submission Box if Submitted/Verified */}
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

                        {/* AI Verification Assessment Result if Present */}
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
                          <span className="text-slate-400">Escrow Status:</span>
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
                          {/* Freelancer Work Submission */}
                          {isFreelancer && (m.status === 'in_progress' || m.status === 'pending' || m.status === 'revision_requested') && (
                            <Button
                              size="sm"
                              asChild
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 h-8 font-medium shadow-sm"
                            >
                              <Link to={ROUTES.DELIVERY_VERIFICATION(contract.id)}>
                                <UploadCloud className="w-3.5 h-3.5" />
                                Submit Work
                              </Link>
                            </Button>
                          )}

                          {/* Client Approve Release */}
                          {isClient && isVerified && !isReleased && (
                            <Button
                              size="sm"
                              onClick={() => handleOpenReleaseModal(m)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 h-8 font-medium shadow-sm"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              Approve Release ({formatCurrency(m.amount, contract.currency)})
                            </Button>
                          )}

                          {/* Client Request Revision */}
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

          {/* TAB 2: LEGAL SOW & DIGITAL TERMS */}
          <TabsContent value="sow" className="space-y-6 outline-none">
            <Card className="border-[#222A3D] bg-[#131B2E] text-white">
              <CardHeader className="border-b border-[#222A3D] pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-400" />
                      Statement of Work (SOW) Specification
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-400 mt-0.5">
                      Formal legal agreement specification for contract {contract.code} (Version {contract.version}.0)
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyHash}
                      className="inline-flex items-center gap-1.5 font-mono text-[11px] text-slate-400 hover:text-white bg-[#0B1326] px-2.5 py-1 rounded border border-[#222A3D]"
                      title="SHA-256 SOW integrity fingerprint"
                    >
                      <span>sha256-tb2026-{contract.id.slice(-8)}</span>
                      {copiedHash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleExportSOW}
                      className="border-[#222A3D] text-xs h-8 gap-1 text-slate-300"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6 text-xs text-slate-300">
                {/* Clause 1: Project Scope */}
                <div className="space-y-2">
                  <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
                    1. Scope of Digital Work &amp; Deliverables
                  </h4>
                  <p className="leading-relaxed text-slate-300">
                    The Freelancer agrees to deliver the milestones detailed herein strictly in accordance with agreed acceptance criteria. Total agreed compensation is <strong>{formatCurrency(totalAmount, contract.currency)} USD</strong> staged conditionally via TrustBroker AI coordination.
                  </p>
                </div>

                {/* Clause 2: Exclusions */}
                <div className="space-y-2">
                  <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
                    2. Exclusions &amp; Out of Scope
                  </h4>
                  <p className="leading-relaxed text-slate-300">
                    Third-party API subscription costs, custom domain registration, ongoing cloud infrastructure hosting beyond initial launch, and unsolicited feature additions are expressly excluded from this SOW. Any material scope addition requires a version increment.
                  </p>
                </div>

                {/* Clause 3: Revisions Policy */}
                <div className="space-y-2">
                  <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
                    3. Revisions &amp; Acceptance Window
                  </h4>
                  <p className="leading-relaxed text-slate-300">
                    Client may request up to two (2) documented revision cycles per milestone based on objective acceptance criteria. Once verified by AI confidence assessment and client approval, funds are eligible for immediate disbursement.
                  </p>
                </div>

                {/* Clause 4: IP Rights */}
                <div className="space-y-2">
                  <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
                    4. Intellectual Property Assignment
                  </h4>
                  <p className="leading-relaxed text-slate-300">
                    All source code, digital assets, documentation, and deliverables produced under this agreement transfer irrevocably and unconditionally to Client upon disbursement of staged milestone funds.
                  </p>
                </div>

                {/* Digital Signatures Box */}
                <div className="pt-4 border-t border-[#222A3D] space-y-3">
                  <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
                    Digital Signature Certificates
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Client Signature */}
                    <div className="p-4 rounded-xl bg-[#0B1326] border border-[#222A3D] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">{clientParty.name}</span>
                        {clientParty.accepted ? (
                          <Badge className="bg-emerald-500/20 text-emerald-300 text-[10px]">Digitally Signed</Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-400 text-[10px]">Awaiting Signature</Badge>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Role: Client &bull; {clientParty.email}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Timestamp: {clientParty.acceptedAt ? new Date(clientParty.acceptedAt).toLocaleString() : 'Pending'}
                      </div>
                    </div>

                    {/* Freelancer Signature */}
                    <div className="p-4 rounded-xl bg-[#0B1326] border border-[#222A3D] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">{freelancerParty.name}</span>
                        {freelancerParty.accepted ? (
                          <Badge className="bg-emerald-500/20 text-emerald-300 text-[10px]">Digitally Signed</Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-400 text-[10px]">Awaiting Signature</Badge>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Role: Freelancer &bull; {freelancerParty.email}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Timestamp: {freelancerParty.acceptedAt ? new Date(freelancerParty.acceptedAt).toLocaleString() : 'Pending'}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: PAYPAL ESCROW & PAYMENTS */}
          <TabsContent value="payments" className="space-y-6 outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: PayPal Checkout */}
              <div className="lg:col-span-7 space-y-4">
                <Card className="border-[#222A3D] bg-[#131B2E] text-white">
                  <CardHeader>
                    <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold">
                      <CreditCard className="w-4 h-4" />
                      <span>PayPal Orders v2 Integration</span>
                    </div>
                    <CardTitle className="text-base font-bold text-white mt-1">
                      Stage Milestone Payments in Sandbox
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-400">
                      Client stages funds using PayPal Sandbox. Payments remain safely locked until deliverables are verified.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <PayPalCheckout
                      contractId={contract.id}
                      contractCode={contract.code}
                      amount={contract.totalAmount}
                      currency={contract.currency}
                      onPaymentSuccess={handlePaymentSuccess}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Protection Guarantee */}
              <div className="lg:col-span-5 space-y-4">
                <Card className="border-[#222A3D] bg-[#131B2E] text-white">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold text-white">
                      Payment Protection Lifecycle
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-400">
                      Standard conditional protection rules for this agreement.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs">
                    {[
                      { step: '1', title: 'Order Created', desc: 'SOW milestones locked and agreed upon.', done: true },
                      { step: '2', title: 'Payment Staged', desc: 'Reserved via PayPal Sandbox.', done: stagedAmount > 0 },
                      { step: '3', title: 'Work Verified', desc: 'AI confirms acceptance criteria.', done: isWorkVerified },
                      { step: '4', title: 'Disbursement Executed', desc: 'Released to freelancer PayPal account.', done: releasedAmount > 0 },
                    ].map((s) => (
                      <div key={s.step} className="flex items-start gap-3 p-2.5 rounded-lg bg-[#0E1528] border border-[#222A3D]">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          s.done ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-500'
                        }`}>
                          {s.done ? <CheckCircle2 className="w-3 h-3" /> : s.step}
                        </div>
                        <div className="space-y-0.5">
                          <span className={`font-semibold ${s.done ? 'text-white' : 'text-slate-400'}`}>
                            {s.title}
                          </span>
                          <p className="text-[11px] text-slate-400">{s.desc}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Honest Payout Disclosure Notice */}
                <Card className="border-blue-900/40 bg-blue-950/20 text-slate-300 p-4 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-blue-300">
                    <Info className="w-3.5 h-3.5 text-blue-400" />
                    <span>Cross-Border Settlement Disclosure</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    This prototype coordinates conditional payments through PayPal Sandbox. Disbursements are executed only when supported by the payment provider for the recipient's country and currency account.
                  </p>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* TAB 4: AUDIT ACTIVITY STREAM */}
          <TabsContent value="activity" className="space-y-4 outline-none">
            <Card className="border-[#222A3D] bg-[#131B2E] text-white">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#222A3D]">
                <div>
                  <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                    <History className="w-4 h-4 text-blue-400" />
                    Audit Activity Trail
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Chronological immutable events recorded for agreement {contract.code}.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {(['all', 'contract', 'payment', 'verification'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setActivityFilter(filter)}
                      className={`px-2.5 py-1 rounded text-xs capitalize transition-colors ${
                        activityFilter === filter
                          ? 'bg-blue-600 text-white font-medium'
                          : 'bg-[#0E1528] text-slate-400 hover:text-white border border-[#222A3D]'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </CardHeader>

              <CardContent className="p-4">
                <div className="space-y-3">
                  {filteredLogs.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-500">
                      No audit events recorded under this filter.
                    </div>
                  ) : (
                    filteredLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3.5 rounded-lg bg-[#0E1528] border border-[#222A3D] space-y-1.5 text-xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-semibold text-blue-400 font-mono text-[11px]">
                            {log.action}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-slate-300 leading-relaxed text-[11px]">
                          {log.details}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                          <span>Actor: {log.actor}</span>
                          <span className="font-mono">hash: 9f8a...{log.id.slice(-4)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* DIALOG 1: ADD MILESTONE WITH PRESETS */}
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
