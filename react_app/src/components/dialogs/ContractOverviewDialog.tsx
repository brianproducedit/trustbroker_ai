import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ROUTES } from '@/constants'
import { formatCurrency } from '@/lib/utils'
import { ExternalLink, FileText, Calendar, DollarSign, Users } from 'lucide-react'

interface ContractOverviewDialogProps {
  contract: any | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const statusColors: Record<string, string> = {
  draft: 'border-slate-600 bg-slate-700/50 text-slate-300',
  open: 'border-indigo-500/40 bg-indigo-900/40 text-indigo-300',
  awarded: 'border-amber-500/40 bg-amber-900/40 text-amber-300',
  active: 'border-blue-500/40 bg-blue-900/40 text-blue-300',
  in_verification: 'border-purple-500/40 bg-purple-900/40 text-purple-300',
  completed: 'border-emerald-500/40 bg-emerald-900/40 text-emerald-300',
  cancelled: 'border-red-500/40 bg-red-900/40 text-red-300',
}

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  open: 'Open',
  awarded: 'Awarded',
  active: 'Active',
  in_verification: 'In Review',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const milestoneStatusColors: Record<string, string> = {
  pending: 'bg-slate-700 text-slate-300',
  in_progress: 'bg-blue-900/60 text-blue-300',
  submitted: 'bg-amber-900/60 text-amber-300',
  in_verification: 'bg-purple-900/60 text-purple-300',
  verified: 'bg-emerald-900/60 text-emerald-300',
  settled: 'bg-emerald-800/60 text-emerald-200',
  disputed: 'bg-red-900/60 text-red-300',
}

export const ContractOverviewDialog: React.FC<ContractOverviewDialogProps> = ({
  contract,
  open,
  onOpenChange,
}) => {
  const navigate = useNavigate()

  if (!contract) return null

  const statusCls = statusColors[contract.status] || 'border-slate-600 bg-slate-700/50 text-slate-300'
  const statusLabel = statusLabels[contract.status] || contract.status

  const handleOpenFull = () => {
    onOpenChange(false)
    navigate(ROUTES.CONTRACT_DETAIL(contract.id))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#131B2E] border-[#222A3D] text-white p-0 gap-0 overflow-hidden">
        {/* Dialog Header */}
        <DialogHeader className="p-5 pb-4 border-b border-[#222A3D] bg-[#0E1528]/60">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-mono text-sm font-bold text-blue-400">
                  {contract.code || '—'}
                </span>
                <Badge
                  variant="outline"
                  className={`text-[10px] font-mono px-2 py-0.5 ${statusCls}`}
                >
                  {statusLabel}
                </Badge>
              </div>
              <DialogTitle className="text-base font-semibold text-white leading-snug line-clamp-2">
                {contract.title}
              </DialogTitle>
              {contract.category && (
                <DialogDescription className="text-xs text-slate-400 mt-1 capitalize">
                  {contract.category}
                </DialogDescription>
              )}
            </div>
            <FileText className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[60vh]">
          {/* 3 Info Cards: Budget | Staged | Released */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-[#222A3D] bg-[#0B1120] p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                <DollarSign className="w-3 h-3" />
                Budget
              </div>
              <div className="font-mono text-base font-bold text-white">
                {formatCurrency(Number(contract.budget) || 0, contract.currency)}
              </div>
              <div className="text-[10px] text-slate-500">Total contract value</div>
            </div>

            <div className="rounded-lg border border-[#222A3D] bg-[#0B1120] p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-amber-400/80 uppercase tracking-wider">
                <DollarSign className="w-3 h-3" />
                Staged
              </div>
              <div className="font-mono text-base font-bold text-amber-400">
                {formatCurrency(Number(contract.stagedAmount) || 0, contract.currency)}
              </div>
              <div className="text-[10px] text-slate-500">In escrow</div>
            </div>

            <div className="rounded-lg border border-[#222A3D] bg-[#0B1120] p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-400/80 uppercase tracking-wider">
                <DollarSign className="w-3 h-3" />
                Released
              </div>
              <div className="font-mono text-base font-bold text-emerald-400">
                {formatCurrency(Number(contract.releasedAmount) || 0, contract.currency)}
              </div>
              <div className="text-[10px] text-slate-500">Disbursed</div>
            </div>
          </div>

          {/* Dates */}
          {contract.createdAt && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Calendar className="w-3.5 h-3.5" />
              <span>Created {new Date(contract.createdAt).toLocaleDateString()}</span>
            </div>
          )}

          <Separator className="bg-[#222A3D]" />

          {/* Milestones */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Milestones ({(contract.milestones || []).length})
            </h3>
            {(contract.milestones || []).length === 0 ? (
              <p className="text-xs text-slate-500 italic">No milestones defined yet.</p>
            ) : (
              <ul className="space-y-2">
                {(contract.milestones || []).map((m: any) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-[#222A3D] bg-[#0E1528] px-3 py-2"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-slate-200 truncate block">
                        {m.title}
                      </span>
                      {m.deadline && (
                        <span className="text-[10px] text-slate-500">
                          Due {new Date(m.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {m.amount != null && (
                        <span className="font-mono text-xs text-slate-300">
                          {formatCurrency(Number(m.amount) || 0, contract.currency)}
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          milestoneStatusColors[m.status] || 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {m.status?.replace('_', ' ') || 'pending'}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Separator className="bg-[#222A3D]" />

          {/* Parties */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Parties
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-[#222A3D] bg-[#0B1120] p-3 space-y-1">
                <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                  Client
                </div>
                {contract.client ? (
                  <>
                    <div className="text-xs font-semibold text-slate-200">
                      {contract.client.name || '—'}
                    </div>
                    {contract.client.email && (
                      <div className="text-[10px] text-slate-400 truncate">
                        {contract.client.email}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-xs text-slate-500 italic">Not assigned</div>
                )}
              </div>

              <div className="rounded-lg border border-[#222A3D] bg-[#0B1120] p-3 space-y-1">
                <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                  Freelancer
                </div>
                {contract.freelancer ? (
                  <>
                    <div className="text-xs font-semibold text-slate-200">
                      {contract.freelancer.name || '—'}
                    </div>
                    {contract.freelancer.email && (
                      <div className="text-[10px] text-slate-400 truncate">
                        {contract.freelancer.email}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-xs text-slate-500 italic">
                    {contract.status === 'open' ? 'Accepting applications' : 'Not assigned'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-[#222A3D] bg-[#0E1528]/60">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs text-slate-400 hover:text-slate-200 hover:bg-[#222A3D] h-8 cursor-pointer"
          >
            Close
          </Button>
          <Button
            size="sm"
            onClick={handleOpenFull}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 h-8 font-medium shadow-sm cursor-pointer"
          >
            <span>Open Full Details</span>
            <ExternalLink className="w-3 h-3" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ContractOverviewDialog
