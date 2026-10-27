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
  Lock,
} from 'lucide-react'

export const ForClients: React.FC = () => {
  const benefits = [
    {
      title: 'AI Drafts Clear Contracts in Seconds',
      desc: 'Describe the work in plain language. TrustBroker turns it into milestones, deadlines, and measurable acceptance criteria you can edit before publishing.',
      icon: Sparkles,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
    },
    {
      title: 'PayPal-secured milestone payments',
      desc: 'Fund the next milestone through PayPal. Payment is only released after the deliverable is verified against the agreed criteria.',
      icon: Lock,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    },
    {
      title: 'Hire from evidence, not guesswork',
      desc: 'Freelancers apply to open contracts. AI ranks applicants from profile, portfolio, and past work — including a fair path for new talent.',
      icon: CheckCircle2,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    },
  ]

  return (
    <div className="min-h-screen bg-[#F6F8FC] text-[#1A2940] flex flex-col font-sans">
      <Header />

      <main className="w-full pt-[68px] flex-1">
        <section className="py-14 sm:py-20 bg-white border-b border-[#DDE4EF]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center space-y-5">
            <Badge variant="outline" className="px-3.5 py-1 rounded-full bg-blue-50 border-blue-200 text-blue-700 text-xs font-semibold gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              For Clients & Hiring Managers
            </Badge>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-[#1A2940] tracking-tight leading-tight">
              Hire global talent with <br className="hidden sm:inline" />
              <span className="text-blue-600">confidence and a clear trail.</span>
            </h1>

            <p className="text-sm sm:text-base text-[#5D6B82] max-w-2xl leading-relaxed">
              Publish an open contract, review AI-vetted applicants, fund the milestone on PayPal, and pay when the work checks out.
            </p>

            <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-11 px-6 gap-2">
                <Link to={`${ROUTES.SIGN_UP}?role=client`}>
                  Hire with TrustBroker
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>

              <Button asChild variant="outline" size="lg" className="border-slate-300 text-slate-700 text-xs h-11 px-6">
                <Link to={`${ROUTES.SIGN_IN}?role=client`}>
                  Sign in as a client
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-14 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-2xl font-bold text-[#1A2940]">Why Clients Use TrustBroker</h2>
            <p className="text-xs text-[#5D6B82] mt-1.5">
              Built to make freelance collaborations transparent, structured, and predictable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {benefits.map((b) => {
              const IconComp = b.icon
              return (
                <Card key={b.title} className="border-[#DDE4EF] bg-white shadow-xs">
                  <CardContent className="p-6 space-y-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${b.color}`}>
                      <IconComp className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold text-base text-[#1A2940]">{b.title}</h3>
                    <p className="text-xs text-[#5D6B82] leading-relaxed">{b.desc}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default ForClients
