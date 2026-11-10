import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { StatusBadge } from '@/components/common/StatusBadge'
import { useContractStore } from '@/hooks/useContractStore'
import { useNotificationStore } from '@/hooks/useNotifications'
import { formatCurrency } from '@/lib/utils'
import { ROUTES } from '@/constants'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import {
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  UploadCloud,
  ShieldCheck,
  DollarSign,
  RotateCcw,
  Loader2,
  GitBranch,
  Globe,
  FileCheck,
  AlertCircle,
  FileText,
  Camera,
  Check,
  Plus,
  Lock,
  Unlock,
  X,
  FolderOpen,
  UserCheck,
  Eye,
  BellRing,
  Scale,
  ShieldAlert,
  Undo2,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'

export const DeliveryVerification: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const {
    contracts,
    activeRole,
    submitEvidence,
    releasePayment,
    reclaimMilestoneFunds,
    requestRevision,
    overrideReview,
    manualVerify,
  } = useContractStore()
  const { addNotification } = useNotificationStore()

  const contract = id
    ? contracts.find((c) => c.id === id || c.code === id)
    : (contracts[0] || null)

  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>(
    contract?.milestones.find((m) => ['in_progress', 'submitted', 'verifying', 'revision_requested', 'verified'].includes(m.status))?.id ||
    contract?.milestones[0]?.id ||
    'ms-1'
  )

  const selectedMilestone = contract?.milestones.find((m) => m.id === selectedMilestoneId) || contract?.milestones[0]

  // Form State
  const [repoUrl, setRepoUrl] = useState('')
  const [liveUrl, setLiveUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [fileAttachments, setFileAttachments] = useState<Array<{ name: string; url: string; sizeBytes: number; mimeType: string }>>([])
  const [newFileName, setNewFileName] = useState('')
  const [newFileUrl, setNewFileUrl] = useState('')

  // Fetched backend deliveries for the milestone
  const [fetchedDeliveries, setFetchedDeliveries] = useState<any[]>([])
  const [isFetchingDeliveries, setIsFetchingDeliveries] = useState(false)

  const loadMilestoneDeliveries = useCallback(async (msId: string) => {
    if (!msId || !/^[0-9a-f-]{36}$/i.test(msId)) {
      setFetchedDeliveries([])
      return
    }
    setIsFetchingDeliveries(true)
    try {
      const data = await api.deliveries.listMilestoneDeliveries(msId)
      setFetchedDeliveries(Array.isArray(data) ? data : [])
    } catch (err) {
      console.warn('Failed to fetch milestone deliveries from backend:', err)
      setFetchedDeliveries([])
    } finally {
      setIsFetchingDeliveries(false)
    }
  }, [])

  useEffect(() => {
    if (selectedMilestone?.id) {
      loadMilestoneDeliveries(selectedMilestone.id)
    }
  }, [selectedMilestone?.id, loadMilestoneDeliveries])

  // Drag-and-drop + file picker state
  const [isDragging, setIsDragging] = useState(false)
  const [isUploadingFile, setIsUploadingFile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isEvaluating, setIsEvaluating] = useState(false)
  const [revisionDialogOpen, setRevisionDialogOpen] = useState(false)
  const [revisionNotes, setRevisionNotes] = useState('')
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false)
  const [overrideReason, setOverrideReason] = useState('')
  const [isReleasing, setIsReleasing] = useState(false)
  const [manualApproveOpen, setManualApproveOpen] = useState(false)
  const [manualRationale, setManualRationale] = useState('')
  const [isManualApproving, setIsManualApproving] = useState(false)
  const [isNudged, setIsNudged] = useState(false)
  const [reclaimDialogOpen, setReclaimDialogOpen] = useState(false)
  const [reclaimReason, setReclaimReason] = useState('Freelancer inactive / unaddressed revision timeout')
  const [isReclaiming, setIsReclaiming] = useState(false)
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false)

  const handleAddAttachment = () => {
    if (!newFileName.trim()) return
    if (newFileUrl.trim().startsWith('blob:')) {
      toast.error('Browser blob: URLs cannot be saved. Please use the drag-and-drop file uploader.')
      return
    }
    const isImage = newFileName.toLowerCase().endsWith('.png') || newFileName.toLowerCase().endsWith('.jpg') || newFileName.toLowerCase().endsWith('.jpeg')
    const isPdf = newFileName.toLowerCase().endsWith('.pdf')
    const isZip = newFileName.toLowerCase().endsWith('.zip')
    const mime = isImage ? 'image/png' : isPdf ? 'application/pdf' : isZip ? 'application/zip' : 'text/plain'

    setFileAttachments([
      ...fileAttachments,
      {
        name: newFileName.trim(),
        url: newFileUrl.trim() || `https://storage.trustbroker.ai/deliveries/${newFileName.trim()}`,
        sizeBytes: 150000,
        mimeType: mime
      }
    ])
    setNewFileName('')
    setNewFileUrl('')
  }

  const handleRemoveAttachment = (idx: number) => {
    setFileAttachments(fileAttachments.filter((_, i) => i !== idx))
  }

  // ── Drag-and-drop + file picker helpers ──────────────────────────────────
  const processFiles = useCallback(async (files: FileList | File[]) => {
    const allowed = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf', 'application/zip', 'text/plain', 'text/markdown']
    const fileList = Array.from(files)
    for (const file of fileList) {
      if (file.size > 25 * 1024 * 1024) {
        toast.error(`${file.name} exceeds the 25 MB limit and was skipped.`)
        continue
      }
      const mime = allowed.includes(file.type) ? file.type : 'application/octet-stream'
      try {
        setIsUploadingFile(true)
        const toastId = toast.loading(`Uploading ${file.name} to secure storage...`)
        const uploaded = await api.deliveries.uploadEvidenceFile(file)
        toast.dismiss(toastId)
        toast.success(`Uploaded ${file.name}`)
        setFileAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            url: uploaded.storage_path,
            sizeBytes: uploaded.size_bytes || file.size,
            mimeType: mime,
          },
        ])
      } catch (err: any) {
        toast.error(`Upload failed for ${file.name}: ${err?.detail || err?.message || 'Server error'}`)
      } finally {
        setIsUploadingFile(false)
      }
    }
  }, [])

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files)
    }
  }

  const handleFilePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files)
      e.target.value = '' // reset so same file can be re-added if removed
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  if (!contract || !selectedMilestone) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <h2 className="text-xl font-bold text-white">Milestone not found</h2>
          <Button asChild variant="outline" className="mt-4 border-slate-700 text-slate-300">
            <Link to={activeRole === 'client' ? ROUTES.CLIENT_CONTRACTS : ROUTES.FREELANCER_WORK}>
              Return to {activeRole === 'client' ? 'Contracts' : 'Active Work'}
            </Link>
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  const handleSubmitEvidence = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsEvaluating(true)

    try {
      const assessment = await submitEvidence(contract.id, selectedMilestone.id, {
        contractId: contract.id,
        milestoneId: selectedMilestone.id,
        submittedBy: activeRole === 'freelancer'
          ? (contract.freelancer?.name || 'the freelancer')
          : 'the freelancer',
        description: notes,
        repoUrl,
        liveUrl,
        fileAttachments,
      })

      await loadMilestoneDeliveries(selectedMilestone.id)

      toast.success(`Verification complete! Score: ${assessment.overallScore}/100`)
      addNotification({
        title: 'Work Verified by AI',
        description: `Milestone "${selectedMilestone.title}" scored ${assessment.overallScore}/100 and passed criteria.`,
        type: 'verification',
        link: activeRole === 'client' ? ROUTES.CLIENT_REVIEW(contract.id) : ROUTES.DELIVERY_VERIFICATION(contract.id),
      })
    } finally {
      setIsEvaluating(false)
    }
  }

  const handleAuthorizeRelease = async () => {
    if (activeRole !== 'client') {
      toast.error('Only the contract client can authorize payment release.')
      return
    }
    setIsReleasing(true)
    try {
      const result = await releasePayment(contract.id, selectedMilestone.id)
      if (['processing', 'pending', 'unclaimed'].includes((result.status || '').toLowerCase())) {
        toast.info(`PayPal accepted the payout request. ${formatCurrency(selectedMilestone.amount)} USD is still processing.`)
      } else if ((result.status || '').toLowerCase() === 'success') {
        toast.success(`PayPal confirmed the ${formatCurrency(selectedMilestone.amount)} USD payout.`)
        addNotification({
          title: 'Payment Released',
          description: `${formatCurrency(selectedMilestone.amount)} USD was confirmed as transferred.`,
          type: 'payment',
          link: ROUTES.CONTRACT_DETAIL(contract.id),
        })
      } else {
        toast.warning(`PayPal payout status: ${result.status || 'reconciliation required'}.`)
      }
    } catch (err: any) {
      toast.error(err?.detail || err?.message || 'Failed to disburse PayPal payout.')
    } finally {
      setIsReleasing(false)
    }
  }

  const handleNudgeClient = () => {
    setIsNudged(true)
    addNotification({
      title: 'Disbursal Requested by Freelancer',
      description: `Freelancer requested payout release for verified milestone "${selectedMilestone.title}" (${formatCurrency(selectedMilestone.amount, contract.currency)}).`,
      type: 'payment',
      link: ROUTES.CLIENT_REVIEW(contract.id),
    })
    toast.success('Disbursal reminder sent to client!')
  }

  const handleConfirmRevision = async () => {
    if (!revisionNotes.trim()) return
    try {
      await requestRevision(contract.id, selectedMilestone.id, revisionNotes.trim())
      setRevisionDialogOpen(false)
      toast.success('Revision request sent to freelancer')
      addNotification({
        title: 'Revision Requested',
        description: `Client requested adjustments for milestone: "${revisionNotes.slice(0, 50)}..."`,
        type: 'revision',
        link: ROUTES.DELIVERY_VERIFICATION(contract.id),
      })
      setRevisionNotes('')
    } catch (err: any) {
      toast.error(err?.detail || 'Failed to submit revision request')
    }
  }

  const handleConfirmOverride = async () => {
    if (!overrideReason.trim()) return
    await overrideReview(contract.id, selectedMilestone.id, overrideReason.trim())
    setOverrideDialogOpen(false)
    toast.success('Human review override accepted: Milestone approved.')
    addNotification({
      title: 'Human Review Override',
      description: `Client manually approved milestone "${selectedMilestone.title}". Reason: ${overrideReason}`,
      type: 'verification',
      link: ROUTES.CONTRACT_DETAIL(contract.id),
    })
  }

  const handleManualApprove = async () => {
    if (!manualRationale.trim()) return
    setIsManualApproving(true)
    try {
      await manualVerify(contract.id, selectedMilestone.id, manualRationale.trim())
      setManualApproveOpen(false)
      toast.success('Milestone manually approved — payment authorization unlocked.')
      addNotification({
        title: 'Manual Verification Approved',
        description: `Client manually approved milestone "${selectedMilestone.title}". Funds ready to disburse.`,
        type: 'verification',
        link: activeRole === 'client' ? ROUTES.CLIENT_REVIEW(contract.id) : ROUTES.DELIVERY_VERIFICATION(contract.id),
      })
      setManualRationale('')
    } catch (err: any) {
      toast.error(err?.detail || 'Failed to submit manual approval.')
    } finally {
      setIsManualApproving(false)
    }
  }

  const handleConfirmReclaim = async () => {
    setIsReclaiming(true)
    try {
      await reclaimMilestoneFunds(contract.id, selectedMilestone.id, reclaimReason)
      setReclaimDialogOpen(false)
      toast.success(`Staged funds of ${formatCurrency(selectedMilestone.amount)} reclaimed back to your account.`)
      addNotification({
        title: 'Staged Funds Reclaimed',
        description: `Client reclaimed staged funds for "${selectedMilestone.title}" (${formatCurrency(selectedMilestone.amount)}). Reason: ${reclaimReason}`,
        type: 'payment',
        link: ROUTES.CONTRACT_DETAIL(contract.id),
      })
    } catch (err: any) {
      toast.error(err?.detail || err?.message || 'Failed to reclaim staged funds.')
    } finally {
      setIsReclaiming(false)
    }
  }

  const latestDelivery = fetchedDeliveries.length > 0 ? fetchedDeliveries[0] : null

  interface EffectiveEvidence {
    repoUrl?: string
    liveUrl?: string
    description?: string
    fileAttachments?: Array<{ name: string; url: string; sizeBytes: number; mimeType: string }>
    submittedAt?: string
    version?: number
  }

  const effectiveEvidence: EffectiveEvidence | null = latestDelivery
    ? {
      repoUrl: latestDelivery.repo_url || '',
      liveUrl: latestDelivery.live_url || '',
      description: latestDelivery.description || '',
      fileAttachments: (latestDelivery.files || []).map((f: any) => ({
        name: f.file_name,
        url: f.storage_path,
        sizeBytes: f.size_bytes || 0,
        mimeType: f.mime_type || 'application/octet-stream',
      })),
      submittedAt: latestDelivery.submitted_at,
      version: latestDelivery.version || 1,
    }
    : (selectedMilestone.submittedEvidence
      ? {
        repoUrl: selectedMilestone.submittedEvidence.repoUrl,
        liveUrl: selectedMilestone.submittedEvidence.liveUrl,
        description: selectedMilestone.submittedEvidence.description,
        fileAttachments: selectedMilestone.submittedEvidence.fileAttachments,
        submittedAt: selectedMilestone.submittedEvidence.submittedAt,
        version: (selectedMilestone.submittedEvidence as any).version || 1,
      }
      : null)

  const backendReport = latestDelivery?.verification_report
  const assessment = selectedMilestone?.assessment || (backendReport ? {
    id: backendReport.report_id,
    overallScore: backendReport.overall_score ?? 0,
    passed: backendReport.passed ?? false,
    criteriaResults: (backendReport.criterion_evaluations || []).map((ce: any) => ({
      id: ce.criterion_id,
      title: ce.title,
      description: ce.explanation || ce.title,
      status: ce.status,
      aiConfidence: (ce.score ?? 0) / 100,
      feedback: ce.explanation,
    })),
    summaryAnalysis: backendReport.summary_analysis,
    assessedAt: backendReport.assessed_at,
    modelUsed: backendReport.model_used,
    requiresHumanReview: backendReport.requires_human_review,
  } : null)

  const isSettled = selectedMilestone.status === 'settled'
  const isRevisionRequested = selectedMilestone.status === 'revision_requested'
  const isVerified =
    (Boolean(assessment?.passed) ||
      selectedMilestone.status === 'verified' ||
      selectedMilestone.paymentStatus === 'release_authorized') &&
    !isRevisionRequested
  const isFunded =
    selectedMilestone.paymentStatus === 'staged_in_sandbox' ||
    selectedMilestone.paymentStatus === 'release_authorized' ||
    (selectedMilestone as any).paymentStatus === 'staged'
  const isReleased = selectedMilestone.paymentStatus === 'released'
  const isLocked = !isFunded && !isReleased

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6 pb-28">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between">
          <Link
            to={ROUTES.CONTRACT_DETAIL(contract.id)}
            className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-mono transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Contract {contract.code}</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-slate-400">
              {activeRole === 'client' ? 'Client Verification Review' : 'Milestone Review'}
            </span>
            <StatusBadge status={selectedMilestone.status} />
          </div>
        </div>

        {/* Page Title & Milestone Selector */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {activeRole === 'client'
                ? 'Review Deliverables & Verify Work'
                : 'Submit Work for Verification'}
            </h1>
            <p className="text-xs text-slate-400">
              {activeRole === 'client'
                ? 'Review submitted repositories, live preview links and automated criterion evaluations.'
                : 'Submit your project links and notes to run automated verification and unlock milestone payment.'}
            </p>
          </div>

          {/* Milestone Selection Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#131B2E] p-1.5 rounded-xl border border-[#222A3D] self-start">
            {contract.milestones.map((m, idx) => {
              const mFunded =
                ['staged_in_sandbox', 'release_authorized', 'released'].includes(m.paymentStatus) ||
                (m as any).paymentStatus === 'staged'
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedMilestoneId(m.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${selectedMilestoneId === m.id
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-[#171F33]'
                    }`}
                >
                  {mFunded ? (
                    <Unlock className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Lock className="w-3 h-3 text-amber-400/80" />
                  )}
                  <span>M{idx + 1}: ${m.amount}</span>
                  {!mFunded && (
                    <span className="text-[9px] text-amber-300 font-mono px-1 py-0.2 rounded bg-amber-950/60 border border-amber-800/60">
                      Locked
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Selected Milestone Context Card */}
        <Card className="border-[#222A3D] bg-[#131B2E] text-white">
          <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">{selectedMilestone.title}</span>
                <StatusBadge status={selectedMilestone.status} />
                <Badge
                  className={`text-[10px] font-mono uppercase ${isReleased
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    : isFunded
                      ? 'bg-blue-950 text-blue-300 border-blue-800'
                      : 'bg-amber-950 text-amber-300 border-amber-800'
                    }`}
                >
                  {isReleased ? 'Paid via PayPal' : isFunded ? 'PayPal Staged (Unlocked)' : 'Locked (Unfunded)'}
                </Badge>
              </div>
              <p className="text-xs text-slate-300">{selectedMilestone.description}</p>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[11px] text-slate-400 block">Milestone Amount</span>
              <span className="text-xl font-bold font-mono text-emerald-400">
                {formatCurrency(selectedMilestone.amount, contract.currency)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Main Grid: 3-column when Client, 2-column when Freelancer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Column 1: Submission Form */}
          <div className={`${activeRole === 'client' ? 'lg:col-span-4' : 'lg:col-span-6'} space-y-4`}>
            <Card className="border-[#222A3D] bg-[#131B2E] text-white">
              <CardHeader className="pb-3 border-b border-[#222A3D]">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-white">
                  <UploadCloud className="w-4 h-4 text-blue-400" />
                  {activeRole === 'client' ? 'Submitted Deliverable Evidence' : 'Deliverable Artifacts & Evidence'}
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  {activeRole === 'client'
                    ? "Inspect the freelancer's submitted repositories, live preview URL and attached deliverables."
                    : 'Provide evidence matching the agreed milestone acceptance criteria for AI inspection.'}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 space-y-4">
                {/* Milestone Lock / Funding Status Banner */}
                {isLocked ? (
                  <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-amber-300 text-xs">
                      <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Milestone Locked — Awaiting PayPal Funding from Client</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {activeRole === 'client'
                        ? `You must fund this milestone (${formatCurrency(selectedMilestone.amount, contract.currency)}) through PayPal Sandbox before the freelancer can submit work.`
                        : `Under TrustBroker AI policy, work and evidence submission remain locked until funds are staged in PayPal Sandbox. This protects you against unfunded scope. Once the client funds this milestone, evidence submission unlocks automatically.`}
                    </p>
                    {activeRole === 'client' && (
                      <Button
                        size="sm"
                        asChild
                        className="h-7 text-xs bg-[#0070BA] hover:bg-[#003087] text-white mt-1 gap-1"
                      >
                        <Link to={ROUTES.CONTRACT_DETAIL(contract.id)}>
                          <DollarSign className="w-3 h-3" />
                          Fund Milestone via PayPal
                        </Link>
                      </Button>
                    )}
                  </div>
                ) : isFunded && !isSettled ? (
                  <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-600/30 text-emerald-300 text-xs flex items-center justify-between">
                    <span className="flex items-center gap-2 font-medium">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Milestone Unlocked — {formatCurrency(selectedMilestone.amount, contract.currency)} Staged in PayPal Sandbox
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Disbursed after verification</span>
                  </div>
                ) : null}

                {/* Milestone Acceptance Criteria Requirements Matrix */}
                <div className="space-y-2 p-3 rounded-xl bg-[#0B1326] border border-[#222A3D]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                      Required Evidence Checklist ({selectedMilestone.acceptanceCriteria?.length || 0})
                    </span>
                    <span className="text-[10px] text-slate-400">Multimodal AI Inspection</span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {(selectedMilestone.acceptanceCriteria || []).map((crit, idx) => {
                      const etype = (crit.evidenceType || 'text').toLowerCase()
                      return (
                        <div
                          key={crit.id || idx}
                          className="flex items-center justify-between p-2 rounded-lg bg-[#131B2E] border border-[#222A3D] text-xs gap-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-4 h-4 rounded-full bg-blue-600/20 text-blue-400 font-mono text-[9px] flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span className="text-slate-200 truncate font-medium text-[11px]">{crit.title}</span>
                          </div>
                          <Badge
                            variant="outline"
                            className="text-[9px] font-mono shrink-0 uppercase border-blue-500/30 text-blue-300 bg-blue-500/10"
                          >
                            {etype.replace('_', ' ')}
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {activeRole === 'client' ? (
                  <div className="space-y-4 pt-1">
                    {isFetchingDeliveries ? (
                      <div className="p-8 rounded-xl bg-[#0B1326] border border-[#222A3D] text-center space-y-2">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-400 mx-auto" />
                        <p className="text-xs text-slate-400">Loading submitted deliverables from storage...</p>
                      </div>
                    ) : effectiveEvidence ? (
                      <div className="space-y-3.5">
                        <div className="p-3.5 rounded-xl bg-[#0B1326] border border-[#222A3D] space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b border-[#222A3D]">
                            <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                              <FileCheck className="w-4 h-4 text-emerald-400" />
                              Freelancer Delivery Package
                            </span>
                            <div className="flex items-center gap-1.5">
                              <Badge className="bg-blue-500/15 text-blue-300 border-blue-500/30 text-[10px] font-mono">
                                Version {effectiveEvidence.version || 1}
                              </Badge>
                              {effectiveEvidence.submittedAt && (
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {new Date(effectiveEvidence.submittedAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* GitHub Repository */}
                          <div className="space-y-1">
                            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                              <GitBranch className="w-3.5 h-3.5 text-blue-400" />
                              Source Code Repository
                            </span>
                            {effectiveEvidence.repoUrl ? (
                              <a
                                href={effectiveEvidence.repoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-2 rounded-lg bg-[#131B2E] border border-[#222A3D] hover:border-blue-500/40 text-blue-400 hover:text-blue-300 text-xs font-mono transition-colors group"
                              >
                                <span className="truncate">{effectiveEvidence.repoUrl}</span>
                                <ExternalLink className="w-3.5 h-3.5 shrink-0 ml-2 text-slate-500 group-hover:text-blue-400" />
                              </a>
                            ) : (
                              <p className="text-xs text-slate-500 italic p-2 rounded-lg bg-[#131B2E]">No repository URL provided</p>
                            )}
                          </div>

                          {/* Live Preview Staging URL */}
                          <div className="space-y-1">
                            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                              <Globe className="w-3.5 h-3.5 text-emerald-400" />
                              Live Staging Environment
                            </span>
                            {effectiveEvidence.liveUrl ? (
                              <a
                                href={effectiveEvidence.liveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-2 rounded-lg bg-[#131B2E] border border-[#222A3D] hover:border-emerald-500/40 text-emerald-400 hover:text-emerald-300 text-xs font-mono transition-colors group"
                              >
                                <span className="truncate">{effectiveEvidence.liveUrl}</span>
                                <ExternalLink className="w-3.5 h-3.5 shrink-0 ml-2 text-slate-500 group-hover:text-emerald-400" />
                              </a>
                            ) : (
                              <p className="text-xs text-slate-500 italic p-2 rounded-lg bg-[#131B2E]">No live staging URL provided</p>
                            )}
                          </div>

                          {/* Delivery Notes & Attestation */}
                          <div className="space-y-1">
                            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-slate-400" />
                              Freelancer Delivery Notes &amp; Attestation
                            </span>
                            <div className="p-2.5 rounded-lg bg-[#131B2E] border border-[#222A3D] text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                              {effectiveEvidence.description || 'No notes provided by freelancer.'}
                            </div>
                          </div>

                          {/* Attached Evidence Files */}
                          <div className="space-y-1.5">
                            <span className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <Camera className="w-3.5 h-3.5 text-purple-400" />
                                Attached Evidence Files ({effectiveEvidence.fileAttachments?.length || 0})
                              </span>
                            </span>
                            {effectiveEvidence.fileAttachments && effectiveEvidence.fileAttachments.length > 0 ? (
                              <div className="space-y-1.5">
                                {effectiveEvidence.fileAttachments.map((f: any, idx: number) => {
                                  const isImg = (f.mimeType || '').startsWith('image/')
                                  const isPdf = f.mimeType === 'application/pdf'
                                  const isZip = f.mimeType === 'application/zip'
                                  const typeBadge = isImg ? 'IMAGE' : isPdf ? 'PDF' : isZip ? 'ZIP' : 'FILE'
                                  const badgeColor = isImg
                                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                    : isPdf
                                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                      : isZip
                                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                        : 'bg-slate-500/20 text-slate-300 border-slate-500/30'
                                  return (
                                    <div
                                      key={idx}
                                      className="flex items-center justify-between p-2 rounded-lg bg-[#131B2E] border border-[#222A3D] text-xs"
                                    >
                                      <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                                        <FileCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                        <span className="text-slate-200 font-mono text-[11px] truncate">{f.name}</span>
                                        {f.sizeBytes > 0 && (
                                          <span className="text-[10px] text-slate-500 font-mono shrink-0">
                                            ({Math.round(f.sizeBytes / 1024)} KB)
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0 ml-2">
                                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${badgeColor}`}>
                                          {typeBadge}
                                        </span>
                                        {f.url && (
                                          <a
                                            href={f.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-400 hover:text-blue-300 text-[10px] font-medium hover:underline flex items-center gap-0.5"
                                          >
                                            <span>View</span>
                                            <ExternalLink className="w-2.5 h-2.5" />
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-500 italic p-2 rounded-lg bg-[#131B2E]">No file attachments uploaded</p>
                            )}
                          </div>

                          {effectiveEvidence.submittedAt && (
                            <div className="text-[10px] text-slate-500 font-mono border-t border-[#222A3D] pt-2">
                              Submitted at: {new Date(effectiveEvidence.submittedAt).toLocaleString()}
                            </div>
                          )}
                        </div>

                        {/* Verification & Manual Review Prompt for Client */}
                        <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-500/30 text-xs text-blue-300 space-y-1">
                          <div className="flex items-center gap-1.5 font-semibold text-blue-200">
                            <Eye className="w-3.5 h-3.5 text-blue-400" />
                            <span>Client Evaluation Guidance</span>
                          </div>
                          <p className="text-slate-300 text-[11px] leading-relaxed">
                            Verify the repository and live deployment outside TrustBroker. Inspect the automated AI Verification Assessment in the center column, then use the Client Manual Review panel on the right to approve and disburse funds or request adjustments.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 rounded-xl bg-[#0B1326] border border-[#222A3D] text-center space-y-3">
                        <Eye className="w-8 h-8 text-slate-500 mx-auto" />
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-slate-300">Awaiting Freelancer Submission</p>
                          <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed">
                            The freelancer has not submitted deliverables for this milestone yet. Once submitted, their repository URL, live preview link and evidence files will appear here for review.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleSubmitEvidence} className="space-y-4">
                    {/* GitHub Repo URL */}
                    <div className="space-y-1.5">
                      <Label htmlFor="repo" className="text-xs text-slate-300 flex items-center gap-1.5">
                        <GitBranch className="w-3.5 h-3.5 text-slate-400" />
                        Repository URL
                      </Label>
                      <Input
                        id="repo"
                        type="url"
                        required
                        value={repoUrl}
                        onChange={(e) => setRepoUrl(e.target.value)}
                        placeholder="https://github.com/..."
                        className="bg-[#0B1326] border-[#2D3449] text-white text-xs"
                      />
                    </div>

                    {/* Live Preview URL */}
                    <div className="space-y-1.5">
                      <Label htmlFor="live" className="text-xs text-slate-300 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-slate-400" />
                        Live Staging URL <span className="text-slate-500 font-normal">(Tested via HTTP Probe)</span>
                      </Label>
                      <Input
                        id="live"
                        type="url"
                        value={liveUrl}
                        onChange={(e) => setLiveUrl(e.target.value)}
                        placeholder="https://preview.vercel.app..."
                        className="bg-[#0B1326] border-[#2D3449] text-white text-xs"
                      />
                    </div>

                    {/* Delivery Notes */}
                    <div className="space-y-1.5">
                      <Label htmlFor="notes" className="text-xs text-slate-300 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        Delivery Notes & Attestation
                      </Label>
                      <Textarea
                        id="notes"
                        rows={3}
                        required
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Explain what was accomplished and test steps..."
                        className="bg-[#0B1326] border-[#2D3449] text-white text-xs leading-relaxed"
                      />
                    </div>

                    {/* Attached Files & Screenshots (Vision / Document Adapters) */}
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-300 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5 text-slate-400" />
                          Attached Evidence Files
                          {fileAttachments.length > 0 && (
                            <span className="ml-1 text-[10px] font-mono bg-blue-600/30 text-blue-300 border border-blue-600/40 px-1.5 py-0.5 rounded-full">
                              {fileAttachments.length}
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] text-slate-500">Drag & drop or click to browse</span>
                      </Label>

                      {fileAttachments.length > 0 && (
                        <div className="space-y-1.5">
                          {fileAttachments.map((file, idx) => {
                            const isImg = file.mimeType.startsWith('image/')
                            const isPdf = file.mimeType === 'application/pdf'
                            const isZip = file.mimeType === 'application/zip'
                            const typeBadge = isImg ? 'IMAGE' : isPdf ? 'PDF' : isZip ? 'ZIP' : 'FILE'
                            const badgeColor = isImg
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                              : isPdf
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                : isZip
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                  : 'bg-slate-500/20 text-slate-300 border-slate-500/30'
                            return (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-2 rounded-lg bg-[#0B1326] border border-[#222A3D] text-xs group"
                              >
                                <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                                  <FileCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                  <span className="text-slate-200 font-mono text-[11px] truncate">{file.name}</span>
                                  <span className="text-[10px] text-slate-500 font-mono shrink-0">
                                    ({Math.round(file.sizeBytes / 1024)} KB)
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${badgeColor}`}>
                                    {typeBadge}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveAttachment(idx)}
                                    className="text-slate-600 hover:text-rose-400 transition-colors p-0.5 rounded"
                                    title="Remove attachment"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Drag-and-Drop Upload Zone */}
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative rounded-xl border-2 border-dashed transition-all cursor-pointer group ${isDragging
                          ? 'border-blue-500 bg-blue-500/10 scale-[1.01]'
                          : 'border-[#2D3449] bg-[#0B1326]/60 hover:border-blue-500/60 hover:bg-blue-500/5'
                          }`}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept="image/*,.pdf,.zip,.txt,.md"
                          className="sr-only"
                          onChange={handleFilePickerChange}
                        />
                        <div className="flex flex-col items-center justify-center gap-2 py-6 px-4 pointer-events-none select-none">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isUploadingFile ? 'bg-blue-500/20' : isDragging ? 'bg-blue-500/20' : 'bg-[#131B2E] group-hover:bg-blue-500/10'}`}>
                            {isUploadingFile ? (
                              <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                            ) : isDragging ? (
                              <FolderOpen className="w-5 h-5 text-blue-400" />
                            ) : (
                              <UploadCloud className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors" />
                            )}
                          </div>
                          <div className="text-center">
                            <p className={`text-xs font-semibold transition-colors ${isUploadingFile || isDragging ? 'text-blue-300' : 'text-slate-300 group-hover:text-white'}`}>
                              {isUploadingFile ? 'Uploading to secure server storage...' : isDragging ? 'Drop files to attach' : 'Drag & drop evidence files here'}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              {isUploadingFile ? 'Bytes are saved directly to server' : <>or <span className="text-blue-400 group-hover:underline">click to browse</span> your computer</>}
                            </p>
                            <p className="text-[10px] text-slate-600 mt-1">
                              PNG, JPG, GIF, WebP, PDF, ZIP, TXT · Max 25 MB per file
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Manual URL entry (still available as fallback) */}
                      <details className="group">
                        <summary className="text-[10px] text-slate-500 hover:text-slate-300 cursor-pointer select-none list-none flex items-center gap-1 pt-1">
                          <Plus className="w-3 h-3" />
                          Add file by URL instead
                        </summary>
                        <div className="pt-2 space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              placeholder="File name (e.g. proof.png)"
                              value={newFileName}
                              onChange={(e) => setNewFileName(e.target.value)}
                              className="bg-[#131B2E] border border-[#2D3449] rounded-md px-2 py-1 text-white text-[11px] h-7 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                            />
                            <input
                              placeholder="Evidence URL or storage link"
                              value={newFileUrl}
                              onChange={(e) => setNewFileUrl(e.target.value)}
                              className="bg-[#131B2E] border border-[#2D3449] rounded-md px-2 py-1 text-white text-[11px] h-7 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                            />
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleAddAttachment}
                            disabled={!newFileName.trim()}
                            className="w-full bg-[#1A2338] hover:bg-[#222D47] text-slate-200 text-xs h-7 gap-1 font-medium border border-[#2D3449]"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add by URL</span>
                          </Button>
                        </div>
                      </details>
                    </div>

                    <Button
                      type="submit"
                      disabled={isEvaluating || isUploadingFile || isSettled || isLocked}
                      className={`w-full text-xs gap-2 h-9 font-semibold shadow-sm ${isLocked
                        ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed hover:bg-slate-800'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                    >
                      {isLocked ? (
                        <>
                          <Lock className="w-3.5 h-3.5 text-slate-500" />
                          Milestone Locked (Client PayPal Funding Required)
                        </>
                      ) : isEvaluating ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          AI is inspecting evidence across multimodal adapters...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          Run AI Verification Check
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Column 2: AI Verification Results */}
          <div className={`${activeRole === 'client' ? 'lg:col-span-4' : 'lg:col-span-6'} space-y-4`}>
            <Card className="border-[#222A3D] bg-[#131B2E] text-white">
              <CardHeader className="pb-3 border-b border-[#222A3D]">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-white">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    AI Verification Assessment
                  </CardTitle>
                  {assessment && (
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px] font-mono">
                        Score: {assessment.overallScore}/100
                      </Badge>
                      {assessment.passed ? (
                        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px]">
                          PASS
                        </Badge>
                      ) : assessment.requiresHumanReview ? (
                        <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px]">
                          NEEDS REVIEW
                        </Badge>
                      ) : (
                        <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/40 text-[10px]">
                          FAIL
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                <CardDescription className="text-xs text-slate-400">
                  Multimodal inspection against agreed acceptance criteria.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 space-y-4">
                {assessment ? (
                  <div className="space-y-4">
                    {/* Score Bar & Model Used Badge */}
                    {!assessment.modelUsed?.includes('Offline') && (
                      <div className="p-3.5 rounded-xl bg-[#0B1326] border border-[#2D3449] space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Overall Verification Score</span>
                          <span className="font-mono font-bold text-emerald-400">{assessment.overallScore}%</span>
                        </div>
                        <Progress value={assessment.overallScore} className="h-2" />
                        <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                          <span>Engine: <span className="text-blue-300 font-mono">{assessment.modelUsed || 'Groq LPU (llama-3.3-70b)'}</span></span>
                          <span>Status: <span className="font-semibold text-slate-200">{assessment.passed ? 'Verified' : 'Pending Action'}</span></span>
                        </div>
                      </div>
                    )}

                    {/* Human Review Banner if triggered */}
                    {assessment.requiresHumanReview && (
                      <div className={`p-3 rounded-lg border space-y-1.5 text-xs ${assessment.modelUsed?.includes('Offline')
                        ? 'bg-rose-950/30 border-rose-800/40 animate-pulse'
                        : 'bg-amber-950/30 border-amber-800/40'
                        }`}>
                        <div className={`flex items-center gap-1.5 font-semibold ${assessment.modelUsed?.includes('Offline') ? 'text-rose-300' : 'text-amber-300'
                          }`}>
                          <AlertCircle className={`w-4 h-4 ${assessment.modelUsed?.includes('Offline') ? 'text-rose-400' : 'text-amber-400'}`} />
                          <span>
                            {assessment.modelUsed?.includes('Offline')
                              ? '⚠ AI Engine Unavailable — Use Manual Review'
                              : 'Human Review Recommended'}
                          </span>
                        </div>
                        <p className="text-slate-300 text-[11px] leading-relaxed">
                          {assessment.modelUsed?.includes('Offline')
                            ? 'The AI verification engine could not be reached. Use the Manual Review panel to inspect the freelancer\'s submitted evidence and approve or request revision.'
                            : 'One or more acceptance criteria involve subjective design or ambiguous scope. Client discretion is required to approve or request revision.'}
                        </p>
                        {assessment.modelUsed?.includes('Offline') && activeRole === 'client' && (
                          <div className="text-[10px] text-rose-300 font-mono bg-rose-950/40 p-1.5 rounded border border-rose-900/60">
                            → Check the "Client Manual Review" panel on the right →
                          </div>
                        )}
                      </div>
                    )}

                    {/* Criteria Results */}
                    <div className="space-y-2.5">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Criterion-by-Criterion Results ({assessment.criteriaResults?.length || 0}):
                      </span>
                      {(assessment.criteriaResults || []).map((c: any) => {
                        const isPass = c.status === 'pass'
                        const isFail = c.status === 'fail'

                        return (
                          <div
                            key={c.id}
                            className="p-3 rounded-xl bg-[#0B1326] border border-[#2D3449] space-y-1.5 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-white">{c.title}</span>
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-mono uppercase ${isPass
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : isFail
                                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  }`}
                              >
                                {c.status ? c.status.toUpperCase() : 'PENDING'}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-slate-300 leading-relaxed">
                              {c.description}
                            </p>
                            {c.feedback && (
                              <div className="text-[10px] text-blue-300 font-mono bg-blue-950/40 p-1.5 rounded">
                                {c.feedback}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Summary Analysis */}
                    <div className="p-3 rounded-lg bg-[#0E1528] border border-[#222A3D] space-y-1 text-xs">
                      <span className="text-[11px] text-slate-400 font-semibold block">Summary Analysis:</span>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        {assessment.summaryAnalysis}
                      </p>
                    </div>

                    {/* Status & Verification Guidance for Client in Column 2 */}
                    {activeRole === 'client' && !isSettled && (
                      <div className="pt-2">
                        {isRevisionRequested ? (
                          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 text-xs text-amber-300 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 font-semibold text-amber-400 text-sm">
                                <RotateCcw className="w-4 h-4 text-amber-400" />
                                <span>Revision Requested — Auto-Release Frozen</span>
                              </div>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                Clock Paused
                              </span>
                            </div>

                            <p className="text-slate-300 text-[11px] leading-relaxed">
                              You have requested adjustments on this milestone deliverable. The 7-day auto-disbursal clock is strictly suspended. The freelancer ({contract.freelancer?.name || 'Freelancer'}) has been notified to address your feedback.
                            </p>

                            {selectedMilestone.revisionNotes && (
                              <div className="p-2.5 rounded-lg bg-[#0B1326] border border-amber-500/30 space-y-1">
                                <span className="text-[10px] text-amber-400 font-semibold block uppercase tracking-wider">Your Revision Notes:</span>
                                <p className="text-slate-200 text-xs font-mono">{selectedMilestone.revisionNotes}</p>
                              </div>
                            )}

                            {/* Buyer Protection Inactivity Guarantee */}
                            <div className="p-2.5 rounded-lg bg-[#0B1326] border border-[#222A3D] space-y-1 text-[11px]">
                              <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Buyer Protection: 7-Day Inactivity Guarantee</span>
                              </div>
                              <p className="text-slate-400 text-[10px] leading-relaxed">
                                Staged funds of {formatCurrency(selectedMilestone.amount, contract.currency)} are completely safeguarded in the PayPal Sandbox. Manage settlement or reclamation in the <strong>Client Manual Review</strong> panel on the right.
                              </p>
                            </div>
                          </div>
                        ) : isVerified ? (
                          <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-xs text-emerald-300 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 font-semibold text-emerald-400 text-sm">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span>AI Multimodal Inspection Passed</span>
                              </div>
                              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px] font-mono">
                                Score: {assessment.overallScore}/100
                              </Badge>
                            </div>
                            <p className="text-slate-300 text-[11px] leading-relaxed">
                              All agreed milestone criteria have passed automated inspection. Proceed to the <strong>Client Manual Review</strong> panel on the right to review the live deliverable outside the system and authorize payment disbursement.
                            </p>
                          </div>
                        ) : (
                          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 text-xs text-amber-300 space-y-2.5">
                            <div className="flex items-center gap-2 font-semibold text-amber-400 text-sm">
                              <AlertCircle className="w-4 h-4 text-amber-400" />
                              <span>Criteria Review or Flagged Items</span>
                            </div>
                            <p className="text-slate-300 text-[11px] leading-relaxed">
                              Some criteria require subjective or visual confirmation. You can manually inspect the deliverables and override approval or request changes in the <strong>Client Manual Review</strong> panel on the right.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Notice & Status for Freelancer after verification */}
                    {activeRole === 'freelancer' && !isSettled && (
                      <div className="pt-2">
                        {isRevisionRequested ? (
                          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 text-xs text-amber-300 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 font-semibold text-amber-400 text-sm">
                                <RotateCcw className="w-4 h-4 text-amber-400" />
                                <span>Revision Requested by Client — Auto-Release Clock Frozen</span>
                              </div>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                Clock Paused
                              </span>
                            </div>

                            <p className="text-slate-300 text-[11px] leading-relaxed">
                              The client ({contract.client?.name || 'Client'}) has reviewed your deliverable and requested adjustments. While in revision status, the 7-day auto-disbursal clock is strictly suspended. Staged funds ({formatCurrency(selectedMilestone.amount, contract.currency)}) remain securely held in PayPal sandbox.
                            </p>

                            {selectedMilestone.revisionNotes && (
                              <div className="p-2.5 rounded-lg bg-[#0B1326] border border-amber-500/30 space-y-1">
                                <span className="text-[10px] text-amber-400 font-semibold block uppercase tracking-wider">Client Revision Feedback:</span>
                                <p className="text-slate-200 text-xs font-mono">{selectedMilestone.revisionNotes}</p>
                              </div>
                            )}

                            {/* 7-Day Freelancer Response Deadline */}
                            <div className="p-2.5 rounded-lg bg-[#0B1326] border border-[#222A3D] space-y-1 text-[11px]">
                              <div className="flex items-center gap-1.5 font-semibold text-amber-400">
                                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                                <span>7-Day Freelancer Response Deadline (Buyer Protection Active)</span>
                              </div>
                              <p className="text-slate-400 text-[10px] leading-relaxed">
                                You have 7 days to address the client's revision notes and submit updated deliverables using the form on the left. If no revision or response is provided within 7 days, the client is protected and may reclaim their staged funds.
                              </p>
                            </div>

                            <div className="pt-2 flex flex-col gap-2">
                              <Button
                                onClick={() => {
                                  window.scrollTo({ top: 300, behavior: 'smooth' })
                                  const notesEl = document.getElementById('delivery-notes')
                                  if (notesEl) notesEl.focus()
                                }}
                                className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5 h-9 font-semibold shadow-md cursor-pointer"
                              >
                                <UploadCloud className="w-3.5 h-3.5" />
                                Submit Revised Deliverables
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => setDisputeDialogOpen(true)}
                                className="w-full border-[#2D3449] text-blue-400 hover:text-white hover:bg-blue-950/40 text-xs gap-1.5 h-8.5 font-medium cursor-pointer"
                              >
                                <Scale className="w-3.5 h-3.5" />
                                Request AI Dispute Mediation
                              </Button>
                            </div>
                          </div>
                        ) : isVerified ? (
                          <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-xs text-emerald-300 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 font-semibold text-emerald-400 text-sm">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span>AI Verification Passed — Awaiting Client Release</span>
                              </div>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Payment Staged
                              </span>
                            </div>

                            <p className="text-slate-300 text-[11px] leading-relaxed">
                              All deliverable criteria have passed AI multimodal inspection (Score: {assessment.overallScore}/100). Milestone funds of <strong className="text-emerald-300 font-semibold">{formatCurrency(selectedMilestone.amount, contract.currency)}</strong> are securely staged in PayPal Sandbox. Your client ({contract.client?.name || 'Client'}) has been notified to perform their final manual verification outside the system and authorize release to your registered account (<code className="text-emerald-400 font-mono">freelancer-payout@sandbox.paypal.com</code>).
                            </p>

                            {/* TrustBroker Seller Protection Policy */}
                            <div className="p-2.5 rounded-lg bg-[#0B1326] border border-[#222A3D] space-y-1 text-[11px]">
                              <div className="flex items-center gap-1.5 font-semibold text-blue-400">
                                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                                <span>TrustBroker Buyer &amp; Seller Protection Active</span>
                              </div>
                              <p className="text-slate-400 text-[10px] leading-relaxed">
                                Clients have a standard 7-day review window following AI verification to inspect deliverables and release staged funds. If the client requests revisions, the timer freezes. If the client takes no action within 7 days, platform protection policies allow automated milestone settlement or dispute mediation.
                              </p>
                            </div>

                            <div className="pt-2 flex flex-col gap-2">
                              <Button
                                onClick={handleNudgeClient}
                                disabled={isNudged}
                                className={`w-full text-xs gap-1.5 h-9 font-semibold transition-all cursor-pointer ${isNudged
                                  ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 cursor-default'
                                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                                  }`}
                              >
                                {isNudged ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    Disbursal Reminder Sent to Client
                                  </>
                                ) : (
                                  <>
                                    <BellRing className="w-3.5 h-3.5" />
                                    Send Disbursal Reminder to Client
                                  </>
                                )}
                              </Button>

                              <Link
                                to={ROUTES.FREELANCER_PAYOUTS}
                                className="w-full inline-flex items-center justify-center px-3.5 py-2 rounded-lg bg-[#171F33] hover:bg-[#222A3D] text-xs font-medium text-slate-300 border border-[#222A3D] transition-colors"
                              >
                                View Earnings Ledger →
                              </Link>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3.5 rounded-lg bg-amber-950/40 border border-amber-500/40 text-xs text-amber-300 space-y-1.5">
                            <div className="flex items-center gap-1.5 font-semibold text-amber-400">
                              <AlertCircle className="w-4 h-4 text-amber-400" />
                              <span>Verification Score Below Threshold ({assessment.overallScore}/100)</span>
                            </div>
                            <p className="text-slate-300 text-[11px] leading-relaxed">
                              Some criteria require adjustments. Review the itemized criterion feedback above, make the necessary corrections and re-run verification.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {isSettled && (
                      <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-center text-xs text-emerald-300 flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Milestone payment of ${selectedMilestone.amount} has been disbursed via PayPal.</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 space-y-3">
                    <ShieldCheck className="w-10 h-10 text-slate-500 mx-auto" />
                    <div className="text-xs text-slate-400 max-w-xs mx-auto">
                      No verification report generated yet for this milestone. Submit artifacts on the left to run evaluation.
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Column 3: Client Manual Review (Visible to Clients) */}
          {activeRole === 'client' && (
            <div className="lg:col-span-4 space-y-4">
              <Card className="border-[#222A3D] bg-[#131B2E] text-white">
                <CardHeader className="pb-3 border-b border-[#222A3D]">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-white">
                    <UserCheck className="w-4 h-4 text-teal-400" />
                    Client Manual Review
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Review submitted evidence and approve or request changes directly — outside AI verification.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  {effectiveEvidence ? (
                    <div className="space-y-3">
                      {/* Submitted Evidence Display */}
                      <div className="p-3 rounded-xl bg-[#0B1326] border border-[#222A3D] space-y-2.5">
                        <div className="flex items-center justify-between pb-1 border-b border-[#222A3D]">
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            Freelancer Submission
                          </span>
                          <Badge className="bg-blue-500/15 text-blue-300 border-blue-500/30 text-[9px] font-mono">
                            v{effectiveEvidence.version || 1}
                          </Badge>
                        </div>

                        {effectiveEvidence.repoUrl && (
                          <div className="flex items-start gap-2 text-xs">
                            <GitBranch className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <span className="text-slate-400 block text-[10px]">Repository</span>
                              <a
                                href={effectiveEvidence.repoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 hover:underline truncate block font-mono text-[10px]"
                              >
                                {effectiveEvidence.repoUrl.replace('https://', '')}
                              </a>
                            </div>
                          </div>
                        )}

                        {effectiveEvidence.liveUrl && (
                          <div className="flex items-start gap-2 text-xs">
                            <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <span className="text-slate-400 block text-[10px]">Live Preview</span>
                              <a
                                href={effectiveEvidence.liveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-400 hover:text-emerald-300 hover:underline truncate block font-mono text-[10px]"
                              >
                                {effectiveEvidence.liveUrl.replace('https://', '')}
                              </a>
                            </div>
                          </div>
                        )}

                        {effectiveEvidence.description && (
                          <div className="flex items-start gap-2 text-xs">
                            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <span className="text-slate-400 block text-[10px]">Delivery Notes</span>
                              <p className="text-slate-300 text-[11px] leading-relaxed mt-0.5 line-clamp-4">
                                {effectiveEvidence.description}
                              </p>
                            </div>
                          </div>
                        )}

                        {(effectiveEvidence.fileAttachments?.length ?? 0) > 0 && (
                          <div className="flex items-start gap-2 text-xs">
                            <FileCheck className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                            <div className="min-w-0 w-full">
                              <span className="text-slate-400 block text-[10px]">
                                Attached Files ({effectiveEvidence.fileAttachments!.length})
                              </span>
                              <div className="mt-1 space-y-1">
                                {effectiveEvidence.fileAttachments!.map((f: any, i: number) => (
                                  <div key={i} className="flex items-center gap-1.5 p-1.5 rounded bg-[#131B2E] border border-[#222A3D]">
                                    <span className="text-[9px] font-mono text-slate-400 truncate">{f.name}</span>
                                    {f.sizeBytes > 0 && (
                                      <span className="text-[9px] text-slate-600 ml-auto shrink-0">
                                        {Math.round(f.sizeBytes / 1024)}KB
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {effectiveEvidence.submittedAt && (
                          <div className="text-[10px] text-slate-500 font-mono border-t border-[#222A3D] pt-2 mt-1">
                            Submitted: {new Date(effectiveEvidence.submittedAt).toLocaleString()}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons for Client Manual Review */}
                      {isRevisionRequested ? (
                        <div className="space-y-2.5">
                          <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/40 text-xs text-amber-300 flex items-center gap-2">
                            <RotateCcw className="w-4 h-4 text-amber-400 shrink-0" />
                            <span>Revision requested — auto-release paused.</span>
                          </div>
                          <Button
                            onClick={() => setOverrideDialogOpen(true)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 h-10 font-bold shadow-md cursor-pointer"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            Override &amp; Approve (${selectedMilestone.amount})
                          </Button>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setReclaimDialogOpen(true)}
                              className="w-full border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-white text-xs gap-1.5 h-9 font-medium cursor-pointer"
                            >
                              <Undo2 className="w-3.5 h-3.5 shrink-0" />
                              <span>Reclaim Staged Funds</span>
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setDisputeDialogOpen(true)}
                              className="w-full border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 hover:text-white text-xs gap-1.5 h-9 font-medium cursor-pointer"
                            >
                              <Scale className="w-3.5 h-3.5 shrink-0" />
                              <span>AI Dispute</span>
                            </Button>
                          </div>
                        </div>
                      ) : !isSettled && selectedMilestone.status !== 'verified' ? (
                        <div className="space-y-2.5">
                          <Button
                            onClick={() => setManualApproveOpen(true)}
                            className="w-full bg-teal-600 hover:bg-teal-700 text-white text-xs gap-1.5 h-10 font-bold shadow-md cursor-pointer"
                          >
                            <UserCheck className="w-4 h-4" />
                            Approve Deliverables Manually
                          </Button>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setRevisionDialogOpen(true)}
                              className="w-full border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-white text-xs gap-1.5 h-9 font-medium cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span>Request Revision</span>
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setDisputeDialogOpen(true)}
                              className="w-full border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 hover:text-white text-xs gap-1.5 h-9 font-medium cursor-pointer"
                            >
                              <Scale className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                              <span>AI Dispute</span>
                            </Button>
                          </div>
                        </div>
                      ) : null}

                      {(isSettled || selectedMilestone.status === 'verified') && !isRevisionRequested && (
                        <div className="space-y-2.5">
                          <div className="p-3 rounded-lg bg-teal-950/30 border border-teal-800/40 text-xs text-teal-300 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                            <span>
                              {isSettled ? 'Payment disbursed via PayPal.' : 'Milestone verified — ready to disburse.'}
                            </span>
                          </div>
                          {!isSettled && (
                            <div className="space-y-2.5">
                              <Button
                                onClick={handleAuthorizeRelease}
                                disabled={isReleasing}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-2 h-10 font-bold shadow-lg shadow-emerald-950/40 cursor-pointer transition-all"
                              >
                                <DollarSign className="w-4 h-4" />
                                {isReleasing ? 'Executing PayPal Disbursement...' : `Authorize PayPal Payout (${formatCurrency(selectedMilestone.amount, contract.currency)})`}
                              </Button>
                              <div className="grid grid-cols-2 gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => setRevisionDialogOpen(true)}
                                  className="w-full border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-white text-xs gap-1.5 h-9 font-medium cursor-pointer transition-all"
                                >
                                  <RotateCcw className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                  <span>Request Revision</span>
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => setDisputeDialogOpen(true)}
                                  className="w-full border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 hover:text-white text-xs gap-1.5 h-9 font-medium cursor-pointer transition-all"
                                >
                                  <Scale className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                  <span>AI Dispute</span>
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 space-y-2">
                      <Eye className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="text-xs text-slate-500 leading-relaxed max-w-[200px] mx-auto">
                        No submission yet. This panel will display the freelancer's evidence once submitted for manual review.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Revision Request Dialog */}
        <Dialog open={revisionDialogOpen} onOpenChange={setRevisionDialogOpen}>
          <DialogContent className="bg-[#131B2E] border-[#222A3D] text-white max-h-[88vh] overflow-y-auto max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">Request Milestone Revision</DialogTitle>
              <DialogDescription className="text-slate-400 text-xs">
                Provide actionable notes for the freelancer to address before re-submitting for verification.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 py-2">
              <Label htmlFor="rev-text" className="text-xs text-slate-300">
                Actionable Feedback
              </Label>
              <Textarea
                id="rev-text"
                rows={3}
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                placeholder="Specify required code fixes, missing criteria or layout fixes..."
                className="bg-[#0B1326] border-[#2D3449] text-white text-xs"
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
                Send Revision Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Client Human Review Override Dialog */}
        <Dialog open={overrideDialogOpen} onOpenChange={setOverrideDialogOpen}>
          <DialogContent className="bg-[#131B2E] border-[#222A3D] text-white max-h-[88vh] overflow-y-auto max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">Human Review Approval Override</DialogTitle>
              <DialogDescription className="text-slate-400 text-xs">
                As the client, you may manually approve this milestone deliverable even if AI flags subjective criteria. An immutable audit record will log your rationale.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 py-2">
              <Label htmlFor="override-text" className="text-xs text-slate-300">
                Approval Rationale (Required)
              </Label>
              <Textarea
                id="override-text"
                rows={3}
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Explain why the deliverables satisfy your requirements..."
                className="bg-[#0B1326] border-[#2D3449] text-white text-xs"
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOverrideDialogOpen(false)}
                className="border-[#2D3449] text-slate-400 hover:text-white hover:bg-[#171F33] text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!overrideReason.trim()}
                onClick={handleConfirmOverride}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                Confirm Override & Approve
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Manual Approval Dialog */}
        <Dialog open={manualApproveOpen} onOpenChange={setManualApproveOpen}>
          <DialogContent className="bg-[#131B2E] border-[#222A3D] text-white max-h-[88vh] overflow-y-auto max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-teal-400" />
                Manual Milestone Approval
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-xs">
                You are approving this milestone outside AI verification. Provide your review rationale — this is recorded in the immutable audit trail.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 py-2">
              <Label htmlFor="manual-rationale" className="text-xs text-slate-300">
                Approval Rationale (Required)
              </Label>
              <Textarea
                id="manual-rationale"
                rows={4}
                value={manualRationale}
                onChange={(e) => setManualRationale(e.target.value)}
                placeholder="Describe how you verified the deliverables satisfy the milestone requirements (e.g., 'Reviewed repository, verified live URL, all criteria met satisfactorily...')"
                className="bg-[#0B1326] border-[#2D3449] text-white text-xs"
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setManualApproveOpen(false); setManualRationale('') }}
                className="border-[#2D3449] text-slate-400 hover:text-white hover:bg-[#171F33] text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!manualRationale.trim() || isManualApproving}
                onClick={handleManualApprove}
                className="bg-teal-600 hover:bg-teal-700 text-white text-xs gap-1.5"
              >
                {isManualApproving ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" />Approving…</>
                ) : (
                  <><UserCheck className="w-3.5 h-3.5" />Confirm Manual Approval</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Staged Funds Reclaim Dialog (Buyer Protection) */}
        <Dialog open={reclaimDialogOpen} onOpenChange={setReclaimDialogOpen}>
          <DialogContent className="bg-[#131B2E] border-[#222A3D] text-white max-h-[88vh] overflow-y-auto max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <Undo2 className="w-4 h-4 text-rose-400" />
                Reclaim Staged Funds — Buyer Protection
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-xs">
                You are reclaiming your staged milestone funds due to freelancer inactivity or failure to address revision feedback. This action is permanently logged in the contract audit trail.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/30 text-xs text-rose-300 space-y-1">
                <p className="font-semibold">Amount to reclaim: <span className="text-rose-200">{formatCurrency(selectedMilestone.amount, contract.currency)}</span></p>
                <p>Milestone: <span className="text-slate-200">{selectedMilestone.title}</span></p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reclaim-reason" className="text-xs text-slate-300">
                  Reason for Reclaiming (Required)
                </Label>
                <Textarea
                  id="reclaim-reason"
                  rows={3}
                  value={reclaimReason}
                  onChange={(e) => setReclaimReason(e.target.value)}
                  placeholder="e.g., Freelancer did not submit revisions within 7 days..."
                  className="bg-[#0B1326] border-[#2D3449] text-white text-xs"
                />
              </div>
              <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/30 text-[11px] text-amber-300">
                <strong>Note:</strong> The freelancer will be notified and the milestone will reset to pending status. They may resubmit deliverables if the contract remains active.
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReclaimDialogOpen(false)}
                className="border-[#2D3449] text-slate-400 hover:text-white hover:bg-[#171F33] text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!reclaimReason.trim() || isReclaiming}
                onClick={handleConfirmReclaim}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs gap-1.5"
              >
                {isReclaiming ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" />Reclaiming…</>
                ) : (
                  <><Undo2 className="w-3.5 h-3.5" />Confirm Reclaim</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* AI Dispute Mediation Dialog */}
        <Dialog open={disputeDialogOpen} onOpenChange={setDisputeDialogOpen}>
          <DialogContent className="bg-[#131B2E] border-[#222A3D] text-white max-h-[88vh] overflow-y-auto max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-blue-400" />
                AI Dispute Mediation
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-xs">
                TrustBroker provides impartial AI-assisted dispute resolution based on contract SOW, acceptance criteria and submitted evidence.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Mediation Protocol */}
              <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-500/30 space-y-3 text-xs">
                <div className="flex items-center gap-2 font-semibold text-blue-300">
                  <Scale className="w-4 h-4 text-blue-400" />
                  <span>TrustBroker Dispute Mediation Protocol</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  When a revision request is disputed, TrustBroker AI conducts an independent evidence audit: re-evaluating the original SOW acceptance criteria, submitted deliverables, the client's revision notes and the freelancer's response — rendering an impartial recommendation.
                </p>
                <div className="space-y-1.5">
                  <div className="flex items-start gap-2 text-[11px] text-slate-300">
                    <span className="text-blue-400 font-bold mt-0.5">1.</span>
                    <span><strong className="text-white">Evidence Re-audit:</strong> AI re-scores all original deliverables against the milestone acceptance criteria independently of prior verification runs.</span>
                  </div>
                  <div className="flex items-start gap-2 text-[11px] text-slate-300">
                    <span className="text-blue-400 font-bold mt-0.5">2.</span>
                    <span><strong className="text-white">Revision Notes Assessment:</strong> AI evaluates whether the client's revision request is specific, within-scope of the original SOW and reasonable.</span>
                  </div>
                  <div className="flex items-start gap-2 text-[11px] text-slate-300">
                    <span className="text-blue-400 font-bold mt-0.5">3.</span>
                    <span><strong className="text-white">Binding Recommendation:</strong> AI issues a recommendation — Release funds (freelancer wins), Revise further (client wins) or Partial settlement — recorded in the immutable audit trail.</span>
                  </div>
                  <div className="flex items-start gap-2 text-[11px] text-slate-300">
                    <span className="text-blue-400 font-bold mt-0.5">4.</span>
                    <span><strong className="text-white">Human Escalation:</strong> Either party may request a manual TrustBroker administrator review if unsatisfied with the AI recommendation.</span>
                  </div>
                </div>
              </div>

              {/* Timeline & Current State */}
              <div className="p-3 rounded-lg bg-[#0B1326] border border-[#222A3D] space-y-2 text-xs">
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] block">Dispute Timeline</span>
                <div className="flex items-center gap-3 text-[11px]">
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <div className="w-px h-5 bg-slate-700" />
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    <div className="w-px h-5 bg-slate-700" />
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                  </div>
                  <div className="space-y-3 text-slate-300">
                    <p><span className="text-emerald-400 font-semibold">AI Verified</span> — Milestone passed initial verification ({assessment?.overallScore ?? 'N/A'}/100)</p>
                    <p><span className="text-amber-400 font-semibold">Revision Requested</span> — Client flagged issues for freelancer to address</p>
                    <p><span className="text-blue-400 font-semibold">Mediation Requested</span> — Awaiting AI dispute evidence re-audit</p>
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-700/40 text-[10px] text-slate-400 italic">
                <strong className="text-slate-300">Hackathon Demo Note:</strong> In production, this triggers a background AI re-audit task. For demonstration, run a fresh AI verification check using the left panel submission form to simulate a mediation re-score.
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDisputeDialogOpen(false)}
                className="border-[#2D3449] text-slate-400 hover:text-white hover:bg-[#171F33] text-xs"
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setDisputeDialogOpen(false)
                  toast.info('AI Dispute Mediation initiated. Both parties will be notified of the outcome within 24 hours.')
                  addNotification({
                    title: 'Dispute Mediation Initiated',
                    description: `AI dispute mediation requested for milestone "${selectedMilestone.title}". Evidence re-audit in progress.`,
                    type: 'verification',
                    link: activeRole === 'client' ? ROUTES.CLIENT_REVIEW(contract.id) : ROUTES.DELIVERY_VERIFICATION(contract.id),
                  })
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5"
              >
                <Scale className="w-3.5 h-3.5" />
                Initiate AI Mediation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}

export default DeliveryVerification
