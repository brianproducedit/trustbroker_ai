import React, { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useContractStore } from '@/hooks/useContractStore'
import { formatCurrency, formatDate } from '@/lib/utils'
import { api } from '@/lib/api'
import {
  Wallet,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  Copy,
  Check,
  RefreshCw,
  DollarSign,
  AlertCircle,
  TrendingUp,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface PayoutRecord {
  id: string
  contract_id: string
  milestone_id: string
  freelancer_id: string
  amount: number | string
  currency: string
  paypal_batch_id?: string | null
  paypal_item_id?: string | null
  paypal_payout_email?: string | null
  status: string
  idempotency_key: string
  created_at: string
  updated_at: string
}

interface PaymentAttempt {
  id: string
  contract_id: string
  paypal_order_id?: string | null
  amount: number | string
  currency: string
  status: string
  created_at: string
}

interface ClientLedger {
  payouts: PayoutRecord[]
  payment_attempts: PaymentAttempt[]
  total_staged: number
  total_released: number
}

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const s = (status || '').toLowerCase()
  const cfg: Record<string, { label: string; cls: string }> = {
    success: { label: 'Released', cls: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' },
    succeeded: { label: 'Released', cls: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' },
    completed: { label: 'Released', cls: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' },
    pending: { label: 'Pending', cls: 'bg-blue-500/15 text-blue-400 border border-blue-500/30' },
    processing: { label: 'Processing', cls: 'bg-blue-500/15 text-blue-400 border border-blue-500/30' },
    staged: { label: 'In Escrow', cls: 'bg-amber-500/15 text-amber-400 border border-amber-500/30' },
    staged_in_sandbox: { label: 'In Escrow', cls: 'bg-amber-500/15 text-amber-400 border border-amber-500/30' },
    unclaimed: { label: 'Unclaimed', cls: 'bg-amber-500/15 text-amber-400 border border-amber-500/30' },
    failed: { label: 'Failed', cls: 'bg-rose-500/15 text-rose-400 border border-rose-500/30' },
    denied: { label: 'Denied', cls: 'bg-rose-500/15 text-rose-400 border border-rose-500/30' },
    captured: { label: 'Captured', cls: 'bg-violet-500/15 text-violet-400 border border-violet-500/30' },
  }
  const found = cfg[s] ?? { label: status || 'Unknown', cls: 'bg-slate-700/50 text-slate-400 border border-slate-600/30' }
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${found.cls}`}>
      {found.label}
    </span>
  )
}

export const ClientPayoutsPage: React.FC = () => {
  const { contracts, fetchContracts } = useContractStore()
  const [ledger, setLedger] = useState<ClientLedger>({
    payouts: [],
    payment_attempts: [],
    total_staged: 0,
    total_released: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const loadLedger = async () => {
    try {
      const data = await api.payments.clientLedger()
      setLedger({
        payouts: Array.isArray(data?.payouts) ? data.payouts : [],
        payment_attempts: Array.isArray(data?.payment_attempts) ? data.payment_attempts : [],
        total_staged: Number(data?.total_staged ?? 0),
        total_released: Number(data?.total_released ?? 0),
      })
    } catch (err) {
      console.warn('Failed to fetch client ledger:', err)
      toast.error('Could not load payment ledger. Please refresh.')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchContracts()
    loadLedger()
  }, [fetchContracts])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchContracts()
    loadLedger()
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const contractMap = new Map(contracts.map((c) => [c.id, c]))

  // Metrics
  const totalEscrowed = ledger.total_staged
  const totalReleased = ledger.total_released
  const inFlight = ledger.payouts.filter(
    (p) => ['pending', 'processing', 'submitted'].includes((p.status || '').toLowerCase())
  ).reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
  const totalSpend = ledger.payment_attempts
    .filter((a) => ['captured', 'completed', 'success'].includes((a.status || '').toLowerCase()))
    .reduce((sum, a) => sum + (Number(a.amount) || 0), 0)

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-500/40 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">Loading payment ledger…</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <Wallet className="w-5 h-5 text-blue-400" />
              </div>
              <h1 className="text-2xl font-bold text-white">Payment Management</h1>
            </div>
            <p className="text-slate-400 text-sm ml-11">
              Escrow & payout ledger — all contracts · PayPal Sandbox
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://developer.paypal.com/dashboard/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0E1528] border border-[#222A3D] hover:border-blue-500/40 text-slate-300 hover:text-white text-sm transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              PayPal Sandbox
            </a>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="border-[#222A3D] hover:border-slate-500 text-slate-300"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Escrowed */}
          <div className="rounded-xl bg-[#0E1528] border border-[#222A3D] p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Escrowed</span>
              <div className="p-1.5 rounded-lg bg-amber-500/10">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{formatCurrency(totalEscrowed)}</p>
            <p className="text-xs text-slate-500 mt-1">Held in PayPal escrow</p>
          </div>

          {/* Total Released */}
          <div className="rounded-xl bg-[#0E1528] border border-[#222A3D] p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Released</span>
              <div className="p-1.5 rounded-lg bg-emerald-500/10">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totalReleased)}</p>
            <p className="text-xs text-slate-500 mt-1">Paid out to freelancers</p>
          </div>

          {/* In-Flight */}
          <div className="rounded-xl bg-[#0E1528] border border-[#222A3D] p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">In-Flight</span>
              <div className="p-1.5 rounded-lg bg-blue-500/10">
                <Clock className="w-4 h-4 text-blue-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-blue-400">{formatCurrency(inFlight)}</p>
            <p className="text-xs text-slate-500 mt-1">Processing payouts</p>
          </div>

          {/* Total Captured */}
          <div className="rounded-xl bg-[#0E1528] border border-[#222A3D] p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Captured</span>
              <div className="p-1.5 rounded-lg bg-violet-500/10">
                <TrendingUp className="w-4 h-4 text-violet-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-violet-400">{formatCurrency(totalSpend)}</p>
            <p className="text-xs text-slate-500 mt-1">Total payments captured</p>
          </div>
        </div>

        {/* Payout Ledger */}
        <div className="rounded-xl bg-[#0E1528] border border-[#222A3D] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#222A3D] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-semibold text-white">Payout Ledger</h2>
              <span className="text-xs text-slate-500">({ledger.payouts.length} records)</span>
            </div>
          </div>

          {ledger.payouts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-3">
                <Wallet className="w-5 h-5 text-slate-500" />
              </div>
              <p className="text-slate-400 font-medium">No payouts yet</p>
              <p className="text-slate-500 text-sm mt-1">
                Payouts appear here once you release funds from verified milestones.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#222A3D]">
                    <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Contract</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Milestone</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Freelancer</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Amount</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">PayPal Batch</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222A3D]/50">
                  {ledger.payouts.map((payout) => {
                    const contract = contractMap.get(payout.contract_id)
                    return (
                      <tr key={payout.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3.5">
                          <span className="text-blue-400 font-mono text-xs">
                            {contract?.code || payout.contract_id.slice(0, 8) + '…'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-300 max-w-[140px] truncate">
                          {payout.milestone_id.slice(0, 8) + '…'}
                        </td>
                        <td className="px-5 py-3.5 text-slate-300 text-xs">
                          {payout.paypal_payout_email || '—'}
                        </td>
                        <td className="px-5 py-3.5 text-right font-semibold text-white">
                          {formatCurrency(Number(payout.amount))}
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={payout.status} />
                        </td>
                        <td className="px-5 py-3.5">
                          {payout.paypal_batch_id ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs text-slate-400 max-w-[120px] truncate">
                                {payout.paypal_batch_id}
                              </span>
                              <button
                                onClick={() => copyToClipboard(payout.paypal_batch_id!, `batch-${payout.id}`)}
                                className="text-slate-500 hover:text-slate-300 transition-colors"
                              >
                                {copiedId === `batch-${payout.id}` ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-600 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-slate-400 text-xs whitespace-nowrap">
                          {formatDate(payout.created_at)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Payment Orders / Capture History */}
        <div className="rounded-xl bg-[#0E1528] border border-[#222A3D] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#222A3D] flex items-center gap-2">
            <FileText className="w-4 h-4 text-violet-400" />
            <h2 className="text-sm font-semibold text-white">Payment Orders</h2>
            <span className="text-xs text-slate-500">({ledger.payment_attempts.length} records)</span>
          </div>

          {ledger.payment_attempts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-3">
                <FileText className="w-5 h-5 text-slate-500" />
              </div>
              <p className="text-slate-400 font-medium">No payment orders found</p>
              <p className="text-slate-500 text-sm mt-1">
                Orders appear here once a client funds a contract milestone via PayPal.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#222A3D]">
                    <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">PayPal Order ID</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Contract</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Amount</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222A3D]/50">
                  {ledger.payment_attempts.map((attempt) => {
                    const contract = contractMap.get(attempt.contract_id)
                    return (
                      <tr key={attempt.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs text-slate-400 max-w-[160px] truncate">
                              {attempt.paypal_order_id || '—'}
                            </span>
                            {attempt.paypal_order_id && (
                              <button
                                onClick={() => copyToClipboard(attempt.paypal_order_id!, `order-${attempt.id}`)}
                                className="text-slate-500 hover:text-slate-300 transition-colors"
                              >
                                {copiedId === `order-${attempt.id}` ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-blue-400 font-mono text-xs">
                            {contract?.code || attempt.contract_id.slice(0, 8) + '…'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right font-semibold text-white">
                          {formatCurrency(Number(attempt.amount))}
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={attempt.status} />
                        </td>
                        <td className="px-5 py-3.5 text-slate-400 text-xs whitespace-nowrap">
                          {formatDate(attempt.created_at)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* PayPal Sandbox Notice */}
        <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-4 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-amber-300 text-sm font-medium">Sandbox Environment</p>
            <p className="text-amber-400/70 text-xs mt-1">
              All transactions are processed in the PayPal Sandbox. No real money moves.
              View full transaction logs at{' '}
              <a
                href="https://developer.paypal.com/dashboard/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-300 hover:text-amber-200 underline underline-offset-2"
              >
                developer.paypal.com/dashboard
              </a>
              {' '}→ Sandbox → Notifications.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default ClientPayoutsPage
