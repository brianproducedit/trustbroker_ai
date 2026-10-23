import React, { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { SandboxBanner } from '@/components/common/SandboxBanner'
import { ROUTES } from '@/constants'
import { Link, useNavigate } from 'react-router-dom'
import { useContractStore } from '@/hooks/useContractStore'
import { 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Layers, 
  FileText, 
  Lock, 
  Users, 
  ChevronRight,
  TrendingUp,
  CreditCard,
  Bot
} from 'lucide-react'

export const Landing: React.FC = () => {
  const navigate = useNavigate()
  const { createContractDraft } = useContractStore()
  
  const [briefInput, setBriefInput] = useState(
    'I need a high-converting React 18 landing page with Tailwind CSS, strict TypeScript checks, and automated Lighthouse performance verification (>95). Delivery in 14 days, split into 3 clear milestones.'
  )
  const [isGenerating, setIsGenerating] = useState(false)

  const quickTemplates = [
    {
      title: 'React Web App',
      prompt: 'I need a responsive React 18 web application with Tailwind CSS, TypeScript, and a working PayPal Sandbox checkout flow. Delivery in 14 days, 3 milestones.',
    },
    {
      title: 'Mobile UI Kit',
      prompt: 'Design a comprehensive mobile UI kit in Figma with light and dark mode tokens, 20 reusable screens, and exportable SVG assets.',
    },
    {
      title: 'FastAPI Microservice',
      prompt: 'Build a Python FastAPI backend with Supabase database integration, JWT authentication, and automated OpenAPI documentation.',
    },
  ]

  const handleStartBrief = () => {
    setIsGenerating(true)
    setTimeout(() => {
      const contractId = createContractDraft(
        'Custom Web Project (AI Drafted)',
        briefInput,
        [
          {
            id: 'm-ai-1',
            title: 'M1: Architecture, Tokens & Wireframes',
            description: 'Core wireframe schemas and Tailwind design token structure.',
            amount: 700,
            currency: 'USD',
            deadline: '2026-11-01',
            status: 'pending',
            paymentStatus: 'not_started',
            acceptanceCriteria: [
              {
                id: 'ca-1',
                title: 'Design token specification',
                description: 'Tailwind config matches brand guidelines.',
                status: 'pending',
              },
            ],
          },
          {
            id: 'm-ai-2',
            title: 'M2: Core Frontend Implementation',
            description: 'React components with strict TypeScript compile checks.',
            amount: 1500,
            currency: 'USD',
            deadline: '2026-11-10',
            status: 'pending',
            paymentStatus: 'not_started',
            acceptanceCriteria: [
              {
                id: 'ca-2',
                title: 'Zero TypeScript errors',
                description: 'Build passes tsc check cleanly.',
                status: 'pending',
              },
            ],
          },
        ]
      )
      setIsGenerating(false)
      navigate(ROUTES.CONTRACT_DETAIL(contractId))
    }, 800)
  }

  return (
    <div className="min-h-screen bg-[#F6F8FC] text-[#1A2940] flex flex-col font-sans">
      <Header />

      {/* Main Container */}
      <main className="w-full pt-[68px] flex-1">
        {/* Top Environment Bar */}
        <section className="w-full bg-[#0E1B35] text-white py-2 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-blue-300 font-medium uppercase tracking-wider">
                PayPal AI Hackathon 2026
              </span>
              <span className="text-slate-500">/</span>
              <span className="text-slate-300">PayPal Sandbox + Gemini AI Coordination Active</span>
            </div>
            <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
              <span className="flex items-center gap-1 text-slate-300">
                <Lock className="w-3.5 h-3.5 text-blue-400" /> Tamper-Proof Audit Logging
              </span>
              <span className="hidden md:inline text-slate-400">Response Latency: &lt;200ms</span>
            </div>
          </div>
        </section>

        {/* Hero Section */}
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left: Headline & AI Brief Card */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {/* Trust Pill */}
              <div className="inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="font-mono text-xs font-semibold uppercase tracking-wide">
                  AI-Assisted Milestone Verification • Sandbox Prototype
                </span>
              </div>

              {/* Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#1A2940] leading-[1.15]">
                Cross-border digital work,{' '}
                <span className="text-blue-600">clearly agreed</span> and easier to verify.
              </h1>

              {/* Supporting copy */}
              <p className="text-base sm:text-lg text-[#5D6B82] leading-relaxed max-w-2xl">
                Turn a natural language project brief into an objective Statement of Work. Stage funds via PayPal Sandbox, verify delivery evidence with AI, and authorize releases with complete audit confidence.
              </p>

              {/* Interactive Brief Card */}
              <div className="w-full bg-white rounded-xl p-5 shadow-sm border border-[#DDE4EF] flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <label htmlFor="brief-input" className="text-sm font-semibold text-[#1A2940] flex items-center gap-2">
                    <Bot className="w-4 h-4 text-blue-600" />
                    <span>What project do you need delivered?</span>
                  </label>
                  <span className="font-mono text-[11px] text-[#8C9BAE]">
                    Natural Language → SOW
                  </span>
                </div>

                <div className="relative">
                  <textarea
                    id="brief-input"
                    rows={4}
                    value={briefInput}
                    onChange={(e) => setBriefInput(e.target.value)}
                    placeholder="Describe your project, required deliverables, deadlines, and milestone budgets..."
                    className="w-full rounded-lg bg-slate-50 p-3.5 text-sm text-[#1A2940] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all border border-slate-200 resize-none font-sans"
                  />
                </div>

                {/* Quick Templates */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-[#5D6B82] font-medium">Quick prompt templates:</span>
                  <div className="flex flex-wrap gap-2">
                    {quickTemplates.map((t) => (
                      <button
                        key={t.title}
                        type="button"
                        onClick={() => setBriefInput(t.prompt)}
                        className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-mono transition-colors border border-slate-200/60"
                      >
                        + {t.title}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action CTA */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                  <span className="text-xs text-slate-500 font-mono">
                    Generates verifiable milestones with Gemini 1.5 Pro
                  </span>
                  <button
                    type="button"
                    onClick={handleStartBrief}
                    disabled={isGenerating || !briefInput.trim()}
                    className="w-full sm:w-auto h-10 px-5 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition-all disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <Sparkles className="w-4 h-4 animate-spin" />
                        <span>Synthesizing SOW...</span>
                      </>
                    ) : (
                      <>
                        <span>Generate SOW with AI</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Inspection Engine Pipeline Preview */}
            <div className="lg:col-span-5 flex flex-col gap-5">
              <div className="bg-[#0E1B35] rounded-xl p-5 text-white shadow-lg border border-slate-800 flex flex-col gap-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-medium">
                      Inspection Engine Pipeline
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                    Live Demo
                  </span>
                </div>

                {/* 3 Stages */}
                <div className="flex flex-col gap-3">
                  {/* Stage 1 */}
                  <div className="bg-[#17233F] p-3.5 rounded-lg border border-slate-700/60 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold mt-0.5">
                      ✓
                    </div>
                    <div className="flex flex-col gap-1 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white">Stage 1: Agree Scope</span>
                        <span className="text-[10px] font-mono text-emerald-400">Signed ✓</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-tight">
                        Both parties accept digital terms. Criteria converted into machine-testable benchmarks.
                      </p>
                    </div>
                  </div>

                  {/* Stage 2 */}
                  <div className="bg-[#17233F] p-3.5 rounded-lg border border-slate-700/60 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold mt-0.5">
                      ✓
                    </div>
                    <div className="flex flex-col gap-1 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white">Stage 2: Stage Payment</span>
                        <span className="text-[10px] font-mono text-blue-400">PayPal Sandbox Staged</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-tight">
                        $3,200 USD pre-authorized via PayPal Orders API. Reserved safely until criteria pass.
                      </p>
                    </div>
                  </div>

                  {/* Stage 3 */}
                  <div className="bg-[#1A2645] p-3.5 rounded-lg border-2 border-blue-500 flex items-start gap-3 shadow-md">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold mt-0.5 animate-pulse">
                      3
                    </div>
                    <div className="flex flex-col gap-1 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white">Stage 3: Review Delivery</span>
                        <span className="text-[10px] font-mono text-amber-300">In Verification</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-tight">
                        Gemini assesses repository artifacts, builds, and test benchmarks against agreed criteria.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Link to Contract Demo */}
                <Link
                  to={ROUTES.CONTRACT_DETAIL('TB-2026-084')}
                  className="w-full mt-1 py-2.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <span>Inspect Active Contract (TB-2026-084)</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Sandbox notice */}
              <SandboxBanner compact />
            </div>
          </div>
        </section>

        {/* Metrics Strip */}
        <section className="w-full bg-white border-y border-[#DDE4EF] py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="flex flex-col gap-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-blue-600 font-mono">100%</span>
                <span className="text-xs sm:text-sm font-semibold text-[#1A2940]">Verified Deliverables</span>
                <span className="text-[11px] text-[#5D6B82]">Checked against written SOW criteria</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#0E1B35] font-mono">&lt; 3 Min</span>
                <span className="text-xs sm:text-sm font-semibold text-[#1A2940]">Verification Turnaround</span>
                <span className="text-[11px] text-[#5D6B82]">Instant automated assessment report</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-mono">$0</span>
                <span className="text-xs sm:text-sm font-semibold text-[#1A2940]">Unresolved Disputes</span>
                <span className="text-[11px] text-[#5D6B82]">Objective evidence replaces opinion</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-indigo-600 font-mono">Sandbox</span>
                <span className="text-xs sm:text-sm font-semibold text-[#1A2940]">PayPal Orders API</span>
                <span className="text-[11px] text-[#5D6B82]">Full mock checkout &amp; disbursements</span>
              </div>
            </div>
          </div>
        </section>

        {/* Three Pillars Section */}
        <section id="how-it-works" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col items-center text-center gap-3 mb-12">
            <span className="font-mono text-xs font-semibold text-blue-600 uppercase tracking-wider">
              How TrustBroker Works
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1A2940]">
              Built to make cross-border digital collaboration fearless.
            </h2>
            <p className="text-sm sm:text-base text-[#5D6B82] max-w-2xl">
              Eliminate the "pay first or deliver first" standoff. TrustBroker provides an objective referee for both buyer and supplier.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pillar 1 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-[#DDE4EF] flex flex-col justify-between">
              <div className="flex flex-col gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-[#1A2940]">1. Agree Scope Clearly</h3>
                <p className="text-sm text-[#5D6B82] leading-relaxed">
                  Turn casual chats or brief descriptions into an explicit, milestone-driven SOW with testable acceptance criteria agreed by both sides.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-mono text-blue-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>AI Statement of Work drafting</span>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-[#DDE4EF] flex flex-col justify-between">
              <div className="flex flex-col gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-[#1A2940]">2. Stage Funds Safely</h3>
                <p className="text-sm text-[#5D6B82] leading-relaxed">
                  Buyer stages funds via PayPal Sandbox. Supplier knows the money is committed before spending weeks on delivery.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-mono text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>PayPal Orders API Sandbox</span>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-[#DDE4EF] flex flex-col justify-between">
              <div className="flex flex-col gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-[#1A2940]">3. Verify Evidence with AI</h3>
                <p className="text-sm text-[#5D6B82] leading-relaxed">
                  Supplier submits code, preview URLs, or test outputs. Gemini evaluates deliverables against agreed SOW criteria and triggers release.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-mono text-indigo-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Automated release authorization</span>
              </div>
            </div>
          </div>
        </section>

        {/* Buyer vs Supplier Value Cards */}
        <section id="for-buyers" className="w-full bg-[#F1F5FF] py-16 border-t border-blue-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* For Buyers */}
              <div className="bg-white rounded-xl p-7 shadow-sm border border-blue-200 flex flex-col gap-4">
                <div className="flex items-center gap-2 text-blue-600">
                  <Users className="w-5 h-5" />
                  <span className="font-mono text-xs uppercase tracking-wider font-semibold">For Buyers</span>
                </div>
                <h3 className="text-xl font-bold text-[#1A2940]">
                  Pay only when milestones meet agreed quality benchmarks.
                </h3>
                <ul className="flex flex-col gap-2.5 text-sm text-[#5D6B82]">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span>No surprise invoices or vague delivery excuses</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span>AI reviews code quality, tests, and metrics automatically</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span>PayPal Sandbox safety with clear release authorization</span>
                  </li>
                </ul>
              </div>

              {/* For Suppliers */}
              <div id="for-suppliers" className="bg-white rounded-xl p-7 shadow-sm border border-blue-200 flex flex-col gap-4">
                <div className="flex items-center gap-2 text-emerald-600">
                  <TrendingUp className="w-5 h-5" />
                  <span className="font-mono text-xs uppercase tracking-wider font-semibold">For Suppliers &amp; Freelancers</span>
                </div>
                <h3 className="text-xl font-bold text-[#1A2940]">
                  Get paid promptly once deliverables satisfy the agreed SOW.
                </h3>
                <ul className="flex flex-col gap-2.5 text-sm text-[#5D6B82]">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span>Funds are committed in advance before you begin development</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span>Shielded from endless scope-creep or subjective rejections</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span>Immutable audit log creates verifiable global reputation</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Live API Code Showcase */}
        <section className="w-full bg-[#0E1B35] text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 flex flex-col gap-4">
                <span className="font-mono text-xs text-blue-400 uppercase tracking-wider font-semibold">
                  Developer Integration
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">
                  Programmatic verification for agentic commerce.
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Trigger SOW generation, submit evidence hashes, and query payment authorization status via standard REST APIs.
                </p>
                <div className="pt-2">
                  <Link
                    to={ROUTES.DEVELOPER_PORTAL}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-medium transition-colors"
                  >
                    <span>View API Documentation</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Code Snippet Box */}
              <div className="lg:col-span-7 bg-[#070D1A] rounded-xl p-4 sm:p-5 border border-slate-800 font-mono text-xs shadow-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                    <span className="ml-2 text-slate-300 font-sans text-xs">POST /api/deliveries/verify</span>
                  </div>
                  <span className="text-emerald-400">200 OK</span>
                </div>
                <pre className="pt-4 text-slate-300 overflow-x-auto leading-relaxed">
{`{
  "contract_id": "TB-2026-084",
  "milestone_id": "ms-2",
  "verification_result": {
    "overall_score": 94,
    "gate_status": "RELEASE_AUTHORIZED",
    "evaluated_by": "Gemini 1.5 Pro",
    "criteria_passed": 3,
    "criteria_failed": 0,
    "paypal_release_payload": {
      "order_id": "PP-84920491",
      "capture_id": "CAP-9182301",
      "amount": "1400.00 USD",
      "recipient": "devstudio@harare.zw"
    }
  }
}`}
                </pre>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
