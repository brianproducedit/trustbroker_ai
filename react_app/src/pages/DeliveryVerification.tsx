import React, { useState } from 'react'
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
  FileCheck
} from 'lucide-react'
import { toast } from 'sonner'

export const DeliveryVerification: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { 
    contracts, 
    activeRole, 
    submitEvidence, 
    releasePayment, 
    requestRevision 
  } = useContractStore()
  const { addNotification } = useNotificationStore()

  const contract = contracts.find((c) => c.id === id || c.code === id) || contracts[0]
  
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>(
    contract?.milestones.find((m) => m.status === 'verifying' || m.status === 'submitted')?.id ||
    contract?.milestones[0]?.id ||
    'ms-1'
  )

  const selectedMilestone = contract?.milestones.find((m) => m.id === selectedMilestoneId) || contract?.milestones[0]

  // Form State
  const [repoUrl, setRepoUrl] = useState('https://github.com/devstudio/react-landing-verified')
  const [liveUrl, setLiveUrl] = useState('https://react-landing-demo.vercel.app')
  const [notes, setNotes] = useState(
    'Production deliverables completed. Strict TypeScript build compiles cleanly without warnings. Components match responsiveness criteria.'
  )
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [revisionDialogOpen, setRevisionDialogOpen] = useState(false)
  const [revisionNotes, setRevisionNotes] = useState('')

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

  const handleSubmitEvidence = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsEvaluating(true)

    try {
      const assessment = await submitEvidence(contract.id, selectedMilestone.id, {
        contractId: contract.id,
        milestoneId: selectedMilestone.id,
        submittedBy: activeRole === 'supplier' ? contract.supplier.name : 'Tariro Moyo',
        description: notes,
        repoUrl,
        liveUrl,
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

  const handleAuthorizeRelease = () => {
    releasePayment(contract.id, selectedMilestone.id)
    toast.success(`Payment released: ${formatCurrency(selectedMilestone.amount)} USD sent to supplier!`)
    addNotification({
      title: 'Payment Released',
      description: `${formatCurrency(selectedMilestone.amount)} USD transferred for verified milestone.`,
      type: 'payment',
      link: `/dashboard/contracts/${contract.id}`,
    })
  }

  const handleConfirmRevision = () => {
    if (!revisionNotes.trim()) return
    requestRevision(contract.id, selectedMilestone.id, revisionNotes.trim())
    setRevisionDialogOpen(false)
    toast.info('Revision request sent to supplier')
    addNotification({
      title: 'Revision Requested',
      description: `Client requested adjustments for milestone: "${revisionNotes.slice(0, 50)}..."`,
      type: 'revision',
      link: `/dashboard/deliveries/${contract.id}`,
    })
  }

  const assessment = selectedMilestone?.assessment
  const isSettled = selectedMilestone.status === 'settled'

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
              {activeRole === 'buyer' 
                ? 'Review Deliverables & Verify Work' 
                : 'Submit Work for Verification'}
            </h1>
            <p className="text-xs text-slate-400">
              {activeRole === 'buyer'
                ? 'Review submitted repositories, live preview links, and automated criterion evaluations.'
                : 'Submit your project links and notes to run automated verification and unlock milestone payment.'}
            </p>
          </div>

          {/* Milestone Selection Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#131B2E] p-1.5 rounded-xl border border-[#222A3D] self-start">
            {contract.milestones.map((m, idx) => (
              <button
                key={m.id}
                onClick={() => setSelectedMilestoneId(m.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  selectedMilestoneId === m.id
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-[#171F33]'
                }`}
              >
                M{idx + 1}: ${m.amount}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Milestone Context Card */}
        <Card className="border-[#222A3D] bg-[#131B2E] text-white">
          <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">{selectedMilestone.title}</span>
                <StatusBadge status={selectedMilestone.status} />
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
                  Deliverable Artifacts
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Provide evidence links corresponding to the agreed milestone criteria.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 space-y-4">
                <form onSubmit={handleSubmitEvidence} className="space-y-4">
                  {/* GitHub Repo URL */}
                  <div className="space-y-1.5">
                    <Label htmlFor="repo" className="text-xs text-slate-300 flex items-center gap-1.5">
                      <GitBranch className="w-3.5 h-3.5" />
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
                      <Globe className="w-3.5 h-3.5" />
                      Live Staging URL <span className="text-slate-500 font-normal">(Optional)</span>
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
                    <Label htmlFor="notes" className="text-xs text-slate-300">
                      Delivery Notes &amp; Highlights
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

                  {/* Attachment Dropzone (Cosmetic MVP) */}
                  <div className="border border-dashed border-[#2D3449] rounded-xl p-4 text-center bg-[#0B1326]/60 space-y-1.5">
                    <FileCheck className="w-5 h-5 text-slate-400 mx-auto" />
                    <div className="text-xs text-slate-300">Optional: Drop test output logs or screenshots</div>
                    <div className="text-[10px] text-slate-500">Supports PDF, PNG, JSON up to 25MB</div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isEvaluating || isSettled}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs gap-2 h-9"
                  >
                    {isEvaluating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        AI is evaluating deliverables...
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
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px]">
                      Score: {assessment.overallScore}/100
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs text-slate-400">
                  Automated inspection against agreed acceptance criteria.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 space-y-4">
                {assessment ? (
                  <div className="space-y-4">
                    {/* Score Bar */}
                    <div className="p-3.5 rounded-xl bg-[#0B1326] border border-[#2D3449] space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Overall Verification Score</span>
                        <span className="font-mono font-bold text-emerald-400">{assessment.overallScore}%</span>
                      </div>
                      <Progress value={assessment.overallScore} className="h-2" />
                    </div>

                    {/* Criteria Results */}
                    <div className="space-y-2.5">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Criterion-by-Criterion Results:
                      </span>
                      {assessment.criteriaResults.map((c) => (
                        <div
                          key={c.id}
                          className="p-3 rounded-xl bg-[#0B1326] border border-[#2D3449] space-y-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-white">{c.title}</span>
                            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px]">
                              {c.status.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-relaxed">
                            {c.description}
                          </p>
                          <div className="text-[10px] text-blue-300 font-mono bg-blue-950/40 p-1.5 rounded">
                            {c.feedback}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Summary Analysis */}
                    <div className="p-3 rounded-lg bg-[#0E1528] border border-[#222A3D] space-y-1 text-xs">
                      <span className="text-[11px] text-slate-400 font-semibold block">Summary Analysis:</span>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        {assessment.summaryAnalysis}
                      </p>
                    </div>

                    {/* Action Buttons for Buyer */}
                    {activeRole === 'buyer' && !isSettled && (
                      <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                        <Button
                          onClick={handleAuthorizeRelease}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 h-9"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          Approve Release (${selectedMilestone.amount})
                        </Button>

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

                    {isSettled && (
                      <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-center text-xs text-emerald-300 flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Milestone payment of ${selectedMilestone.amount} has been disbursed.</span>
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
                Provide actionable notes for Tariro to address before re-submitting for verification.
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
      </div>
    </DashboardLayout>
  )
}

export default DeliveryVerification
