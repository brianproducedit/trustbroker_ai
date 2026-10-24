import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
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
  Clock, 
  ExternalLink, 
  Globe,
  GitBranch
} from 'lucide-react'

export const DeliveryVerification: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { contracts, activeRole, submitEvidence, releasePayment } = useContractStore()

  const contract = contracts.find((c) => c.id === id || c.code === id) || contracts[0]
  
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>(
    contract.milestones.find((m) => m.status === 'verifying')?.id || contract.milestones[0]?.id || 'ms-1'
  )

  const selectedMilestone = contract.milestones.find((m) => m.id === selectedMilestoneId) || contract.milestones[0]

  // Form State
  const [repoUrl, setRepoUrl] = useState('https://github.com/devstudio/react-landing-verified')
  const [liveUrl, setLiveUrl] = useState('https://react-landing-demo.vercel.app')
  const [notes, setNotes] = useState('Completed Milestone: Strict TypeScript compile check passes cleanly with zero errors. Lighthouse score on production build is 98/100.')
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
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between">
          <Link
            to={ROUTES.CONTRACT_DETAIL(contract.id)}
            className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-mono transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Contract {contract.code}</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-slate-400">Gemini 1.5 Pro AI Engine</span>
            <StatusBadge status={selectedMilestone?.status || 'verifying'} />
          </div>
        </div>

        {/* Page Heading & Milestone Selector */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-xs font-mono text-blue-400 font-semibold">
              <span>DELIVERY INSPECTION BAY</span>
              <span>•</span>
              <span>OBJECTIVE SOW GATE</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {activeRole === 'buyer' 
                ? 'Inspect Deliverable Evidence & Release Payment' 
                : 'Submit Deliverable Evidence for AI Verification'}
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl">
              {activeRole === 'buyer'
                ? 'Review submitted code repositories and performance benchmarks. Gemini AI verifies compliance against agreed SOW criteria.'
                : 'Provide GitHub URLs, live preview deployments, or test outputs. Once Gemini AI confirms criteria pass, PayPal funds are released.'}
            </p>
          </div>

          {/* Milestone Selector Tabs */}
          <div className="flex items-center gap-1.5 bg-[#131B2E] p-1.5 rounded-xl border border-[#222A3D] self-start">
            {contract.milestones.map((m, idx) => (
              <button
                key={m.id}
                onClick={() => setSelectedMilestoneId(m.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedMilestoneId === m.id
                    ? activeRole === 'buyer'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-[#171F33]'
                }`}
              >
                M{idx + 1}: {formatCurrency(m.amount)}
              </button>
            ))}
          </div>
        </div>

        {/* Grid Layout: Evidence Form/Viewer (Left) & AI Verification Report (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 6 cols: Evidence Submission / Review */}
          <div className="lg:col-span-6 bg-[#131B2E] rounded-2xl p-6 border border-[#222A3D] flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#222A3D]">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-blue-400" />
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-200 font-bold">
                  {activeRole === 'supplier' ? 'Submit Deliverable Evidence' : 'Supplier Evidence Submission'}
                </h3>
              </div>
              <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                {formatCurrency(selectedMilestone.amount, selectedMilestone.currency)}
              </span>
            </div>

            {activeRole === 'supplier' ? (
              <form onSubmit={handleTriggerAI} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-200">
                    GitHub Repository / Branch URL
                  </label>
                  <input
                    type="url"
                    required
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/org/repo"
                    className="w-full bg-[#0E1528] border border-[#222A3D] rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-200">
                    Live Deployment / Preview URL
                  </label>
                  <input
                    type="url"
                    value={liveUrl}
                    onChange={(e) => setLiveUrl(e.target.value)}
                    placeholder="https://preview.vercel.app"
                    className="w-full bg-[#0E1528] border border-[#222A3D] rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-200">
                    Delivery Notes &amp; Verification Evidence
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Describe specific features delivered, test runs, and how criteria are met..."
                    className="w-full bg-[#0E1528] border border-[#222A3D] rounded-lg p-3 text-xs text-white focus:outline-none focus:border-blue-500 resize-none font-sans"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isEvaluating}
                  className="w-full h-11 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-900/30 transition-all disabled:opacity-50"
                >
                  {isEvaluating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Gemini AI Verifying Deliverables...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Submit &amp; Trigger AI Verification Gate</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="p-3.5 rounded-xl bg-[#0E1528] border border-[#222A3D] flex flex-col gap-2">
                  <span className="text-[11px] font-mono text-slate-400 uppercase">
                    Submitted Repository Artifact
                  </span>
                  <a
                    href={repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:underline flex items-center gap-1.5 font-mono"
                  >
                    <GitBranch className="w-3.5 h-3.5" />
                    <span>{repoUrl}</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </a>
                </div>

                <div className="p-3.5 rounded-xl bg-[#0E1528] border border-[#222A3D] flex flex-col gap-2">
                  <span className="text-[11px] font-mono text-slate-400 uppercase">
                    Live Preview Instance
                  </span>
                  <a
                    href={liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-400 hover:underline flex items-center gap-1.5 font-mono"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>{liveUrl}</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </a>
                </div>

                <div className="p-3.5 rounded-xl bg-[#0E1528] border border-[#222A3D] flex flex-col gap-1.5">
                  <span className="text-[11px] font-mono text-slate-400 uppercase">
                    Supplier Delivery Notes
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed italic">
                    "{notes}"
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right 6 cols: AI Verification Report & Score Ring */}
          <div className="lg:col-span-6 bg-[#131B2E] rounded-2xl p-6 border border-[#222A3D] flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#222A3D]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-200 font-bold">
                  AI Verification Assessment Report
                </h3>
              </div>
              <span className="font-mono text-xs text-indigo-300 font-semibold bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/60">
                Model: Gemini 1.5 Pro
              </span>
            </div>

            {assessment ? (
              <div className="flex flex-col gap-5">
                {/* Gauge Card */}
                <div className="bg-[#0E1528] p-4 rounded-xl border border-[#222A3D] flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold">
                      Overall Confidence Score
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-black font-mono text-white">
                        {assessment.overallScore}%
                      </span>
                      <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/60">
                        Passed Threshold (&gt;90%)
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
                      Evaluated on {new Date(assessment.assessedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="w-16 h-16 rounded-full bg-emerald-950/40 border-4 border-emerald-500 flex items-center justify-center text-emerald-400 font-mono font-bold text-sm">
                    {assessment.overallScore}%
                  </div>
                </div>

                {/* Summary Text */}
                <div className="text-xs text-slate-300 bg-blue-950/40 p-3.5 rounded-xl border border-blue-900/40 leading-relaxed">
                  <strong className="text-blue-300 font-semibold block mb-1">
                    Gemini Synthesis Analysis:
                  </strong>
                  {assessment.summaryAnalysis}
                </div>

                {/* Acceptance Criteria Breakdown */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-slate-200">
                    Acceptance Criteria Audit:
                  </span>
                  <div className="flex flex-col gap-2">
                    {selectedMilestone.acceptanceCriteria?.map((c) => (
                      <div
                        key={c.id}
                        className="p-3 rounded-lg border border-[#222A3D] bg-[#0E1528] flex flex-col gap-1 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {c.status === 'pass' ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                            ) : (
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                            )}
                            <span className="font-semibold text-white">{c.title}</span>
                          </div>
                          <span className={`font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                            c.status === 'pass'
                              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                              : 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                          }`}>
                            {c.status}
                          </span>
                        </div>
                        {c.evidenceMatchSnippet && (
                          <p className="text-[11px] text-slate-400 pl-6 italic">
                            "{c.evidenceMatchSnippet}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Settlement Authorization Button */}
                {selectedMilestone.status !== 'settled' ? (
                  activeRole === 'buyer' ? (
                    <div className="pt-2 border-t border-[#222A3D] flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={handleAuthorizeRelease}
                        className="w-full h-11 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-900/40 transition-all"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Authorize PayPal Settlement Release ({formatCurrency(selectedMilestone.amount)})</span>
                      </button>
                      <span className="text-[10px] text-center text-slate-400 font-mono">
                        Releases pre-authorized funds from PayPal Sandbox holding reserve
                      </span>
                    </div>
                  ) : (
                    <div className="p-3 bg-blue-950/40 border border-blue-800/40 rounded-xl text-center text-xs font-semibold text-blue-300 flex items-center justify-center gap-2">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span>Verification passed &bull; Waiting for client release authorization</span>
                    </div>
                  )
                ) : (
                  <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-center text-xs font-semibold text-emerald-300 flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Milestone Settled &bull; Funds Released to Supplier via PayPal Sandbox</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                <Clock className="w-8 h-8 text-slate-600" />
                <span>No evaluation run yet for this milestone.</span>
                <span>Submit deliverables on the left to trigger automated AI verification.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
