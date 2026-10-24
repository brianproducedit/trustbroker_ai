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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  CheckCircle2, 
  CreditCard, 
  History, 
  Sparkles,
  AlertCircle,
  UploadCloud,
  DollarSign,
  RotateCcw
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
    stagePayment
  } = useContractStore()
  const { addNotification } = useNotificationStore()

  const contract = contracts.find((c) => c.id === id || c.code === id) || contracts[0]

  const [activeTab, setActiveTab] = useState<'contract' | 'payments' | 'activity'>('contract')
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false)
  const [revisionDialogOpen, setRevisionDialogOpen] = useState(false)
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null)
  const [revisionNotes, setRevisionNotes] = useState('')
  const [activityFilter, setActivityFilter] = useState<'all' | 'contract' | 'payment' | 'verification'>('all')

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

  const handleConfirmAcceptTerms = () => {
    acceptContract(contract.id, activeRole)
    setAcceptDialogOpen(false)
    const roleName = activeRole === 'buyer' ? 'Client' : 'Supplier'
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

  const handleRelease = (milestoneId: string, amount: number) => {
    releasePayment(contract.id, milestoneId)
    toast.success(`Payment released: ${formatCurrency(amount)} USD sent to supplier!`)
    addNotification({
      title: 'Milestone Payout Disbursed',
      description: `${formatCurrency(amount)} USD released for verified milestone.`,
      type: 'payment',
      link: `/dashboard/contracts/${contract.id}`,
    })
  }

  const handleOpenRevision = (milestoneId: string) => {
    setSelectedMilestoneId(milestoneId)
    setRevisionNotes('')
    setRevisionDialogOpen(true)
  }

  const handleConfirmRevision = () => {
    if (!selectedMilestoneId || !revisionNotes.trim()) return
    requestRevision(contract.id, selectedMilestoneId, revisionNotes.trim())
    setRevisionDialogOpen(false)
    toast.info('Revision requested from supplier')
    addNotification({
      title: 'Revision Requested',
      description: `Client requested adjustments for milestone: "${revisionNotes.slice(0, 60)}..."`,
      type: 'revision',
      link: `/dashboard/contracts/${contract.id}`,
    })
  }

  // Filter audit logs
  const filteredLogs = contract.auditLogs.filter((log) => {
    if (activityFilter === 'all') return true
    if (activityFilter === 'contract') return log.action.includes('CONTRACT') || log.action.includes('ACCEPTED')
    if (activityFilter === 'payment') return log.action.includes('PAYMENT') || log.action.includes('RESERVED')
    if (activityFilter === 'verification') return log.action.includes('VERIF') || log.action.includes('EVIDENCE')
    return true
  })

  const isUserAccepted = activeRole === 'buyer' ? contract.buyer.accepted : contract.supplier.accepted

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Header Card */}
        <Card className="border-[#222A3D] bg-[#131B2E] text-white">
          <CardContent className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#222A3D]">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-mono text-xs font-bold text-blue-400 bg-blue-950/80 px-2.5 py-0.5 rounded border border-blue-800/60">
                    {contract.code}
                  </span>
                  <StatusBadge status={contract.status} />
                  <span className="text-xs text-slate-400">
                    Version {contract.version}.0 &bull; Created {formatDate(contract.createdAt)}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                  {contract.title}
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                  {contract.description}
                </p>
              </div>

              {/* Financial Summary Box */}
              <div className="bg-[#0B1326] p-4 rounded-xl border border-[#222A3D] flex flex-col sm:items-end min-w-[200px] shrink-0">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                  Total Budget
                </span>
                <span className="text-2xl font-black font-mono text-emerald-400 mt-0.5">
                  {formatCurrency(contract.totalAmount, contract.currency)}
                </span>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                  <span>Staged: {formatCurrency(contract.stagedAmount)}</span>
                  <span>&bull;</span>
                  <span className="text-blue-400">Released: {formatCurrency(contract.releasedAmount)}</span>
                </div>
              </div>
            </div>

            {/* Parties Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Buyer Party */}
              <div className="p-3.5 rounded-xl bg-[#0E1528] border border-[#222A3D] flex items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-blue-400 font-mono font-semibold uppercase block">Client (Buyer)</span>
                  <div className="font-semibold text-white">{contract.buyer.name}</div>
                  <div className="text-slate-400 text-[11px]">{contract.buyer.email}</div>
                </div>
                <div className="text-right">
                  {contract.buyer.accepted ? (
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px] gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Accepted
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-amber-400 border-amber-400/40 text-[10px]">
                      Pending Acceptance
                    </Badge>
                  )}
                </div>
              </div>

              {/* Supplier Party */}
              <div className="p-3.5 rounded-xl bg-[#0E1528] border border-[#222A3D] flex items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-emerald-400 font-mono font-semibold uppercase block">Freelancer (Supplier)</span>
                  <div className="font-semibold text-white">{contract.supplier.name}</div>
                  <div className="text-slate-400 text-[11px]">{contract.supplier.email}</div>
                </div>
                <div className="text-right">
                  {contract.supplier.accepted ? (
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px] gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Accepted
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-amber-400 border-amber-400/40 text-[10px]">
                      Pending Acceptance
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Accept Contract Action Bar if Pending */}
            {!isUserAccepted && (
              <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-900/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="text-slate-200">
                    You have not yet accepted this agreement. Please review the milestones and confirm your acceptance.
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

        {/* Tabbed Content Navigation */}
        <Tabs defaultValue="contract" value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
          <TabsList className="bg-[#131B2E] border border-[#222A3D] p-1">
            <TabsTrigger value="contract" className="text-xs font-medium text-slate-400 data-[state=active]:text-white data-[state=active]:bg-[#1F2942]">
              Milestones &amp; Deliverables ({contract.milestones.length})
            </TabsTrigger>
            <TabsTrigger value="payments" className="text-xs font-medium text-slate-400 data-[state=active]:text-white data-[state=active]:bg-[#1F2942]">
              PayPal Staging &amp; Payments
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-xs font-medium text-slate-400 data-[state=active]:text-white data-[state=active]:bg-[#1F2942]">
              Audit Activity Stream ({contract.auditLogs.length})
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: MILESTONES & DELIVERABLES */}
          <TabsContent value="contract" className="space-y-4">
            <div className="space-y-3">
              {contract.milestones.map((m, idx) => (
                <Card key={m.id} className="border-[#222A3D] bg-[#131B2E] text-white overflow-hidden">
                  <CardHeader className="pb-3 border-b border-[#222A3D]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-blue-600/20 text-blue-400 text-xs font-bold flex items-center justify-center border border-blue-500/30">
                          {idx + 1}
                        </span>
                        <div>
                          <CardTitle className="text-sm font-bold text-white">{m.title}</CardTitle>
                          <CardDescription className="text-xs text-slate-400 mt-0.5">
                            Due {formatDate(m.deadline)} &bull; {formatCurrency(m.amount, contract.currency)}
                          </CardDescription>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <StatusBadge status={m.status} />
                        <span className="text-xs font-mono font-bold text-white bg-[#0B1326] px-2.5 py-1 rounded border border-[#2D3449]">
                          {formatCurrency(m.amount, contract.currency)}
                        </span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 space-y-3">
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {m.description}
                    </p>

                    {/* Acceptance criteria checklist */}
                    <div className="space-y-2 pt-1">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Acceptance Criteria:
                      </span>
                      <div className="grid grid-cols-1 gap-2">
                        {m.acceptanceCriteria.map((c) => (
                          <div
                            key={c.id}
                            className="p-2 rounded-lg bg-[#0E1528] border border-[#222A3D] flex items-center justify-between text-xs gap-3"
                          >
                            <div className="flex items-center gap-2">
                              <CheckCircle2
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  c.status === 'pass'
                                    ? 'text-emerald-400'
                                    : c.status === 'fail'
                                    ? 'text-rose-400'
                                    : 'text-slate-500'
                                }`}
                              />
                              <span className="text-slate-200">{c.title}</span>
                            </div>
                            <span className="text-[10px] font-mono uppercase text-slate-400">
                              {c.status || 'pending'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI Assessment Result if present */}
                    {m.assessment && (
                      <div className="p-3 rounded-lg bg-blue-950/30 border border-blue-800/50 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-blue-300 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                            AI Verification Assessment (Score: {m.assessment.overallScore}/100)
                          </span>
                          <Badge className="bg-emerald-500/20 text-emerald-300 text-[10px]">Passed</Badge>
                        </div>
                        <p className="text-slate-300 text-[11px] leading-relaxed">
                          {m.assessment.summaryAnalysis}
                        </p>
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="bg-[#0E1528] border-t border-[#222A3D] p-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-[11px] text-slate-400">
                      Payment Status: <span className="text-white font-mono">{m.paymentStatus || 'Not Funded'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Supplier can submit work if in_progress or pending */}
                      {activeRole === 'supplier' && (m.status === 'in_progress' || m.status === 'pending' || m.status === 'revision_requested') && (
                        <Button
                          size="sm"
                          asChild
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 h-8"
                        >
                          <Link to={ROUTES.DELIVERY_VERIFICATION(contract.id)}>
                            <UploadCloud className="w-3.5 h-3.5" />
                            Submit Work
                          </Link>
                        </Button>
                      )}

                      {/* Buyer can review evidence & authorize release */}
                      {activeRole === 'buyer' && m.status === 'verified' && m.paymentStatus !== 'released' && (
                        <Button
                          size="sm"
                          onClick={() => handleRelease(m.id, m.amount)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 h-8"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          Approve Release (${m.amount})
                        </Button>
                      )}

                      {/* Buyer can request revision */}
                      {activeRole === 'buyer' && (m.status === 'submitted' || m.status === 'verified') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenRevision(m.id)}
                          className="border-[#2D3449] text-amber-400 hover:text-white hover:bg-amber-950/30 text-xs gap-1.5 h-8"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Request Revision
                        </Button>
                      )}

                      {/* View Delivery page link */}
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
              ))}
            </div>
          </TabsContent>

          {/* TAB 2: PAYPAL STAGING & PAYMENTS */}
          <TabsContent value="payments" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: PayPal Sandbox Card */}
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
                      Client stages funds using PayPal Sandbox. Payments remain held until milestones are verified.
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

              {/* Right Column: Payment Lifecycle Summary */}
              <div className="lg:col-span-5 space-y-4">
                <Card className="border-[#222A3D] bg-[#131B2E] text-white">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold text-white">
                      Payment Protection Lifecycle
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-400">
                      Standard escrow progression for this contract.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs">
                    {[
                      { step: '1', title: 'Order Created', desc: 'SOW milestones locked and staged.', done: true },
                      { step: '2', title: 'Payment Staged', desc: 'Reserved via PayPal Sandbox.', done: contract.stagedAmount > 0 },
                      { step: '3', title: 'Work Verified', desc: 'AI confirms acceptance criteria.', done: contract.milestones.some(m => m.status === 'verified' || m.status === 'settled') },
                      { step: '4', title: 'Disbursement Executed', desc: 'Released to supplier PayPal account.', done: contract.releasedAmount > 0 },
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
              </div>
            </div>
          </TabsContent>

          {/* TAB 3: AUDIT ACTIVITY STREAM */}
          <TabsContent value="activity" className="space-y-4">
            <Card className="border-[#222A3D] bg-[#131B2E] text-white">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#222A3D]">
                <div>
                  <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                    <History className="w-4 h-4 text-blue-400" />
                    Audit Activity Trail
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Chronological events recorded for this agreement.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-1.5">
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
                  {filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-lg bg-[#0E1528] border border-[#222A3D] space-y-1 text-xs"
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
                      <div className="text-[10px] text-slate-500 font-medium pt-0.5">
                        Actor: {log.actor}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* DIALOG 1: ACCEPT TERMS CONFIRMATION */}
        <Dialog open={acceptDialogOpen} onOpenChange={setAcceptDialogOpen}>
          <DialogContent className="bg-[#131B2E] border-[#222A3D] text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Accept Contract Terms</DialogTitle>
              <DialogDescription className="text-slate-400 text-xs">
                By accepting, you agree to the milestone scopes, deadlines, and payment terms for contract {contract.code}.
              </DialogDescription>
            </DialogHeader>

            <div className="py-2 space-y-2 text-xs text-slate-300">
              <div className="p-3 rounded-lg bg-[#0B1326] border border-[#222A3D] space-y-1">
                <span className="text-white font-semibold block">{contract.title}</span>
                <span className="text-slate-400">Total Budget: {formatCurrency(contract.totalAmount)} USD</span>
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
                Confirm Acceptance
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DIALOG 2: REQUEST REVISION */}
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
      </div>
    </DashboardLayout>
  )
}

export default ContractDetail
