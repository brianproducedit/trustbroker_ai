import React from 'react'
import { Link } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ROUTES } from '@/constants'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Building2,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Lock
} from 'lucide-react'

export const ForClients: React.FC = () => {
  const benefits = [
    {
      title: 'AI Drafts Clear Contracts in Seconds',
      desc: 'Describe your project in natural language. TrustBroker structures milestones, deadlines and measurable acceptance criteria with assigned evidence types before you publish.',
      icon: Sparkles,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
    },
    {
      title: 'PayPal-Secured Milestone Payments',
      desc: 'Fund milestones one at a time through PayPal Orders v2. Capital stays in sandbox escrow until deliverables pass objective AI inspection against your criteria.',
      icon: Lock,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    },
    {
      title: 'Hire from Evidence, Not Hype',
      desc: 'Freelancers apply with verifiable portfolio artifacts. AI ranks candidates on multidimensional fit — with fair consideration for high-aptitude newcomers.',
      icon: CheckCircle2,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    },
  ]

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#0E172E] flex flex-col font-sans relative overflow-x-hidden">
      {/* Background Subtle Mesh & Glow Orbs */}
      <div 
        aria-hidden="true" 
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(#CBD5E1_1px,transparent_1px)] [background-size:24px_24px] opacity-40" 
      />
      <div 
        aria-hidden="true" 
        className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none -z-10" 
      />
      <div 
        aria-hidden="true" 
        className="absolute top-24 right-1/4 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none -z-10" 
      />

      <Header />

      <main className="w-full pt-[68px] flex-1 z-10">
        {/* Header Hero */}
        <section className="py-14 sm:py-20 bg-white/80 backdrop-blur-md border-b border-[#DDE4EF]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center space-y-5">
            <Badge variant="outline" className="px-3.5 py-1 rounded-full bg-blue-50 border-blue-200 text-blue-700 text-xs font-semibold gap-1.5 shadow-xs">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              For Clients &amp; Hiring Teams
            </Badge>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0B1B33] tracking-tight leading-tight">
              Hire global talent with <br className="hidden sm:inline" />
              <span className="text-blue-600 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                verifiable confidence and transparent escrow.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-[#475569] max-w-2xl leading-relaxed">
              Publish open contracts, evaluate AI-ranked applicant proposals with portfolio proof, fund milestones through PayPal and authorize payouts only after multimodal inspection.
            </p>

            <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-11 px-6 gap-2 font-medium shadow-md hover:shadow-lg transition-all cursor-pointer">
                <Link to={`${ROUTES.SIGN_UP}?role=client`}>
                  <span>Post a Contract as Client</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>

              <Button asChild variant="outline" size="lg" className="border-slate-300 text-slate-700 hover:bg-slate-50 text-xs h-11 px-6 font-medium shadow-xs cursor-pointer">
                <Link to={`${ROUTES.SIGN_IN}?role=client`}>
                  <span>Sign In as Client</span>
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Benefits Grid */}
        <section className="py-14 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-2xl font-bold text-[#0B1B33]">Why Leading Employers Choose TrustBroker</h2>
            <p className="text-xs sm:text-sm text-[#475569] mt-1.5">
              Structured accountability replaces ambiguous deliverables and off-platform disputes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {benefits.map((b) => {
              const IconComp = b.icon
              return (
                <Card key={b.title} className="group border-[#E2E8F0] bg-white shadow-xs hover:shadow-lg hover:border-blue-400 transition-all duration-300 rounded-xl overflow-hidden hover:-translate-y-0.5">
                  <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardContent className="p-6 space-y-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${b.color}`}>
                      <IconComp className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold text-base text-[#0B1B33] group-hover:text-blue-600 transition-colors">{b.title}</h3>
                    <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">{b.desc}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        {/* Interactive Client Screenshot Mockup */}
        <section className="py-12 bg-white border-t border-b border-[#DDE4EF]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="text-center max-w-xl mx-auto">
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 text-xs mb-2">
                Client Workspace Preview
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0B1B33]">
                AI-Vetted Proposals &amp; Release Control
              </h2>
              <p className="text-xs sm:text-sm text-[#475569] mt-1">
                See exactly how TrustBroker ranks applicants and lets you inspect evidence before approving disbursements.
              </p>
            </div>

            {/* Client Mockup Frame */}
            <div className="rounded-2xl border border-[#222A3D] bg-[#0B1326] text-white p-4 sm:p-6 shadow-xl space-y-5">
              {/* Mock Window Bar */}
              <div className="flex items-center justify-between border-b border-[#222A3D] pb-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="font-mono text-slate-400 text-[11px] ml-2">trustbroker.ai/app/client/contracts/TB-2026-001/applicants</span>
                </div>
                <Badge className="bg-blue-900/40 text-blue-300 border-blue-700 text-[10px]">
                  Client Workspace
                </Badge>
              </div>

              {/* Mock Proposal Ranking Card */}
              <div className="p-4 sm:p-5 rounded-xl bg-[#131B2E] border border-[#222A3D] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center border border-emerald-500/30">
                      TM
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">Tariro Moyo</span>
                        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px]">
                          Rank #1 · Strong Match
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400">Senior Full-Stack Architect &bull; DevStudio Zimbabwe</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">AI Match Score</span>
                      <span className="font-mono font-bold text-lg text-emerald-400">94/100</span>
                    </div>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8">
                      Award Contract
                    </Button>
                  </div>
                </div>

                {/* Score Breakdown Pills */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="p-2.5 rounded-lg bg-[#0B1326] border border-[#222A3D] text-xs space-y-1">
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Skills Match</span>
                      <span className="font-mono text-blue-400 font-bold">92%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: '92%' }} />
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#0B1326] border border-[#222A3D] text-xs space-y-1">
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Portfolio Proof</span>
                      <span className="font-mono text-emerald-400 font-bold">95%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '95%' }} />
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#0B1326] border border-[#222A3D] text-xs space-y-1">
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Past Delivery</span>
                      <span className="font-mono text-indigo-400 font-bold">90%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: '90%' }} />
                    </div>
                  </div>
                </div>

                {/* AI Rationale Snippet */}
                <div className="p-3 rounded-lg bg-[#0E1528] border border-[#222A3D] text-xs space-y-1">
                  <span className="text-[11px] font-semibold text-blue-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Vetting Rationale
                  </span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    Applicant has demonstrated high proficiency in TypeScript React and PayPal Orders v2 integration. Submitted portfolio includes live production SaaS links with documented test coverage. Recommended for immediate award.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-16 text-center max-w-4xl mx-auto px-4 sm:px-6">
          <div className="space-y-4">
            <h2 className="text-3xl font-extrabold text-[#0B1B33]">Ready to post your first milestone contract?</h2>
            <p className="text-xs sm:text-sm text-[#475569] max-w-lg mx-auto">
              Draft your statement of work with AI in minutes. Review proposals and fund milestones only when you are satisfied.
            </p>
            <div className="pt-2">
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-11 px-7 gap-2 shadow-md">
                <Link to={`${ROUTES.SIGN_UP}?role=client`}>
                  <span>Get Started as Client</span>
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

export default ForClients
