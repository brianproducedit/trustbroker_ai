import React from 'react'
import { Link } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
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

export const ForBuyers: React.FC = () => {
  const benefits = [
    {
      title: 'AI Drafts Clear Contracts in Seconds',
      desc: 'No messy contract negotiations. Describe what you need and AI generates clear milestones, deadlines, and unambiguous acceptance criteria.',
      icon: Sparkles,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
    },
    {
      title: 'Funds Stay Protected Until Work is Verified',
      desc: 'Stage milestone payments through PayPal Sandbox. Your payment is secured and only released once the deliverable passes inspection.',
      icon: Lock,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    },
    {
      title: 'Automated Delivery Assessment',
      desc: 'When the freelancer submits work, AI evaluates repository code, builds, and deliverables against criteria so you have an objective report.',
      icon: CheckCircle2,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    },
  ]

  return (
    <div className="min-h-screen bg-[#F6F8FC] text-[#1A2940] flex flex-col font-sans">
      <Header />

      <main className="w-full pt-[68px] flex-1">
        {/* Hero */}
        <section className="py-14 sm:py-20 bg-white border-b border-[#DDE4EF]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center space-y-5">
            <Badge variant="outline" className="px-3.5 py-1 rounded-full bg-blue-50 border-blue-200 text-blue-700 text-xs font-semibold gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              For Clients & Hiring Managers
            </Badge>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-[#1A2940] tracking-tight leading-tight">
              Hire global talent with <br className="hidden sm:inline" />
              <span className="text-blue-600">confidence and peace of mind.</span>
            </h1>

            <p className="text-sm sm:text-base text-[#5D6B82] max-w-2xl leading-relaxed">
              Never worry about unfinished projects or broken code. Staged milestone payments guarantee you only pay for completed, verified work.
            </p>

            <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-11 px-6 gap-2">
                <Link to="/sign-in?role=client&redirect=/dashboard/create-project">
                  Create Your First Project
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>

              <Button asChild variant="outline" size="lg" className="border-slate-300 text-slate-700 text-xs h-11 px-6">
                <Link to="/sign-in?role=client&redirect=/dashboard">
                  Explore Client Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Benefits Grid */}
        <section className="py-14 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-2xl font-bold text-[#1A2940]">Why Clients Rely on TrustBroker</h2>
            <p className="text-xs text-[#5D6B82] mt-1.5">
              Built to make freelance collaborations transparent, smooth, and predictable.
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

export default ForBuyers
