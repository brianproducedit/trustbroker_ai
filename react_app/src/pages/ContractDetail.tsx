import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { SandboxBanner } from '@/components/common/SandboxBanner'
import { StatusBadge } from '@/components/common/StatusBadge'
import { PayPalCheckout } from '@/components/payments/PayPalCheckout'
import { useContractStore } from '@/hooks/useContractStore'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ROUTES } from '@/constants'
import { 
  CheckCircle2, 
  Clock, 
  ArrowLeft, 
  ChevronRight
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

  const [activeTab, setActiveTab] = useState<'overview' | 'milestones' | 'checkout' | 'activity'>('overview')

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
    // Update first milestone payment status
    if (contract.milestones.length > 0) {
      updateMilestone(contract.id, contract.milestones[0].id, {
        paymentStatus: 'staged_in_sandbox',
      })
    }
  }

  return (
    <div className="min-h-screen bg-[#F6F8FC] text-[#1A2940] flex flex-col font-sans">
      <Header />

      <main className="w-full pt-[68px] flex-1">
        {/* Top Sandbox Notice */}
        <SandboxBanner />

        {/* Contract Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
          {/* Breadcrumb & Navigation */}
          <div className="flex items-center justify-between">
            <Link
              to={ROUTES.DASHBOARD}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Ledger</span>
            </Link>

            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-slate-500">Contract Version {contract.version}.0</span>
              <StatusBadge status={contract.status} />
            </div>
          </div>

          {/* Contract Hero Header */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-[#DDE4EF] flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                    {contract.code}
                  </span>
                  <span className="text-xs text-slate-500">
                    Created on {formatDate(contract.createdAt)}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A2940]">
                  {contract.title}
                </h1>
                <p className="text-sm text-[#5D6B82] max-w-3xl leading-relaxed">
                  {contract.description}
                </p>
              </div>

              {/* Total Value Box */}
              <div className="bg-[#0E1B35] text-white p-5 rounded-xl border border-slate-800 flex flex-col items-end min-w-[220px]">
                <span className="font-mono text-[11px] text-blue-300 uppercase tracking-wider">
                  Total Staged Value
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
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono text-slate-500 uppercase font-semibold">
                      Contract Buyer
                    </span>
                    <span className="text-sm font-bold text-[#1A2940]">{contract.buyer.name}</span>
                    <span className="text-xs text-slate-500">{contract.buyer.organization}</span>
                  </div>
                  {contract.buyer.accepted ? (
                    <span className="inline-flex items-center gap-1 text-xs font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Accepted</span>
                    </span>
                  ) : (
                    <span className="text-xs font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Pending
                    </span>
                  )}
                </div>

                {activeRole === 'buyer' && !contract.buyer.accepted && (
                  <button
                    onClick={handleAcceptTerms}
                    className="w-full py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs"
                  >
                    Accept SOW as Buyer
                  </button>
                )}
              </div>

              {/* Supplier */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono text-slate-500 uppercase font-semibold">
                      Contract Supplier
                    </span>
                    <span className="text-sm font-bold text-[#1A2940]">{contract.supplier.name}</span>
                    <span className="text-xs text-slate-500">{contract.supplier.organization}</span>
                  </div>
                  {contract.supplier.accepted ? (
                    <span className="inline-flex items-center gap-1 text-xs font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Accepted</span>
                    </span>
                  ) : (
                    <span className="text-xs font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Pending Counter-Signature
                    </span>
                  )}
                </div>

                {activeRole === 'supplier' && !contract.supplier.accepted && (
                  <button
                    onClick={handleAcceptTerms}
                    className="w-full py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs"
                  >
                    Sign &amp; Accept SOW as Supplier
                  </button>
                )}
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 pt-2">
              {[
                { id: 'overview', label: 'Milestones & Criteria' },
                { id: 'checkout', label: 'PayPal Sandbox Checkout' },
                { id: 'activity', label: 'Audit History' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab 1: Milestones & Criteria */}
            {activeTab === 'overview' && (
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#1A2940]">
                    Statement of Work Milestones ({contract.milestones.length})
                  </h3>
                  <Link
                    to={ROUTES.DELIVERY_VERIFICATION(contract.id)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <span>Open Verification Bay</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="flex flex-col gap-4">
                  {contract.milestones.map((m, idx) => (
                    <div
                      key={m.id}
                      className="p-5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-all flex flex-col gap-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 font-mono text-xs font-bold flex items-center justify-center">
                            0{idx + 1}
                          </span>
                          <div>
                            <h4 className="text-sm font-bold text-[#1A2940]">{m.title}</h4>
                            <span className="text-xs text-slate-500">Due {formatDate(m.deadline)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm font-bold text-emerald-600">
                            {formatCurrency(m.amount, m.currency)}
                          </span>
                          <StatusBadge status={m.status} size="sm" />
                        </div>
                      </div>

                      <p className="text-xs text-[#5D6B82] leading-relaxed">
                        {m.description}
                      </p>

                      {/* Criteria */}
                      {m.acceptanceCriteria && m.acceptanceCriteria.length > 0 && (
                        <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80 flex flex-col gap-2">
                          <span className="text-[11px] font-mono uppercase text-slate-500 font-semibold">
                            Acceptance Criteria for Payment Release:
                          </span>
                          <div className="flex flex-col gap-1.5">
                            {m.acceptanceCriteria.map((c) => (
                              <div key={c.id} className="flex items-start justify-between text-xs gap-3">
                                <div className="flex items-center gap-2">
                                  {c.status === 'pass' ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                  ) : (
                                    <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                  )}
                                  <span className="font-medium text-slate-800">{c.title}</span>
                                </div>
                                <span className={`font-mono text-[11px] uppercase font-semibold ${
                                  c.status === 'pass' ? 'text-emerald-600' : 'text-slate-500'
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

            {/* Tab 2: PayPal Checkout */}
            {activeTab === 'checkout' && (
              <div className="flex flex-col gap-6 max-w-2xl">
                <PayPalCheckout
                  contractId={contract.id}
                  contractCode={contract.code}
                  amount={contract.totalAmount}
                  currency={contract.currency}
                  onPaymentSuccess={handlePaymentSuccess}
                />
              </div>
            )}

            {/* Tab 3: Audit Activity */}
            {activeTab === 'activity' && (
              <div className="flex flex-col gap-3">
                <h3 className="text-base font-bold text-[#1A2940]">
                  Tamper-Proof Contract Audit Trail
                </h3>
                <div className="flex flex-col gap-2 pt-2">
                  {contract.auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[11px] text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded font-semibold">
                          {log.action}
                        </span>
                        <span className="text-slate-700">{log.details}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
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
      </main>

      <Footer />
    </div>
  )
}
