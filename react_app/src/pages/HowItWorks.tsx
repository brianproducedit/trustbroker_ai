import React from 'react'
import { Link } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CreditCard, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles,
  UserCheck
} from 'lucide-react'

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'Describe Your Project Brief',
      subtitle: 'AI-Generated Statement of Work',
      desc: 'Clients describe what they need in ordinary language. TrustBroker structures this into clear milestones with testable acceptance criteria, deadlines, and milestone budgets.',
      icon: Sparkles,
      iconColor: 'bg-blue-50 text-blue-600 border-blue-200',
      bullets: [
        'Converts project ideas into concrete milestone deliverables',
        'Defines clear pass/fail acceptance criteria',
        'Clients can add, remove, and adjust milestones before finalizing',
      ],
    },
    {
      step: '02',
      title: 'Both Parties Accept the Terms',
      subtitle: 'Mutual Agreement Before Work Begins',
      desc: 'The freelancer receives the contract and reviews the scope, milestone payouts, and timeline. Both parties digitally accept the terms, locking the agreement.',
      icon: UserCheck,
      iconColor: 'bg-indigo-50 text-indigo-600 border-indigo-200',
      bullets: [
        'Complete transparency into milestone deliverables and expectations',
        'Both parties must agree before any work begins',
        'Creates an immutable, traceable audit trail',
      ],
    },
    {
      step: '03',
      title: 'Stage Milestone Payment via PayPal',
      subtitle: 'Guaranteed Funds Held in Sandbox',
      desc: 'The client stages funds using PayPal Sandbox. The freelancer has 100% confidence that payment is secured before starting work, while the client knows funds will not release without approval.',
      icon: CreditCard,
      iconColor: 'bg-amber-50 text-amber-600 border-amber-200',
      bullets: [
        'Funds are committed through official PayPal Orders API',
        'Freelancers work knowing payment is already staged',
        'Zero upfront disbursement until work is verified',
      ],
    },
    {
      step: '04',
      title: 'Verify Delivery & Release Payment',
      subtitle: 'Objective AI Assessment & Instant Release',
      desc: 'The freelancer submits work (repository link, live URL, notes). AI reviews the delivery against the acceptance criteria. Once verified, funds are released directly to the freelancer.',
      icon: CheckCircle2,
      iconColor: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      bullets: [
        'Evaluates code quality, tests, and stated criteria',
        'Detailed criterion-by-criterion pass/fail breakdown',
        'Instant payout execution or one-click revision requests',
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-[#F6F8FC] text-[#1A2940] flex flex-col font-sans">
      <Header />

      <main className="w-full pt-[68px] flex-1">
        {/* Hero */}
        <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10 text-center">
          <Badge variant="outline" className="px-3.5 py-1 rounded-full bg-blue-50 border-blue-200 text-blue-700 text-xs font-semibold gap-1.5 mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            Clear & Predictable Lifecycle
          </Badge>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#1A2940]">
            How TrustBroker Coordinates Projects
          </h1>
          <p className="text-sm sm:text-base text-[#5D6B82] max-w-2xl mx-auto mt-4 leading-relaxed">
            Eliminating payment disputes with AI contract generation, staged PayPal milestone payments, and objective delivery verification.
          </p>
        </section>

        {/* Steps Timeline */}
        <section className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="space-y-6">
            {steps.map((item) => {
              const IconComp = item.icon
              return (
                <Card key={item.step} className="border-[#DDE4EF] bg-white shadow-xs overflow-hidden">
                  <CardContent className="p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row gap-6 items-start">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${item.iconColor}`}>
                        <IconComp className="w-7 h-7" />
                      </div>

                      <div className="flex-1 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-mono font-bold text-blue-600 tracking-wider">
                            STEP {item.step}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">{item.subtitle}</span>
                        </div>

                        <h2 className="text-xl font-bold text-[#1A2940]">{item.title}</h2>
                        <p className="text-xs sm:text-sm text-[#5D6B82] leading-relaxed">
                          {item.desc}
                        </p>

                        <div className="pt-2 grid grid-cols-1 gap-2">
                          {item.bullets.map((bullet, bIdx) => (
                            <div key={bIdx} className="flex items-center gap-2 text-xs text-slate-700">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>{bullet}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* CTA Banner */}
          <div className="mt-12 p-8 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-center space-y-4 shadow-sm">
            <h2 className="text-2xl font-bold">Ready to see it in action?</h2>
            <p className="text-xs sm:text-sm text-blue-100 max-w-xl mx-auto leading-relaxed">
              Experience the full contract, payment, and verification workflow in the interactive demo sandbox.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="bg-white hover:bg-slate-100 text-blue-700 font-semibold text-xs h-10 px-5 gap-2">
                <Link to="/sign-in?role=client&redirect=/dashboard">
                  Try Client Flow
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-white/40 text-white hover:bg-white/10 font-semibold text-xs h-10 px-5 gap-2">
                <Link to="/sign-in?role=freelancer&redirect=/dashboard">
                  Try Freelancer Flow
                  <ArrowRight className="w-3.5 h-3.5" />
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

export default HowItWorks
