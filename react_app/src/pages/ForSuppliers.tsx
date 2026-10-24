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

export const ForSuppliers: React.FC = () => {
  const benefits = [
    {
      title: 'Guaranteed Funds Staged Upfront',
      desc: 'Never wonder if a client has the budget to pay. Before writing a line of code, milestone payments are safely staged via PayPal Sandbox.',
      icon: CreditCard,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    },
    {
      title: 'Zero Ambiguity or Scope Creep',
      desc: 'Milestones have explicit, agreed-upon acceptance criteria. Deliver what is specified and get approved without moving goalposts.',
      icon: Sparkles,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
    },
    {
      title: 'Direct Disbursement Upon Verification',
      desc: 'Submit your code or project links for verification. As soon as criteria are satisfied, milestone disbursements execute directly to your account.',
      icon: DollarSign,
      color: 'bg-amber-50 text-amber-600 border-amber-200',
    },
  ]

  return (
    <div className="min-h-screen bg-[#F6F8FC] text-[#1A2940] flex flex-col font-sans">
      <Header />

      <main className="w-full pt-[68px] flex-1">
        {/* Hero */}
        <section className="py-14 sm:py-20 bg-white border-b border-[#DDE4EF]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center space-y-5">
            <Badge variant="outline" className="px-3.5 py-1 rounded-full bg-emerald-50 border-emerald-200 text-emerald-700 text-xs font-semibold gap-1.5">
              <Globe2 className="w-3.5 h-3.5 text-emerald-600" />
              For Freelancers & Software Studios
            </Badge>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-[#1A2940] tracking-tight leading-tight">
              Get paid for verified work. <br className="hidden sm:inline" />
              <span className="text-emerald-600">Zero invoice chasing.</span>
            </h1>

            <p className="text-sm sm:text-base text-[#5D6B82] max-w-2xl leading-relaxed">
              Say goodbye to ghosting and payment delays. With TrustBroker, client funds are staged before work commences and released upon objective verification.
            </p>

            <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-11 px-6 gap-2">
                <Link to="/sign-in?role=supplier&redirect=/dashboard">
                  View Freelancer Portal
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>

              <Button asChild variant="outline" size="lg" className="border-slate-300 text-slate-700 text-xs h-11 px-6">
                <Link to={ROUTES.HOW_IT_WORKS}>
                  Learn How Staging Works
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Benefits Grid */}
        <section className="py-14 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-2xl font-bold text-[#1A2940]">Built for Fair Freelance Collaboration</h2>
            <p className="text-xs text-[#5D6B82] mt-1.5">
              Transparent terms, pre-funded milestones, and automated release.
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

export default ForSuppliers
