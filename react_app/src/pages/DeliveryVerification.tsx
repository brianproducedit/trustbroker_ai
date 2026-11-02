import React, { useState, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { StatusBadge } from '@/components/common/StatusBadge'
import { useContractStore } from '@/hooks/useContractStore'
import { useNotificationStore } from '@/hooks/useNotifications'
import { formatCurrency } from '@/lib/utils'
import { ROUTES } from '@/constants'
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
} from 'lucide-react'
import { toast } from 'sonner'

export const DeliveryVerification: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const {
    contracts,
    activeRole,
    submitEvidence,
    releasePayment,
    requestRevision,
    overrideReview
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

  // Drag-and-drop + file picker state
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isEvaluating, setIsEvaluating] = useState(false)
  const [revisionDialogOpen, setRevisionDialogOpen] = useState(false)
  const [revisionNotes, setRevisionNotes] = useState('')
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false)
  const [overrideReason, setOverrideReason] = useState('')
  const [isReleasing, setIsReleasing] = useState(false)

  if (!contract || !selectedMilestone) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <h2 className="text-xl font-bold text-white">Milestone not found</h2>
          <Button asChild variant="outline" className="mt-4 border-slate-700 text-slate-300">
            <Link to={ROUTES.DASHBOARD}>Return to Dashboard</Link>
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  const handleAddAttachment = () => {
    if (!newFileName.trim()) return
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
  const processFiles = useCallback((files: FileList | File[]) => {
    const allowed = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf', 'application/zip', 'text/plain', 'text/markdown']
    Array.from(files).forEach((file) => {
      if (file.size > 25 * 1024 * 1024) {
        toast.error(`${file.name} exceeds the 25 MB limit and was skipped.`)
        return
      }
      const mime = allowed.includes(file.type) ? file.type : 'application/octet-stream'
      // Create an object URL so the AI engine can reference the local blob
      const objectUrl = URL.createObjectURL(file)
      setFileAttachments((prev) => [
        ...prev,
        { name: file.name, url: objectUrl, sizeBytes: file.size, mimeType: mime },
      ])
    })
  }, [fileAttachments])

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

      toast.success(`Verification complete! Score: ${assessment.overallScore}/100`)
      addNotification({
        title: 'Work Verified by AI',
        description: `Milestone "${selectedMilestone.title}" scored ${assessment.overallScore}/100 and passed criteria.`,
        type: 'verification',
        link: `/dashboard/deliveries/${contract.id}`,
      })
    } finally {
      setIsEvaluating(false)
    }
  }

  const handleAuthorizeRelease = async () => {
    setIsReleasing(true)
    try {
      await releasePayment(contract.id, selectedMilestone.id)
      toast.success(`Payment released: ${formatCurrency(selectedMilestone.amount)} USD disbursed via PayPal!`)
      addNotification({
        title: 'Payment Released',
        description: `${formatCurrency(selectedMilestone.amount)} USD transferred for verified milestone.`,
        type: 'payment',
        link: `/dashboard/contracts/${contract.id}`,
      })
    } catch (err: any) {
      toast.error(err?.detail || err?.message || 'Failed to disburse PayPal payout.')
    } finally {
      setIsReleasing(false)
    }
  }

  const handleConfirmRevision = () => {
    if (!revisionNotes.trim()) return
    requestRevision(contract.id, selectedMilestone.id, revisionNotes.trim())
    setRevisionDialogOpen(false)
    toast.info('Revision request sent to freelancer')
    addNotification({
      title: 'Revision Requested',
      description: `Client requested adjustments for milestone: "${revisionNotes.slice(0, 50)}..."`,
      type: 'revision',
      link: `/dashboard/deliveries/${contract.id}`,
    })
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
      link: `/dashboard/contracts/${contract.id}`,
    })
  }

  const assessment = selectedMilestone?.assessment
  const isSettled = selectedMilestone.status === 'settled'
  const isFunded =
    selectedMilestone.paymentStatus === 'staged_in_sandbox' ||
    selectedMilestone.paymentStatus === 'release_authorized' ||
    (selectedMilestone as any).paymentStatus === 'staged'
  const isReleased = selectedMilestone.paymentStatus === 'released'
  const isLocked = !isFunded && !isReleased

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
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
            <span className="font-mono text-xs text-slate-400">Milestone Review</span>
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedMilestoneId === m.id
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
                  className={`text-[10px] font-mono uppercase ${
                    isReleased
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

        {/* Main 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Column 1: Submission Form */}
          <div className="lg:col-span-6 space-y-4">
            <Card className="border-[#222A3D] bg-[#131B2E] text-white">
              <CardHeader className="pb-3 border-b border-[#222A3D]">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-white">
                  <UploadCloud className="w-4 h-4 text-blue-400" />
                  Deliverable Artifacts & Evidence
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Provide evidence matching the agreed milestone acceptance criteria for AI inspection.
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
                        <Link to={`/app/client/contracts/${contract.id}`}>
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
                      className={`relative rounded-xl border-2 border-dashed transition-all cursor-pointer group ${
                        isDragging
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
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isDragging ? 'bg-blue-500/20' : 'bg-[#131B2E] group-hover:bg-blue-500/10'}`}>
                          {isDragging ? (
                            <FolderOpen className="w-5 h-5 text-blue-400" />
                          ) : (
                            <UploadCloud className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors" />
                          )}
                        </div>
                        <div className="text-center">
                          <p className={`text-xs font-semibold transition-colors ${isDragging ? 'text-blue-300' : 'text-slate-300 group-hover:text-white'}`}>
                            {isDragging ? 'Drop files to attach' : 'Drag & drop evidence files here'}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            or <span className="text-blue-400 group-hover:underline">click to browse</span> your computer
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
                    disabled={isEvaluating || isSettled || isLocked}
                    className={`w-full text-xs gap-2 h-9 font-semibold shadow-sm ${
                      isLocked
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
              </CardContent>
            </Card>
          </div>

          {/* Column 2: AI Verification Results */}
          <div className="lg:col-span-6 space-y-4">
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

                    {/* Human Review Banner if triggered */}
                    {assessment.requiresHumanReview && (
                      <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/40 space-y-1.5 text-xs">
                        <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                          <AlertCircle className="w-4 h-4 text-amber-400" />
                          <span>Human Review Recommended</span>
                        </div>
                        <p className="text-slate-300 text-[11px] leading-relaxed">
                          One or more acceptance criteria involve subjective design or ambiguous scope. Client discretion is required to approve or request revision.
                        </p>
                      </div>
                    )}

                    {/* Criteria Results */}
                    <div className="space-y-2.5">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Criterion-by-Criterion Results ({assessment.criteriaResults?.length || 0}):
                      </span>
                      {(assessment.criteriaResults || []).map((c) => {
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

                    {/* Action Buttons for Client */}
                    {activeRole === 'client' && !isSettled && (
                      <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                        {assessment.passed || selectedMilestone.status === 'verified' || selectedMilestone.paymentStatus === 'release_authorized' ? (
                          <Button
                            onClick={handleAuthorizeRelease}
                            disabled={isReleasing}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 h-9 font-semibold shadow-md"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            {isReleasing ? 'Executing PayPal Disbursement...' : `Authorize PayPal Payout (${formatCurrency(selectedMilestone.amount, contract.currency)})`}
                          </Button>
                        ) : (
                          <Button
                            onClick={() => setOverrideDialogOpen(true)}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 h-9 font-semibold"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Client Override & Approve (${selectedMilestone.amount})
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          onClick={() => setRevisionDialogOpen(true)}
                          className="border-[#2D3449] text-amber-400 hover:text-white hover:bg-amber-950/40 text-xs gap-1.5 h-9"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Request Revision
                        </Button>
                      </div>
                    )}

                    {/* Notice & Disbursal for Freelancer after verification */}
                    {activeRole === 'freelancer' && !isSettled && (
                      <div className="pt-2">
                        {assessment.passed || selectedMilestone.status === 'verified' || selectedMilestone.paymentStatus === 'release_authorized' ? (
                          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 space-y-3">
                            <div className="flex items-center gap-1.5 font-semibold text-emerald-400 text-sm">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              <span>AI Verification Passed — Ready for PayPal Disbursal</span>
                            </div>
                            <p className="text-slate-300 text-[11px] leading-relaxed">
                              All deliverable criteria have passed AI multimodal inspection (Score: {assessment.overallScore}/100). Funds ({formatCurrency(selectedMilestone.amount, contract.currency)}) are staged in PayPal Sandbox, approved and ready for transfer directly to your registered PayPal account (<code className="text-emerald-400 font-mono">freelancer-payout@sandbox.paypal.com</code>).
                            </p>
                            <p className="text-[10px] text-slate-400 italic bg-[#0B1326] p-2 rounded border border-[#222A3D]">
                              Notice: PayPal Developer Sandbox simulation active. In live production, PayPal Payouts capabilities are subject to recipient country regulations and regional PayPal account capabilities (e.g., Zimbabwe accounts are currently Send-Only in PayPal production).
                            </p>
                            <div className="pt-1 flex flex-col sm:flex-row gap-2">
                              <Button
                                onClick={handleAuthorizeRelease}
                                disabled={isReleasing}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 h-9 font-semibold shadow-md"
                              >
                                <DollarSign className="w-3.5 h-3.5" />
                                {isReleasing ? 'Executing PayPal Disbursement...' : `Disburse PayPal Payout (${formatCurrency(selectedMilestone.amount, contract.currency)})`}
                              </Button>
                              <Link
                                to={ROUTES.FREELANCER_PAYOUTS}
                                className="inline-flex items-center justify-center px-3.5 py-2 rounded-lg bg-[#171F33] hover:bg-[#222A3D] text-xs font-medium text-slate-300 border border-[#222A3D] transition-colors"
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
                              Some criteria require adjustments. Review the itemized criterion feedback above, make the necessary corrections, and re-run verification.
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
        </div>

        {/* Revision Request Dialog */}
        <Dialog open={revisionDialogOpen} onOpenChange={setRevisionDialogOpen}>
          <DialogContent className="bg-[#131B2E] border-[#222A3D] text-white">
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
                placeholder="Specify required code fixes, missing criteria, or layout fixes..."
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
          <DialogContent className="bg-[#131B2E] border-[#222A3D] text-white">
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
      </div>
    </DashboardLayout>
  )
}

export default DeliveryVerification
