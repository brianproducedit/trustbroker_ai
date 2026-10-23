import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { SandboxBanner } from '@/components/common/SandboxBanner'
import { StatusBadge } from '@/components/common/StatusBadge'
import { useContractStore } from '@/hooks/useContractStore'
import { formatCurrency } from '@/lib/utils'
import { ROUTES } from '@/constants'
import { 
  CheckCircle2, 
  Sparkles, 
  AlertTriangle, 
  ArrowLeft, 
  UploadCloud, 
  ShieldCheck, 
  RefreshCw,
  Clock
} from 'lucide-react'

export const DeliveryVerification: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { contracts, activeRole, submitEvidence, releasePayment } = useContractStore()

  const contract = contracts.find((c) => c.id === id || c.code === id) || contracts[0]
  
  // Choose milestone 2 (or the first verifying/submitted milestone)
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>(
    contract.milestones.find((m) => m.status === 'verifying')?.id || contract.milestones[0]?.id || 'ms-1'
  )

  const selectedMilestone = contract.milestones.find((m) => m.id === selectedMilestoneId) || contract.milestones[0]

  // Form State
  const [repoUrl, setRepoUrl] = useState('https://github.com/devstudio/react-landing-verified')
  const [liveUrl, setLiveUrl] = useState('https://react-landing-demo.vercel.app')
  const [notes, setNotes] = useState('Completed Milestone 2: Strict TypeScript compiler run passed with zero errors. Lighthouse score on production build is 98/100.')
  const [isEvaluating, setIsEvaluating] = useState(false)

  const handleTriggerAI = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsEvaluating(true)
    await submitEvidence(contract.id, selectedMilestone.id, {
      contractId: contract.id,
      milestoneId: selectedMilestone.id,
      submittedBy: activeRole === 'supplier' ? contract.supplier.name : 'Tariro Moyo',
      description: notes,
      repoUrl,
      liveUrl,
    })
    setIsEvaluating(false)
  }

  const handleAuthorizeRelease = () => {
    releasePayment(contract.id, selectedMilestone.id)
  }

  const assessment = selectedMilestone?.assessment

  return (
    <div className="min-h-screen bg-[#F6F8FC] text-[#1A2940] flex flex-col font-sans">
      <Header />

      <main className="w-full pt-[68px] flex-1">
        <SandboxBanner />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
          {/* Breadcrumbs */}
          <div className="flex items-center justify-between">
            <Link
              to={ROUTES.CONTRACT_DETAIL(contract.id)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Contract {contract.code}</span>
            </Link>

            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-slate-500">AI Evaluation Engine: Gemini 1.5 Pro</span>
              <StatusBadge status={selectedMilestone?.status || 'verifying'} />
            </div>
          </div>

          {/* Page Heading */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-xs font-mono text-blue-600 font-semibold">
                <span>MILITARY-GRADE OBJECTIVITY</span>
                <span>•</span>
                <span>SOW CRITERIA GATE</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A2940]">
                Deliverable Evidence &amp; AI Verification
              </h1>
              <p className="text-xs sm:text-sm text-[#5D6B82] max-w-2xl">
                Submit repository artifacts, test logs, or preview URLs. Gemini AI evaluates delivery evidence against agreed acceptance criteria to authorize conditional PayPal release.
              </p>
            </div>

            {/* Milestone Selector Tabs */}
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 self-start">
              {contract.milestones.map((m, idx) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMilestoneId(m.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedMilestoneId === m.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  M{idx + 1}: {formatCurrency(m.amount)}
                </button>
              ))}
            </div>
          </div>

          {/* Grid Layout: Evidence Form (Left) & AI Verification Report (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 6 cols: Evidence Submission Form */}
            <div className="lg:col-span-6 bg-white rounded-2xl p-6 shadow-sm border border-[#DDE4EF] flex flex-col gap-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-bold text-[#1A2940]">
                    Submit Deliverables for M{contract.milestones.findIndex((m) => m.id === selectedMilestone.id) + 1}
                  </h3>
                </div>
                <span className="font-mono text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {formatCurrency(selectedMilestone.amount, selectedMilestone.currency)}
                </span>
              </div>

              <form onSubmit={handleTriggerAI} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#1A2940]">
                    GitHub Repository / Branch URL
                  </label>
                  <input
                    type="url"
                    required
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/org/repo"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-[#1A2940] focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#1A2940]">
                    Live Deployment / Preview URL
                  </label>
                  <input
                    type="url"
                    value={liveUrl}
                    onChange={(e) => setLiveUrl(e.target.value)}
                    placeholder="https://preview.vercel.app"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-[#1A2940] focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#1A2940]">
                    Delivery Notes &amp; Verification Evidence
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Describe specific features delivered, test runs, and where each criterion is implemented..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-[#1A2940] focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isEvaluating}
                  className="w-full h-11 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm shadow-blue-500/20 transition-all disabled:opacity-50"
                >
                  {isEvaluating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Gemini AI Verifying Deliverables...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Submit &amp; Trigger AI Verification</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Right 6 cols: AI Verification Report & Score Ring */}
            <div className="lg:col-span-6 bg-white rounded-2xl p-6 shadow-sm border border-[#DDE4EF] flex flex-col gap-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-bold text-[#1A2940]">
                    AI Verification Assessment Report
                  </h3>
                </div>
                <span className="font-mono text-xs text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  Model: Gemini 1.5 Pro
                </span>
              </div>

              {assessment ? (
                <div className="flex flex-col gap-5">
                  {/* Gauge Card */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-mono text-slate-500 uppercase font-semibold">
                        Overall Confidence Score
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-black font-mono text-slate-900">
                          {assessment.overallScore}%
                        </span>
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          Passed Benchmark (&gt;90%)
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">
                        Evaluated {new Date(assessment.assessedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="w-16 h-16 rounded-full bg-emerald-50 border-4 border-emerald-500 flex items-center justify-center text-emerald-700 font-mono font-bold text-sm">
                      {assessment.overallScore}%
                    </div>
                  </div>

                  {/* Summary Text */}
                  <div className="text-xs text-slate-700 bg-blue-50/60 p-3.5 rounded-xl border border-blue-200/60 leading-relaxed">
                    <strong className="text-blue-900 font-semibold block mb-1">
                      Synthesis Summary:
                    </strong>
                    {assessment.summaryAnalysis}
                  </div>

                  {/* Acceptance Criteria Breakdown */}
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold text-slate-800">
                      Criteria Audit Checklist:
                    </span>
                    <div className="flex flex-col gap-2">
                      {selectedMilestone.acceptanceCriteria?.map((c) => (
                        <div
                          key={c.id}
                          className="p-3 rounded-lg border border-slate-200 bg-white flex flex-col gap-1 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {c.status === 'pass' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                              )}
                              <span className="font-semibold text-slate-900">{c.title}</span>
                            </div>
                            <span className={`font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                              c.status === 'pass'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {c.status}
                            </span>
                          </div>
                          {c.evidenceMatchSnippet && (
                            <p className="text-[11px] text-slate-500 pl-6 italic">
                              "{c.evidenceMatchSnippet}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Settlement Authorization Button */}
                  {selectedMilestone.status !== 'settled' ? (
                    <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={handleAuthorizeRelease}
                        className="w-full h-11 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/30 transition-all"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Authorize PayPal Settlement Release ({formatCurrency(selectedMilestone.amount)})</span>
                      </button>
                      <span className="text-[10px] text-center text-slate-400 font-mono">
                        Triggers server-side PayPal Sandbox capture &amp; disbursement
                      </span>
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs font-semibold text-emerald-800 flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Milestone Settled &bull; Funds Released to Supplier</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                  <Clock className="w-8 h-8 text-slate-300" />
                  <span>No evaluation run yet for this milestone.</span>
                  <span>Submit evidence on the left to trigger automated AI verification.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
