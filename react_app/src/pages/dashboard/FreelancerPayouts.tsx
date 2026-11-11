import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useContractStore } from '@/hooks/useContractStore'
import { useAuthStore } from '@/hooks/useAuthStore'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ROUTES } from '@/constants'
import { api } from '@/lib/api'
import {
  Wallet,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  ArrowUpRight,
  Building2,
  Copy,
  Check,
  Zap,
  Info,
  AlertCircle,
  RefreshCw,
  FileCheck2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { toast } from 'sonner'

export interface PayoutItem {
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

export const FreelancerPayouts: React.FC = () => {
  const { contracts, activeRole, fetchContracts } = useContractStore()
  const user = useAuthStore((state) => state.user)
  const [payouts, setPayouts] = useState<PayoutItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [claimingId, setClaimingId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showWebhookModal, setShowWebhookModal] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(true)

  const loadEarnings = async () => {
    try {
      const data = await api.payments.earnings()
      setPayouts(Array.isArray(data) ? data : [])
    } catch (err) {
      console.warn('Failed to fetch freelancer earnings:', err)
      setPayouts([])
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleClaimSandbox = async (payoutId: string) => {
    setClaimingId(payoutId)
    try {
      await api.payments.claimSandboxPayout(payoutId)
      toast.success('Sandbox payout marked as claimed. Status updated to SUCCESS.')
      await loadEarnings()
    } catch (err: any) {
      toast.error(err?.detail || err?.message || 'Failed to claim sandbox payout.')
    } finally {
      setClaimingId(null)
    }
  }

  useEffect(() => {
    fetchContracts()
    loadEarnings()
  }, [fetchContracts])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchContracts()
    loadEarnings()
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Create lookup map for contracts
  const contractMap = new Map(contracts.map((c) => [c.id, c]))

  // Calculate real metrics from payouts and active contracts
  // In PayPal Sandbox, payouts to demo/virtual emails stay UNCLAIMED until accepted in Sandbox,
  // but represent completed, released disbursements from the client escrow.
  const isCleared = (status: string) =>
    ['success', 'succeeded', 'completed', 'unclaimed'].includes((status || '').toLowerCase())

  const clearedPayouts = payouts.filter((p) => isCleared(p.status))
  const totalClearedAmount = clearedPayouts.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)

  const inFlightPayouts = payouts.filter(
    (p) => ['pending', 'processing', 'submitted'].includes(p.status?.toLowerCase() || '')
  )
  const totalInFlightAmount = inFlightPayouts.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)

  // Staged milestone funds from user's awarded contracts
  const stagedMilestones = contracts.flatMap((c) =>
    c.milestones.filter(
      (m) => m.paymentStatus === 'staged_in_sandbox' || (m.paymentStatus as string) === 'staged' || m.paymentStatus === 'release_authorized'
    ).map((m) => ({ ...m, contractCode: c.code, currency: c.currency, contractId: c.id }))
  )
  const totalStagedAmount = stagedMilestones.reduce((sum, m) => sum + (Number(m.amount) || 0), 0)

  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase()
    if (s === 'success' || s === 'succeeded' || s === 'completed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          PAID VIA PAYPAL
        </span>
      )
    }
    if (s === 'submitted') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-semibold bg-sky-950/80 text-sky-400 border border-sky-800/60">
          <Clock className="w-3 h-3 text-sky-400 animate-spin" />
          PAYOUT SUBMITTED
        </span>
      )
    }
    if (s === 'processing' || s === 'pending') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-semibold bg-blue-950/80 text-blue-400 border border-blue-800/60">
          <Clock className="w-3 h-3 text-blue-400 animate-spin" />
          PROCESSING
        </span>
      )
    }
    if (s === 'unclaimed') {
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60"
          title="Disbursed via PayPal Payouts API. In Sandbox, held until recipient sandbox login."
        >
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          DISBURSED (SANDBOX)
        </span>
      )
    }
    if (s === 'returned') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-semibold bg-purple-950/80 text-purple-400 border border-purple-800/60">
          <AlertCircle className="w-3 h-3 text-purple-400" />
          RETURNED
        </span>
      )
    }
    if (s === 'reconciliation_required') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-semibold bg-orange-950/80 text-orange-400 border border-orange-800/60">
          <AlertCircle className="w-3 h-3 text-orange-400" />
          RECONCILIATION REQUIRED
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-semibold bg-rose-950/80 text-rose-400 border border-rose-800/60">
        <AlertCircle className="w-3 h-3 text-rose-400" />
        {status?.toUpperCase() || 'FAILED'}
      </span>
    )
  }

  const payoutEmail = (user as any)?.paypal_payout_email || user?.email

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Client View Banner Notice */}
        {activeRole === 'client' && (
          <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-800/60 flex items-center gap-2.5 text-xs text-blue-300">
            <Info className="w-4 h-4 flex-shrink-0 text-blue-400" />
            <span>
              <strong>Client account notice:</strong> Payout ledger below displays disbursements sent via PayPal Payouts for verified milestone deliveries.
            </span>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-semibold uppercase">
              <Wallet className="w-4 h-4" />
              <span>PAYPAL PAYOUTS &amp; EARNINGS DISBURSEMENT</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Earnings &amp; PayPal Payouts
            </h1>
            <p className="text-xs text-slate-400">
              Direct disbursements via PayPal Payouts API (<code className="text-emerald-400 font-mono">/v1/payments/payouts</code>) for verified milestone deliveries.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#171F33] hover:bg-[#222A3D] text-xs font-medium text-slate-300 border border-[#222A3D] transition-colors disabled:opacity-50"
              title="Refresh ledger"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setShowWebhookModal(true)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#171F33] hover:bg-[#222A3D] text-xs font-medium text-slate-300 border border-[#222A3D] transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Inspect Webhook</span>
            </button>
            <a
              href="https://developer.paypal.com/dashboard/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-sm transition-colors"
            >
              <span>PayPal Sandbox Dashboard</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#131B2E] p-5 rounded-xl border border-[#222A3D] flex flex-col gap-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium uppercase font-mono">Cleared Payouts</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-2xl font-bold text-white font-mono">
              {formatCurrency(totalClearedAmount)}
            </span>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
              <ShieldCheck className="w-3 h-3" />
              {clearedPayouts.length} completed milestone {clearedPayouts.length === 1 ? 'payout' : 'payouts'}
            </span>
          </div>

          <div className="bg-[#131B2E] p-5 rounded-xl border border-[#222A3D] flex flex-col gap-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium uppercase font-mono">Staged in Sandbox</span>
              <Clock className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-2xl font-bold text-white font-mono">
              {formatCurrency(totalStagedAmount)}
            </span>
            <span className="text-[11px] text-blue-400 flex items-center gap-1 font-mono">
              Captured via PayPal Orders v2 &bull; Pre-funded
            </span>
          </div>

          <div className="bg-[#131B2E] p-5 rounded-xl border border-[#222A3D] flex flex-col gap-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium uppercase font-mono">In-Flight Payouts</span>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-2xl font-bold text-white font-mono">
              {formatCurrency(totalInFlightAmount)}
            </span>
            <span className="text-[11px] text-amber-400 font-mono">
              {inFlightPayouts.length} processing / unclaimed in sandbox
            </span>
          </div>

          <div className="bg-[#131B2E] p-5 rounded-xl border border-[#222A3D] flex flex-col gap-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium uppercase font-mono">Disbursement Mode</span>
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-2xl font-bold text-emerald-400 font-mono">API Real-Time</span>
            <span className="text-[11px] text-slate-400 font-mono">
              Automated on milestone verification release
            </span>
          </div>
        </div>

        {/* Connected PayPal Sandbox Account Card */}
        <div className="bg-[#131B2E] rounded-xl border border-[#222A3D] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#1A2640] border border-[#2E3C5D] flex items-center justify-center text-emerald-400 flex-shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{user?.name || 'Freelancer Payout Profile'}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                  PAYPAL SANDBOX READY
                </span>
              </div>
              <span className="text-xs font-mono text-slate-400 mt-0.5">
                Payout receiver email: <strong className="text-slate-200">{payoutEmail || 'Not set (update in profile)'}</strong>
              </span>
              <span className="text-[11px] text-slate-500">
                Sandbox endpoint: <code className="text-slate-400">https://api-m.sandbox.paypal.com/v1/payments/payouts</code>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={ROUTES.FREELANCER_PROFILE}
              className="text-xs font-mono text-blue-400 hover:text-blue-300 bg-[#0B1326] px-3.5 py-2 rounded-lg border border-[#222A3D] hover:border-blue-500/50 transition-colors"
            >
              Update PayPal Email &rarr;
            </Link>
          </div>
        </div>

        {/* Real Payout Transactions Table */}
        <Collapsible
          open={historyOpen}
          onOpenChange={setHistoryOpen}
          className="bg-[#131B2E] rounded-xl border border-[#222A3D] overflow-hidden flex flex-col"
        >
          <CollapsibleTrigger asChild>
            <div className="p-4 border-b border-[#222A3D] flex items-center justify-between cursor-pointer hover:bg-[#162137] transition-colors select-none">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-white">PayPal Disbursement Ledger</h2>
                  <span className="text-xs text-slate-400 font-mono">
                    ({payouts.length} {payouts.length === 1 ? 'Transaction' : 'Transactions'})
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Exact payouts generated from backend <code className="text-slate-300">payouts</code> table and verified PayPal batches.
                </p>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <span className="text-xs font-medium">{historyOpen ? 'Collapse' : 'Expand'}</span>
                {historyOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>

          {isLoading ? (
            <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
              <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
              <span>Loading PayPal payout records...</span>
            </div>
          ) : payouts.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#171F33] border border-[#222A3D] flex items-center justify-center text-slate-500">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <div className="flex flex-col gap-1 max-w-sm">
                <span className="font-semibold text-white text-sm">No PayPal payouts released yet</span>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  When a client funds a milestone and you submit work evidence that passes AI verification, releasing the milestone sends funds directly to your PayPal email via the Payouts API.
                </p>
              </div>
              <Link
                to={ROUTES.MARKETPLACE}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors"
              >
                Browse Open Contracts
              </Link>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#222A3D] bg-[#0E1528] text-slate-400 font-mono uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Milestone &amp; Contract</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">PayPal Status</th>
                    <th className="py-3 px-4">Batch / Item ID</th>
                    <th className="py-3 px-4">Disbursed At</th>
                    <th className="py-3 px-4 text-right">Contract</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222A3D]">
                  {payouts.map((p) => {
                    const matchedContract = contractMap.get(p.contract_id)
                    const matchedMilestone = matchedContract?.milestones.find(
                      (m) => m.id === p.milestone_id
                    )
                    const milestoneTitle = matchedMilestone?.title || 'Milestone Delivery'
                    const contractCode = matchedContract?.code || p.contract_id.slice(0, 8)
                    const clientName = matchedContract?.client?.name || 'Client'
                    const clientOrg = matchedContract?.client?.organization || ''
                    const displayTxId = p.paypal_item_id || p.paypal_batch_id || p.idempotency_key

                    return (
                      <tr key={p.id} className="hover:bg-[#172036] transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-white">{milestoneTitle}</span>
                            <span className="text-[11px] font-mono text-slate-400">
                              {contractCode} {matchedContract?.title ? `• ${matchedContract.title}` : ''}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-col">
                            <span className="text-slate-200">{clientOrg || clientName}</span>
                            {clientOrg && <span className="text-[11px] text-slate-500">{clientName}</span>}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                          {formatCurrency(Number(p.amount) || 0, p.currency || 'USD')}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-col items-start gap-1">
                            {getStatusBadge(p.status)}
                            {p.status?.toLowerCase() === 'unclaimed' && (
                              <button
                                onClick={() => handleClaimSandbox(p.id)}
                                disabled={claimingId === p.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono text-emerald-300 hover:text-white bg-emerald-900/40 hover:bg-emerald-800/60 border border-emerald-700/50 transition-colors disabled:opacity-50"
                                title="Simulate recipient accepting funds in PayPal Sandbox"
                              >
                                {claimingId === p.id ? (
                                  <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                                ) : (
                                  <Check className="w-2.5 h-2.5" />
                                )}
                                <span>Claim in Sandbox</span>
                              </button>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2 font-mono text-[11px]">
                            <span className="text-slate-300 max-w-[140px] truncate" title={displayTxId}>
                              {displayTxId}
                            </span>
                            <button
                              onClick={() => copyToClipboard(displayTxId, p.id)}
                              className="text-slate-500 hover:text-white transition-colors"
                              title="Copy transaction ID"
                            >
                              {copiedId === p.id ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                          {formatDate(p.created_at)}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <Link
                            to={ROUTES.CONTRACT_DETAIL(p.contract_id)}
                            className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-semibold"
                          >
                            <span>View</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (Below md screen size) */}
          <div className="md:hidden divide-y divide-[#222A3D]">
            {payouts.map((p) => {
              const matchedContract = contractMap.get(p.contract_id)
              const matchedMilestone = matchedContract?.milestones.find(
                (m) => m.id === p.milestone_id
              )
              const milestoneTitle = matchedMilestone?.title || 'Milestone Delivery'
              const contractCode = matchedContract?.code || p.contract_id.slice(0, 8)
              const clientName = matchedContract?.client?.name || 'Client'
              const batchId = p.paypal_batch_id || 'PENDING_BATCH'

              return (
                <div key={p.id} className="p-4 space-y-2.5 bg-[#0E1528]">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-emerald-400">{contractCode}</span>
                    <div className="flex items-center gap-1.5">
                      {getStatusBadge(p.status)}
                      {p.status?.toLowerCase() === 'unclaimed' && (
                        <button
                          onClick={() => handleClaimSandbox(p.id)}
                          disabled={claimingId === p.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono text-emerald-300 hover:text-white bg-emerald-900/40 hover:bg-emerald-800/60 border border-emerald-700/50 transition-colors disabled:opacity-50"
                        >
                          {claimingId === p.id ? (
                            <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                          ) : (
                            <Check className="w-2.5 h-2.5" />
                          )}
                          <span>Claim</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">{milestoneTitle}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Client: {clientName}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-400">Amount:</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      {formatCurrency(Number(p.amount) || 0, p.currency || 'USD')}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-[#090E1A] border border-[#222A3D] text-[11px] font-mono flex items-center justify-between">
                    <span className="text-slate-500 truncate mr-2">Batch: {batchId}</span>
                    <button
                      onClick={() => copyToClipboard(batchId, `m-${p.id}`)}
                      className="text-slate-400 hover:text-white flex-shrink-0"
                    >
                      {copiedId === `m-${p.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                    <span>{formatDate(p.created_at)}</span>
                    {matchedContract && (
                      <Link
                        to={ROUTES.CONTRACT_DETAIL(matchedContract.id)}
                        className="text-blue-400 hover:underline inline-flex items-center gap-1 font-sans text-xs"
                      >
                        View Contract &rarr;
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
          </CollapsibleContent>
        </Collapsible>

        {/* PayPal Sandbox & Regional Capability Notice */}
        <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-4 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="text-amber-300 text-sm font-medium">Sandbox Simulation &amp; Regional Capabilities</p>
            <p className="text-amber-400/80 text-xs">
              Disbursements shown here are executed against the PayPal Developer Sandbox via PayPal Payouts API.
            </p>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              <strong>PayPal Sandbox UNCLAIMED Status:</strong> Per official PayPal Payouts documentation, payments sent to unconfirmed or demo recipient emails remain held as <code className="text-amber-300 font-mono">UNCLAIMED</code> for 30 days until accepted at <code className="text-blue-300 font-mono">sandbox.paypal.com</code>. TrustBroker treats this as a completed, settled disbursement because client funds were captured and disbursed via PayPal. In live production with registered PayPal accounts, payouts settle immediately with <code className="text-emerald-400 font-mono">SUCCESS</code> status. You can click <em>Claim in Sandbox</em> on any row above to simulate the recipient claiming the payout.
            </p>
            <p className="text-slate-500 text-[10px] leading-relaxed">
              Note: Live production payout capabilities are subject to recipient country regulations and regional PayPal account capabilities (e.g., Zimbabwe accounts are currently Send-Only in PayPal production).
            </p>
          </div>
        </div>

        {/* Webhook Modal Inspection */}
        {showWebhookModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#131B2E] border border-[#222A3D] rounded-2xl max-w-xl w-full p-6 flex flex-col gap-4 text-white shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-[#222A3D]">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-bold">PayPal Webhook &amp; Payout Event Schema</h3>
                </div>
                <button
                  onClick={() => setShowWebhookModal(false)}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                TrustBroker backend (<code className="text-blue-300 font-mono">POST /api/v1/payments/webhook</code>) idempotently processes PayPal event notifications to synchronize milestone capture and payout state.
              </p>

              <div className="space-y-3 font-mono text-[11px]">
                <div className="text-xs font-sans font-bold text-slate-200">1. Payout Batch Success Event</div>
                <div className="bg-[#0B1326] p-3 rounded-xl border border-[#222A3D] text-slate-300 overflow-x-auto leading-relaxed">
                  {`{
  "event_type": "PAYMENT.PAYOUTSBATCH.SUCCESS",
  "resource_type": "payouts",
  "summary": "Payout batch completed successfully",
  "resource": {
    "batch_header": {
      "payout_batch_id": "BATCH-PPL-2026-9912",
      "batch_status": "SUCCESS",
      "amount": { "value": "1400.00", "currency": "USD" }
    }
  }
}`}
                </div>

                <div className="text-xs font-sans font-bold text-slate-200">2. Orders v2 Milestone Capture Event</div>
                <div className="bg-[#0B1326] p-3 rounded-xl border border-[#222A3D] text-slate-300 overflow-x-auto leading-relaxed">
                  {`{
  "event_type": "PAYMENT.CAPTURE.COMPLETED",
  "resource_type": "capture",
  "resource": {
    "id": "CAP-8841-9210-PROD",
    "status": "COMPLETED",
    "amount": { "value": "1400.00", "currency_code": "USD" },
    "custom_id": "payout:milestone-uuid"
  }
}`}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowWebhookModal(false)}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors"
                >
                  Close Inspection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default FreelancerPayouts
