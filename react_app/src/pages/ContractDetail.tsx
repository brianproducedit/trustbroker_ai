import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { StatusBadge } from '@/components/common/StatusBadge'
import { PayPalCheckout } from '@/components/payments/PayPalCheckout'
import { useContractStore } from '@/hooks/useContractStore'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ROUTES } from '@/constants'
import { 
  CheckCircle2, 
  Clock, 
  ArrowLeft, 
  ChevronRight,
  ShieldCheck,
  CreditCard,
  History,
  Sparkles
} from 'lucide-react'

export const ContractDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { 
    contracts, 
    activeRole, 
    acceptContract, 
    updateMilestone, 
    addAuditLog 
  } = useContractStore()

  const contract = contracts.find((c) => c.id === id || c.code === id) || contracts[0]

  const [activeTab, setActiveTab] = useState<'overview' | 'checkout' | 'activity'>('overview')

  const handleAcceptTerms = () => {
    acceptContract(contract.id, activeRole)
  }

  const handlePaymentSuccess = (details: any) => {
    addAuditLog(
      contract.id,
      'PAYPAL_SANDBOX_RESERVED',
      `Order ${details.id} captured. Reserve of $${contract.totalAmount} USD staged in PayPal Sandbox.`,
      activeRole === 'buyer' ? contract.buyer.name : 'PayPal Sandbox Engine'
    )
    if (contract.milestones.length > 0) {
      updateMilestone(contract.id, contract.milestones[0].id, {
        paymentStatus: 'staged_in_sandbox',
      })
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between">
          <Link
            to={ROUTES.DASHBOARD}
            className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-mono transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Ledger</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-slate-400">Contract Version {contract.version}.0</span>
            <StatusBadge status={contract.status} />
          </div>
        </div>

        {/* Contract Hero Header */}
        <div className="bg-[#131B2E] rounded-2xl p-6 border border-[#222A3D] flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#222A3D]">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs font-bold text-blue-400 bg-blue-950/80 px-2.5 py-1 rounded-md border border-blue-800/60">
                  {contract.code}
                </span>
                <span className="text-xs text-slate-400">
                  Created on {formatDate(contract.createdAt)}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                {contract.title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
                {contract.description}
              </p>
            </div>

            {/* Total Staged Value Card */}
            <div className="bg-[#0B1326] p-5 rounded-xl border border-[#222A3D] flex flex-col items-end min-w-[220px]">
              <span className="font-mono text-[11px] text-blue-300 uppercase tracking-wider font-semibold">
                Total Staged Escrow
              </span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 mt-0.5">
                {formatCurrency(contract.totalAmount, contract.currency)}
              </span>
              <span className="text-[10px] text-slate-400 mt-1">
                {formatCurrency(contract.releasedAmount, contract.currency)} released upon verification
              </span>
            </div>
          </div>

          {/* Counterparties Dual-Sided Acceptance Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Buyer */}
            <div className="p-4 rounded-xl border border-[#222A3D] bg-[#0E1528] flex flex-col justify-between gap-3">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
                    Hiring Client (Buyer)
                  </span>
                  <span className="text-sm font-bold text-white">{contract.buyer.name}</span>
                  <span className="text-xs text-slate-400">{contract.buyer.organization}</span>
                </div>
                {contract.buyer.accepted ? (
                  <span className="inline-flex items-center gap-1 text-xs font-mono text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-800/60 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Accepted &amp; Funded</span>
                  </span>
                ) : (
                  <span className="text-xs font-mono text-amber-400 bg-amber-950/80 px-2.5 py-1 rounded border border-amber-800/60">
                    Pending Acceptance
                  </span>
                )}
              </div>

              {activeRole === 'buyer' && !contract.buyer.accepted && (
                <button
                  onClick={handleAcceptTerms}
                  className="w-full py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 transition-colors shadow-xs"
                >
                  Accept &amp; Commit SOW Terms
                </button>
              )}
            </div>

            {/* Supplier */}
            <div className="p-4 rounded-xl border border-[#222A3D] bg-[#0E1528] flex flex-col justify-between gap-3">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
                    Contracted Supplier
                  </span>
                  <span className="text-sm font-bold text-white">{contract.supplier.name}</span>
                  <span className="text-xs text-slate-400">{contract.supplier.organization}</span>
                </div>
                {contract.supplier.accepted ? (
                  <span className="inline-flex items-center gap-1 text-xs font-mono text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-800/60 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Signed ✓</span>
                  </span>
                ) : (
                  <span className="text-xs font-mono text-amber-400 bg-amber-950/80 px-2.5 py-1 rounded border border-amber-800/60">
                    Awaiting Countersignature
                  </span>
                )}
              </div>

              {activeRole === 'supplier' && !contract.supplier.accepted && (
                <button
                  onClick={handleAcceptTerms}
                  className="w-full py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 transition-colors shadow-xs"
                >
                  Sign &amp; Countersign SOW as Supplier
                </button>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-[#222A3D] pt-2">
            {[
              { id: 'overview', label: 'Milestones & Acceptance Criteria', icon: Sparkles },
              { id: 'checkout', label: 'PayPal Sandbox Escrow', icon: CreditCard },
              { id: 'activity', label: 'Immutable Audit History', icon: History },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* TAB 1: Milestones & Criteria */}
          {activeTab === 'overview' && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Statement of Work Milestones ({contract.milestones.length})
                </h3>
                <Link
                  to={ROUTES.DELIVERY_VERIFICATION(contract.id)}
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 font-mono"
                >
                  <span>Open Verification Bay</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="flex flex-col gap-4">
                {contract.milestones.map((m, idx) => (
                  <div
                    key={m.id}
                    className="p-5 rounded-xl border border-[#222A3D] bg-[#0E1528] flex flex-col gap-4 hover:border-slate-700 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-blue-950/80 border border-blue-800 text-blue-400 font-mono text-xs font-bold flex items-center justify-center">
                          0{idx + 1}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-white">{m.title}</h4>
                          <span className="text-xs text-slate-400">Due {formatDate(m.deadline)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-bold text-emerald-400">
                          {formatCurrency(m.amount, m.currency)}
                        </span>
                        <StatusBadge status={m.status} size="sm" />
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {m.description}
                    </p>

                    {/* Criteria */}
                    {m.acceptanceCriteria && m.acceptanceCriteria.length > 0 && (
                      <div className="bg-[#131B2E] p-3.5 rounded-lg border border-[#222A3D] flex flex-col gap-2">
                        <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold">
                          Required Acceptance Criteria for Payment Release:
                        </span>
                        <div className="flex flex-col gap-1.5">
                          {m.acceptanceCriteria.map((c) => (
                            <div key={c.id} className="flex items-start justify-between text-xs gap-3">
                              <div className="flex items-center gap-2">
                                {c.status === 'pass' ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                                ) : (
                                  <Clock className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                                )}
                                <span className="font-medium text-slate-200">{c.title}</span>
                              </div>
                              <span className={`font-mono text-[10px] uppercase font-semibold ${
                                c.status === 'pass' ? 'text-emerald-400' : 'text-slate-400'
                              }`}>
                                {c.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: PayPal Checkout */}
          {activeTab === 'checkout' && (
            <div className="flex flex-col gap-6 max-w-2xl">
              <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-800/40 text-xs text-slate-300 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <strong className="text-blue-300 font-semibold">Pre-Authorized Holding Reserve:</strong>
                  <span>
                    Staging funds into the PayPal Sandbox reserve protects both parties. The client guarantees payment is ready, and funds will disburse automatically once Gemini AI validates delivery evidence.
                  </span>
                </div>
              </div>

              <PayPalCheckout
                contractId={contract.id}
                contractCode={contract.code}
                amount={contract.totalAmount}
                currency={contract.currency}
                onPaymentSuccess={handlePaymentSuccess}
              />
            </div>
          )}

          {/* TAB 3: Audit Activity */}
          {activeTab === 'activity' && (
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Immutable Contract Audit Trail
              </h3>
              <div className="flex flex-col gap-2 pt-2">
                {contract.auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-lg bg-[#0E1528] border border-[#222A3D] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[11px] text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-800/40 font-semibold">
                        {log.action}
                      </span>
                      <span className="text-slate-200">{log.details}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                      <span>{log.actor}</span>
                      <span>&bull;</span>
                      <span>{formatDate(log.timestamp)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
