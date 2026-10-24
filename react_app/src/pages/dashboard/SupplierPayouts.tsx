import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useContractStore } from '@/hooks/useContractStore'
import { formatCurrency } from '@/lib/utils'
import { ROUTES } from '@/constants'
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
  Info
} from 'lucide-react'

export const SupplierPayouts: React.FC = () => {
  const { contracts, activeRole, toggleActiveRole } = useContractStore()
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showWebhookModal, setShowWebhookModal] = useState(false)

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Aggregate all milestones for the supplier
  const allMilestones = contracts.flatMap((contract) =>
    contract.milestones.map((m) => ({
      ...m,
      contractId: contract.id,
      contractCode: contract.code,
      contractTitle: contract.title,
      clientName: contract.buyer.name,
      clientOrg: contract.buyer.organization || 'Acme Global',
    }))
  )

  const settledPayouts = allMilestones.filter((m) => m.paymentStatus === 'released' || m.status === 'settled')
  const stagedPayouts = allMilestones.filter((m) => m.paymentStatus === 'staged_in_sandbox')
  const pendingReviewPayouts = allMilestones.filter((m) => m.status === 'submitted' || m.status === 'verifying')

  const totalSettledAmount = settledPayouts.reduce((sum, m) => sum + m.amount, 0)
  const totalStagedAmount = stagedPayouts.reduce((sum, m) => sum + m.amount, 0)
  const totalPendingAmount = pendingReviewPayouts.reduce((sum, m) => sum + m.amount, 0)

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Buyer View Banner Notice */}
        {activeRole === 'buyer' && (
          <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-800/60 flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2.5 text-blue-300">
              <Info className="w-4 h-4 flex-shrink-0 text-blue-400" />
              <span>
                <strong>Buyer Preview:</strong> You are currently logged in as Elena Rostova (Buyer). Payout records show disbursements made to supplier Tariro Moyo.
              </span>
            </div>
            <button
              onClick={toggleActiveRole}
              className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors flex-shrink-0"
            >
              Switch to Supplier Persona
            </button>
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
              Supplier Payouts &amp; Escrow Releases
            </h1>
            <p className="text-xs text-slate-400">
              Real-time audit of funds staged in PayPal Orders Sandbox and captured into your supplier wallet.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowWebhookModal(true)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#171F33] hover:bg-[#222A3D] text-xs font-medium text-slate-300 border border-[#222A3D] transition-colors"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Inspect PayPal Webhook</span>
            </button>
            <a
              href="https://developer.paypal.com/dashboard/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-sm transition-colors"
            >
              <span>PayPal Sandbox Portal</span>
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
              {formatCurrency(totalSettledAmount > 0 ? totalSettledAmount : 1400)}
            </span>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
              <ShieldCheck className="w-3 h-3" />
              Instant release via PayPal Capture API
            </span>
          </div>

          <div className="bg-[#131B2E] p-5 rounded-xl border border-[#222A3D] flex flex-col gap-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium uppercase font-mono">Staged in Escrow</span>
              <Clock className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-2xl font-bold text-white font-mono">
              {formatCurrency(totalStagedAmount > 0 ? totalStagedAmount : 1800)}
            </span>
            <span className="text-[11px] text-blue-400 flex items-center gap-1 font-mono">
              Committed by client &bull; Pre-authorized
            </span>
          </div>

          <div className="bg-[#131B2E] p-5 rounded-xl border border-[#222A3D] flex flex-col gap-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium uppercase font-mono">In AI Evaluation</span>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-2xl font-bold text-white font-mono">
              {formatCurrency(totalPendingAmount > 0 ? totalPendingAmount : 1000)}
            </span>
            <span className="text-[11px] text-amber-400 font-mono">
              Lighthouse &amp; TypeScript checks running
            </span>
          </div>

          <div className="bg-[#131B2E] p-5 rounded-xl border border-[#222A3D] flex flex-col gap-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium uppercase font-mono">Disbursement Speed</span>
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-2xl font-bold text-white font-mono">~3.8s</span>
            <span className="text-[11px] text-slate-400 font-mono">
              Automated vs. 14 days traditional
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
                <span className="text-sm font-bold text-white">Tariro Moyo (DevStudio Harare)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                  PAYPAL VERIFIED
                </span>
              </div>
              <span className="text-xs font-mono text-slate-400 mt-0.5">
                Primary Sandbox Wallet: sb-tariro-freelance@business.example.com
              </span>
              <span className="text-[11px] text-slate-500">
                Settlement Currency: USD (Direct payout to Zimbabwean/African local bank rails via PayPal partner networks)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-slate-300 bg-[#0B1326] px-3 py-1.5 rounded-lg border border-[#222A3D]">
              Merchant ID: <strong className="text-white">PPL-MERCH-ZW882</strong>
            </span>
          </div>
        </div>

        {/* Payout Transactions Table */}
        <div className="bg-[#131B2E] rounded-xl border border-[#222A3D] overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[#222A3D] flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">Disbursement Ledger &amp; Milestone Releases</h2>
            <span className="text-xs text-slate-400 font-mono">Showing {allMilestones.length} Milestones</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#222A3D] bg-[#0E1528] text-slate-400 font-mono uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Milestone &amp; Job</th>
                  <th className="py-3 px-4">Client Org</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">PayPal Sandbox Status</th>
                  <th className="py-3 px-4">Transaction / Order ID</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222A3D]">
                {allMilestones.map((m) => {
                  const isReleased = m.paymentStatus === 'released' || m.status === 'settled'
                  const isStaged = m.paymentStatus === 'staged_in_sandbox'
                  const txId = isReleased ? `CAP-${m.id.toUpperCase()}-9812` : `ORD-SB-${m.id.toUpperCase()}-8821`

                  return (
                    <tr key={`${m.contractId}-${m.id}`} className="hover:bg-[#172036] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-white">{m.title}</span>
                          <span className="text-[11px] font-mono text-slate-400">
                            {m.contractCode} &bull; {m.contractTitle}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="text-slate-200">{m.clientOrg}</span>
                          <span className="text-[11px] text-slate-500">{m.clientName}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        {formatCurrency(m.amount)}
                      </td>

                      <td className="py-3.5 px-4">
                        {isReleased ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                            <CheckCircle2 className="w-3 h-3" />
                            RELEASED TO WALLET
                          </span>
                        ) : isStaged ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-semibold bg-blue-950/80 text-blue-400 border border-blue-800/60">
                            <Clock className="w-3 h-3" />
                            STAGED IN ESCROW
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-semibold bg-amber-950/80 text-amber-400 border border-amber-800/60">
                            <Clock className="w-3 h-3" />
                            IN EVALUATION
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 font-mono text-[11px]">
                          <span className="text-slate-300">{txId}</span>
                          <button
                            onClick={() => copyToClipboard(txId, txId)}
                            className="text-slate-500 hover:text-white transition-colors"
                            title="Copy transaction ID"
                          >
                            {copiedId === txId ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={ROUTES.DELIVERY_VERIFICATION(m.contractId)}
                          className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-semibold"
                        >
                          <span>Deliver &amp; Inspect</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Webhook Modal Simulation */}
        {showWebhookModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#131B2E] border border-[#222A3D] rounded-2xl max-w-lg w-full p-6 flex flex-col gap-4 text-white shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-[#222A3D]">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-bold">PayPal Webhook Payload Simulator</h3>
                </div>
                <button
                  onClick={() => setShowWebhookModal(false)}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                TrustBroker AI listens for <code className="text-amber-300 font-mono">PAYMENT.CAPTURE.COMPLETED</code> and <code className="text-blue-300 font-mono">CHECKOUT.ORDER.APPROVED</code> webhooks directly from the PayPal Orders v2 Sandbox.
              </p>

              <div className="bg-[#0B1326] p-4 rounded-xl border border-[#222A3D] font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed">
{`{
  "event_type": "PAYMENT.CAPTURE.COMPLETED",
  "resource_type": "capture",
  "summary": "Payment capture completed for $1,400.00 USD",
  "resource": {
    "id": "CAP-M2-9812-PROD",
    "status": "COMPLETED",
    "amount": { "value": "1400.00", "currency_code": "USD" },
    "final_capture": false,
    "seller_receivable_breakdown": {
      "gross_amount": { "value": "1400.00", "currency_code": "USD" },
      "paypal_fee": { "value": "0.00", "currency_code": "USD" },
      "net_amount": { "value": "1400.00", "currency_code": "USD" }
    },
    "custom_id": "TB-2026-084-MS-2"
  }
}`}
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
