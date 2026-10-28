import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { useContractStore } from '@/hooks/useContractStore'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import {
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
  CreditCard,
  ShieldCheck,
  Loader2,
} from 'lucide-react'

interface MilestoneDetailDialogProps {
  milestone: any | null
  contract: any | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onMilestoneUpdated?: () => void
}

function getMilestoneStatusColor(status: string) {
  switch (status) {
    case 'verified':
    case 'settled':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    case 'in_progress':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    case 'submitted':
    case 'verifying':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    case 'revision_requested':
      return 'bg-red-500/20 text-red-400 border-red-500/30'
    default:
      return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
  }
}

function getCriterionStatusColor(status: string) {
  switch (status) {
    case 'satisfied':
    case 'pass':
      return 'bg-emerald-500/20 text-emerald-400'
    case 'failed':
    case 'fail':
      return 'bg-red-500/20 text-red-400'
    default:
      return 'bg-slate-500/20 text-slate-400'
  }
}

function getCriterionStatusLabel(status: string) {
  switch (status) {
    case 'satisfied':
    case 'pass':
      return 'Satisfied'
    case 'failed':
    case 'fail':
      return 'Failed'
    default:
      return 'Pending'
  }
}

function getPaymentStatusLabel(status: string | undefined) {
  switch (status) {
    case 'staged_in_sandbox':
      return 'Staged in Escrow'
    case 'released':
    case 'release_authorized':
      return 'Payment Released'
    case 'checkout_created':
      return 'Order Created'
    default:
      return 'Not Funded'
  }
}

