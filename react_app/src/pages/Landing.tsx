import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ROUTES } from '@/constants'
import { 
  Bot, 
  CreditCard, 
  CheckCircle2, 
  Zap, 
  ArrowRight, 
  Lock, 
  ChevronRight, 
  Sparkles,
  Building2,
  Globe2
} from 'lucide-react'

export const Landing: React.FC = () => {
  const navigate = useNavigate()

  const [briefInput, setBriefInput] = useState(
    'I need a high-converting React 18 landing page with Tailwind CSS, strict TypeScript checks, and automated Lighthouse performance verification (>95). Delivery in 14 days, split into 3 clear milestones.'
  )

  const quickTemplates = [
    {
      title: 'React 19 Web App',
      prompt: 'Build a responsive React 19 web app with Tailwind CSS, TypeScript, and a working PayPal Sandbox checkout flow. Delivery in 14 days, 3 milestones.',
    },
    {
      title: 'Figma UI Design System',
      prompt: 'Design a comprehensive mobile and desktop UI kit in Figma with dark mode tokens, 25 components, and exportable SVG assets.',
    },
    {
      title: 'FastAPI Microservice',
      prompt: 'Build a Python FastAPI backend with JWT authentication, PostgreSQL integration, and automated OpenAPI documentation.',
    },
  ]

  const handleLaunchWizard = () => {
    navigate(`/sign-in?role=buyer&redirect=/dashboard/create-project`)
  }

  return (
    <div className="min-h-screen bg-[#F6F8FC] text-[#1A2940] flex flex-col font-sans">
      <Header />

      <main className="w-full pt-[68px] flex-1">
        {/* Top Hackathon Banner */}
        <section className="w-full bg-[#0E1B35] text-white py-2 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-blue-300 font-semibold uppercase tracking-wider">
                PayPal AI Hackathon 2026
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300">PayPal Orders v2 Sandbox + Gemini 1.5 Pro</span>
            </div>
            <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
              <span className="flex items-center gap-1 text-slate-300">
                <Lock className="w-3.5 h-3.5 text-blue-400" /> Tamper-Proof SHA-256 Ledger
              </span>
              <span className="hidden md:inline text-slate-400">Release Latency: ~3.8s</span>
            </div>
          </div>
        </section>

        {/* Hero Section */}
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto gap-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>AI-POWERED CONDITIONAL ESCROW PLATFORM</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#1A2940] leading-[1.12]">
              The Freelance Trust Dilemma, <br />
              <span className="text-blue-600">Solved by AI &amp; PayPal.</span>
            </h1>

            <p className="text-base sm:text-lg text-[#5D6B82] leading-relaxed max-w-2xl">
              Clients fear paying first for broken deliverables. Freelancers fear working first without guaranteed payment. <strong>TrustBroker AI</strong> coordinates the middle with automated milestone gating.
            </p>

            {/* Dual 1-Click Persona Demo Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                to="/sign-in?role=buyer&redirect=/dashboard"
                className="h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/25 transition-all flex items-center gap-2"
              >
                <Building2 className="w-4 h-4 text-blue-200" />
                <span>Launch Buyer Demo (Elena - Acme Global)</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/sign-in?role=supplier&redirect=/dashboard"
                className="h-12 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-500/25 transition-all flex items-center gap-2"
              >
                <Globe2 className="w-4 h-4 text-emerald-200" />
                <span>Launch Supplier Demo (Tariro - DevStudio)</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* 4-Step Interactive Visual Flow */}
        <section className="w-full bg-white border-y border-[#DDE4EF] py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="font-mono text-xs font-semibold text-blue-600 uppercase tracking-wider">
                How It Works in 4 Steps
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1A2940] mt-1">
                Zero Uncertainty. Total Protection.
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Step 1 */}
              <div className="p-6 rounded-xl bg-[#F8FAFC] border border-slate-200 flex flex-col gap-3 hover:border-blue-300 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    STEP 01
                  </span>
                  <Bot className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-base font-bold text-slate-900">AI Synthesizes SOW</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Natural language project briefs are converted into testable milestones with rigid, unambiguous pass/fail criteria.
                </p>
                <span className="text-[11px] font-mono text-blue-600 mt-auto pt-2">
                  Gemini 1.5 Pro JSON Schema
                </span>
              </div>

              {/* Step 2 */}
              <div className="p-6 rounded-xl bg-[#F8FAFC] border border-slate-200 flex flex-col gap-3 hover:border-emerald-300 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                    STEP 02
                  </span>
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Stage PayPal Reserve</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Client pre-authorizes milestone funds in PayPal Orders Sandbox. Freelancers see 100% committed escrow before coding.
                </p>
                <span className="text-[11px] font-mono text-emerald-600 mt-auto pt-2">
                  PayPal Orders API (Capture intent)
                </span>
              </div>

              {/* Step 3 */}
              <div className="p-6 rounded-xl bg-[#F8FAFC] border border-slate-200 flex flex-col gap-3 hover:border-indigo-300 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    STEP 03
                  </span>
                  <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Automated AI Verification</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Supplier submits GitHub repo and staging URL. Gemini executes automated TypeScript checks and performance score audits.
                </p>
                <span className="text-[11px] font-mono text-indigo-600 mt-auto pt-2">
                  Multi-Modal Code Audit Gate
                </span>
              </div>

              {/* Step 4 */}
              <div className="p-6 rounded-xl bg-[#F8FAFC] border border-slate-200 flex flex-col gap-3 hover:border-teal-300 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded">
                    STEP 04
                  </span>
                  <Zap className="w-5 h-5 text-teal-600" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Instant PayPal Release</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Once criteria pass, the PayPal capture webhook triggers immediately. Payout dispatches in ~3.8 seconds with SHA-256 receipt.
                </p>
                <span className="text-[11px] font-mono text-teal-600 mt-auto pt-2">
                  Zero Holdback Period
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive SOW Draft Showcase */}
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#DDE4EF] shadow-sm flex flex-col lg:flex-row items-center gap-8">
            <div className="flex-1 flex flex-col gap-4">
              <div className="flex items-center gap-2 text-xs font-mono text-blue-600 font-semibold uppercase">
                <Bot className="w-4 h-4" />
                <span>INTERACTIVE SOW DRAFT ENGINE</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#1A2940]">
                Turn your natural language brief into testable criteria.
              </h2>
              <p className="text-sm text-[#5D6B82] leading-relaxed">
                Try a quick sample prompt or write your own. Our AI parses technical deliverables, allocates budgets, and schedules milestone deadlines automatically.
              </p>

              <div className="flex flex-col gap-2 pt-1">
                <span className="text-xs font-medium text-slate-500">Quick templates:</span>
                <div className="flex flex-wrap gap-2">
                  {quickTemplates.map((t) => (
                    <button
                      key={t.title}
                      type="button"
                      onClick={() => setBriefInput(t.prompt)}
                      className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-mono transition-colors border border-slate-200"
                    >
                      + {t.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="w-full lg:w-1/2 bg-[#0E1B35] rounded-xl p-5 border border-slate-800 text-white flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-mono text-blue-400 font-semibold">Project Brief</span>
                <span className="text-[10px] font-mono text-slate-400">Gemini 1.5 Pro</span>
              </div>

              <textarea
                rows={4}
                value={briefInput}
                onChange={(e) => setBriefInput(e.target.value)}
                className="w-full bg-[#17233F] rounded-lg p-3 text-xs text-white placeholder-slate-400 border border-slate-700 focus:outline-none focus:border-blue-500 transition-colors resize-none font-sans"
              />

              <button
                type="button"
                onClick={handleLaunchWizard}
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-md shadow-blue-600/25"
              >
                <span>Synthesize SOW &amp; Stage Reserve</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* Active Sandbox Contracts Preview */}
        <section className="w-full bg-[#F6F8FC] py-12 border-t border-[#DDE4EF]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h3 className="text-xl font-bold text-[#1A2940]">Live Contracts in Sandbox</h3>
                <p className="text-xs text-[#5D6B82]">Real-time audit of active cross-border milestone contracts.</p>
              </div>
              <Link
                to="/sign-in?role=buyer&redirect=/dashboard"
                className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                <span>Open Full Transaction Ledger</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contract 1 Card */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between gap-4 hover:border-blue-300 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-600">TB-2026-084</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        In Verification
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">
                      Design and deliver production-grade responsive website
                    </h4>
                  </div>
                  <span className="font-mono text-sm font-bold text-slate-900">$3,200 USD</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-100 font-mono">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Client:</span>
                    <span className="text-slate-700 font-medium">Acme Global (USA)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Supplier:</span>
                    <span className="text-slate-700 font-medium">DevStudio Harare (ZW)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-emerald-600 font-mono font-semibold">
                    $1,800 Staged in PayPal
                  </span>
                  <Link
                    to={ROUTES.CONTRACT_DETAIL('contract-1')}
                    className="text-xs text-blue-600 font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    <span>Inspect Milestones</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* Contract 2 Card */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between gap-4 hover:border-blue-300 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-600">TB-2026-092</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Active Contract
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">
                      Fintech Analytics API &amp; Webhook Integration
                    </h4>
                  </div>
                  <span className="font-mono text-sm font-bold text-slate-900">$4,500 USD</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-100 font-mono">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Client:</span>
                    <span className="text-slate-700 font-medium">GlobalPay Tech (UK)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Supplier:</span>
                    <span className="text-slate-700 font-medium">Nairobi Code Labs (KE)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-emerald-600 font-mono font-semibold">
                    $4,500 Staged in PayPal
                  </span>
                  <Link
                    to={ROUTES.CONTRACT_DETAIL('contract-2')}
                    className="text-xs text-blue-600 font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    <span>Inspect Milestones</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <section className="py-16 bg-[#0B1326] text-white">
          <div className="max-w-4xl mx-auto px-4 text-center flex flex-col items-center gap-6">
            <h2 className="text-3xl font-extrabold tracking-tight">
              Experience Fearless Cross-Border Commerce
            </h2>
            <p className="text-slate-300 text-sm max-w-xl">
              Zero escrow delay. Zero invoice chasing. Guaranteed technical quality with Gemini AI and PayPal Sandbox.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/sign-in?role=buyer&redirect=/dashboard"
                className="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-sm transition-colors shadow-lg shadow-blue-600/30 inline-flex items-center gap-2"
              >
                <span>Launch Interactive Demo</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to={ROUTES.DEVELOPER_PORTAL}
                className="h-11 px-6 rounded-xl bg-[#171F33] hover:bg-[#222A3D] text-slate-200 font-semibold text-sm border border-[#222A3D] transition-colors"
              >
                <span>Explore Developer API</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
