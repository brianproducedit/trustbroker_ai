import React from 'react'
import { Link } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { SandboxBanner } from '@/components/common/SandboxBanner'
import { ROUTES } from '@/constants'
import { 
  ShieldCheck, 
  FileCheck, 
  CheckCircle2, 
  ArrowRight, 
  Building2, 
  Lock, 
  History, 
  Sparkles 
} from 'lucide-react'

export const ForBuyers: React.FC = () => {
  const buyerBenefits = [
    {
      title: 'Zero Payment Without Verified Code',
      desc: 'Funds are held in a secure PayPal Sandbox reserve. Not a single dollar is captured until the freelancer submits verifiable code that satisfies your pre-agreed criteria.',
      icon: Lock,
    },
    {
      title: 'AI Drafts Crystal-Clear SOWs in Seconds',
      desc: 'Stop spending hours writing contracts. Describe your needs in plain English and Gemini 1.5 Pro structures it into testable milestones with measurable acceptance criteria.',
      icon: Sparkles,
    },
    {
      title: 'Automated Code & Performance Auditing',
      desc: 'Our AI verification engine clones the repository, verifies TypeScript type safety, tests responsive layouts, and computes Lighthouse performance scores automatically.',
      icon: FileCheck,
    },
    {
      title: 'Enterprise-Grade Audit Trails',
      desc: 'Every agreement, milestone approval, and disbursement is cryptographically hashed with SHA-256 for compliance, accounting, and dispute-free operations.',
      icon: History,
    },
  ]

  return (
    <div className="min-h-screen bg-[#F6F8FC] text-[#1A2940] flex flex-col font-sans">
      <Header />

      <main className="w-full pt-[68px] flex-1">
        <SandboxBanner />

        {/* Hero Section */}
        <section className="py-16 sm:py-24 bg-white border-b border-[#DDE4EF]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-6">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>FOR ENTERPRISE CLIENTS &amp; HIRING MANAGERS</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#1A2940] tracking-tight max-w-4xl leading-tight">
              Hire Global Talent with <br className="hidden sm:inline" />
              <span className="text-blue-600">Zero Delivery Risk</span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-[#5D6B82] max-w-2xl leading-relaxed">
              Never pay upfront for broken code or vague promises. TrustBroker AI locks your budget safely in PayPal Sandbox escrow until Gemini AI proves the work is done right.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/sign-in?role=buyer&redirect=/dashboard/create-project"
                className="h-12 px-6 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all hover:gap-3"
              >
                <span>Draft New Project SOW</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/sign-in?role=buyer&redirect=/dashboard"
                className="h-12 px-6 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm transition-colors"
              >
                <span>Explore Buyer Dashboard</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Benefits Grid */}
        <section className="py-16 bg-[#F6F8FC]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl font-extrabold text-[#1A2940]">
                Why Procurement Teams Choose TrustBroker AI
              </h2>
              <p className="mt-3 text-base text-[#5D6B82]">
                Guaranteed quality, programmatic milestone gating, and frictionless PayPal integration.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {buyerBenefits.map((b) => {
                const Icon = b.icon
                return (
                  <div
                    key={b.title}
                    className="p-8 rounded-2xl bg-white border border-[#DDE4EF] shadow-sm flex flex-col gap-4 hover:border-blue-300 transition-all"
                  >
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">{b.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{b.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Case Study / Persona Spotlight */}
        <section className="py-16 bg-white border-t border-b border-[#DDE4EF]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-[#0B1326] text-white p-8 sm:p-10 rounded-3xl border border-[#222A3D] flex flex-col md:flex-row items-center gap-8">
              <div className="w-20 h-20 rounded-2xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400 text-3xl font-bold flex-shrink-0">
                ER
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-lg">Elena Rostova</span>
                  <span className="text-xs font-mono text-slate-400">&bull; VP of Digital Delivery, Acme Global</span>
                </div>
                <blockquote className="text-sm sm:text-base text-slate-300 italic leading-relaxed">
                  "Before TrustBroker AI, our engineering teams spent countless hours manually reviewing pull requests for remote contractors before finance would approve wire transfers. With automated Gemini verification and PayPal Sandbox gating, our contract cycle time dropped from 3 weeks to under 48 hours."
                </blockquote>
                <div className="flex items-center gap-4 text-xs font-mono text-emerald-400 pt-2">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    $3,200 Contract Verified
                  </span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    100% Audit Compliance
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-16 bg-[#F6F8FC]">
          <div className="max-w-4xl mx-auto px-4 text-center flex flex-col items-center gap-6">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              Ready to safeguard your remote project budgets?
            </h2>
            <p className="text-slate-600 text-sm max-w-xl">
              Create an AI Statement of Work in seconds and stage your first milestone in the PayPal Sandbox.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/sign-in?role=buyer&redirect=/dashboard/create-project"
                className="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold text-sm text-white transition-colors shadow-lg shadow-blue-600/20 inline-flex items-center gap-2"
              >
                <span>Draft SOW Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to={ROUTES.HOW_IT_WORKS}
                className="h-11 px-6 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm border border-slate-300 transition-colors"
              >
                <span>Read How It Works</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
