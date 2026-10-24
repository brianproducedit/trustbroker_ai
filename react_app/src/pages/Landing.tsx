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
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  UserCheck, 
  Code2,
  Lock
} from 'lucide-react'

export const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F6F8FC] text-[#1A2940] flex flex-col font-sans">
      <Header />

      <main className="w-full pt-[68px] flex-1">
        {/* Subtle Hackathon Top Ribbon */}
        <section className="w-full bg-[#0E1B35] text-white py-2 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-medium text-blue-300">PayPal AI Hackathon 2026</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300">PayPal Sandbox + Gemini AI</span>
            </div>
            <div className="flex items-center gap-3 text-slate-400 text-[11px]">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                Verified Sandbox Environment
              </span>
            </div>
          </div>
        </section>

        {/* Hero Section */}
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-16">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto gap-6">
            <Badge variant="outline" className="px-3.5 py-1 rounded-full bg-blue-50/80 border-blue-200 text-blue-700 text-xs font-semibold gap-1.5 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Next-Gen Work Verification
            </Badge>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#1A2940] leading-[1.15]">
              The trust layer between <br className="hidden sm:inline" />
              <span className="text-blue-600">clients and freelancers.</span>
            </h1>

            <p className="text-base sm:text-lg text-[#5D6B82] leading-relaxed max-w-2xl">
              AI-drafted contracts. Staged payments. Verified delivery. Neither party has to risk working or paying without security.
            </p>

            {/* Persona Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button asChild size="lg" className="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-sm gap-2">
                <Link to="/sign-in?role=client&redirect=/dashboard">
                  <UserCheck className="w-4 h-4 text-blue-200" />
                  <span>I am Hiring (Client Demo)</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>

              <Button asChild variant="outline" size="lg" className="h-11 px-6 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border-slate-300 font-medium text-sm gap-2">
                <Link to="/sign-in?role=freelancer&redirect=/dashboard">
                  <UserCheck className="w-4 h-4 text-slate-500" />
                  <span>I am a Freelancer (Demo)</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* 4-Step How It Works Strip */}
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-2xl font-bold text-[#1A2940]">How TrustBroker Works</h2>
            <p className="text-xs text-[#5D6B82] mt-1.5">
              From project brief to final payment disbursement in four automated steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Step 1 */}
            <Card className="border-[#DDE4EF] bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-6 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <h3 className="font-semibold text-base text-[#1A2940]">Describe Project</h3>
                <p className="text-xs text-[#5D6B82] leading-relaxed">
                  Enter your brief in plain language. AI generates a clear contract with milestones and measurable acceptance criteria.
                </p>
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card className="border-[#DDE4EF] bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-6 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <h3 className="font-semibold text-base text-[#1A2940]">Agree on Terms</h3>
                <p className="text-xs text-[#5D6B82] leading-relaxed">
                  Both client and freelancer review and digitally accept the contract scope. Terms are locked before work begins.
                </p>
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card className="border-[#DDE4EF] bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-6 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <h3 className="font-semibold text-base text-[#1A2940]">Stage Payment</h3>
                <p className="text-xs text-[#5D6B82] leading-relaxed">
                  The client stages milestone funds through PayPal Sandbox. The freelancer starts work knowing funds are committed.
                </p>
              </CardContent>
            </Card>

            {/* Step 4 */}
            <Card className="border-[#DDE4EF] bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-6 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                  4
                </div>
                <h3 className="font-semibold text-base text-[#1A2940]">Verify & Release</h3>
                <p className="text-xs text-[#5D6B82] leading-relaxed">
                  Work is submitted and evaluated against criteria. Upon verification, funds release automatically to the freelancer.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Interactive Contract Preview Strip */}
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-2xl border border-[#DDE4EF] p-6 sm:p-10 shadow-xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 space-y-4">
                <Badge variant="secondary" className="text-xs text-blue-700 bg-blue-50 border-blue-200">
                  Live Contract Example
                </Badge>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#1A2940]">
                  Objective verification replaces endless debates.
                </h2>
                <p className="text-xs sm:text-sm text-[#5D6B82] leading-relaxed">
                  Every milestone has explicit acceptance criteria. When Tariro submits code, Gemini AI assesses test passes, responsiveness, and file deliverables, giving Elena a clear pass/fail breakdown before funds release.
                </p>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white gap-2 text-xs">
                    <Link to="/sign-in?role=client&redirect=/dashboard/contracts/contract-1">
                      Explore This Contract
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="border-slate-200 text-slate-700 text-xs">
                    <Link to={ROUTES.HOW_IT_WORKS}>
                      Read Full Flow
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
                        <span className="font-mono text-xs font-semibold text-blue-600">TB-2026-084</span>
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                          Active Contract
                        </Badge>
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 mt-0.5">Fintech SaaS Onboarding & Checkout</h4>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500">Total Budget</div>
                      <div className="text-sm font-bold text-slate-900">$3,400 USD</div>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    {/* Milestone 1 */}
                    <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between gap-3 text-xs">
                      <div className="space-y-0.5">
                        <div className="font-medium text-slate-800">Milestone 1: Architecture & Auth Setup</div>
                        <div className="text-slate-500 text-[11px]">Due Feb 28 &bull; Verified 98% score</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                          Payment Released ($1,200)
                        </Badge>
                      </div>
                    </div>

                    {/* Milestone 2 */}
                    <div className="p-3 bg-white rounded-lg border border-blue-200 bg-blue-50/30 flex items-center justify-between gap-3 text-xs">
                      <div className="space-y-0.5">
                        <div className="font-medium text-slate-800">Milestone 2: PayPal Sandbox Integration</div>
                        <div className="text-slate-500 text-[11px]">Due Mar 15 &bull; In review</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] animate-pulse">
                          Reviewing Work ($1,400)
                        </Badge>
                      </div>
                    </div>

                    {/* Milestone 3 */}
                    <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between gap-3 text-xs opacity-75">
                      <div className="space-y-0.5">
                        <div className="font-medium text-slate-800">Milestone 3: End-to-End Testing & Handover</div>
                        <div className="text-slate-500 text-[11px]">Due Mar 30 &bull; Staged in Sandbox</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-slate-600 text-[10px]">
                          Payment Staged ($800)
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Signals Footer Strip */}
        <section className="w-full bg-white border-t border-[#DDE4EF] py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">
              Powered by Industry-Standard Infrastructure
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 text-slate-600 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span>PayPal Orders v2 Sandbox</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Google Gemini AI</span>
              </div>
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-emerald-600" />
                <span>AG Grid Enterprise Ready</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-700" />
                <span>End-to-End Cryptographic Audit</span>
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
