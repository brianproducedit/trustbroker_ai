import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ROUTES } from '@/constants'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CreditCard, 
  Sparkles, 
  ArrowRight, 
  UserCheck, 
  Lock,
  CheckCircle2,
  Search,
  ChevronDown,
  ChevronUp,
  Cpu,
  Check
} from 'lucide-react'

export const Landing: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  const steps = [
    { n: '1', title: 'Draft SOW', desc: 'AI turns your brief into testable acceptance criteria & milestones.' },
    { n: '2', title: 'Publish listing', desc: 'Listing opens to vetted freelancers in the marketplace.' },
    { n: '3', title: 'Apply with proof', desc: 'Talent applies with portfolio evidence and tailored proposals.' },
    { n: '4', title: 'AI vetting', desc: 'AI ranks applicants on skills, portfolio, and past delivery.' },
    { n: '5', title: 'Fund milestone', desc: 'Client funds the next milestone via secure PayPal checkout.' },
    { n: '6', title: 'Verify deliverables', desc: 'Multimodal AI inspects HTTP endpoints, screenshots & code.' },
    { n: '7', title: 'PayPal payout', desc: 'Policy engine unlocks automated PayPal disbursement to freelancer.' },
  ]

  const faqs = [
    {
      q: 'How does PayPal milestone funding protect both sides?',
      a: 'The client funds only the upcoming milestone into TrustBroker via PayPal Orders v2 before work begins. Funds remain staged in sandbox escrow until the freelancer delivers evidence and the AI verification engine validates the agreed acceptance criteria.'
    },
    {
      q: 'What deliverables can the AI verification engine inspect?',
      a: 'TrustBroker features specialized multimodal adapters: live URLs are probed via TLS/HTTP status checks, UI screenshots are analyzed with vision models, code archives (.zip) are scanned for file structure and security issues, and documents (.pdf) are extracted and compared against requirements.'
    },
    {
      q: 'What happens if a milestone requires subjective creative review?',
      a: 'When criteria cannot be deterministically scored (such as subjective design taste), TrustBroker marks the criterion as "Needs Review" rather than auto-rejecting or auto-paying. The client is notified and can execute a Human Review Override with recorded rationale.'
    },
    {
      q: 'Can new freelancers with no past platform history win contracts?',
      a: 'Yes. TrustBroker includes dedicated newcomer vetting logic: past delivery score is treated as insufficient evidence rather than zero. New talent is evaluated primarily on skills match, verified portfolio relevance, and proposal strength.'
    }
  ]

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#0E172E] flex flex-col font-sans relative overflow-x-hidden">
      {/* Background Subtle Mesh & Radial Gradients */}
      <div 
        aria-hidden="true" 
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(#CBD5E1_1px,transparent_1px)] [background-size:24px_24px] opacity-40" 
      />
      <div 
        aria-hidden="true" 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-b from-blue-100/60 via-indigo-50/20 to-transparent pointer-events-none blur-3xl -z-10" 
      />

      <Header />

      <main className="w-full pt-[68px] flex-1 z-10">
        {/* Hero Section */}
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-16 sm:pb-20">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto gap-6">
            <Badge 
              variant="outline" 
              className="px-3.5 py-1 rounded-full bg-white/80 border-blue-200/80 text-blue-700 text-xs font-semibold gap-2 shadow-xs backdrop-blur-xs"
            >
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span>AI Milestone Contracts · PayPal-Secured Escrow</span>
            </Badge>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#0B1B33] leading-[1.12]">
              Describe the work. <br />
              <span className="text-blue-600 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Hire with evidence.
              </span> <br />
              Pay when it checks out.
            </h1>

            <p className="text-base sm:text-lg text-[#475569] leading-relaxed max-w-2xl font-normal">
              TrustBroker AI is the trust layer for global freelance contracts. AI drafts clear statements of work, vets applicants on proof, and inspects deliverables before releasing PayPal payouts.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3 w-full sm:w-auto">
              <Button asChild size="lg" className="w-full sm:w-auto h-12 px-7 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-md hover:shadow-lg transition-all gap-2 cursor-pointer">
                <Link to={`${ROUTES.SIGN_UP}?role=client`}>
                  <UserCheck className="w-4 h-4 text-blue-100" />
                  <span>Hire with TrustBroker</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>

              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto h-12 px-7 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border-slate-300 font-medium text-sm shadow-xs transition-all gap-2 cursor-pointer">
                <Link to={`${ROUTES.SIGN_UP}?role=freelancer`}>
                  <Search className="w-4 h-4 text-emerald-600" />
                  <span>Find Work as Freelancer</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                100% PayPal Sandbox Verified
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-blue-600" />
                Zero Escrow Lock-in Debates
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-indigo-600" />
                Automated Multimodal Proof Checks
              </span>
            </div>
          </div>
        </section>

        {/* 7-Step Trust Lifecycle Strip */}
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0B1B33]">
              The 7-Step Verified Loop
            </h2>
            <p className="text-xs sm:text-sm text-[#475569] mt-2">
              Every milestone is structured, pre-funded in PayPal escrow, verified on live evidence, and settled automatically.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
            {steps.map((step) => (
              <Card key={step.n} className="border-[#E2E8F0] bg-white hover:border-blue-400 hover:shadow-md transition-all">
                <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-mono font-bold text-xs border border-blue-100">
                      0{step.n}
                    </span>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Step</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-xs sm:text-sm text-[#0B1B33]">{step.title}</h3>
                    <p className="text-[11px] text-[#64748B] mt-1 leading-relaxed">{step.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Two Persona Panels: Client vs Freelancer */}
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Panel A: Client */}
            <div className="p-8 sm:p-10 rounded-2xl bg-gradient-to-br from-[#0B1B33] to-[#132342] text-white shadow-xl relative overflow-hidden flex flex-col justify-between">
              <div className="space-y-4">
                <Badge variant="outline" className="bg-blue-900/60 border-blue-700 text-blue-200 text-xs">
                  For Clients & Employers
                </Badge>
                <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  Hire on verified proof. <br />
                  Pay only when milestones pass.
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md">
                  Stop writing vague proposals and arguing over incomplete deliveries. AI drafts your SOW, ranks candidates fairly, and evaluates actual code, screenshots, and live staging URLs before you release payment.
                </p>

                <ul className="space-y-2.5 pt-2 text-xs text-slate-200">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Clear acceptance criteria with assigned evidence types</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>PayPal Orders v2 milestone funding with transparent transaction ledger</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>One-click payout release to verified freelancer PayPal accounts</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <Button asChild className="bg-blue-500 hover:bg-blue-600 text-white font-medium text-xs h-10 px-5 gap-1.5 shadow-sm">
                  <Link to={ROUTES.FOR_CLIENTS}>
                    <span>Explore Client Benefits</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Panel B: Freelancer */}
            <div className="p-8 sm:p-10 rounded-2xl bg-gradient-to-br from-[#0C1E1B] to-[#142E28] text-white shadow-xl relative overflow-hidden flex flex-col justify-between">
              <div className="space-y-4">
                <Badge variant="outline" className="bg-emerald-900/60 border-emerald-700 text-emerald-200 text-xs">
                  For Freelancers & Studios
                </Badge>
                <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  Work against funded escrow. <br />
                  Get paid without invoice chasing.
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md">
                  Never start working on an empty promise. Clients fund milestones through PayPal before you start. Submit your work, pass automated multimodal verification, and receive immediate payouts directly to your PayPal email.
                </p>

                <ul className="space-y-2.5 pt-2 text-xs text-slate-200">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Milestones are pre-funded in PayPal sandbox before you begin</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Fair AI applicant ranking — newcomers evaluated on portfolio merit</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Instant PayPal Payouts with full PayPal Batch and Item IDs</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs h-10 px-5 gap-1.5 shadow-sm">
                  <Link to={ROUTES.FOR_FREELANCERS}>
                    <span>Explore Freelancer Benefits</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Live Contract Showcase Strip */}
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-2xl border border-[#DDE4EF] p-6 sm:p-10 shadow-xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 space-y-4">
                <Badge variant="secondary" className="text-xs text-blue-700 bg-blue-50 border-blue-200">
                  Live Contract Example
                </Badge>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#0B1B33]">
                  Objective verification replaces endless debates.
                </h2>
                <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                  Every milestone has explicit acceptance criteria. When the freelancer submits evidence, AI assesses it against those criteria and gives the client a clear pass, fail, or needs-review breakdown before any payout.
                </p>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white gap-2 text-xs">
                    <Link to={ROUTES.HOW_IT_WORKS}>
                      See the complete 7-step guide
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Sample Contract Card */}
              <div className="lg:col-span-7">
                <Card className="border border-slate-200 bg-slate-50/70 shadow-sm overflow-hidden">
                  <div className="p-4 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-blue-600">TB-2026-001</span>
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                          Active Contract
                        </Badge>
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 mt-0.5">Fintech SaaS Onboarding & Checkout</h4>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500">Total Budget</div>
                      <div className="text-sm font-bold text-slate-900">$15,000 USD</div>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    {/* Milestone 1 */}
                    <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between gap-3 text-xs">
                      <div className="space-y-0.5">
                        <div className="font-medium text-slate-800">M1: Architecture, Wireframes & Auth</div>
                        <div className="text-slate-500 text-[11px]">Due Nov 15 &bull; AI Verified 95% pass</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                          Disbursed via PayPal ($4,000)
                        </Badge>
                      </div>
                    </div>

                    {/* Milestone 2 */}
                    <div className="p-3 bg-white rounded-lg border border-blue-200 bg-blue-50/30 flex items-center justify-between gap-3 text-xs">
                      <div className="space-y-0.5">
                        <div className="font-medium text-slate-800">M2: PayPal Orders v2 & Escrow Hub</div>
                        <div className="text-slate-500 text-[11px]">Due Dec 01 &bull; Under AI Inspection</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] animate-pulse">
                          Staged in Escrow ($5,500)
                        </Badge>
                      </div>
                    </div>

                    {/* Milestone 3 */}
                    <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between gap-3 text-xs opacity-75">
                      <div className="space-y-0.5">
                        <div className="font-medium text-slate-800">M3: Multimodal Verification & Release</div>
                        <div className="text-slate-500 text-[11px]">Due Dec 15 &bull; Pending funding</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-slate-600 text-[10px]">
                          Pending ($5,500)
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="text-center space-y-2 mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0B1B33]">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-[#475569]">
              Everything you need to know about TrustBroker AI contracts, PayPal milestone escrow, and payouts.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-[#E2E8F0] bg-white transition-all overflow-hidden"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <span className="font-semibold text-xs sm:text-sm text-[#0B1B33]">{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-blue-600 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-slate-100 text-xs sm:text-sm text-[#475569] leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* Infrastructure Footing Strip */}
        <section className="w-full bg-white border-t border-[#DDE4EF] py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              Enterprise Technology Stack &bull; Built for PayPal AI Hackathon
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 text-slate-600 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span>PayPal Orders v2 &amp; Payouts API</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Groq LPU Multimodal AI</span>
              </div>
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-600" />
                <span>Deterministic Policy Engine</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-700" />
                <span>Auditable Cryptographic History</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default Landing
