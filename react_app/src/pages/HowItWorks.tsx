import React from 'react'
import { Link } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { SandboxBanner } from '@/components/common/SandboxBanner'
import { ROUTES } from '@/constants'
import { 
  Bot, 
  CreditCard, 
  CheckCircle2, 
  Zap, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle, 
  Sparkles 
} from 'lucide-react'

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'Describe Your Project in Plain English',
      subtitle: 'AI-Powered Statement of Work (SOW)',
      desc: 'No more ambiguous contracts or confusing legal jargon. You type what you need (e.g. "React landing page with 95+ Lighthouse score and PayPal checkout"), and Gemini AI structures it into concrete, testable milestones with unambiguous pass/fail criteria.',
      icon: Bot,
      color: 'blue',
      badge: 'Gemini 1.5 Pro',
      bullets: [
        'Transforms vague wishes into binary acceptance criteria',
        'Auto-splits budget and sets realistic deadlines',
        'Both buyer and supplier sign with 1-click approval',
      ],
    },
    {
      step: '02',
      title: 'Lock Payment Safely in PayPal Sandbox Escrow',
      subtitle: 'Zero-Risk Milestone Staging',
      desc: 'The buyer reserves milestone funds upfront using PayPal Sandbox. Freelancers can see that the money is 100% committed before writing a single line of code—yet the buyer knows not a penny will leave until work is verified.',
      icon: CreditCard,
      color: 'emerald',
      badge: 'PayPal Orders API',
      bullets: [
        'Funds held conditionally in PayPal Sandbox reserve',
        'Freelancer gets 100% guarantee that funds exist',
        'Buyer maintains control until deliverables are verified',
      ],
    },
    {
      step: '03',
      title: 'Submit Deliverable Evidence for AI Verification',
      subtitle: 'Automated Multi-Modal Inspection',
      desc: 'When a milestone is completed, the freelancer submits proof: a GitHub repository link, live staging URL, and delivery notes. Gemini AI runs automated TypeScript compile checks, scans code structure, and audits live web performance.',
      icon: CheckCircle2,
      color: 'purple',
      badge: 'Automated Audit Gate',
      bullets: [
        'Checks GitHub repositories and live web applications',
        'Verifies code quality, TypeScript types, and performance',
        'Flags missing items with actionable revision guidance',
      ],
    },
    {
      step: '04',
      title: 'Pass Criteria & Receive Instant PayPal Payout',
      subtitle: 'Zero Waiting Period Disbursement',
      desc: 'Once the AI inspection gate passes and the buyer authorizes release, the PayPal capture webhook triggers immediately. Freelancers receive their earnings in seconds—not 14 to 21 business days later.',
      icon: Zap,
      color: 'teal',
      badge: 'Instant Settlement',
      bullets: [
        'Instant disbursement to PayPal account',
        'Cryptographic SHA-256 receipt for both parties',
        'Permanent audit record logged on the activity ledger',
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-[#F6F8FC] text-[#1A2940] flex flex-col font-sans">
      <Header />

      <main className="w-full pt-[68px] flex-1">
        <SandboxBanner />

        {/* Hero Section */}
        <section className="relative overflow-hidden py-16 sm:py-24 bg-white border-b border-[#DDE4EF]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-6">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>THE 4-STEP REVOLUTION IN CROSS-BORDER COMMERCE</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#1A2940] tracking-tight max-w-4xl leading-tight">
              How TrustBroker AI Works
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-[#5D6B82] max-w-2xl leading-relaxed">
              We eliminate the classic dilemma in global freelance hiring:{' '}
              <span className="font-semibold text-slate-800">
                "Do I pay first and risk poor work, or do I deliver first and risk non-payment?"
              </span>
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                to={ROUTES.DASHBOARD}
                className="h-12 px-6 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all hover:gap-3"
              >
                <span>Launch Interactive Demo</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to={ROUTES.NEW_PROJECT}
                className="h-12 px-6 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm transition-colors"
              >
                <span>Draft an AI SOW</span>
              </Link>
            </div>
          </div>
        </section>

        {/* The Problem vs Solution Callout */}
        <section className="py-12 bg-[#F6F8FC]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* The Old Way */}
              <div className="bg-white p-6 rounded-2xl border border-red-200/80 shadow-sm flex flex-col gap-3">
                <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
                  <AlertCircle className="w-5 h-5" />
                  <span>The Old Way (Broken Trust)</span>
                </div>
                <ul className="text-xs sm:text-sm text-slate-600 space-y-2.5">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">&times;</span>
                    <span>Vague contract scopes leading to bitter scope creep</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">&times;</span>
                    <span>Freelancers wait 14 to 21 days for manual client approval</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">&times;</span>
                    <span>Clients pay upfront for half-baked or broken deliverables</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">&times;</span>
                    <span>20% commission platform fee taken from hardworking freelancers</span>
                  </li>
                </ul>
              </div>

              {/* The TrustBroker Way */}
              <div className="bg-white p-6 rounded-2xl border border-emerald-300 shadow-sm flex flex-col gap-3">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>The TrustBroker AI Way</span>
                </div>
                <ul className="text-xs sm:text-sm text-slate-700 space-y-2.5">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Gemini AI writes crystal-clear, testable acceptance criteria</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Funds pre-authorized in PayPal Sandbox before work begins</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Objective automated AI verification of code and staging links</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>Instant release to PayPal Sandbox wallet in ~3.8 seconds</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 4 Steps Section */}
        <section className="py-16 sm:py-20 bg-white border-t border-[#DDE4EF]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-extrabold text-[#1A2940] sm:text-4xl">
                The 4-Step Escrow Workflow
              </h2>
              <p className="mt-3 text-base text-[#5D6B82]">
                Every milestone moves transparently through an automated verification gate.
              </p>
            </div>

            <div className="flex flex-col gap-12">
              {steps.map((item, index) => {
                const Icon = item.icon
                const isEven = index % 2 === 1
                return (
                  <div
                    key={item.step}
                    className={`flex flex-col lg:flex-row items-center gap-8 lg:gap-12 p-8 rounded-2xl border border-slate-200 bg-[#FBFDFF] hover:border-blue-300 transition-all ${
                      isEven ? 'lg:flex-row-reverse' : ''
                    }`}
                  >
                    {/* Left/Right Text Content */}
                    <div className="flex-1 flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-2xl font-black text-blue-600">
                          {item.step}
                        </span>
                        <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          {item.badge}
                        </span>
                      </div>

                      <h3 className="text-2xl font-bold text-slate-900">{item.title}</h3>
                      <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold">
                        {item.subtitle}
                      </h4>

                      <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>

                      <div className="pt-2 flex flex-col gap-2">
                        {item.bullets.map((b) => (
                          <div key={b} className="flex items-center gap-2 text-xs text-slate-700">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            <span>{b}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Visual Card / Representation */}
                    <div className="w-full lg:w-96 p-6 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-mono text-slate-400">Step {item.step} Status</span>
                        <span className="text-sm font-bold text-slate-900">
                          Verified Programmatic Handshake
                        </span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-xs text-slate-600 flex items-center justify-between">
                        <span>Latency</span>
                        <span className="font-bold text-emerald-600">&lt; 5 seconds</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-16 bg-[#0B1326] text-white">
          <div className="max-w-4xl mx-auto px-4 text-center flex flex-col items-center gap-6">
            <h2 className="text-3xl font-bold tracking-tight">
              Ready to experience escrow that works automatically?
            </h2>
            <p className="text-slate-300 text-sm max-w-xl">
              Explore the working buyer and supplier dashboard demo in our PayPal Sandbox environment.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                to={ROUTES.DASHBOARD}
                className="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-sm transition-colors shadow-lg shadow-blue-600/30 inline-flex items-center gap-2"
              >
                <span>Open Dashboard Demo</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to={ROUTES.FOR_BUYERS}
                className="h-11 px-6 rounded-xl bg-[#171F33] hover:bg-[#222A3D] text-slate-200 font-semibold text-sm border border-[#222A3D] transition-colors"
              >
                <span>For Buyers Guide</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
