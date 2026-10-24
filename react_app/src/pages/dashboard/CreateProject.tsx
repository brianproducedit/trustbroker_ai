import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useContractStore } from '@/hooks/useContractStore'
import { ROUTES } from '@/constants'
import { formatCurrency } from '@/lib/utils'
import { 
  Bot, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  ShieldCheck, 
  Calendar
} from 'lucide-react'

export const CreateProject: React.FC = () => {
  const navigate = useNavigate()
  const { createContractDraft } = useContractStore()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [brief, setBrief] = useState(
    'I need a high-converting React 18 landing page with Tailwind CSS, strict TypeScript checks, and automated Lighthouse performance verification (>95). Delivery in 14 days, split into 3 clear milestones.'
  )
  const [isGenerating, setIsGenerating] = useState(false)
  const [projectTitle, setProjectTitle] = useState('High-Converting React 18 Landing Page')
  const [supplierEmail, setSupplierEmail] = useState('tariro@devstudio.co.zw')
  const [totalBudget, setTotalBudget] = useState(3200)

  // Synthesized milestones preview
  const [milestones] = useState([
    {
      id: 'm1',
      title: 'M1: Architecture, Tokens & Responsive Wireframes',
      description: 'Lexend font family tokens, Figma component hierarchy, and mobile/desktop wireframes.',
      amount: 800,
      deadline: '2026-11-02',
    },
    {
      id: 'm2',
      title: 'M2: Core React Implementation & TypeScript Audit',
      description: 'Clean React 19 + TypeScript components with zero errors and Lighthouse benchmark >95.',
      amount: 1400,
      deadline: '2026-11-09',
    },
    {
      id: 'm3',
      title: 'M3: PayPal Sandbox Integration & Deployment',
      description: 'Working PayPal Orders API sandbox checkout and live cloud production deployment.',
      amount: 1000,
      deadline: '2026-11-16',
    },
  ])

  const quickTemplates = [
    {
      title: 'React Web App',
      text: 'Build a responsive React 19 web app with Tailwind CSS, TypeScript, and a working PayPal Sandbox checkout flow. Delivery in 14 days, 3 milestones.',
      budget: 3200,
    },
    {
      title: 'Mobile UI Kit',
      text: 'Design a comprehensive mobile UI kit in Figma with light and dark mode tokens, 20 reusable screens, and exportable SVG assets.',
      budget: 2400,
    },
    {
      title: 'FastAPI Backend',
      text: 'Build a Python FastAPI backend with Supabase database integration, JWT authentication, and automated OpenAPI documentation.',
      budget: 1850,
    },
  ]

  const handleSynthesize = () => {
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      setStep(2)
    }, 700)
  }

  const handleFinalizeContract = () => {
    const formattedMilestones = milestones.map((m) => ({
      id: `ms-${Date.now()}-${m.id}`,
      title: m.title,
      description: m.description,
      amount: m.amount,
      currency: 'USD',
      deadline: m.deadline,
      status: 'pending' as const,
      paymentStatus: 'not_started' as const,
      acceptanceCriteria: [
        {
          id: `crit-${Date.now()}-1`,
          title: 'Automated Build & Lint Check',
          description: 'Code deliverables pass all build and static analysis tests.',
          status: 'pending' as const,
        },
        {
          id: `crit-${Date.now()}-2`,
          title: 'Functional SOW Compliance',
          description: 'Deliverables verified against agreed milestone specification.',
          status: 'pending' as const,
        },
      ],
    }))

    const contractId = createContractDraft(projectTitle, brief, formattedMilestones)
    navigate(ROUTES.CONTRACT_DETAIL(contractId))
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        {/* Wizard Stepper Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#222A3D]">
          <div>
            <span className="text-[10px] font-mono uppercase text-blue-400 font-semibold tracking-wider">
              Client SOW Creator
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Create a New Project Statement of Work
            </h1>
          </div>

          {/* Steps Indicator */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className={`px-2.5 py-1 rounded-md ${step === 1 ? 'bg-blue-600 text-white font-bold' : 'bg-[#171F33] text-slate-400'}`}>
              1. Brief
            </span>
            <span className="text-slate-600">&rarr;</span>
            <span className={`px-2.5 py-1 rounded-md ${step === 2 ? 'bg-blue-600 text-white font-bold' : 'bg-[#171F33] text-slate-400'}`}>
              2. SOW Scope
            </span>
            <span className="text-slate-600">&rarr;</span>
            <span className={`px-2.5 py-1 rounded-md ${step === 3 ? 'bg-blue-600 text-white font-bold' : 'bg-[#171F33] text-slate-400'}`}>
              3. Assign &amp; Reserve
            </span>
          </div>
        </div>

        {/* STEP 1: Natural Language Brief */}
        {step === 1 && (
          <div className="bg-[#131B2E] rounded-2xl border border-[#222A3D] p-6 flex flex-col gap-5">
            <div className="flex items-center gap-2.5 text-blue-400">
              <Bot className="w-5 h-5" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Step 1: Describe What You Need Delivered
              </h2>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Describe the project in plain English. Gemini 1.5 Pro will structure it into machine-testable milestones, criteria, and sandbox holding allocations.
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-200">Project Title</label>
              <input
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                className="w-full bg-[#0E1528] border border-[#222A3D] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                placeholder="e.g. Next.js SaaS Landing Page"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-200">Project Requirements &amp; Scope</label>
              <textarea
                rows={5}
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                className="w-full bg-[#0E1528] border border-[#222A3D] rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500 resize-none font-sans"
                placeholder="Explain the required stack, deliverable files, performance goals, and delivery timeframe..."
              />
            </div>

            {/* Quick Templates */}
            <div className="flex flex-col gap-2">
              <span className="text-[11px] text-slate-400 font-mono font-medium">Quick prompt templates:</span>
              <div className="flex flex-wrap gap-2">
                {quickTemplates.map((t) => (
                  <button
                    key={t.title}
                    type="button"
                    onClick={() => {
                      setBrief(t.text)
                      setProjectTitle(t.title)
                      setTotalBudget(t.budget)
                    }}
                    className="px-2.5 py-1 rounded bg-[#171F33] hover:bg-blue-900/40 text-slate-300 hover:text-blue-300 border border-slate-700/60 text-xs font-mono transition-colors"
                  >
                    + {t.title} ({formatCurrency(t.budget)})
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-[#222A3D] flex justify-end">
              <button
                type="button"
                onClick={handleSynthesize}
                disabled={isGenerating || !brief.trim()}
                className="py-2.5 px-5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-md shadow-blue-600/30 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>Gemini AI Drafting SOW...</span>
                  </>
                ) : (
                  <>
                    <span>Generate SOW Milestones</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: SOW Review & Milestones */}
        {step === 2 && (
          <div className="bg-[#131B2E] rounded-2xl border border-[#222A3D] p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#222A3D]">
              <div className="flex items-center gap-2 text-indigo-400">
                <Sparkles className="w-5 h-5" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Step 2: Review AI-Synthesized Milestones
                </h2>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-800/60">
                Total: {formatCurrency(totalBudget)} USD
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {milestones.map((m, idx) => (
                <div
                  key={m.id}
                  className="p-4 rounded-xl bg-[#0E1528] border border-[#222A3D] flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">
                      0{idx + 1}. {m.title}
                    </span>
                    <span className="font-mono text-xs font-bold text-emerald-400">
                      {formatCurrency(m.amount)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{m.description}</p>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500 pt-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Target Delivery: {m.deadline}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-[#222A3D] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-2 px-4 rounded-lg bg-[#171F33] text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Brief</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="py-2.5 px-5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-md shadow-blue-600/30"
              >
                <span>Proceed to Supplier Assignment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Assign Supplier & Staging Notice */}
        {step === 3 && (
          <div className="bg-[#131B2E] rounded-2xl border border-[#222A3D] p-6 flex flex-col gap-5">
            <div className="flex items-center gap-2 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Step 3: Assign Supplier &amp; Pre-Authorize Reserve
              </h2>
            </div>

            <div className="bg-[#171F33] p-4 rounded-xl border border-blue-900/40 flex flex-col gap-3">
              <span className="text-xs font-semibold text-slate-200">Target Supplier Profile</span>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600/30 border border-emerald-500 text-emerald-300 flex items-center justify-center font-bold text-xs">
                  TM
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Tariro Moyo (DevStudio Harare)</h4>
                  <span className="text-[11px] text-slate-400 font-mono">tariro@devstudio.co.zw &bull; Zimbabwe</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-200">Confirm Supplier Email</label>
              <input
                type="email"
                value={supplierEmail}
                onChange={(e) => setSupplierEmail(e.target.value)}
                className="w-full bg-[#0E1528] border border-[#222A3D] rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-800/40 text-xs text-slate-300 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <strong className="text-blue-300 font-semibold">How Conditional Payment Works:</strong>
                <span>
                  Once created, you will stage <strong>{formatCurrency(totalBudget)} USD</strong> into the PayPal Sandbox holding reserve. The supplier will review and accept the SOW. When they submit work, Gemini AI verifies the criteria before any disbursement is released.
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#222A3D] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="py-2 px-4 rounded-lg bg-[#171F33] text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Scope</span>
              </button>
              <button
                type="button"
                onClick={handleFinalizeContract}
                className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-md shadow-emerald-900/40"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Create SOW &amp; Open Escrow Checkout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
