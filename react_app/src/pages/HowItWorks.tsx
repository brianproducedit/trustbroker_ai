import React from 'react'
import { Link } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ROUTES } from '@/constants'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CreditCard,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  UserCheck,
  FileSearch,
  Megaphone,
  Wallet,
} from 'lucide-react'

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'Describe the brief',
      subtitle: 'AI-drafted statement of work',
      desc: 'The client describes the project in ordinary language. TrustBroker asks clarifying questions and drafts milestones, budgets, and testable acceptance criteria.',
      icon: Sparkles,
      iconColor: 'bg-blue-50 text-blue-600 border-blue-200',
      bullets: [
        'Plain-language brief becomes a structured contract',
        'Each milestone has pass / fail / needs-review criteria',
        'The client edits everything before publishing',
      ],
    },
    {
      step: '02',
      title: 'Publish an open contract',
      subtitle: 'Visible to freelancers',
      desc: 'The contract is published so qualified freelancers can find the work. It is not assigned to a person until the client awards it.',
      icon: Megaphone,
      iconColor: 'bg-sky-50 text-sky-600 border-sky-200',
      bullets: [
        'Open listing with budget, timeline, and skills',
        'Drafts stay private until you publish',
        'One clear version of the statement of work',
      ],
    },
    {
      step: '03',
      title: 'Freelancers apply',
      subtitle: 'Cover note and portfolio',
      desc: 'Interested freelancers apply with a short note and relevant portfolio items. New talent can apply even with no completed TrustBroker jobs.',
      icon: UserCheck,
      iconColor: 'bg-indigo-50 text-indigo-600 border-indigo-200',
      bullets: [
        'One application per contract',
        'Portfolio and skills travel with the application',
        'Newcomers are not scored as zero',
      ],
    },
    {
      step: '04',
      title: 'AI vets applicants',
      subtitle: 'Ranked for the client',
      desc: 'AI compares each applicant to the contract using skills, portfolio relevance, communication, and past deliveries — and flags insufficient evidence instead of inventing history.',
      icon: FileSearch,
      iconColor: 'bg-violet-50 text-violet-600 border-violet-200',
      bullets: [
        'Fit scores with a short rationale',
        'New talent badge when portfolio is strong and history is thin',
        'The client awards one freelancer; others are notified',
      ],
    },
    {
      step: '05',
      title: 'Award, accept, fund',
      subtitle: 'PayPal-secured milestone',
      desc: 'The awarded freelancer accepts the same contract version. The client funds the next milestone through PayPal. Work starts when that payment is confirmed.',
      icon: CreditCard,
      iconColor: 'bg-amber-50 text-amber-600 border-amber-200',
      bullets: [
        'Both parties accept the same version',
        'PayPal checkout is verified on the server',
        'Cancelled checkout never shows as funded',
      ],
    },
    {
      step: '06',
      title: 'Submit work, AI verifies',
      subtitle: 'Evidence against criteria',
      desc: 'The freelancer submits screenshots, files, or a live URL. AI inspects the evidence against each criterion and records pass, fail, or needs review.',
      icon: CheckCircle2,
      iconColor: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      bullets: [
        'Criterion-by-criterion results with citations',
        'Fail leads to a revision, not a silent payout',
        'Ambiguous work goes to the client for a human decision',
      ],
    },
    {
      step: '07',
      title: 'Release the PayPal payout',
      subtitle: 'When verification and policy pass',
      desc: 'The client confirms release. TrustBroker sends a PayPal payout to the freelancer and records the payout id. AI never moves money on its own.',
      icon: Wallet,
      iconColor: 'bg-teal-50 text-teal-700 border-teal-200',
      bullets: [
        'Policy engine checks status before payout',
        'Payout id and status are visible to both parties',
        'Repeat for each milestone until the contract completes',
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-[#F6F8FC] text-[#1A2940] flex flex-col font-sans">
      <Header />

      <main className="w-full pt-[68px] flex-1">
        <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10 text-center">
          <Badge variant="outline" className="px-3.5 py-1 rounded-full bg-blue-50 border-blue-200 text-blue-700 text-xs font-semibold gap-1.5 mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            From brief to payout
          </Badge>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#1A2940]">
            How TrustBroker Coordinates Projects
          </h1>
          <p className="text-sm sm:text-base text-[#5D6B82] max-w-2xl mx-auto mt-4 leading-relaxed">
            AI-drafted contracts, open applications, PayPal-secured milestones, and evidence-based verification — so clients and freelancers share one trail of what was agreed and what was paid.
          </p>
        </section>

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
                          {item.bullets.map((bullet) => (
                            <div key={bullet} className="flex items-center gap-2 text-xs text-slate-700">
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

          <div className="mt-12 p-8 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-center space-y-4 shadow-sm">
            <h2 className="text-2xl font-bold">Ready to start?</h2>
            <p className="text-xs sm:text-sm text-blue-100 max-w-xl mx-auto leading-relaxed">
              Create a client account to publish a contract, or a freelancer account to apply for open work.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="bg-white hover:bg-slate-100 text-blue-700 font-semibold text-xs h-10 px-5 gap-2">
                <Link to={`${ROUTES.SIGN_UP}?role=client`}>
                  Hire with TrustBroker
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-white/40 text-white hover:bg-white/10 font-semibold text-xs h-10 px-5 gap-2">
                <Link to={`${ROUTES.SIGN_UP}?role=freelancer`}>
                  Find work
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
