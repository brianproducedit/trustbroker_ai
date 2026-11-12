import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, FileText } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useContractStore } from '@/hooks/useContractStore'
import { ROUTES } from '@/constants'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ContractOverviewDialog } from '@/components/dialogs/ContractOverviewDialog'

type ContractFilter = 'completed' | 'cancelled'

const statusLabel: Record<string, string> = {
  draft: 'Draft',
  open: 'Open',
  awarded: 'Awarded',
  pending_acceptance: 'Pending acceptance',
  active: 'Active',
  in_verification: 'In review',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const statusClass: Record<string, string> = {
  active: 'bg-emerald-950 text-emerald-400 border-emerald-800',
  in_verification: 'bg-amber-950 text-amber-400 border-amber-800',
  completed: 'bg-emerald-950 text-emerald-300 border-emerald-700',
  cancelled: 'bg-red-950 text-red-400 border-red-800',
}

export const FreelancerContracts: React.FC = () => {
  const { contracts, fetchContracts } = useContractStore()
  const [filter, setFilter] = useState<ContractFilter>('completed')
  const [loading, setLoading] = useState(true)
  const [selectedContract, setSelectedContract] = useState<any | null>(null)

  useEffect(() => {
    const loadContracts = async () => {
      setLoading(true)
      try {
        await fetchContracts()
      } finally {
        setLoading(false)
      }
    }
    loadContracts()
  }, [fetchContracts])

  const filteredContracts = useMemo(() => {
    return contracts.filter((contract) => contract.status === filter)
  }, [contracts, filter])

  const completedContracts = contracts.filter((contract) => contract.status === 'completed')

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-16">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded border border-emerald-900/50 font-semibold">
            Freelancer Workspace
          </span>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-2">My Contracts</h1>
          <p className="text-slate-400 text-xs mt-1">
            Keep a permanent record of contracts completed or cancelled. Current deliverables and acceptance actions belong in Active Work.
          </p>
        </div>

        <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/20 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-emerald-200">Looking for current deliverables?</p>
            <p className="text-xs text-slate-400 mt-1">
              Submit evidence, monitor verification, and respond to contract actions from Active Work.
            </p>
          </div>
          <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs shrink-0">
            <Link to={ROUTES.FREELANCER_WORK}>Open Active Work</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-[#1C3831] bg-[#0C1916] p-4">
            <p className="text-xs text-slate-400">Completed contracts</p>
            <p className="text-2xl font-bold text-emerald-300 mt-2">{completedContracts.length}</p>
          </div>
          <div className="rounded-xl border border-[#1C3831] bg-[#0C1916] p-4">
            <p className="text-xs text-slate-400">Cancelled contracts</p>
            <p className="text-2xl font-bold text-slate-300 mt-2">
              {contracts.filter((contract) => contract.status === 'cancelled').length}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-[#1C3831] pb-3 text-xs">
          {[
            { id: 'completed', label: 'Completed' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as ContractFilter)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                filter === tab.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-[#122622]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading contracts...</div>
        ) : filteredContracts.length === 0 ? (
          <div className="rounded-xl border border-[#1C3831] bg-[#0C1916] p-12 text-center space-y-3">
            {filter === 'completed' ? (
              <CheckCircle2 className="w-12 h-12 text-slate-600 mx-auto" />
            ) : (
              <FileText className="w-12 h-12 text-slate-600 mx-auto" />
            )}
            <h2 className="text-base font-semibold text-white">
              {filter === 'completed' ? 'No completed contracts yet' : 'No cancelled contracts'}
            </h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              A contract is marked completed automatically when all of its milestones are verified and the related PayPal payouts are settled. Active contracts remain in Active Work.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-[#1C3831] bg-[#0C1916] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#1C3831] bg-[#122622] text-slate-400 font-mono uppercase text-[11px]">
                    <th className="py-3.5 px-4">Reference</th>
                    <th className="py-3.5 px-4">Contract</th>
                    <th className="py-3.5 px-4">Client</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Amount</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#172E28]">
                  {filteredContracts.map((contract) => (
                    <tr
                      key={contract.id}
                      onClick={() => setSelectedContract(contract)}
                      className="hover:bg-[#122622] cursor-pointer transition-colors"
                    >
                      <td className="py-4 px-4 font-mono font-semibold text-emerald-400">{contract.code}</td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-white">{contract.title}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {contract.milestones?.length || 0} milestone{contract.milestones?.length === 1 ? '' : 's'}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-300">{contract.client?.name || 'Client'}</td>
                      <td className="py-4 px-4">
                        <Badge className={`text-[10px] font-mono uppercase ${statusClass[contract.status] || 'bg-slate-800 text-slate-300'}`}>
                          {statusLabel[contract.status] || contract.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-right font-mono font-bold text-white">
                        {formatCurrency(contract.totalAmount || 0, contract.currency)}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="text-emerald-400 hover:underline">View details</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <ContractOverviewDialog
        contract={selectedContract}
        open={Boolean(selectedContract)}
        onOpenChange={(open) => {
          if (!open) setSelectedContract(null)
        }}
      />
    </DashboardLayout>
  )
}

export default FreelancerContracts