export const MilestoneDetailDialog: React.FC<MilestoneDetailDialogProps> = ({
  milestone,
  contract,
  open,
  onOpenChange,
  onMilestoneUpdated,
}) => {
  const { updateMilestone, removeMilestone } = useContractStore()

  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    amount: '',
    deadline: '',
  })
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [isCollapsibleOpen, setIsCollapsibleOpen] = useState(true)
  const [isFunding, setIsFunding] = useState(false)
  const [isReleasing, setIsReleasing] = useState(false)
  const [fundingError, setFundingError] = useState<string | null>(null)

  useEffect(() => {
    if (milestone) {
      setEditData({
        title: milestone.title || '',
        description: milestone.description || '',
        amount: String(milestone.amount || ''),
        deadline: milestone.deadline ? milestone.deadline.slice(0, 10) : '',
      })
      setIsEditing(false)
      setFundingError(null)
    }
  }, [milestone])

  if (!milestone || !contract) return null

  const canEdit =
    contract?.status === 'draft' || contract?.status === 'open'

  const criteria: any[] = milestone.acceptanceCriteria || []

  const handleSave = () => {
    updateMilestone(contract.id, milestone.id, {
      title: editData.title,
      description: editData.description,
      amount: Number(editData.amount),
      deadline: editData.deadline,
    })
    setIsEditing(false)
    onMilestoneUpdated?.()
  }

  const handleDelete = () => {
    removeMilestone(contract.id, milestone.id)
    setDeleteConfirmOpen(false)
    onOpenChange(false)
    onMilestoneUpdated?.()
  }

  const handleFundMilestone = async () => {
    setIsFunding(true)
    setFundingError(null)
    try {
      await api.payments.createOrder({
        contract_id: contract.id,
        milestone_id: milestone.id,
      })
      onMilestoneUpdated?.()
      onOpenChange(false)
    } catch (err: any) {
      setFundingError(err?.message || 'Failed to initiate funding. Please try again.')
    } finally {
      setIsFunding(false)
    }
  }

  const handleReleasePayment = async () => {
    setIsReleasing(true)
    try {
      await api.payments.releasePayout({
        contract_id: contract.id,
        milestone_id: milestone.id,
      })
      onMilestoneUpdated?.()
      onOpenChange(false)
    } catch (err: any) {
      setFundingError(err?.message || 'Failed to release payment.')
    } finally {
      setIsReleasing(false)
    }
  }

  const paymentStatus = milestone.paymentStatus
  const isReleased = paymentStatus === 'released' || paymentStatus === 'release_authorized'
  const isStaged = paymentStatus === 'staged_in_sandbox'

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-w-2xl bg-[#131B2E] border-[#222A3D] text-white overflow-y-auto max-h-[90vh]"
          style={{ backgroundColor: '#131B2E', borderColor: '#222A3D', color: 'white' }}
        >
          <DialogHeader className="pb-2">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-slate-500 font-mono uppercase tracking-wider">
                    Milestone #{(contract.milestones?.findIndex((m: any) => m.id === milestone.id) ?? 0) + 1}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-xs px-2 py-0.5 border ${getMilestoneStatusColor(milestone.status)}`}
                  >
                    {milestone.status?.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) || 'Pending'}
                  </Badge>
                </div>
                <DialogTitle className="text-xl font-bold text-white leading-snug">
                  {milestone.title}
                </DialogTitle>
              </div>
              <div className="text-right shrink-0">
                <div className="text-2xl font-bold text-emerald-400">
                  {formatCurrency(milestone.amount, milestone.currency || 'USD')}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {getPaymentStatusLabel(paymentStatus)}
                </div>
              </div>
            </div>
          </DialogHeader>

          <Separator className="bg-[#222A3D] my-2" />

          {/* Acceptance Criteria (Collapsible) */}
          <Collapsible open={isCollapsibleOpen} onOpenChange={setIsCollapsibleOpen}>
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors group">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  <span>Acceptance Criteria</span>
                  <Badge variant="outline" className="text-xs px-1.5 border-slate-600 text-slate-400">
                    {criteria.length}
                  </Badge>
                </div>
                {isCollapsibleOpen ? (
                  <ChevronUp className="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="pb-3 space-y-2">
                {criteria.length === 0 ? (
                  <p className="text-sm text-slate-500 italic pl-2">
                    No acceptance criteria defined for this milestone.
                  </p>
                ) : (
                  criteria.map((criterion: any, idx: number) => (
                    <div
                      key={criterion.id || idx}
                      className="flex items-start gap-3 rounded-lg p-2.5 bg-[#0E1528] border border-[#222A3D]"
                    >
                      <div className="mt-0.5 shrink-0">
                        {criterion.status === 'satisfied' || criterion.status === 'pass' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : criterion.status === 'failed' || criterion.status === 'fail' ? (
                          <XCircle className="w-4 h-4 text-red-400" />
                        ) : (
                          <Clock className="w-4 h-4 text-slate-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200 leading-snug">
                          {criterion.title}
                        </p>
                        {criterion.description && (
                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                            {criterion.description}
                          </p>
                        )}
                      </div>
                      <Badge
                        className={`text-xs px-2 shrink-0 ${getCriterionStatusColor(criterion.status)}`}
                      >
                        {getCriterionStatusLabel(criterion.status)}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator className="bg-[#222A3D] my-2" />

          {/* Details section */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Details</h4>
            <div className="rounded-lg bg-[#0E1528] border border-[#222A3D] p-3 space-y-2.5">
              <div>
                <p className="text-xs text-slate-500 mb-1">Description</p>
                <p className="text-sm text-slate-200 leading-relaxed">
                  {milestone.description || <span className="text-slate-500 italic">No description provided.</span>}
                </p>
              </div>
              <Separator className="bg-[#222A3D]" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Deadline</p>
                  <p className="text-sm text-slate-200">
                    {milestone.deadline
                      ? new Date(milestone.deadline).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                      : <span className="text-slate-500 italic">Not set</span>}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Payment Status</p>
                  <Badge
                    variant="outline"
                    className={`text-xs border ${isReleased
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : isStaged
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                      }`}
                  >
                    {getPaymentStatusLabel(paymentStatus)}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <Separator className="bg-[#222A3D] my-2" />

          {/* PayPal / Payment section */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5" />
              Payment
            </h4>

            {fundingError && (
              <div className="rounded-lg p-2.5 bg-red-500/10 border border-red-500/30 text-sm text-red-400">
                {fundingError}
              </div>
            )}

            {isReleased ? (
              <div className="rounded-lg p-3 bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-emerald-400">Payment Released ✓</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {formatCurrency(milestone.amount, milestone.currency || 'USD')} has been disbursed to the freelancer.
                  </p>
                </div>
              </div>
            ) : isStaged ? (
              <div className="space-y-2">
                <div className="rounded-lg p-3 bg-amber-500/10 border border-amber-500/30 flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-amber-400">Staged in Escrow</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatCurrency(milestone.amount, milestone.currency || 'USD')} is held securely in PayPal sandbox escrow.
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-amber-500/50 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
                  onClick={handleReleasePayment}
                  disabled={isReleasing}
                >
                  {isReleasing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Releasing...
                    </>
                  ) : (
                    'Release Payment to Freelancer'
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate-400">
                  Fund this milestone to place {formatCurrency(milestone.amount, milestone.currency || 'USD')} into PayPal sandbox escrow.
                </p>
                <Button
                  size="sm"
                  className="w-full bg-[#0070BA] hover:bg-[#003087] text-white font-semibold"
                  onClick={handleFundMilestone}
                  disabled={isFunding}
                >
                  {isFunding ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Initiating PayPal...
                    </>
                  ) : (
                    <>
                      <DollarSign className="w-4 h-4 mr-1.5" />
                      Fund Milestone via PayPal
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Edit section */}
          {canEdit && (
            <>
              <Separator className="bg-[#222A3D] my-2" />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Edit2 className="w-3.5 h-3.5" />
                    Manage
                  </h4>
                  <div className="flex items-center gap-2">
                    {!isEditing && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 h-7 px-2.5"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                        Edit
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 px-2.5"
                      onClick={() => setDeleteConfirmOpen(true)}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                      Delete
                    </Button>
                  </div>
                </div>

                {isEditing && (
                  <div className="rounded-lg bg-[#0E1528] border border-[#222A3D] p-3 space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-400">Title</label>
                      <Input
                        value={editData.title}
                        onChange={(e) => setEditData((d) => ({ ...d, title: e.target.value }))}
                        className="bg-[#0B1120] border-[#222A3D] text-white h-8 text-sm focus:border-blue-500"
                        placeholder="Milestone title"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-400">Description</label>
                      <Textarea
                        value={editData.description}
                        onChange={(e) => setEditData((d) => ({ ...d, description: e.target.value }))}
                        className="bg-[#0B1120] border-[#222A3D] text-white text-sm min-h-[72px] focus:border-blue-500 resize-none"
                        placeholder="Describe the milestone deliverables..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-400">Amount (USD)</label>
                        <Input
                          type="number"
                          value={editData.amount}
                          onChange={(e) => setEditData((d) => ({ ...d, amount: e.target.value }))}
                          className="bg-[#0B1120] border-[#222A3D] text-white h-8 text-sm focus:border-blue-500"
                          placeholder="0"
                          min="0"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-slate-400">Deadline</label>
                        <Input
                          type="date"
                          value={editData.deadline}
                          onChange={(e) => setEditData((d) => ({ ...d, deadline: e.target.value }))}
                          className="bg-[#0B1120] border-[#222A3D] text-white h-8 text-sm focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white h-8"
                        onClick={handleSave}
                        disabled={!editData.title}
                      >
                        Save Changes
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-400 hover:text-white h-8"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          <DialogFooter className="pt-2">
            <Button
              variant="ghost"
              className="text-slate-400 hover:text-white hover:bg-white/5"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm AlertDialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent
          className="bg-[#131B2E] border-[#222A3D] text-white"
          style={{ backgroundColor: '#131B2E', borderColor: '#222A3D' }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Milestone?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This will permanently remove <strong className="text-white">"{milestone.title}"</strong> from the contract.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-[#222A3D] text-slate-300 hover:bg-white/5 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDelete}
            >
              Delete Milestone
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default MilestoneDetailDialog

