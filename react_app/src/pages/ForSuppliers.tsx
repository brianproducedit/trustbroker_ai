import React from 'react'
import { Link } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { SandboxBanner } from '@/components/common/SandboxBanner'
import { ROUTES } from '@/constants'
import { 
  Wallet, 
  CheckCircle2, 
  ArrowRight, 
  Zap, 
  Lock, 
  Award, 
  Globe2, 
  Sparkles 
} from 'lucide-react'

export const ForSuppliers: React.FC = () => {
  const supplierBenefits = [
    {
      title: 'Guaranteed Funds Staged Upfront',
      desc: 'Never worry if a client has the budget to pay you. Before you write a single line of code, the buyer reserves the milestone funds in the PayPal Sandbox.',
      icon: Lock,
    },
    {
      title: 'Protection from Vague Scope Creep',
      desc: 'No more "just one more small thing" without extra pay. Gemini AI structures your contract with rigid, unambiguous pass/fail criteria from day one.',
      icon: Sparkles,
    },
    {
      title: 'Instant Automated PayPal Payouts',
      desc: 'Traditional platforms hold your earnings for 14 to 21 business days. With TrustBroker AI, as soon as your evidence passes verification, funds are released to your wallet in ~3.8 seconds.',
      icon: Zap,
    },
    {
      title: 'Cryptographic Proof of Work Receipts',
      desc: 'Every delivered milestone issues an immutable SHA-256 receipt proving your technical competence to clients worldwide—eliminating bias and unlocking global rates.',
      icon: Award,
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
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold uppercase tracking-wider mb-6">
              <Globe2 className="w-4 h-4 text-emerald-600" />
              <span>FOR GLOBAL FREELANCERS &amp; SOFTWARE AGENCIES</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#1A2940] tracking-tight max-w-4xl leading-tight">
              Get Paid Instantly for Your Code. <br className="hidden sm:inline" />
              <span className="text-emerald-600">Zero Invoice Chasing.</span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-[#5D6B82] max-w-2xl leading-relaxed">
              Work with international clients with total peace of mind. Milestone funds are pre-authorized in PayPal Sandbox before you start, and paid out the second your code passes AI inspection.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/sign-in?role=supplier&redirect=/dashboard"
                className="h-12 px-6 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-500/20 transition-all hover:gap-3"
              >
                <span>Open Supplier Portal</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/sign-in?role=supplier&redirect=/dashboard/payouts"
                className="h-12 px-6 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm transition-colors"
              >
                <span>View Payouts &amp; Earnings</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Benefits Grid */}
        <section className="py-16 bg-[#F6F8FC]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl font-extrabold text-[#1A2940]">
                Built for Developers Who Value Their Time
              </h2>
              <p className="mt-3 text-base text-[#5D6B82]">
                Guaranteed escrow reserves, automated code validation, and immediate global payouts.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {supplierBenefits.map((b) => {
                const Icon = b.icon
                return (
                  <div
                    key={b.title}
                    className="p-8 rounded-2xl bg-white border border-[#DDE4EF] shadow-sm flex flex-col gap-4 hover:border-emerald-300 transition-all"
                  >
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
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
              <div className="w-20 h-20 rounded-2xl bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-3xl font-bold flex-shrink-0">
                TM
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-lg">Tariro Moyo</span>
                  <span className="text-xs font-mono text-slate-400">&bull; Principal Engineer, DevStudio Harare (Zimbabwe)</span>
                </div>
                <blockquote className="text-sm sm:text-base text-slate-300 italic leading-relaxed">
                  "As an African software engineer building for clients in the US and Europe, cross-border payment anxiety was a constant headache. With TrustBroker AI, the client's money is staged in the PayPal Sandbox before I commit to sprint deadlines. When I deliver clean TypeScript code that passes tests, the payout releases instantly."
                </blockquote>
                <div className="flex items-center gap-4 text-xs font-mono text-emerald-400 pt-2">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    $1,400 Cleared Payouts
                  </span>
                  <span className="flex items-center gap-1">
                    <Wallet className="w-3.5 h-3.5" />
                    $1,800 Staged in Escrow
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
              Ready to take on global projects with guaranteed pay?
            </h2>
            <p className="text-slate-600 text-sm max-w-xl">
              Switch to Supplier Mode in our live demo and submit code evidence for milestone verification.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/sign-in?role=supplier&redirect=/dashboard"
                className="h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-semibold text-sm text-white transition-colors shadow-lg shadow-emerald-600/20 inline-flex items-center gap-2"
              >
                <span>Launch Supplier Demo</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to={ROUTES.HOW_IT_WORKS}
                className="h-11 px-6 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm border border-slate-300 transition-colors"
              >
                <span>Learn How It Works</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
