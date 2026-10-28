import React from 'react'
import { Link } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ROUTES } from '@/constants'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Globe2,
  CreditCard,
  ArrowRight,
  Sparkles,
  DollarSign
} from 'lucide-react'

export const ForFreelancers: React.FC = () => {
  const benefits = [
    {
      title: 'Work Against Pre-Funded Milestones',
      desc: 'Never risk working on unpaid promises. The client funds each milestone into PayPal sandbox escrow before you start delivering.',
      icon: CreditCard,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    },
    {
      title: 'Explicit Acceptance Criteria',
      desc: 'No moving goalposts or vague revisions. AI drafts testable criteria upfront so you know exactly what constitutes a passing deliverable.',
      icon: Sparkles,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
    },
    {
      title: 'Direct PayPal Payout Disbursements',
      desc: 'When verification passes, the policy engine unlocks a direct PayPal payout to your email with an immutable batch transaction ID.',
      icon: DollarSign,
      color: 'bg-amber-50 text-amber-600 border-amber-200',
    },
  ]

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#0E172E] flex flex-col font-sans">
      <Header />

      <main className="w-full pt-[68px] flex-1">
        {/* Header Hero */}
        <section className="py-14 sm:py-20 bg-white border-b border-[#DDE4EF]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center space-y-5">
            <Badge variant="outline" className="px-3.5 py-1 rounded-full bg-emerald-50 border-emerald-200 text-emerald-700 text-xs font-semibold gap-1.5 shadow-xs">
              <Globe2 className="w-3.5 h-3.5 text-emerald-600" />
              For Freelancers, Engineers &amp; Agencies
            </Badge>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0B1B33] tracking-tight leading-tight">
              Get paid for verified work. <br className="hidden sm:inline" />
              <span className="text-emerald-600">Zero invoice chasing. Direct PayPal payouts.</span>
            </h1>

            <p className="text-sm sm:text-base text-[#475569] max-w-2xl leading-relaxed">
              Browse open listings, apply with your real portfolio artifacts, work with pre-funded escrow protection, and receive disbursements immediately after AI inspection.
            </p>

            <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-11 px-6 gap-2 font-medium shadow-sm cursor-pointer">
                <Link to={`${ROUTES.SIGN_UP}?role=freelancer`}>
                  <span>Join as Freelancer</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>

              <Button asChild variant="outline" size="lg" className="border-slate-300 text-slate-700 hover:bg-slate-50 text-xs h-11 px-6 font-medium shadow-xs cursor-pointer">
                <Link to={ROUTES.MARKETPLACE}>
                  <span>Explore Marketplace</span>
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Benefits Grid */}
        <section className="py-14 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-2xl font-bold text-[#0B1B33]">Built for Fair, Transparent Freelancing</h2>
            <p className="text-xs sm:text-sm text-[#475569] mt-1.5">
              Clear milestone parameters protect your time, code, and revenue.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {benefits.map((b) => {
              const IconComp = b.icon
              return (
                <Card key={b.title} className="border-[#E2E8F0] bg-white shadow-xs hover:shadow-md transition-shadow">
                  <CardContent className="p-6 space-y-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${b.color}`}>
                      <IconComp className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold text-base text-[#0B1B33]">{b.title}</h3>
                    <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">{b.desc}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        {/* Interactive Freelancer Screenshot Mockup */}
        <section className="py-12 bg-white border-t border-b border-[#DDE4EF]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="text-center max-w-xl mx-auto">
              <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs mb-2">
                Freelancer Workspace Preview
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0B1B33]">
                Funded Milestones &amp; PayPal Earnings
              </h2>
              <p className="text-xs sm:text-sm text-[#475569] mt-1">
                Deliver evidence, watch multimodal AI pass criteria, and review verified PayPal disbursements in your earnings ledger.
              </p>
            </div>

            {/* Freelancer Mockup Frame */}
            <div className="rounded-2xl border border-[#222A3D] bg-[#0C1916] text-white p-4 sm:p-6 shadow-xl space-y-5">
              {/* Mock Window Bar */}
              <div className="flex items-center justify-between border-b border-[#1A332C] pb-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="font-mono text-emerald-400 text-[11px] ml-2">trustbroker.ai/app/freelancer/earnings</span>
                </div>
                <Badge className="bg-emerald-900/40 text-emerald-300 border-emerald-700 text-[10px]">
                  Freelancer Workspace
                </Badge>
              </div>

              {/* Earnings Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-[#11231F] border border-[#1E3B33] space-y-1">
                  <span className="text-[11px] text-slate-400 block">Cleared PayPal Payouts</span>
                  <span className="text-xl font-bold font-mono text-emerald-400">$4,000.00 USD</span>
                  <span className="text-[10px] text-emerald-300 block font-mono">Disbursed via PayPal API</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#11231F] border border-[#1E3B33] space-y-1">
                  <span className="text-[11px] text-slate-400 block">Staged in Sandbox Escrow</span>
                  <span className="text-xl font-bold font-mono text-blue-400">$5,500.00 USD</span>
                  <span className="text-[10px] text-blue-300 block font-mono">Funded by Client</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#11231F] border border-[#1E3B33] space-y-1">
                  <span className="text-[11px] text-slate-400 block">Registered Payout Email</span>
                  <span className="text-sm font-semibold text-white block truncate">freelancer.demo@trustbroker.ai</span>
                  <span className="text-[10px] text-emerald-300 block font-mono">PayPal Sandbox Verified</span>
                </div>
              </div>

              {/* Sample Verified Disbursement Row */}
              <div className="p-4 rounded-xl bg-[#11231F] border border-[#1E3B33] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="font-semibold text-white text-sm">Milestone 1: Architecture, Wireframes &amp; Auth</span>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">Contract TB-2026-001 &bull; Acme Global Ventures LLC</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px]">
                      SUCCESS
                    </Badge>
                    <span className="text-sm font-bold font-mono text-emerald-400">+$4,000.00 USD</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#1E3B33] text-[11px] font-mono text-slate-400">
                  <span>PayPal Batch: <span className="text-slate-200">PAYOUT-BATCH-78921-SB</span></span>
                  <span>Disbursed: Today, 14:32 UTC</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-16 text-center max-w-4xl mx-auto px-4 sm:px-6">
          <div className="space-y-4">
            <h2 className="text-3xl font-extrabold text-[#0B1B33]">Ready to deliver work without invoice risk?</h2>
            <p className="text-xs sm:text-sm text-[#475569] max-w-lg mx-auto">
              Create your profile in 2 minutes. Apply to open contracts and receive secure PayPal payouts as soon as milestones pass.
            </p>
            <div className="pt-2">
              <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-11 px-7 gap-2 shadow-md">
                <Link to={`${ROUTES.SIGN_UP}?role=freelancer`}>
                  <span>Join TrustBroker as Freelancer</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default ForFreelancers
